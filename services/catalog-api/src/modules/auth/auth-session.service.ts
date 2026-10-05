import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { StaffSessionService } from '../../common/services/staff-session.service';
import { isStaffRole } from '../../common/utils/staff-access.util';
import { staffForbidden, staffUnauthorized, StaffAuthErrorCode } from '../../common/errors/staff-auth.errors';
import { lockAuthSessions } from '../../common/utils/auth-session-lock.util';

export type SessionUser = Pick<User, 'id' | 'phone' | 'email' | 'name' | 'role'>;

export type QalaGoSessionResult = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
  sessionId: string;
};

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly staffSession: StaffSessionService,
  ) { }

  async issueQalaGoSession(
    user: SessionUser,
    options?: { userAgent?: string; stepUpAt?: number; mfaEnrollOnly?: boolean },
  ): Promise<QalaGoSessionResult> {
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashRefreshToken(refreshToken);
    const familyId = randomUUID();
    const expiresAt = this.refreshExpiresAt();

    const session = await this.prisma.$transaction(async (tx) => {
      await lockAuthSessions(tx, user.id);
      return tx.authSession.create({
        data: {
          userId: user.id,
          tokenHash,
          familyId,
          userAgent: options?.userAgent?.slice(0, 512) ?? null,
          expiresAt,
          mfaEnrollOnly: options?.mfaEnrollOnly ?? false,
        },
      });
    });

    const accessToken = await this.signAccessToken(user, {
      sessionId: session.id,
      stepUpAt: options?.stepUpAt,
      mfaEnrollOnly: options?.mfaEnrollOnly,
    });
    return { accessToken, refreshToken, user, sessionId: session.id };
  }

  async refreshSession(
    refreshToken: string,
    options?: { userAgent?: string },
  ): Promise<QalaGoSessionResult> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const initial = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });
    if (!initial) throw new UnauthorizedException('Invalid or expired refresh token');

    // Return denials from the transaction so replay revocation is committed.
    const result = await this.prisma.$transaction(async (tx) => {
      await lockAuthSessions(tx, initial.userId);
      const session = await tx.authSession.findUnique({
        where: { tokenHash },
        include: {
          user: {
            select: { id: true, phone: true, email: true, name: true, role: true, isActive: true },
          },
        },
      });

      if (!session) return null;
      if (session.revokedAt || !session.user.isActive) {
        await tx.authSession.updateMany({
          where: { familyId: session.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return null;
      }
      if (session.expiresAt <= new Date()) return null;

      let effectiveRole = session.user.role;
      if (isStaffRole(session.user.role)) {
        const staff = await tx.staffAccess.findUnique({
          where: { userId: session.user.id }, select: { isActive: true, staffRole: true },
        });
        if (!staff?.isActive) {
          await tx.authSession.updateMany({
            where: { familyId: session.familyId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          return { denied: true as const };
        }
        effectiveRole = staff.staffRole;
      }

      const now = new Date();
      const consumed = await tx.authSession.updateMany({
        where: { id: session.id, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, lastUsedAt: now },
      });
      if (consumed.count !== 1) return null;

      const newRefreshToken = this.generateRefreshToken();
      const newHash = this.hashRefreshToken(newRefreshToken);
      const expiresAt = this.refreshExpiresAt();

      const newSession = await tx.authSession.create({
        data: {
          userId: session.userId,
          tokenHash: newHash,
          familyId: session.familyId,
          rotatedFromId: session.id,
          userAgent: options?.userAgent?.slice(0, 512) ?? session.userAgent,
          expiresAt,
          mfaEnrollOnly: session.mfaEnrollOnly,
        },
      });

      const user: SessionUser = {
        id: session.user.id,
        phone: session.user.phone,
        email: session.user.email,
        name: session.user.name,
        role: effectiveRole,
      };

      const accessToken = await this.signAccessToken(user, {
        sessionId: newSession.id,
        mfaEnrollOnly: newSession.mfaEnrollOnly,
      });
      return {
        accessToken,
        refreshToken: newRefreshToken,
        user,
        sessionId: newSession.id,
      };
    });
    if (!result) throw new UnauthorizedException('Invalid or expired refresh token');
    if ('denied' in result) {
      throw staffUnauthorized(StaffAuthErrorCode.STAFF_ACCESS_DISABLED, 'Staff access disabled');
    }
    return result;
  }

  async issueStepUpAccessToken(
    user: SessionUser,
    sessionId: string,
    stepUpAt: number,
  ): Promise<string> {
    const session = await this.staffSession.assertStaffSessionActive(sessionId, user.id);
    if (session.mfaEnrollOnly) {
      throw staffForbidden(StaffAuthErrorCode.MFA_REQUIRED, 'Complete MFA enrollment');
    }
    return this.signAccessToken(user, { sessionId, stepUpAt });
  }

  async reissueStaffAccessToken(user: SessionUser, sessionId: string): Promise<string> {
    const session = await this.staffSession.assertStaffSessionActive(sessionId, user.id);
    return this.signAccessToken(user, { sessionId, mfaEnrollOnly: session.mfaEnrollOnly });
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({ where: { tokenHash } });
    if (!session) return;
    await this.prisma.$transaction(async (tx) => {
      await lockAuthSessions(tx, session.userId);
      await tx.authSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await lockAuthSessions(tx, userId);
      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshExpiresAt(): Date {
    const days = this.config.get<number>('app.refreshTokenExpiresDays', 30);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async signAccessToken(
    user: Pick<User, 'id' | 'phone' | 'role'>,
    options: { sessionId: string; stepUpAt?: number; mfaEnrollOnly?: boolean },
  ) {
    const expiresIn = (this.config.get<string>('app.jwtExpiresIn') ?? '20m') as `${number}m`;
    const authAt = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      sub: user.id,
      ...(user.phone != null ? { phone: user.phone } : {}),
      role: user.role as UserRole,
      sid: options.sessionId,
      authAt,
      ...(options.stepUpAt != null ? { stepUpAt: options.stepUpAt } : {}),
      ...(options.mfaEnrollOnly ? { mfaEnrollOnly: true } : {}),
    };
    return this.jwtService.signAsync(payload, { expiresIn });
  }
}
