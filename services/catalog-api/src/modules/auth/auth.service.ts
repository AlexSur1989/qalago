import { createHash, randomInt } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { OtpRateLimitService } from '../../common/services/otp-rate-limit.service';
import { AccountType, resolveAccountRole } from './auth-role.util';
import { normalizeKazakhstanPhone } from './auth-phone.util';
import { DevLoginDto, SendCodeDto, VerifyCodeDto } from './dto/auth.dto';
import { AuthSessionService } from './auth-session.service';
import { isProductionNodeEnv } from '../../common/utils/production-config.util';

const OTP_TTL_SEC = 300;

const userSelect = {
  id: true,
  phone: true,
  email: true,
  name: true,
  role: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly businessMembershipService: BusinessMembershipService,
    private readonly otpRateLimit: OtpRateLimitService,
    private readonly authSession: AuthSessionService,
  ) {}

  isDevLoginEnabled(): boolean {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    if (isProductionNodeEnv(nodeEnv)) {
      return false;
    }
    return this.config.get<boolean>('app.devLoginEnabled') === true;
  }

  isOtpAuthEnabled(): boolean {
    return this.config.get<boolean>('app.otpAuthEnabled') !== false;
  }

  assertOtpAuthEnabled(): void {
    if (!this.isOtpAuthEnabled()) {
      throw new NotFoundException();
    }
  }

  async sendCode(dto: SendCodeDto, ip: string) {
    this.assertOtpAuthEnabled();
    const phone = this.requireNormalizedPhone(dto.phone);
    this.otpRateLimit.assertCanSendCode(phone, ip);

    await this.prisma.otpCode.updateMany({
      where: { phone, consumed: false },
      data: { consumed: true },
    });

    const code = this.generateCode();
    const codeHash = this.hashCode(code);

    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_SEC * 1000),
      },
    });

    this.otpRateLimit.recordSendCode(phone);

    const response: { success: boolean; expiresInSec: number; debugCode?: string } = {
      success: true,
      expiresInSec: OTP_TTL_SEC,
    };

    if (this.config.get<boolean>('app.otpDebug')) {
      response.debugCode = code;
    }

    return response;
  }

  async verifyCode(dto: VerifyCodeDto, ip: string) {
    this.assertOtpAuthEnabled();
    const phone = this.requireNormalizedPhone(dto.phone);
    this.otpRateLimit.assertCanVerifyCode(phone, ip);
    const codeHash = this.hashCode(dto.code);

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        codeHash,
        consumed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      this.otpRateLimit.recordVerifyFailure(phone, ip);
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    this.otpRateLimit.clearVerifyAttempts(phone, ip);

    return this.completeLogin(phone, {
      name: dto.name,
      accountType: dto.accountType,
    });
  }

  async devLogin(dto: DevLoginDto) {
    if (!this.isDevLoginEnabled()) {
      throw new NotFoundException();
    }

    const phone = this.requireNormalizedPhone(dto.phone);
    return this.completeLogin(phone);
  }

  async completeLogin(
    phone: string,
    options?: { name?: string; accountType?: AccountType },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing && !existing.isActive) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const targetRole = resolveAccountRole(
      existing?.role ?? null,
      options?.accountType ?? 'user',
    );

    let user;
    if (!existing) {
      user = await this.prisma.user.create({
        data: {
          phone,
          name: options?.name,
          role: targetRole,
        },
        select: userSelect,
      });
    } else {
      user =
        options?.name
          ? await this.prisma.user.update({
              where: { phone },
              data: { name: options.name },
              select: userSelect,
            })
          : existing;
    }

    if (phone) {
      await this.businessMembershipService.claimPendingInvitations(user.id, phone);
    }
    return this.authSession.issueQalaGoSession(user);
  }

  async refresh(refreshToken: string, userAgent?: string) {
    try {
      return await this.authSession.refreshSession(refreshToken, { userAgent });
    } catch (error) {
      await this.authSession.handlePossibleReplay(refreshToken);
      throw error;
    }
  }

  async logout(refreshToken: string | undefined) {
    if (refreshToken) {
      await this.authSession.revokeRefreshToken(refreshToken);
    }
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.authSession.revokeAllUserSessions(userId);
    return { success: true };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        preferredCityId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  private requireNormalizedPhone(phone: string): string {
    const normalized = normalizeKazakhstanPhone(phone);
    if (!normalized) {
      throw new BadRequestException('Invalid phone number');
    }
    return normalized;
  }


  private generateCode(): string {
    return String(randomInt(1000, 9999));
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
