import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type MfaChallengePurpose = 'login_verify';

export type MfaChallengePayload = {
  typ: 'mfa_challenge';
  sub: string;
  purpose: MfaChallengePurpose;
  jti: string;
};

@Injectable()
export class StaffMfaChallengeService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async issueLoginChallenge(userId: string): Promise<string> {
    const jti = randomUUID();
    const ttlSec = this.config.get<number>('app.staffMfaChallengeTtlSeconds') ?? 300;
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    await this.prisma.staffMfaChallengeJti.create({
      data: { jti, userId, purpose: 'login_verify', expiresAt },
    });
    const payload: MfaChallengePayload = {
      typ: 'mfa_challenge',
      sub: userId,
      purpose: 'login_verify',
      jti,
    };
    return this.jwt.signAsync(payload, { expiresIn: ttlSec });
  }

  async consumeChallenge(token: string): Promise<{ userId: string; purpose: MfaChallengePurpose }> {
    let payload: MfaChallengePayload;
    try {
      payload = await this.jwt.verifyAsync<MfaChallengePayload>(token, {
        secret: this.config.getOrThrow<string>('app.jwtSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA challenge');
    }
    if (payload.typ !== 'mfa_challenge' || !payload.sub || !payload.jti) {
      throw new UnauthorizedException('Invalid MFA challenge');
    }
    const row = await this.prisma.staffMfaChallengeJti.findUnique({
      where: { jti: payload.jti },
    });
    if (!row || row.userId !== payload.sub || row.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired MFA challenge');
    }
    await this.prisma.staffMfaChallengeJti.delete({ where: { jti: payload.jti } });
    return { userId: payload.sub, purpose: payload.purpose };
  }
}
