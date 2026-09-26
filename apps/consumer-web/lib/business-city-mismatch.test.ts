import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  BUSINESS_LOCATION_CITY_MISMATCH_CODE,
  canonicalBusinessPagePath,
  parseBusinessCityMismatchBody,
} from './business-page-paths';

const fullMismatchBody = {
  statusCode: 409,
  message: 'Business location belongs to another city',
  code: BUSINESS_LOCATION_CITY_MISMATCH_CODE,
  businessSlug: 'a91-del-primary-87d3aaf452',
  locationId: 'cmugp1kz90003ulisj3hk139m',
  citySlug: 'aktobe',
};

describe('F.4 city mismatch parser (strict)', () => {
  it('parses real backend shape after filter preserves public fields', () => {
    expect(parseBusinessCityMismatchBody(fullMismatchBody)).toEqual({
      businessSlug: 'a91-del-primary-87d3aaf452',
      locationId: 'cmugp1kz90003ulisj3hk139m',
      citySlug: 'aktobe',
    });
  });

  it('rejects pre-hotfix stripped 409 body (code only)', () => {
    expect(
      parseBusinessCityMismatchBody({
        statusCode: 409,
        message: 'Business location belongs to another city',
        code: BUSINESS_LOCATION_CITY_MISMATCH_CODE,
      }),
    ).toBeNull();
  });

  it('rejects unrelated 409', () => {
    expect(
      parseBusinessCityMismatchBody({
        statusCode: 409,
        code: 'REPORT_ALREADY_SUBMITTED',
        message: 'conflict',
      }),
    ).toBeNull();
  });

  it('rejects missing code', () => {
    expect(
      parseBusinessCityMismatchBody({
        businessSlug: 'b',
        locationId: 'l',
        citySlug: 'uralsk',
      }),
    ).toBeNull();
  });

  it('rejects missing citySlug', () => {
    expect(
      parseBusinessCityMismatchBody({
        code: BUSINESS_LOCATION_CITY_MISMATCH_CODE,
        businessSlug: 'b',
        locationId: 'l',
      }),
    ).toBeNull();
  });

  it('rejects missing businessSlug', () => {
    expect(
      parseBusinessCityMismatchBody({
        code: BUSINESS_LOCATION_CITY_MISMATCH_CODE,
        locationId: 'l',
        citySlug: 'uralsk',
      }),
    ).toBeNull();
  });

  it('rejects missing locationId', () => {
    expect(
      parseBusinessCityMismatchBody({
        code: BUSINESS_LOCATION_CITY_MISMATCH_CODE,
        businessSlug: 'b',
        citySlug: 'uralsk',
      }),
    ).toBeNull();
  });

  it('ignores arbitrary redirect URL in body', () => {
    const parsed = parseBusinessCityMismatchBody({
      ...fullMismatchBody,
      redirectUrl: 'https://evil.example/phish',
    });
    expect(parsed?.citySlug).toBe('aktobe');
    expect(parsed).not.toHaveProperty('redirectUrl');
    expect(
      canonicalBusinessPagePath(parsed!.citySlug, parsed!.businessSlug, parsed!.locationId),
    ).toBe(
      '/aktobe/business/a91-del-primary-87d3aaf452?locationId=cmugp1kz90003ulisj3hk139m',
    );
  });
});

describe('fetchBusinessBySlug 409 handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('city_mismatch only for full valid BUSINESS_LOCATION_CITY_MISMATCH body', async () => {
    const { fetchBusinessBySlug } = await import('./catalog-api');
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(fullMismatchBody), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const result = await fetchBusinessBySlug({
      businessSlug: 'a91-del-primary-87d3aaf452',
      citySlug: 'uralsk',
      locationId: 'cmugp1kz90003ulisj3hk139m',
    });
    expect(result.status).toBe('city_mismatch');
    if (result.status === 'city_mismatch') {
      expect(result.payload.citySlug).toBe('aktobe');
    }
  });

  it('throws on stripped 409 (does not treat as redirect)', async () => {
    const { fetchBusinessBySlug } = await import('./catalog-api');
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 409,
          code: BUSINESS_LOCATION_CITY_MISMATCH_CODE,
          message: 'Business location belongs to another city',
        }),
        { status: 409 },
      ),
    );
    await expect(
      fetchBusinessBySlug({
        businessSlug: 'b',
        citySlug: 'uralsk',
        locationId: 'l',
      }),
    ).rejects.toThrow(/Unexpected city mismatch/);
  });

  it('throws on unrelated 409', async () => {
    const { fetchBusinessBySlug } = await import('./catalog-api');
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'OTHER', message: 'nope' }), { status: 409 }),
    );
    await expect(
      fetchBusinessBySlug({ businessSlug: 'b', citySlug: 'uralsk' }),
    ).rejects.toThrow(/Unexpected city mismatch/);
  });
});
