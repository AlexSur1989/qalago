import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type SessionUser = Pick<User, 'id' | 'phone' | 'email' | 'name' | 'role'>;

export type QalaGoSessionResult = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueQalaGoSession(
    user: SessionUser,
    options?: { userAgent?: string },
  ): Promise<QalaGoSessionResult> {
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashRefreshToken(refreshToken);
    const familyId = randomUUID();
    const expiresAt = this.refreshExpiresAt();

    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        userAgent: options?.userAgent?.slice(0, 512) ?? null,
        expiresAt,
      },
    });

    const accessToken = await this.signAccessToken(user);
    return { accessToken, refreshToken, user };
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

    const now = new Date();
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: now, lastUsedAt: now },
    });

    const newRefreshToken = this.generateRefreshToken();
    const newHash = this.hashRefreshToken(newRefreshToken);
    const expiresAt = this.refreshExpiresAt();

    await this.prisma.authSession.create({
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
      role: session.user.role,
    };

    const accessToken = await this.signAccessToken(user);
    return { accessToken, refreshToken: newRefreshToken, user };
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

  /** Detect refresh replay: token already revoked but family still active elsewhere. */
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

  private async signAccessToken(user: Pick<User, 'id' | 'phone' | 'role'>) {
    const expiresIn = (this.config.get<string>('app.jwtExpiresIn') ?? '20m') as `${number}m`;
    return this.jwtService.signAsync(
      {
        sub: user.id,
        ...(user.phone != null ? { phone: user.phone } : {}),
        role: user.role,
      },
      { expiresIn },
    );
  }
}
