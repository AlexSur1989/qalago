import { BadRequestException, HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { OtpRateLimitService } from '../../common/services/otp-rate-limit.service';

describe('AuthService', () => {
  let service: AuthService;
  let membership: { claimPendingInvitations: jest.Mock };
  let prisma: {
    otpCode: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock };
  let otpRateLimit: {
    assertCanSendCode: jest.Mock;
    recordSendCode: jest.Mock;
    assertCanVerifyCode: jest.Mock;
    recordVerifyFailure: jest.Mock;
    clearVerifyAttempts: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      otpCode: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('jwt-token') };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'app.devLoginEnabled') return false;
        if (key === 'app.otpDebug') return false;
        if (key === 'app.otpAuthEnabled') return true;
        return undefined;
      }),
    };

    membership = {
      claimPendingInvitations: jest.fn().mockResolvedValue(undefined),
    };

    otpRateLimit = {
      assertCanSendCode: jest.fn(),
      recordSendCode: jest.fn(),
      assertCanVerifyCode: jest.fn(),
      recordVerifyFailure: jest.fn(),
      clearVerifyAttempts: jest.fn(),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      membership as unknown as BusinessMembershipService,
      otpRateLimit as unknown as OtpRateLimitService,
    );
  });

  describe('devLogin', () => {
    it('rejects when DEV_LOGIN_ENABLED=false', async () => {
      await expect(service.devLogin({ phone: '+77001234567' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects when flag missing (default false)', async () => {
      config.get.mockReturnValue(undefined);
      await expect(service.devLogin({ phone: '+77001234567' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects invalid phone when enabled', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'app.devLoginEnabled' ? true : false,
      );
      await expect(service.devLogin({ phone: '123' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('normalizes 8-prefix phone when enabled', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'app.devLoginEnabled' ? true : false,
      );
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        phone: '+77001234567',
        name: null,
        role: UserRole.USER,
      });

      const result = await service.devLogin({ phone: '87001234567' });
      expect(result.accessToken).toBe('jwt-token');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ phone: '+77001234567', role: UserRole.USER }),
        }),
      );
    });

    it('returns existing user with preserved ADMIN role', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'app.devLoginEnabled' ? true : false,
      );
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        phone: '+77001234567',
        name: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
      });

      const result = await service.devLogin({ phone: '+77001234567' });
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('creates new user with USER role only', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'app.devLoginEnabled' ? true : false,
      );
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u-new',
        phone: '+77009998877',
        name: null,
        role: UserRole.USER,
      });

      await service.devLogin({ phone: '+77009998877' });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { phone: '+77009998877', name: undefined, role: UserRole.USER },
        }),
      );
    });

    it('issues JWT via same signer as OTP flow', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'app.devLoginEnabled' ? true : false,
      );
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        phone: '+77001234567',
        role: UserRole.USER,
        isActive: true,
      });

      await service.devLogin({ phone: '+77001234567' });
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        phone: '+77001234567',
        role: UserRole.USER,
      });
    });

    it('does not create duplicate users on repeat login', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'app.devLoginEnabled' ? true : false,
      );
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        phone: '+77001234567',
        role: UserRole.USER,
        isActive: true,
      });

      await service.devLogin({ phone: '+77001234567' });
      await service.devLogin({ phone: '+77001234567' });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyCode', () => {
    it('still works after dev-login refactor', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({ id: 'otp-1' });
      prisma.otpCode.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        phone: '+77001234567',
        role: UserRole.USER,
      });

      const result = await service.verifyCode(
        {
          phone: '+77001234567',
          code: '1234',
        },
        '127.0.0.1',
      );
      expect(result.accessToken).toBe('jwt-token');
      expect(prisma.otpCode.update).toHaveBeenCalled();
    });

    it('rejects invalid phone', async () => {
      await expect(
        service.verifyCode({ phone: 'bad', code: '1234' }, '127.0.0.1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ignores accountType=business for new users (always USER)', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({ id: 'otp-1' });
      prisma.otpCode.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u-new',
        phone: '+77008887766',
        role: UserRole.USER,
      });

      await service.verifyCode(
        {
          phone: '+77008887766',
          code: '1234',
          accountType: 'business',
        },
        '127.0.0.1',
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: UserRole.USER }),
        }),
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('preserves existing BUSINESS role on login', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({ id: 'otp-1' });
      prisma.otpCode.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        id: 'biz-user',
        phone: '+77001234567',
        role: UserRole.BUSINESS,
        isActive: true,
      });

      const result = await service.verifyCode(
        {
          phone: '+77001234567',
          code: '1234',
          accountType: 'user',
        },
        '127.0.0.1',
      );

      expect(result.user.role).toBe(UserRole.BUSINESS);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('OTP_AUTH_ENABLED', () => {
    it('blocks send-code when OTP auth is disabled', async () => {
      config.get.mockImplementation((key: string) => {
        if (key === 'app.otpAuthEnabled') return false;
        return false;
      });
      await expect(service.sendCode({ phone: '+77001234567' }, '127.0.0.1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('blocks verify-code when OTP auth is disabled', async () => {
      config.get.mockImplementation((key: string) => {
        if (key === 'app.otpAuthEnabled') return false;
        return false;
      });
      await expect(
        service.verifyCode({ phone: '+77001234567', code: '1234' }, '127.0.0.1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('sendCode', () => {
    it('normalizes phone before storing OTP', async () => {
      prisma.otpCode.create.mockResolvedValue({});
      prisma.otpCode.updateMany.mockResolvedValue({ count: 0 });
      await service.sendCode({ phone: '87001234567' }, '127.0.0.1');
      expect(prisma.otpCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ phone: '+77001234567' }),
        }),
      );
      expect(otpRateLimit.recordSendCode).toHaveBeenCalledWith('+77001234567');
    });

    it('does not expose debugCode when OTP_DEBUG=false', async () => {
      prisma.otpCode.create.mockResolvedValue({});
      prisma.otpCode.updateMany.mockResolvedValue({ count: 0 });
      const result = await service.sendCode({ phone: '+77001234567' }, '127.0.0.1');
      expect(result.debugCode).toBeUndefined();
    });

    it('invalidates previous unconsumed OTPs on resend', async () => {
      prisma.otpCode.create.mockResolvedValue({});
      prisma.otpCode.updateMany.mockResolvedValue({ count: 1 });
      await service.sendCode({ phone: '+77001234567' }, '127.0.0.1');
      expect(prisma.otpCode.updateMany).toHaveBeenCalledWith({
        where: { phone: '+77001234567', consumed: false },
        data: { consumed: true },
      });
    });

    it('propagates rate limit errors', async () => {
      otpRateLimit.assertCanSendCode.mockImplementation(() => {
        throw new HttpException('Too many requests', 429);
      });
      await expect(service.sendCode({ phone: '+77001234567' }, '127.0.0.1')).rejects.toBeInstanceOf(
        HttpException,
      );
    });
  });

  describe('verifyCode security', () => {
    it('rejects invalid OTP without leaking account existence', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(null);
      await expect(
        service.verifyCode({ phone: '+77001234567', code: '9999' }, '127.0.0.1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(otpRateLimit.recordVerifyFailure).toHaveBeenCalled();
    });

    it('rejects login for inactive users with generic message', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({ id: 'otp-1' });
      prisma.otpCode.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        phone: '+77001234567',
        role: UserRole.USER,
        isActive: false,
      });

      await expect(
        service.verifyCode({ phone: '+77001234567', code: '1234' }, '127.0.0.1'),
      ).rejects.toThrow('Invalid or expired verification code');
    });

    it('clears verify counters on success', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({ id: 'otp-1' });
      prisma.otpCode.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        phone: '+77001234567',
        role: UserRole.USER,
        isActive: true,
      });

      await service.verifyCode({ phone: '+77001234567', code: '1234' }, '127.0.0.1');
      expect(otpRateLimit.clearVerifyAttempts).toHaveBeenCalledWith('+77001234567', '127.0.0.1');
    });
  });
});
