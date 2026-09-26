import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  runBusinessLocationIntegrity,
} from '../../common/utils/business-location-integrity-repair.util';
import {
  assertPrimaryBusinessCompatibilityParity,
} from './business-location-parity.test-util';

describe('Stage 6.12A.9.4.2A — BusinessLocation integrity repair tooling', () => {
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

  async function createSlug(prefix: string) {
    return `${prefix}-${randomBytes(5).toString('hex')}`;
  }

  it('DRY_RUN detects zero-primary and does not mutate', async () => {
    if (skip) return;
    const slug = await createSlug('a942a-dry-zp');
    const business = await prisma.business.create({
      data: {
        title: 'A942A dry zero primary',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId,
        status: 'PENDING',
      },
    });
    await prisma.businessLocation.createMany({
      data: [
        { businessId: business.id, cityId: uralskCityId, address: 'B1', isPrimary: false },
        { businessId: business.id, cityId: uralskCityId, address: 'B2', isPrimary: false },
      ],
    });

    try {
      const before = await prisma.businessLocation.count({ where: { businessId: business.id } });
      const summary = await runBusinessLocationIntegrity(prisma, 'DRY_RUN');
      expect(summary.zeroPrimaryCount).toBeGreaterThanOrEqual(1);
      const item = summary.items.find((i) => i.businessId === business.id);
      expect(item?.proposedAction).toBe('PROMOTE_DETERMINISTIC_PRIMARY');
      expect(item?.chosenLocationId).toBeDefined();
      const after = await prisma.businessLocation.count({ where: { businessId: business.id } });
      expect(after).toBe(before);
    } finally {
      await prisma.businessLocation.deleteMany({ where: { businessId: business.id } });
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('APPLY repairs zero-primary without writing retired Business geo mirror', async () => {
    if (skip) return;
    const slug = await createSlug('a942a-apply-zp');
    const business = await prisma.business.create({
      data: {
        title: 'A942A apply zero primary',
        slug,
        categoryId,
        cityId: uralskCityId,
        phone: 'apply-zp-phone',
        ownerId,
        status: 'ACTIVE',
      },
    });
    const older = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: false,
        createdAt: new Date('2019-01-01'),
        phone: 'older-phone',
      },
    });
    await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: false,
        createdAt: new Date('2022-01-01'),
      },
    });

    const geoBefore = await prisma.businessLocation.findFirstOrThrow({
      where: { businessId: business.id, isPrimary: true },
    });

    try {
      const summary = await runBusinessLocationIntegrity(prisma, 'APPLY');
      const item = summary.items.find(
        (i) => i.businessId === business.id && i.result === 'REPAIRED',
      );
      expect(item?.chosenLocationId).toBe(older.id);

      const primaries = await prisma.businessLocation.findMany({
        where: { businessId: business.id, isPrimary: true },
      });
      expect(primaries).toHaveLength(1);
      expect(primaries[0]?.id).toBe(older.id);

      await assertPrimaryBusinessCompatibilityParity(prisma, business.id);
      const businessRow = await prisma.business.findUniqueOrThrow({
        where: { id: business.id },
        select: {
          cityId: true,
        },
      });
      expect(businessRow.cityId).toBe(geoBefore.cityId);
      expect(businessRow.cityId).toBe(uralskCityId);

      const second = await runBusinessLocationIntegrity(prisma, 'APPLY');
      expect(second.repairedCount).toBe(0);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('APPLY does not reconstruct zero-location from Business geo (C2)', async () => {
    if (skip) return;
    const slug = await createSlug('a942a-apply-zl');
    const business = await prisma.business.create({
      data: {
        title: 'A942A apply zero location',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId,
        status: 'PENDING',
      },
    });

    try {
      const summary = await runBusinessLocationIntegrity(prisma, 'APPLY');
      const item = summary.items.find((i) => i.businessId === business.id);
      expect(item?.proposedAction).toBe('MANUAL_REMEDIATION');
      expect(item?.result).toBe('MANUAL_REMEDIATION');

      const locations = await prisma.businessLocation.findMany({ where: { businessId: business.id } });
      expect(locations).toHaveLength(0);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('classifies invalid zero-location as MANUAL_REMEDIATION without mutation', async () => {
    if (skip) return;
    const slug = await createSlug('a942a-manual-zl');
    const business = await prisma.business.create({
      data: {
        title: 'A942A manual zero location',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId,
        status: 'PENDING',
      },
    });

    try {
      const dry = await runBusinessLocationIntegrity(prisma, 'DRY_RUN');
      const item = dry.items.find((i) => i.businessId === business.id);
      expect(item?.result).toBe('MANUAL_REMEDIATION');

      const apply = await runBusinessLocationIntegrity(prisma, 'APPLY');
      const applyItem = apply.items.find((i) => i.businessId === business.id);
      expect(applyItem?.result).toBe('MANUAL_REMEDIATION');
      const count = await prisma.businessLocation.count({ where: { businessId: business.id } });
      expect(count).toBe(0);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('SKIPPED_ALREADY_VALID when apply runs on repaired zero-primary business', async () => {
    if (skip) return;
    const slug = await createSlug('a942a-stale');
    const business = await prisma.business.create({
      data: {
        title: 'A942A stale skip',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId,
        status: 'PENDING',
      },
    });
    await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: true,
      },
    });

    try {
      const summary = await runBusinessLocationIntegrity(prisma, 'APPLY');
      const item = summary.items.find((i) => i.businessId === business.id);
      expect(item).toBeUndefined();
      const primaries = await prisma.businessLocation.count({
        where: { businessId: business.id, isPrimary: true },
      });
      expect(primaries).toBe(1);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });
});
