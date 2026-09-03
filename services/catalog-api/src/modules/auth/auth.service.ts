import { createHash, randomInt } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SendCodeDto, VerifyCodeDto } from './dto/auth.dto';

const OTP_TTL_SEC = 300;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sendCode(dto: SendCodeDto) {
    const phone = this.normalizePhone(dto.phone);
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
    const phone = this.normalizePhone(dto.phone);
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

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: dto.name ? { name: dto.name } : {},
      create: {
        phone,
        name: dto.name,
        role: UserRole.USER,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
      },
    });

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

  private async signToken(user: Pick<User, 'id' | 'phone' | 'role'>) {
    return this.jwtService.signAsync({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('8') && digits.length === 11) {
      return `+7${digits.slice(1)}`;
    }
    if (digits.startsWith('7') && digits.length === 11) {
      return `+${digits}`;
    }
    if (phone.startsWith('+')) {
      return phone;
    }
    return `+${digits}`;
  }

  private generateCode(): string {
    return String(randomInt(1000, 9999));
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
