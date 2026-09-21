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
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { PrismaService } from '../../prisma/prisma.service';
import { asBusinessAccessService, createMockBusinessAccess } from '../../test-utils/mock-business-access';
import { AuditLogService } from '../audit-log/audit-log.service';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessLocationService } from './business-location.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { BusinessTeamService } from './business-team.service';

const QA_BUSINESS_ID = 'cmpn1wnq1000iult8yj6a06q7';
const QA_L1_ID = 'bl7085ee9a617ae8b64026db';
const QA_L2_ID = 'cmubk34fk0001uls458d1nta9';

/** Mirrors JwtAuthGuard public-route behavior for HTTP routing tests. */
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

describe('Stage 6.12A.7.4 — public locations HTTP routing', () => {
  let app: INestApplication;
  let listPublicLocations: jest.Mock;
  let getLocation: jest.Mock;

  beforeAll(async () => {
    listPublicLocations = jest.fn();
    getLocation = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BusinessesController],
      providers: [
        { provide: BusinessesService, useValue: { findOne: jest.fn(), findAll: jest.fn() } },
        {
          provide: BusinessLocationService,
          useValue: {
            listPublicLocations,
            getLocation,
            listLocations: jest.fn(),
            createLocation: jest.fn(),
            updateLocation: jest.fn(),
            setPrimaryLocation: jest.fn(),
          },
        },
        { provide: BusinessTeamService, useValue: {} },
        { provide: BusinessPublicContentService, useValue: { findPublicCatalog: jest.fn() } },
        { provide: AuditLogService, useValue: { listTeamHistory: jest.fn() } },
        { provide: APP_GUARD, useClass: PublicAwareAuthGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    listPublicLocations.mockReset();
    getLocation.mockReset();
  });

  it('GET /businesses/:id/locations/public is public and not shadowed by :locationId', async () => {
    listPublicLocations.mockResolvedValue({
      items: [
        {
          id: QA_L1_ID,
          businessId: QA_BUSINESS_ID,
          isPrimary: true,
          address: 'Primary',
        },
        {
          id: QA_L2_ID,
          businessId: QA_BUSINESS_ID,
          isPrimary: false,
          address: 'Branch',
        },
      ],
    });

    const res = await request(app.getHttpServer()).get(
      `/api/v1/businesses/${QA_BUSINESS_ID}/locations/public`,
    );

    expect(res.status).toBe(200);
    expect(listPublicLocations).toHaveBeenCalledTimes(1);
    expect(listPublicLocations).toHaveBeenCalledWith(QA_BUSINESS_ID);
    expect(getLocation).not.toHaveBeenCalled();

    const ids = (res.body.items as Array<{ id: string }>).map((row) => row.id).sort();
    expect(res.body.items).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(ids).toEqual([QA_L1_ID, QA_L2_ID].sort());
    expect(res.body.items.every((row: { businessId: string }) => row.businessId === QA_BUSINESS_ID))
      .toBe(true);
    expect(res.body.items.some((row: { isPrimary: boolean }) => row.isPrimary)).toBe(true);
    expect(res.body.items.some((row: { isPrimary: boolean }) => !row.isPrimary)).toBe(true);
  });

  it('GET /businesses/:businessId/locations/:locationId stays protected without bearer', async () => {
    const res = await request(app.getHttpServer()).get(
      `/api/v1/businesses/${QA_BUSINESS_ID}/locations/${QA_L1_ID}`,
    );

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Missing bearer token');
    expect(getLocation).not.toHaveBeenCalled();
    expect(listPublicLocations).not.toHaveBeenCalled();
  });
});

describe('Stage 6.12A.7.4 — public locations HTTP (QA fixture DB)', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let app: INestApplication;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const business = await prisma.business.findFirst({
        where: { id: QA_BUSINESS_ID, status: 'ACTIVE' },
        select: { id: true },
      });
      const locations = await prisma.businessLocation.count({
        where: { businessId: QA_BUSINESS_ID },
      });
      if (!business || locations < 2) skip = true;
    } catch {
      skip = true;
    }

    if (skip) return;

    const owner = await prisma.business.findUnique({
      where: { id: QA_BUSINESS_ID },
      select: { ownerId: true },
    });
    const locationService = new BusinessLocationService(
      prisma as unknown as PrismaService,
      asBusinessAccessService(createMockBusinessAccess({ ownerId: owner?.ownerId ?? '' })),
      new BusinessPrimaryLocationService(),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BusinessesController],
      providers: [
        { provide: BusinessesService, useValue: { findOne: jest.fn(), findAll: jest.fn() } },
        { provide: BusinessLocationService, useValue: locationService },
        { provide: BusinessTeamService, useValue: {} },
        { provide: BusinessPublicContentService, useValue: { findPublicCatalog: jest.fn() } },
        { provide: AuditLogService, useValue: { listTeamHistory: jest.fn() } },
        { provide: APP_GUARD, useClass: PublicAwareAuthGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    await prisma.$disconnect();
  });

  it('returns Bar Code 51 L1 and L2 without auth when fixture exists', async () => {
    if (skip) return;

    const res = await request(app.getHttpServer()).get(
      `/api/v1/businesses/${QA_BUSINESS_ID}/locations/public`,
    );

    expect(res.status).toBe(200);
    const ids = (res.body.items as Array<{ id: string }>).map((row) => row.id);
    expect(ids).toContain(QA_L1_ID);
    expect(ids).toContain(QA_L2_ID);
  });
});
