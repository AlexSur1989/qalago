import { BusinessStatus, BusinessPlanTier, UserRole } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

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
