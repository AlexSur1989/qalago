import { collectPrimaryIntegrityReport } from './business-primary-integrity-audit.util';

describe('business-primary-integrity-audit.util', () => {
  it('collectPrimaryIntegrityReport returns pass flag from counts', async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([
          {
            businesses_total: 2,
            businesses_with_zero_locations: 0,
            businesses_with_locations: 2,
            businesses_exactly_one_primary: 2,
            businesses_with_locations_zero_primary: 0,
            businesses_multi_primary: 0,
            locations_total: 2,
            primary_locations: 2,
            secondary_locations: 0,
          },
        ])
        .mockResolvedValueOnce([]),
    };

    const report = await collectPrimaryIntegrityReport(prisma as never);
    expect(report.pass).toBe(true);
    expect(report.businessesMultiPrimary).toBe(0);
  });
});
