import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { authenticator } from 'otplib';
import { StaffMfaService } from './staff-mfa.service';
import { encryptStaffMfaSecret } from '../../common/utils/staff-mfa-crypto.util';

describe('MFA enrollment session promotion', () => {
  function fixture() {
    const secret = authenticator.generateSecret();
    const key = Buffer.from('b'.repeat(64), 'hex');
    const credential = { id: 'credential', pendingSecretEncrypted: encryptStaffMfaSecret(secret, key), pendingExpiresAt: new Date(Date.now() + 60_000) };
    const actor = { id: 'staff', sub: 'staff', sid: 'current', role: UserRole.SUPER_ADMIN, mfaEnrollOnly: true };
    const tx = {
      $queryRaw: jest.fn(),
      authSession: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      staffMfaCredential: {
        findUnique: jest.fn().mockResolvedValue(credential),
        update: jest.fn().mockResolvedValue(credential),
      },
      staffAccess: { updateMany: jest.fn() },
      staffMfaRecoveryCode: { create: jest.fn() },
    };
    const prisma = { ...tx, $transaction: jest.fn(async fn => fn(tx)), user: { findUniqueOrThrow: jest.fn().mockResolvedValue(actor) } };
    const sessions = { reissueStaffAccessToken: jest.fn().mockResolvedValue('promoted-token') };
    const service = new StaffMfaService(prisma as never,
      { get: () => key.toString('hex') } as never, { record: jest.fn() } as never,
      sessions as never, { assertStaffAccessActive: jest.fn() } as never,
      {} as never, { assertCanEnrollVerify: jest.fn() } as never, {} as never, {} as never);
    return { service, tx, prisma, actor, secret, sessions };
  }

  it('promotes only the current active session after valid TOTP', async () => {
    const { service, tx, actor, secret } = fixture();
    const result = await service.enrollVerify(actor, { totp: authenticator.generate(secret) }, '127.0.0.1');
    expect(result.accessToken).toBe('promoted-token');
    expect(result.recoveryCodes).toHaveLength(10);
    expect(tx.authSession.updateMany.mock.calls[0][0]).toMatchObject({
      where: { id: 'current', userId: 'staff', revokedAt: null }, data: { mfaEnrollOnly: false },
    });
    expect(tx.authSession.updateMany.mock.calls[1][0].where).toMatchObject({ id: { not: 'current' }, mfaEnrollOnly: true });
  });

  it('does not promote a revoked session even with valid TOTP', async () => {
    const { service, tx, actor, secret, sessions } = fixture();
    tx.authSession.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.enrollVerify(actor, { totp: authenticator.generate(secret) }, '127.0.0.1')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.staffMfaCredential.update).not.toHaveBeenCalled();
    expect(sessions.reissueStaffAccessToken).not.toHaveBeenCalled();
  });

  it('does not promote on invalid TOTP', async () => {
    const { service, tx, actor } = fixture();
    await expect(service.enrollVerify(actor, { totp: 'invalid' }, '127.0.0.1')).rejects.toThrow();
    expect(tx.authSession.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an enrollment changed between validation and transaction', async () => {
    const { service, tx, prisma, actor, secret } = fixture();
    prisma.staffMfaCredential = { ...tx.staffMfaCredential };
    tx.staffMfaCredential.findUnique = jest.fn().mockResolvedValue(null);
    await expect(service.enrollVerify(actor, { totp: authenticator.generate(secret) }, '127.0.0.1')).rejects.toThrow('Enrollment changed');
    expect(tx.authSession.updateMany).not.toHaveBeenCalled();
  });
});
