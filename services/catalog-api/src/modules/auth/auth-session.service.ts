import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { StaffSessionService } from '../../common/services/staff-session.service';
import { isStaffRole } from '../../common/utils/staff-access.util';
import { staffUnauthorized, StaffAuthErrorCode } from '../../common/errors/staff-auth.errors';

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
  ) {}

  async issueQalaGoSession(
    user: SessionUser,
    options?: { userAgent?: string; stepUpAt?: number },
  ): Promise<QalaGoSessionResult> {
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashRefreshToken(refreshToken);
    const familyId = randomUUID();
    const expiresAt = this.refreshExpiresAt();

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        userAgent: options?.userAgent?.slice(0, 512) ?? null,
        expiresAt,
      },
    });

    const accessToken = await this.signAccessToken(user, {
      sessionId: session.id,
      stepUpAt: options?.stepUpAt,
    });
    return { accessToken, refreshToken, user, sessionId: session.id };
  }

  async refreshSession(
    refreshToken: string,
    options?: { userAgent?: string },
  ): Promise<QalaGoSessionResult> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, phone: true, email: true, name: true, role: true, isActive: true },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (session.revokedAt) {
      await this.revokeSessionFamily(session.familyId);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!session.user.isActive) {
      await this.revokeSessionFamily(session.familyId);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    let effectiveRole = session.user.role;
    if (isStaffRole(session.user.role)) {
      try {
        effectiveRole = await this.staffSession.assertStaffAccessActive(
          session.user.id,
          session.user.role,
        );
      } catch {
        await this.revokeSessionFamily(session.familyId);
        throw staffUnauthorized(
          StaffAuthErrorCode.STAFF_ACCESS_DISABLED,
          'Staff access disabled',
        );
      }
    }

    const now = new Date();
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: now, lastUsedAt: now },
    });

    const newRefreshToken = this.generateRefreshToken();
    const newHash = this.hashRefreshToken(newRefreshToken);
    const expiresAt = this.refreshExpiresAt();

    const newSession = await this.prisma.authSession.create({
      data: {
        userId: session.userId,
        tokenHash: newHash,
        familyId: session.familyId,
        rotatedFromId: session.id,
        userAgent: options?.userAgent?.slice(0, 512) ?? session.userAgent,
        expiresAt,
      },
    });

    const user: SessionUser = {
      id: session.user.id,
      phone: session.user.phone,
      email: session.user.email,
      name: session.user.name,
      role: effectiveRole,
    };

    const accessToken = await this.signAccessToken(user, { sessionId: newSession.id });
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user,
      sessionId: newSession.id,
    };
  }

  async issueStepUpAccessToken(
    user: SessionUser,
    sessionId: string,
    stepUpAt: number,
  ): Promise<string> {
    await this.staffSession.assertStaffSessionActive(sessionId, user.id);
    return this.signAccessToken(user, { sessionId, stepUpAt });
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async handlePossibleReplay(refreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({ where: { tokenHash } });
    if (session?.revokedAt) {
      await this.revokeSessionFamily(session.familyId);
    }
  }

  private async revokeSessionFamily(familyId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
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
    options: { sessionId: string; stepUpAt?: number },
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
    };
    return this.jwtService.signAsync(payload, { expiresIn });
  }
}
