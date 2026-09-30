import { IsBoolean, IsOptional } from 'class-validator';

export class PatchPlatformFeaturesBodyDto {
  @IsOptional()
  @IsBoolean()
  businessTeamEnabled?: boolean;
}
