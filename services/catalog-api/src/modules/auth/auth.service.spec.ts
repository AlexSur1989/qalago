import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BusinessMembershipService } from '../../common/services/business-membership.service';

describe('AuthService', () => {
  let service: AuthService;
  let membership: { claimPendingInvitations: jest.Mock };
  let prisma: {
    otpCode: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    prisma = {
      otpCode: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
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
        return undefined;
      }),
    };

    membership = {
      claimPendingInvitations: jest.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      membership as unknown as BusinessMembershipService,
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

      const result = await service.verifyCode({
        phone: '+77001234567',
        code: '1234',
      });
      expect(result.accessToken).toBe('jwt-token');
      expect(prisma.otpCode.update).toHaveBeenCalled();
    });

    it('rejects invalid phone', async () => {
      await expect(
        service.verifyCode({ phone: 'bad', code: '1234' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('sendCode', () => {
    it('normalizes phone before storing OTP', async () => {
      prisma.otpCode.create.mockResolvedValue({});
      await service.sendCode({ phone: '87001234567' });
      expect(prisma.otpCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ phone: '+77001234567' }),
        }),
      );
    });
  });
});
