import { BusinessStatus, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { createBusinessWithInitialPrimaryInTx } from '../../common/utils/business-primary-location-aggregate.util';
import { runBusinessLocationIntegrity } from '../../common/utils/business-location-integrity-repair.util';
import { buildEffectivePhysicalDto } from './business-effective-physical.util';
import { businessRowToContactDefaults } from './business-physical-read-normalization.util';

describe('Stage 6.12A.9.4.4C3 — business creation BL authority', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let uralskCityId = '';
  let categoryId = '';
  let ownerId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'BusinessLocation'
        ) AS exists`;
      skip = !table[0]?.exists;
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const user = await prisma.user.findFirst({ select: { id: true } });
      if (!uralsk || !category || !user) skip = true;
      else {
        uralskCityId = uralsk.id;
        categoryId = category.id;
        ownerId = user.id;
      }
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('createBusinessWithInitialPrimaryInTx creates shell + one primary BL atomically', async () => {
    if (skip) return;
    const slug = `c3-agg-${randomBytes(4).toString('hex')}`;

    try {
      await prisma.$transaction(async (tx) => {
        const { business, primaryLocation } = await createBusinessWithInitialPrimaryInTx(tx, {
          brand: {
            title: 'C3 aggregate',
            slug,
            categoryId,
            ownerId,
            status: BusinessStatus.PENDING,
            phone: '+77001112233',
          },
          primaryPhysical: {
            cityId: uralskCityId,
            address: 'Authoritative BL addr',
            latitude: null,
            longitude: null,
            locationSource: null,
            workHours: null,
            phone: '+77001112233',
            whatsapp: null,
            instagram: null,
            website: null,
          },
        });

        expect(primaryLocation.isPrimary).toBe(true);
        expect(primaryLocation.address).toBe('Authoritative BL addr');
        expect(primaryLocation.cityId).toBe(uralskCityId);
        expect(business.phone).toBe('+77001112233');

        const count = await tx.businessLocation.count({ where: { businessId: business.id } });
        expect(count).toBe(1);
      });
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });

  it('legacy INSERT bootstrap on Business does not track BL geo after create', async () => {
    if (skip) return;
    const slug = `c3-bootstrap-${randomBytes(4).toString('hex')}`;

    try {
      const { businessId, locationId } = await prisma.$transaction(async (tx) => {
        const { business, primaryLocation } = await createBusinessWithInitialPrimaryInTx(tx, {
          brand: {
            title: 'C3 bootstrap drift',
            slug,
            categoryId,
            ownerId,
            status: BusinessStatus.PENDING,
          },
          primaryPhysical: {
            cityId: uralskCityId,
            address: 'Initial BL addr',
            latitude: null,
            longitude: null,
            locationSource: null,
            workHours: null,
            phone: null,
            whatsapp: null,
            instagram: null,
            website: null,
          },
        });
        return { businessId: business.id, locationId: primaryLocation.id };
      });

      const before = await prisma.businessLocation.findUniqueOrThrow({
        where: { id: locationId },
      });
      expect(before.address).toBe('Initial BL addr');

      await prisma.businessLocation.update({
        where: { id: locationId },
        data: { address: 'Updated BL only' },
      });

      const afterPrimary = await prisma.businessLocation.findUniqueOrThrow({
        where: { id: locationId },
      });
      expect(afterPrimary.address).toBe('Updated BL only');

      const bl = await prisma.businessLocation.findUniqueOrThrow({ where: { id: locationId } });
      const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
      const dto = buildEffectivePhysicalDto(businessRowToContactDefaults(businessRow), bl);
      expect(dto.address).toBe('Updated BL only');
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });

  it('failed primary BL creation rolls back Business shell', async () => {
    if (skip) return;
    const slug = `c3-rollback-${randomBytes(4).toString('hex')}`;
    const before = await prisma.business.count({ where: { slug } });

    await expect(
      prisma.$transaction(async (tx) => {
        await createBusinessWithInitialPrimaryInTx(tx, {
          brand: {
            title: 'C3 rollback',
            slug,
            categoryId,
            ownerId,
            status: BusinessStatus.PENDING,
          },
          primaryPhysical: {
            cityId: uralskCityId,
            address: 'Addr',
            latitude: null,
            longitude: null,
            locationSource: null,
            workHours: null,
            phone: null,
            whatsapp: null,
            instagram: null,
            website: null,
          },
        });
        await tx.businessLocation.create({
          data: {
            businessId: 'nonexistent-id',
            cityId: uralskCityId,
            address: 'force fail',
            isPrimary: true,
          },
        });
      }),
    ).rejects.toThrow();

    expect(await prisma.business.count({ where: { slug } })).toBe(before);
  });

  it('integrity audit remains BL-native after aggregate create fixture', async () => {
    if (skip) return;
    const slug = `c3-integ-${randomBytes(4).toString('hex')}`;

    try {
      await prisma.$transaction(async (tx) => {
        await createBusinessWithInitialPrimaryInTx(tx, {
          brand: {
            title: 'C3 integrity',
            slug,
            categoryId,
            ownerId,
            status: BusinessStatus.PENDING,
          },
          primaryPhysical: {
            cityId: uralskCityId,
            address: 'Integrity addr',
            latitude: null,
            longitude: null,
            locationSource: null,
            workHours: null,
            phone: null,
            whatsapp: null,
            instagram: null,
            website: null,
          },
        });
      });

      const summary = await runBusinessLocationIntegrity(prisma, 'AUDIT_ONLY');
      expect(summary.items.find((i) => i.businessId && i.problemType !== 'VALID')).toBeUndefined();
      const biz = await prisma.business.findFirst({ where: { slug }, select: { id: true } });
      expect(biz).toBeTruthy();
      const item = summary.items.find((i) => i.businessId === biz!.id);
      expect(item).toBeUndefined();
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });
});
