import { BusinessCatalogSort } from '../../common/utils/business-catalog-sort.util';
import type { ListBusinessesQueryDto } from './dto/business.dto';
import type { NormalizedMapBbox } from './business-map-query.util';

/**
 * A.9.3.2b — When a complete bbox is present, physical membership uses BL PostGIS viewport
 * paging unless explicit radius or nearest sort owns geo membership.
 */
export function catalogUsesBlViewportPostgisPaging(
  query: Pick<
    ListBusinessesQueryDto,
    'latitude' | 'longitude' | 'radiusKm' | 'sort'
  >,
  normalizedBbox: NormalizedMapBbox | null,
): boolean {
  if (normalizedBbox == null) {
    return false;
  }
  const hasGeo = query.latitude != null && query.longitude != null;
  if (hasGeo && query.radiusKm != null) {
    return false;
  }
  if (hasGeo) {
    const sort =
      query.sort ??
      (hasGeo ? BusinessCatalogSort.NEAREST : BusinessCatalogSort.RECOMMENDED);
    if (sort === BusinessCatalogSort.NEAREST) {
      return false;
    }
  }
  return true;
}
