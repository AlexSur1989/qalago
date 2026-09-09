import { BusinessApplicationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

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
