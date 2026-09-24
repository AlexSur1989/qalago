import { BusinessCatalogSort } from '../../common/utils/business-catalog-sort.util';
import { catalogUsesBlViewportPostgisPaging } from './catalog-bbox-routing.util';

const bbox = { minLat: 50.2, maxLat: 50.3, minLng: 57.1, maxLng: 57.2 };

describe('catalog-bbox-routing.util (A.9.3.2b)', () => {
  it('bbox-only uses BL viewport PostGIS paging', () => {
    expect(catalogUsesBlViewportPostgisPaging({}, bbox)).toBe(true);
  });

  it('bbox + nearest uses nearest PostGIS, not viewport paging', () => {
    expect(
      catalogUsesBlViewportPostgisPaging(
        { latitude: 50.28, longitude: 57.17, sort: BusinessCatalogSort.NEAREST },
        bbox,
      ),
    ).toBe(false);
  });

  it('bbox + explicit radius uses radius PostGIS, not viewport paging', () => {
    expect(
      catalogUsesBlViewportPostgisPaging(
        { latitude: 50.28, longitude: 57.17, radiusKm: 5 },
        bbox,
      ),
    ).toBe(false);
  });

  it('bbox + lat/lng + recommended uses viewport PostGIS for membership', () => {
    expect(
      catalogUsesBlViewportPostgisPaging(
        { latitude: 50.28, longitude: 57.17, sort: BusinessCatalogSort.RECOMMENDED },
        bbox,
      ),
    ).toBe(true);
  });

  it('no bbox never uses viewport paging', () => {
    expect(catalogUsesBlViewportPostgisPaging({}, null)).toBe(false);
  });
});
