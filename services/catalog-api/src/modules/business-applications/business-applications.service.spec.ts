import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  BusinessApplicationStatus,
  BusinessStatus,
  CityLaunchStatus,
  UserRole,
} from '@prisma/client';
import { BusinessApplicationsService } from './business-applications.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { buildApplicationDedupeKey } from '../../common/utils/business-application-dedupe.util';

describe('BusinessApplicationsService (Stage 5N.1)', () => {
  const user: AuthUser = {
    id: 'user-1',
    sub: 'user-1',
    phone: '+77000000010',
    role: UserRole.USER,
  };
  const admin: AuthUser = {
    id: 'admin-1',
    sub: 'admin-1',
    phone: '+77000000001',
    role: UserRole.SUPER_ADMIN,
  };
  const cityAdmin: AuthUser = {
    id: 'city-admin-1',
    sub: 'city-admin-1',
    phone: '+77000000004',
    role: UserRole.CITY_ADMIN,
  };

  const baseApplication = {
    id: 'app-1',
    applicantUserId: 'user-1',
    cityId: 'city-uralsk',
    categoryId: 'cat-1',
    title: 'Cafe Sultan',
    shortDesc: null,
    address: 'Abay 10',
    phone: null,
    status: BusinessApplicationStatus.DRAFT,
    dedupeKey: buildApplicationDedupeKey('city-uralsk', 'Cafe Sultan', 'Abay 10'),
    rejectionReason: null,
    reviewedByUserId: null,
    reviewedAt: null,
    approvedBusinessId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const auditLog = { record: jest.fn().mockResolvedValue({}) };
  const membership = { createActiveOwnerMembership: jest.fn().mockResolvedValue({}) };
  const notifications = { create: jest.fn().mockResolvedValue({}) };
  const rateLimit = {
    assertApplicationCreate: jest.fn(),
    assertApplicationSubmit: jest.fn(),
    assertOwnershipClaimCreate: jest.fn(),
  };
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
    resolveAdminCityId: jest.fn().mockResolvedValue('city-uralsk'),
    assertBusinessInAdminScope: jest.fn().mockResolvedValue(undefined),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let service: BusinessApplicationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      businessApplication: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cat-1', isActive: true }),
        findUnique: jest.fn().mockResolvedValue({ id: 'cat-1', isActive: true }),
      },
      city: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'city-uralsk',
          isActive: true,
          launchStatus: CityLaunchStatus.LIVE,
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'city-uralsk',
          launchStatus: CityLaunchStatus.LIVE,
        }),
      },
      business: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'biz-new',
          title: 'Cafe Sultan',
          status: BusinessStatus.ACTIVE,
        }),
      },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) => fn(prisma)),
    };

    service = new BusinessApplicationsService(
      prisma as never,
      cityScope as never,
      membership as never,
      auditLog as never,
      notifications as never,
      rateLimit as never,
    );
  });

  it('creates DRAFT without Business or membership', async () => {
    prisma.businessApplication.findFirst = jest.fn().mockResolvedValue(null);
    prisma.businessApplication.create = jest.fn().mockResolvedValue({
      ...baseApplication,
      city: null,
      category: null,
      approvedBusiness: null,
    });

    await service.createDraft(user, {
      title: 'Cafe Sultan',
      categoryId: 'cat-1',
      citySlug: 'uralsk',
      address: 'Abay 10',
    });

    expect(prisma.businessApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: BusinessApplicationStatus.DRAFT }),
      }),
    );
    expect(prisma.business.create).not.toHaveBeenCalled();
    expect(membership.createActiveOwnerMembership).not.toHaveBeenCalled();
  });

  it('denies IDOR read', async () => {
    prisma.businessApplication.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseApplication, applicantUserId: 'other-user' });

    await expect(service.getOwn(user, 'app-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('submits DRAFT to PENDING and writes audit', async () => {
    prisma.businessApplication.findUnique = jest.fn().mockResolvedValue({
      ...baseApplication,
      city: null,
      category: null,
      approvedBusiness: null,
    });
    prisma.businessApplication.updateMany = jest.fn().mockResolvedValue({ count: 1 });
    prisma.businessApplication.findUniqueOrThrow = jest.fn().mockResolvedValue({
      ...baseApplication,
      status: BusinessApplicationStatus.PENDING,
    });

    await service.submit(user, 'app-1');

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.BUSINESS_APPLICATION_SUBMIT }),
    );
    expect(prisma.business.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate pending application for same dedupe identity', async () => {
    prisma.businessApplication.findFirst = jest.fn().mockResolvedValue({ id: 'app-other' });

    await expect(
      service.createDraft(user, {
        title: 'Cafe Sultan',
        categoryId: 'cat-1',
        citySlug: 'uralsk',
        address: 'Abay 10',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects submit when matching business already exists', async () => {
    prisma.businessApplication.findUnique = jest.fn().mockResolvedValue({
      ...baseApplication,
      city: null,
      category: null,
      approvedBusiness: null,
    });
    prisma.business.findMany = jest.fn().mockResolvedValue([
      { id: 'b1', cityId: 'city-uralsk', title: 'Cafe Sultan', address: 'Abay 10' },
    ]);

    await expect(service.submit(user, 'app-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('approves atomically and keeps applicant USER role untouched', async () => {
    prisma.businessApplication.findUnique = jest
      .fn()
      .mockResolvedValueOnce({
        ...baseApplication,
        status: BusinessApplicationStatus.PENDING,
        applicant: { id: 'user-1', name: 'User', role: UserRole.USER },
        reviewedBy: null,
        city: { launchStatus: CityLaunchStatus.LIVE },
        category: null,
        approvedBusiness: null,
      })
      .mockResolvedValueOnce({ ...baseApplication, status: BusinessApplicationStatus.PENDING });

    prisma.businessApplication.updateMany = jest.fn().mockResolvedValue({ count: 1 });
    prisma.businessApplication.findUniqueOrThrow = jest.fn().mockResolvedValue({
      ...baseApplication,
      status: BusinessApplicationStatus.APPROVED,
      approvedBusinessId: 'biz-new',
    });

    const result = await service.adminApprove(admin, 'app-1');

    expect(prisma.business.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: 'user-1',
          status: BusinessStatus.ACTIVE,
        }),
      }),
    );
    expect(membership.createActiveOwnerMembership).toHaveBeenCalledWith(
      prisma,
      'user-1',
      'biz-new',
    );
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.BUSINESS_APPLICATION_APPROVE }),
    );
    expect(result.business?.id).toBe('biz-new');
  });

  it('creates PENDING business for COMING_SOON city on approval', async () => {
    prisma.businessApplication.findUnique = jest
      .fn()
      .mockResolvedValueOnce({
        ...baseApplication,
        status: BusinessApplicationStatus.PENDING,
        applicant: { id: 'user-1', name: 'User', role: UserRole.USER },
        reviewedBy: null,
        city: { launchStatus: CityLaunchStatus.COMING_SOON },
        category: null,
        approvedBusiness: null,
      })
      .mockResolvedValueOnce({ ...baseApplication, status: BusinessApplicationStatus.PENDING });

    prisma.city.findUniqueOrThrow = jest.fn().mockResolvedValue({
      id: 'city-uralsk',
      launchStatus: CityLaunchStatus.COMING_SOON,
    });
    prisma.businessApplication.updateMany = jest.fn().mockResolvedValue({ count: 1 });
    prisma.businessApplication.findUniqueOrThrow = jest.fn().mockResolvedValue({
      ...baseApplication,
      status: BusinessApplicationStatus.APPROVED,
    });

    await service.adminApprove(admin, 'app-1');

    expect(prisma.business.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: BusinessStatus.PENDING }),
      }),
    );
  });

  it('is idempotent on second approve', async () => {
    prisma.businessApplication.findUnique = jest.fn().mockResolvedValue({
      ...baseApplication,
      status: BusinessApplicationStatus.APPROVED,
      approvedBusinessId: 'biz-new',
      approvedBusiness: { id: 'biz-new' },
      applicant: null,
      reviewedBy: null,
      city: null,
      category: null,
    });

    const result = await service.adminApprove(admin, 'app-1');
    expect(result.business?.id).toBe('biz-new');
    expect(prisma.business.create).not.toHaveBeenCalled();
  });

  it('denies approve after reject race', async () => {
    prisma.businessApplication.findUnique = jest.fn().mockResolvedValue({
      ...baseApplication,
      status: BusinessApplicationStatus.REJECTED,
      applicant: null,
      reviewedBy: null,
      city: null,
      category: null,
      approvedBusiness: null,
    });

    await expect(service.adminApprove(admin, 'app-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects with audit and notification', async () => {
    prisma.businessApplication.findUnique = jest.fn().mockResolvedValue({
      ...baseApplication,
      status: BusinessApplicationStatus.PENDING,
      applicant: { id: 'user-1', name: 'User', role: UserRole.USER },
      reviewedBy: null,
      city: null,
      category: null,
      approvedBusiness: null,
    });
    prisma.businessApplication.updateMany = jest.fn().mockResolvedValue({ count: 1 });
    prisma.businessApplication.findUniqueOrThrow = jest.fn().mockResolvedValue({
      ...baseApplication,
      status: BusinessApplicationStatus.REJECTED,
    });

    await service.adminReject(admin, 'app-1', { rejectionReason: 'Incomplete details' });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.BUSINESS_APPLICATION_REJECT }),
    );
    expect(notifications.create).toHaveBeenCalled();
  });

  it('forces CITY_ADMIN to managed city on list', async () => {
    prisma.businessApplication.findMany = jest.fn().mockResolvedValue([]);
    prisma.businessApplication.count = jest.fn().mockResolvedValue(0);

    await expect(
      service.adminList(cityAdmin, { cityId: 'city-other' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await service.adminList(cityAdmin, {});
    expect(prisma.businessApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cityId: 'city-uralsk' }),
      }),
    );
  });

  it('clears review fields when REJECTED edited back to DRAFT', async () => {
    prisma.businessApplication.findUnique = jest.fn().mockResolvedValue({
      ...baseApplication,
      status: BusinessApplicationStatus.REJECTED,
      rejectionReason: 'Old reason',
      reviewedByUserId: 'admin-1',
      reviewedAt: new Date(),
      city: null,
      category: null,
      approvedBusiness: null,
    });
    prisma.businessApplication.findFirst = jest.fn().mockResolvedValue(null);
    prisma.businessApplication.update = jest.fn().mockResolvedValue({
      ...baseApplication,
      status: BusinessApplicationStatus.DRAFT,
      rejectionReason: null,
    });

    await service.updateOwn(user, 'app-1', { title: 'Cafe Sultan 2' });

    expect(prisma.businessApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: BusinessApplicationStatus.DRAFT,
          rejectionReason: null,
          reviewedByUserId: null,
        }),
      }),
    );
  });
});
