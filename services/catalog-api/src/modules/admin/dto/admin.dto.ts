import { BusinessLocationSource, BusinessStatus, BusinessPlanTier, UserRole } from '@prisma/client';
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
  ValidateNested,
} from 'class-validator';
import { BusinessCoordinatePairConstraint } from '../../../common/validators/business-coordinate-pair.validator';

export class AdminListBusinessesQueryDto {
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;

  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 50;
}

export class UpdateBusinessStatusDto {
  @IsEnum(BusinessStatus)
  status!: BusinessStatus;
}

export class UpdateBusinessFeaturedDto {
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isFeatured!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  featuredSlot?: number;
}

export class UpdateBusinessPlanDto {
  @IsEnum(BusinessPlanTier)
  tier!: BusinessPlanTier;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  managedCityId?: string | null;
}

export class AdminListReviewsQueryDto {
  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 50;
}

export class AdminListCategoriesQueryDto {
  @IsOptional()
  @IsString()
  citySlug?: string;
}

export class GeoSearchQueryDto {
  @IsString()
  @Length(2, 100)
  q!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}

export class UpdateCategoryCityOrderDto {
  @IsString()
  citySlug!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class UpdateCategoryCityVisibilityDto {
  @IsString()
  citySlug!: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isHidden!: boolean;
}

export class UpdateBusinessTaxonomyDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategoryIds?: string[];
}

/** Initial primary BusinessLocation for staff catalog create (AOP.1). */
export class AdminCreateBusinessInitialLocationDto {
  @IsString()
  cityId!: string;

  @IsString()
  @Length(1, 500)
  address!: string;

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
  @IsObject()
  workHours?: Record<string, string>;

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

  @Validate(BusinessCoordinatePairConstraint)
  @IsOptional()
  private readonly coordinatePairValidation?: unknown;
}

/** Staff-only ownerless Business + primary BL create (POST /admin/businesses). */
export class AdminCreateBusinessDto {
  @IsString()
  @Length(2, 200)
  title!: string;

  @IsString()
  @Length(2, 120)
  slug!: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDesc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

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
  @IsObject()
  workHours?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategoryIds?: string[];

  @ValidateNested()
  @Type(() => AdminCreateBusinessInitialLocationDto)
  initialLocation!: AdminCreateBusinessInitialLocationDto;
}

/** Allowlisted Admin catalog fields (no slug, owner, status, or retired geo). */
export class AdminPatchBusinessCatalogDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDesc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

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
  @IsObject()
  workHours?: Record<string, string>;
}
