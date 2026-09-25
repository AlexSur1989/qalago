import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  runBusinessLocationIntegrity,
} from '../../common/utils/business-location-integrity-repair.util';
import {
  assertPrimaryBusinessLocationParity,
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
        address: 'Dry zp addr',
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

  it('APPLY repairs zero-primary and syncs Business mirror', async () => {
    if (skip) return;
    const slug = await createSlug('a942a-apply-zp');
    const business = await prisma.business.create({
      data: {
        title: 'A942A apply zero primary',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Primary target addr',
        phone: 'apply-zp-phone',
        ownerId,
        status: 'ACTIVE',
        latitude: 51.2278,
        longitude: 51.3865,
      },
    });
    const older = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Older branch',
        isPrimary: false,
        createdAt: new Date('2019-01-01'),
        phone: 'older-phone',
      },
    });
    await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Newer branch',
        isPrimary: false,
        createdAt: new Date('2022-01-01'),
      },
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

      await assertPrimaryBusinessLocationParity(prisma, business.id);
      const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      expect(businessRow.address).toBe('Older branch');

      const second = await runBusinessLocationIntegrity(prisma, 'APPLY');
      expect(second.repairedCount).toBe(0);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('APPLY reconstructs zero-location when safe', async () => {
    if (skip) return;
    const slug = await createSlug('a942a-apply-zl');
    const business = await prisma.business.create({
      data: {
        title: 'A942A apply zero location',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Reconstruct me',
        ownerId,
        status: 'PENDING',
        latitude: 51.2278,
        longitude: 51.3865,
      },
    });

    try {
      const summary = await runBusinessLocationIntegrity(prisma, 'APPLY');
      const item = summary.items.find(
        (i) => i.businessId === business.id && i.result === 'REPAIRED',
      );
      expect(item?.proposedAction).toBe('RECONSTRUCT_PRIMARY_LOCATION');

      const locations = await prisma.businessLocation.findMany({ where: { businessId: business.id } });
      expect(locations).toHaveLength(1);
      expect(locations[0]?.isPrimary).toBe(true);
      await assertPrimaryBusinessLocationParity(prisma, business.id);
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
        address: '',
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
        address: 'Valid addr',
        ownerId,
        status: 'PENDING',
      },
    });
    await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Only primary',
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
