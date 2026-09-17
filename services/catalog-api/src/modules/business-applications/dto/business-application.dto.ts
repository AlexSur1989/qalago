import { BusinessApplicationStatus, BusinessLocationSource } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Validate,
} from 'class-validator';
import { BusinessCoordinatePairConstraint } from '../../../common/validators/business-coordinate-pair.validator';

export class CreateBusinessApplicationDto {
  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 500)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  shortDesc?: string;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  phone?: string;

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

  @Validate(BusinessCoordinatePairConstraint)
  @IsOptional()
  private readonly coordinatePairValidation?: unknown;
}

export class UpdateBusinessApplicationDto {
  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 500)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  shortDesc?: string;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  phone?: string;

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

  @Validate(BusinessCoordinatePairConstraint)
  @IsOptional()
  private readonly coordinatePairValidation?: unknown;
}

export class RejectBusinessApplicationDto {
  @IsString()
  @Length(3, 500)
  rejectionReason!: string;
}

export class AdminListBusinessApplicationsQueryDto {
  @IsOptional()
  @IsEnum(BusinessApplicationStatus)
  status?: BusinessApplicationStatus;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  citySlug?: string;

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
}
