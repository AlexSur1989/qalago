import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { UploadsService } from './uploads.service';

describe('UploadsService authorization', () => {
  const businessId = 'biz-1';
  let businessAccess: { assertCanManageBusiness: jest.Mock };
  let service: UploadsService;

  beforeEach(() => {
    businessAccess = {
      assertCanManageBusiness: jest.fn().mockResolvedValue({
        id: businessId,
        ownerId: 'owner-1',
        cityId: 'city-1',
        categoryId: 'cat-1',
      }),
    };

    service = new UploadsService(
      { get: jest.fn().mockReturnValue('./uploads') } as never,
      {
        businessImage: {
          create: jest.fn().mockResolvedValue({ id: 'img-1', businessId, imageUrl: 'https://cdn/x.jpg' }),
          findMany: jest.fn(),
        },
      } as never,
      { assertCanAddPhoto: jest.fn().mockResolvedValue(undefined) } as never,
      businessAccess as unknown as BusinessAccessService,
    );
  });

  it('delegates attach authorization to BusinessAccessService', async () => {
    const user = { id: 'owner-1', sub: 'owner-1', role: UserRole.BUSINESS, phone: '+1' };
    await service.attachToBusiness(user, businessId, 'https://cdn/x.jpg');
    expect(businessAccess.assertCanManageBusiness).toHaveBeenCalledWith(user, businessId);
  });

  it('propagates forbidden from BusinessAccessService', async () => {
    businessAccess.assertCanManageBusiness.mockRejectedValue(
      new ForbiddenException('Not allowed to manage this business'),
    );
    const user = { id: 'owner-x', sub: 'owner-x', role: UserRole.BUSINESS, phone: '+2' };
    await expect(
      service.attachToBusiness(user, businessId, 'https://cdn/x.jpg'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('propagates not found from BusinessAccessService', async () => {
    businessAccess.assertCanManageBusiness.mockRejectedValue(
      new NotFoundException('Business not found'),
    );
    const user = { id: 'admin', sub: 'admin', role: UserRole.ADMIN, phone: '+3' };
    await expect(service.listBusinessImages(user, businessId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
