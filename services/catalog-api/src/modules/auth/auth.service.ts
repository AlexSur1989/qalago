import { createHash, randomInt } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountType, resolveAccountRole } from './auth-role.util';
import { normalizeKazakhstanPhone } from './auth-phone.util';
import { DevLoginDto, SendCodeDto, VerifyCodeDto } from './dto/auth.dto';

const OTP_TTL_SEC = 300;

const userSelect = {
  id: true,
  phone: true,
  name: true,
  role: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  isDevLoginEnabled(): boolean {
    return this.config.get<boolean>('app.devLoginEnabled') === true;
  }

  async sendCode(dto: SendCodeDto) {
    const phone = this.requireNormalizedPhone(dto.phone);
    const code = this.generateCode();
    const codeHash = this.hashCode(code);

    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_SEC * 1000),
      },
    });

    const response: { success: boolean; expiresInSec: number; debugCode?: string } = {
      success: true,
      expiresInSec: OTP_TTL_SEC,
    };

    if (this.config.get<boolean>('app.otpDebug')) {
      response.debugCode = code;
    }

    return response;
  }

  async verifyCode(dto: VerifyCodeDto) {
    const phone = this.requireNormalizedPhone(dto.phone);
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
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

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
      const updateData: { name?: string; role?: UserRole } = {};
      if (options?.name) {
        updateData.name = options.name;
      }
      if (existing.role === UserRole.USER && targetRole === UserRole.BUSINESS) {
        updateData.role = UserRole.BUSINESS;
      }
      user =
        Object.keys(updateData).length > 0
          ? await this.prisma.user.update({
              where: { phone },
              data: updateData,
              select: userSelect,
            })
          : existing;
    }

    const accessToken = await this.signToken(user);
    return { accessToken, user };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
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

  private async signToken(user: Pick<User, 'id' | 'phone' | 'role'>) {
    return this.jwtService.signAsync({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });
  }

  private generateCode(): string {
    return String(randomInt(1000, 9999));
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
