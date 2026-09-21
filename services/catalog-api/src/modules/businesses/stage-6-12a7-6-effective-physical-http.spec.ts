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
import { attachEffectivePhysicalToDetail } from './business-effective-physical.util';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessLocationService } from './business-location.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { BusinessTeamService } from './business-team.service';
import { AuditLogService } from '../audit-log/audit-log.service';

const QA_BUSINESS_ID = 'cmpn1wnq1000iult8yj6a06q7';
const QA_L1_ID = 'bl7085ee9a617ae8b64026db';
const QA_L2_ID = 'cmubk34fk0001uls458d1nta9';

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

describe('Stage 6.12A.7.6 — effective physical HTTP', () => {
  let app: INestApplication;
  let findOne: jest.Mock;

  beforeAll(async () => {
    findOne = jest.fn().mockResolvedValue({
      id: QA_BUSINESS_ID,
      title: 'Bar',
      activeLocationId: QA_L2_ID,
      effectivePhysical: { locationId: QA_L2_ID, address: 'L2' },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BusinessesController],
      providers: [
        { provide: BusinessesService, useValue: { findOne, findAll: jest.fn() } },
        {
          provide: BusinessLocationService,
          useValue: {
            listPublicLocations: jest.fn(),
            getLocation: jest.fn(),
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
    findOne.mockClear();
  });

  it('passes optional locationId query to BusinessesService.findOne', async () => {
    const res = await request(app.getHttpServer()).get(
      `/api/v1/businesses/${QA_BUSINESS_ID}?locationId=${QA_L2_ID}`,
    );

    expect(res.status).toBe(200);
    expect(findOne).toHaveBeenCalledWith(QA_BUSINESS_ID, { locationId: QA_L2_ID });
    expect(res.body.activeLocationId).toBe(QA_L2_ID);
  });

  it('findOne without locationId omits options object field when undefined', async () => {
    await request(app.getHttpServer()).get(`/api/v1/businesses/${QA_BUSINESS_ID}`);
    expect(findOne).toHaveBeenCalledWith(QA_BUSINESS_ID, { locationId: undefined });
  });
});

describe('Stage 6.12A.7.6 — effective physical QA fixture (runtime DB)', () => {
  const prisma = new PrismaClient();
  let skip = false;

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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('default and L1/L2 effectivePhysical differ by locationId', async () => {
    if (skip) return;

    const business = await prisma.business.findFirstOrThrow({
      where: { id: QA_BUSINESS_ID },
    });
    const locations = await prisma.businessLocation.findMany({
      where: { businessId: QA_BUSINESS_ID },
    });

    const defaultDetail = attachEffectivePhysicalToDetail(business, locations);
    const l1Detail = attachEffectivePhysicalToDetail(business, locations, QA_L1_ID);
    const l2Detail = attachEffectivePhysicalToDetail(business, locations, QA_L2_ID);

    expect(defaultDetail.activeLocationId).toBe(QA_L1_ID);
    expect(l1Detail.activeLocationId).toBe(QA_L1_ID);
    expect(l2Detail.activeLocationId).toBe(QA_L2_ID);
    expect(l2Detail.effectivePhysical.address).not.toBe(l1Detail.effectivePhysical.address);
  });

  it('foreign locationId falls back to primary without L2 address leak', async () => {
    if (skip) return;

    const business = await prisma.business.findFirstOrThrow({
      where: { id: QA_BUSINESS_ID },
    });
    const locations = await prisma.businessLocation.findMany({
      where: { businessId: QA_BUSINESS_ID },
    });
    const otherBusinessLocation = await prisma.businessLocation.findFirst({
      where: { businessId: { not: QA_BUSINESS_ID } },
      select: { id: true, address: true },
    });
    if (!otherBusinessLocation) return;

    const detail = attachEffectivePhysicalToDetail(
      business,
      locations,
      otherBusinessLocation.id,
    );
    expect(detail.activeLocationId).toBe(QA_L1_ID);
    expect(detail.effectivePhysical.address).not.toBe(otherBusinessLocation.address);
  });
});
