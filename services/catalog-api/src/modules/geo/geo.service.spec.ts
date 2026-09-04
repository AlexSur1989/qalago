import { GeoService } from './geo.service';

describe('GeoService', () => {
  const service = new GeoService();

  it('returns empty list for short query', async () => {
    await expect(service.searchCities('a')).resolves.toEqual([]);
  });

  it('slugifies cyrillic city names', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: '51.1694',
          lon: '71.4491',
          display_name: 'Астана, Казахстан',
          class: 'place',
          type: 'city',
          name: 'Астана',
          address: { city: 'Астана', country: 'Казахстан' },
        },
      ],
    }) as unknown as typeof fetch;

    const items = await service.searchCities('Астана');
    expect(items).toHaveLength(1);
    expect(items[0].nameRu).toBe('Астана');
    expect(items[0].lat).toBeCloseTo(51.1694);
    expect(items[0].lng).toBeCloseTo(71.4491);
    expect(items[0].slugSuggestion).toBe('astana');
    expect(items[0].timezone).toBe('Asia/Almaty');

    global.fetch = originalFetch;
  });
});
