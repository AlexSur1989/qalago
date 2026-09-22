import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  CATALOG_SEARCH_MAX_LENGTH,
  normalizeCatalogSearchQuery,
} from '../../../common/utils/catalog-search-query.util';
import {
  PUBLIC_CATALOG_DEFAULT_LIMIT,
  PUBLIC_CATALOG_MAX_LIMIT,
} from '../../../common/constants/public-preview.constants';

export class ListBusinessCatalogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_CATALOG_MAX_LIMIT)
  limit?: number;

  /** Business catalog section (ServiceMenuGroup id). */
  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(CATALOG_SEARCH_MAX_LENGTH)
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return normalizeCatalogSearchQuery(value) ?? undefined;
  })
  search?: string;

  /** Optional branch scope (Stage 6.12A.7.8.3). Omitted = legacy business-wide catalog. */
  @IsOptional()
  @IsString()
  locationId?: string;
}

export const BUSINESS_CATALOG_DEFAULT_LIMIT = PUBLIC_CATALOG_DEFAULT_LIMIT;
