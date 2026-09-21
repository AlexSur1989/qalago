import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Validate,
} from 'class-validator';
import { BusinessLocationSource } from '@prisma/client';
import { BusinessCoordinatePairConstraint } from '../../../common/validators/business-coordinate-pair.validator';

/** Guest/public read (Stage 6.12A.6) — no timestamps or internal provenance. */
export class PublicBusinessLocationCityDto {
  slug!: string;
  nameRu!: string;
  nameKk!: string | null;
}

export class PublicBusinessLocationResponseDto {
  id!: string;
  businessId!: string;
  cityId!: string;
  city!: PublicBusinessLocationCityDto;
  address!: string;
  latitude!: number | null;
  longitude!: number | null;
  workHours!: Record<string, string> | null;
  phone!: string | null;
  whatsapp!: string | null;
  instagram!: string | null;
  website!: string | null;
  isPrimary!: boolean;
}

export class BusinessLocationResponseDto {
  id!: string;
  businessId!: string;
  cityId!: string;
  address!: string;
  latitude!: number | null;
  longitude!: number | null;
  locationSource!: BusinessLocationSource | null;
  workHours!: Record<string, string> | null;
  phone!: string | null;
  whatsapp!: string | null;
  instagram!: string | null;
  website!: string | null;
  isPrimary!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class CreateBusinessLocationDto {
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

export class UpdateBusinessLocationDto {
  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
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
