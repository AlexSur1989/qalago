import { AppPlatform } from '@qalago/shared-types';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class AppConfigQueryDto {
  @IsOptional()
  @IsEnum(AppPlatform)
  platform?: AppPlatform;

  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/)
  appVersion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999_999_999)
  buildNumber?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  citySlug?: string;
}
