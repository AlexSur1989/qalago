import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  VersioningType,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BusinessStatus, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import {
  asReviewAggregationService,
  createMockReviewAggregation,
} from '../../test-utils/mock-review-aggregation';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessLocationService } from './business-location.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { BusinessTeamService } from './business-team.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { BUSINESS_LOCATION_CITY_MISMATCH_CODE } from './business-location-city-mismatch.exception';

@Injectable()
class PublicAwareAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    throw new UnauthorizedException('Missing bearer token');
  }
}

describe('Stage F.4 Phase 1 — public slug + city detail', () => {
  jest.setTimeout(60_000);
  const prisma = new PrismaClient();
  let skip = false;
  let uralskCityId = '';
  let aktobeCityId = '';
  let categoryId = '';
  let ownerId = '';
  const createdBusinessIds: string[] = [];
  let app: INestApplication;
  let publicContent: BusinessPublicContentService;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const user = await prisma.user.findFirst({ select: { id: true } });
      if (!uralsk || !aktobe || !category || !user) skip = true;
      else {
        uralskCityId = uralsk.id;
        aktobeCityId = aktobe.id;
        categoryId = category.id;
        ownerId = user.id;
      }
    } catch {
      skip = true;
    }

    publicContent = {
      getGalleryPreview: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
      getCatalogPreview: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
      getPromotionsPreview: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
      getReviewsPreview: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
      resolveCoverImageUrl: jest.fn().mockResolvedValue(null),
      getEffectiveMediaForDetail: jest.fn().mockImplementation((_id: string, activeLocationId: string | null) =>
        Promise.resolve({
          activeLocationId,
          coverImageUrl: null,
          galleryPreview: { items: [], totalCount: 0 },
        }),
      ),
      getEffectiveCatalogForDetail: jest.fn().mockImplementation((_id: string, activeLocationId: string | null) =>
        Promise.resolve({
          activeLocationId,
          sections: [],
          items: [],
          totalCount: 0,
        }),
      ),
      getEffectivePromotionsForDetail: jest.fn().mockImplementation((_id: string, activeLocationId: string | null) =>
        Promise.resolve({
          activeLocationId,
          items: [],
          totalCount: 0,
        }),
      ),
      findPublicCatalog: jest.fn(),
      findPublicPromotions: jest.fn(),
      findPublicPhotos: jest.fn(),
    } as unknown as BusinessPublicContentService;

    const subDeps = createMockSubcategoryDeps();
    const businessesService = new BusinessesService(
      prisma as unknown as PrismaService,
      new CityScopeService(prisma as unknown as PrismaService, {
        get: jest.fn().mockReturnValue('uralsk'),
      } as never),
      asBusinessAccessService(createMockBusinessAccess({ ownerId: ownerId || 'u' })),
      { createActiveOwnerMembership: jest.fn() } as never,
      {} as never,
      publicContent,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
      asReviewAggregationService(createMockReviewAggregation()),
      new BusinessPrimaryLocationService(),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BusinessesController],
      providers: [
        { provide: BusinessesService, useValue: businessesService },
        {
          provide: BusinessLocationService,
          useValue: { listPublicLocations: jest.fn().mockResolvedValue({ items: [] }) },
        },
        { provide: BusinessTeamService, useValue: {} },
        { provide: BusinessPublicContentService, useValue: publicContent },
        { provide: AuditLogService, useValue: { listTeamHistory: jest.fn() } },
        { provide: APP_GUARD, useClass: PublicAwareAuthGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterEach(async () => {
    if (skip || createdBusinessIds.length === 0) return;
    await prisma.business.deleteMany({ where: { id: { in: createdBusinessIds } } });
    createdBusinessIds.length = 0;
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  async function seedMultiCityBrand() {
    const slug = `f4-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `F4 ${slug}`,
        slug,
        categoryId,
        ownerId,
        status: BusinessStatus.ACTIVE,
      },
    });
    createdBusinessIds.push(business.id);
    const lUralsk = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Uralsk branch',
        isPrimary: true,
      },
    });
    const lAktobe = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: aktobeCityId,
        address: 'Aktobe branch',
        isPrimary: false,
      },
    });
    return { business, slug, lUralsk, lAktobe };
  }

  async function seedUralskOnlySecondaryPrimaryElsewhere() {
    const slug = `f4m-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `F4M ${slug}`,
        slug,
        categoryId,
        ownerId,
        status: BusinessStatus.ACTIVE,
      },
    });
    createdBusinessIds.push(business.id);
    await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: aktobeCityId,
        address: 'Primary Aktobe',
        isPrimary: true,
      },
    });
    const lU1 = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Uralsk sec 1',
        isPrimary: false,
        createdAt: new Date('2024-06-01'),
      },
    });
    const lU2 = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Uralsk sec 2',
        isPrimary: false,
        createdAt: new Date('2024-06-02'),
      },
    });
    return { business, slug, lU1, lU2 };
  }

  it('HTTP — primary in city without locationId', async () => {
    if (skip) return;
    const { slug, lUralsk } = await seedMultiCityBrand();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/businesses/by-slug/${encodeURIComponent(slug)}`)
      .query({ citySlug: 'uralsk' })
      .expect(200);
    expect(res.body.slug).toBe(slug);
    expect(res.body.activeLocationId).toBe(lUralsk.id);
    expect(res.body.effectivePhysical.locationId).toBe(lUralsk.id);
  });

  it('HTTP — city-default when primary elsewhere', async () => {
    if (skip) return;
    const { slug, lU1 } = await seedUralskOnlySecondaryPrimaryElsewhere();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/businesses/by-slug/${encodeURIComponent(slug)}`)
      .query({ citySlug: 'uralsk' })
      .expect(200);
    expect(res.body.activeLocationId).toBe(lU1.id);
  });

  it('HTTP — same-city locationId', async () => {
    if (skip) return;
    const { slug, lAktobe } = await seedMultiCityBrand();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/businesses/by-slug/${encodeURIComponent(slug)}`)
      .query({ citySlug: 'aktobe', locationId: lAktobe.id })
      .expect(200);
    expect(res.body.activeLocationId).toBe(lAktobe.id);
  });

  it('HTTP — wrong-city owned locationId returns normalization code', async () => {
    if (skip) return;
    const { slug, lAktobe } = await seedMultiCityBrand();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/businesses/by-slug/${encodeURIComponent(slug)}`)
      .query({ citySlug: 'uralsk', locationId: lAktobe.id })
      .expect(409);
    expect(res.body.code).toBe(BUSINESS_LOCATION_CITY_MISMATCH_CODE);
    expect(res.body.citySlug).toBe('aktobe');
    expect(res.body.locationId).toBe(lAktobe.id);
    expect(res.body.businessSlug).toBe(slug);
  });

  it('HTTP — foreign locationId uses city default without leak', async () => {
    if (skip) return;
    const { slug, lUralsk } = await seedMultiCityBrand();
    const other = await seedMultiCityBrand();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/businesses/by-slug/${encodeURIComponent(slug)}`)
      .query({ citySlug: 'uralsk', locationId: other.lAktobe.id })
      .expect(200);
    expect(res.body.activeLocationId).toBe(lUralsk.id);
  });

  it('HTTP — no branch in city → 404', async () => {
    if (skip) return;
    const slug = `f4solo-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'Solo',
        slug,
        categoryId,
        ownerId,
        status: BusinessStatus.ACTIVE,
        locations: {
          create: [{ cityId: uralskCityId, address: 'Only Uralsk', isPrimary: true }],
        },
      },
    });
    createdBusinessIds.push(business.id);
    await request(app.getHttpServer())
      .get(`/api/v1/businesses/by-slug/${encodeURIComponent(slug)}`)
      .query({ citySlug: 'aktobe' })
      .expect(404);
  });

  it('HTTP — unknown slug → 404', async () => {
    if (skip) return;
    await request(app.getHttpServer())
      .get('/api/v1/businesses/by-slug/does-not-exist-slug-xyz')
      .query({ citySlug: 'uralsk' })
      .expect(404);
  });

  it('HTTP — unknown citySlug → 404', async () => {
    if (skip) return;
    const { slug } = await seedMultiCityBrand();
    await request(app.getHttpServer())
      .get(`/api/v1/businesses/by-slug/${encodeURIComponent(slug)}`)
      .query({ citySlug: 'no-such-city-xyz' })
      .expect(404);
  });

  it('HTTP — PENDING business → 404', async () => {
    if (skip) return;
    const slug = `f4pend-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'Pending',
        slug,
        categoryId,
        ownerId,
        status: BusinessStatus.PENDING,
        locations: {
          create: [{ cityId: uralskCityId, address: 'x', isPrimary: true }],
        },
      },
    });
    createdBusinessIds.push(business.id);
    await request(app.getHttpServer())
      .get(`/api/v1/businesses/by-slug/${encodeURIComponent(slug)}`)
      .query({ citySlug: 'uralsk' })
      .expect(404);
  });

  it('HTTP — GET /businesses/:id unchanged global primary default', async () => {
    if (skip) return;
    const { business, lUralsk } = await seedMultiCityBrand();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/businesses/${business.id}`)
      .expect(200);
    expect(res.body.activeLocationId).toBe(lUralsk.id);
  });

  it('effective* hooks receive selected locationId', async () => {
    if (skip) return;
    jest.clearAllMocks();
    const { slug, lAktobe } = await seedMultiCityBrand();
    await request(app.getHttpServer())
      .get(`/api/v1/businesses/by-slug/${encodeURIComponent(slug)}`)
      .query({ citySlug: 'aktobe', locationId: lAktobe.id })
      .expect(200);
    expect(publicContent.getEffectiveMediaForDetail).toHaveBeenCalledWith(
      expect.any(String),
      lAktobe.id,
      null,
    );
    expect(publicContent.getEffectiveCatalogForDetail).toHaveBeenCalledWith(
      expect.any(String),
      lAktobe.id,
    );
    expect(publicContent.getEffectivePromotionsForDetail).toHaveBeenCalledWith(
      expect.any(String),
      lAktobe.id,
    );
  });
});
