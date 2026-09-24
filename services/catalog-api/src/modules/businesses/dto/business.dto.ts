import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  Validate,
} from 'class-validator';
import { BusinessCoordinatePairConstraint } from '../../../common/validators/business-coordinate-pair.validator';
import { CatalogListGeoQueryConstraint } from '../../../common/validators/catalog-list-geo-query.validator';
import { PublicCatalogBusinessStatusConstraint } from '../../../common/validators/public-catalog-business-status.validator';
import { BusinessLocationSource, BusinessStatus } from '@prisma/client';
import { BusinessCatalogSort } from '../../../common/utils/business-catalog-sort.util';
import {
  CATALOG_SEARCH_MAX_LENGTH,
  normalizeCatalogSearchQuery,
} from '../../../common/utils/catalog-search-query.util';

export class CreateBusinessDto {
  @IsString()
  @Length(2, 200)
  title!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  citySlug!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ListBusinessesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(CATALOG_SEARCH_MAX_LENGTH)
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return normalizeCatalogSearchQuery(value) ?? undefined;
  })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  /** @deprecated Ignored on public catalog — legacy admin field; use AdCampaign for paid visibility. */
  featured?: boolean;

  @IsOptional()
  @IsEnum(BusinessStatus)
  @Validate(PublicCatalogBusinessStatusConstraint)
  status?: BusinessStatus;

  /** User latitude — enables distance sort when paired with longitude. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  latitude?: number;

  /** User longitude — enables distance sort when paired with latitude. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  longitude?: number;

  /** Max distance from user in km (default 15). Used only with latitude/longitude. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.5)
  @Max(100)
  radiusKm?: number;

  /** Organic catalog sort (default: recommended — title ru, plan-neutral). */
  @IsOptional()
  @IsEnum(BusinessCatalogSort)
  sort?: BusinessCatalogSort;

  /**
   * Map marker mode: only businesses with stored coordinates (does not affect
   * normal list/search when omitted).
   */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  forMap?: boolean;

  /** Map viewport bbox — must be sent together with maxLat/minLng/maxLng. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  minLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  maxLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  minLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  maxLng?: number;

  @Validate(CatalogListGeoQueryConstraint)
  @IsOptional()
  private readonly catalogListGeoQueryValidation?: unknown;
}

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsEnum(BusinessLocationSource)
  locationSource?: BusinessLocationSource;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsObject()
  workHours?: Record<string, string>;

  /** Optional multi-select; empty array clears assignments. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategoryIds?: string[];

  @Validate(BusinessCoordinatePairConstraint)
  @IsOptional()
  private readonly coordinatePairValidation?: unknown;
}

/** Public business detail (Stage 6.12A.7.6). */
export class GetBusinessDetailQueryDto {
  @IsOptional()
  @IsString()
  locationId?: string;
}
