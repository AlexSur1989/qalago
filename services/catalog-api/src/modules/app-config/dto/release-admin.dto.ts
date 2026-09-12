import { FeatureFlagKey, FEATURE_FLAG_KEYS } from '@qalago/shared-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateReleaseSettingsDto {
  @IsOptional()
  @IsBoolean()
  maintenanceEnabled?: boolean;

  @IsOptional()
  @IsString()
  maintenanceMessageRu?: string;

  @IsOptional()
  @IsString()
  maintenanceMessageKk?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  maintenanceEndsAt?: Date | null;

  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/)
  androidMinimumVersion!: string;

  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/)
  androidLatestVersion!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999_999_999)
  androidMinimumBuild?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999_999_999)
  androidLatestBuild?: number | null;

  @IsOptional()
  @IsString()
  androidStoreUrl?: string | null;

  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/)
  iosMinimumVersion!: string;

  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/)
  iosLatestVersion!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999_999_999)
  iosMinimumBuild?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999_999_999)
  iosLatestBuild?: number | null;

  @IsOptional()
  @IsString()
  iosStoreUrl?: string | null;
}

export class UpsertFeatureFlagDto {
  @IsIn([...FEATURE_FLAG_KEYS])
  key!: FeatureFlagKey;

  @IsBoolean()
  globalEnabled!: boolean;

  @IsOptional()
  @IsBoolean()
  androidEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  iosEnabled?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpsertCityFeatureFlagDto {
  @IsIn([...FEATURE_FLAG_KEYS])
  flagKey!: FeatureFlagKey;

  @IsBoolean()
  enabled!: boolean;
}
