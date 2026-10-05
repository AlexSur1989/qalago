import { MonetizationMode } from '@qalago/shared-types';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class PatchPlatformFeaturesBodyDto {
  @IsOptional()
  @IsBoolean()
  businessTeamEnabled?: boolean;

  @IsOptional()
  @IsEnum(MonetizationMode)
  monetizationMode?: MonetizationMode;
}
