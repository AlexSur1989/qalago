import { CityLaunchStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
export class CreateCityDto {
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase latin letters, digits and hyphens',
  })
  slug!: string;

  @IsString()
  @Length(2, 100)
  nameRu!: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  nameKk?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  centerLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  centerLng?: number;

  @IsOptional()
  @IsString()
  @Length(3, 64)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(CityLaunchStatus)
  launchStatus?: CityLaunchStatus;
}

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nameRu?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  nameKk?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  centerLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  centerLng?: number;

  @IsOptional()
  @IsString()
  @Length(3, 64)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(CityLaunchStatus)
  launchStatus?: CityLaunchStatus;
}
