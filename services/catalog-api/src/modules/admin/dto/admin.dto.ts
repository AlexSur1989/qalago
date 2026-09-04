import { BusinessStatus, UserRole } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

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
