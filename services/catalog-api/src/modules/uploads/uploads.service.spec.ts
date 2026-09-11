import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessPermission, UserRole } from '@prisma/client';
import { UploadsService } from './uploads.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('UploadsService authorization', () => {
  const businessId = 'biz-1';
  let businessAccess: ReturnType<typeof createMockBusinessAccess>;
  let service: UploadsService;

  beforeEach(() => {
    businessAccess = createMockBusinessAccess();

    service = new UploadsService(
      { get: jest.fn().mockReturnValue('./uploads') } as never,
      {
        businessImage: {
          create: jest.fn().mockResolvedValue({ id: 'img-1', businessId, imageUrl: 'https://cdn/x.jpg' }),
          findMany: jest.fn(),
        },
      } as never,
      { assertCanAddPhoto: jest.fn().mockResolvedValue(undefined) } as never,
      asBusinessAccessService(businessAccess),
      asAuditLogService(createMockAuditLog()),
      {
        assertAllowed: jest.fn().mockResolvedValue(undefined),
        recordHit: jest.fn().mockResolvedValue(undefined),
      } as never,
    );
  });

  it('delegates attach authorization to BusinessAccessService PHOTOS_EDIT', async () => {
    const user = { id: 'owner-1', sub: 'owner-1', role: UserRole.BUSINESS, phone: '+1' };
    await service.attachToBusiness(user, businessId, 'https://cdn/x.jpg');
    expect(businessAccess.assertBusinessPermission).toHaveBeenCalledWith(
      user,
      businessId,
      BusinessPermission.PHOTOS_EDIT,
    );
  });

  it('propagates forbidden from BusinessAccessService', async () => {
    businessAccess.assertBusinessPermission.mockRejectedValue(
      new ForbiddenException('Not allowed to manage this business'),
    );
    const user = { id: 'owner-x', sub: 'owner-x', role: UserRole.BUSINESS, phone: '+2' };
    await expect(
      service.attachToBusiness(user, businessId, 'https://cdn/x.jpg'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('propagates not found from BusinessAccessService', async () => {
    businessAccess.assertBusinessPermission.mockRejectedValue(
      new NotFoundException('Business not found'),
    );
    const user = { id: 'admin', sub: 'admin', role: UserRole.ADMIN, phone: '+3' };
    await expect(service.listBusinessImages(user, businessId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
