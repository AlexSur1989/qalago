import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum BranchAvailabilityMode {
  ALL = 'ALL',
  SELECTED = 'SELECTED',
}

/** Owner management contract (Stage 6.12A.7.8.2). Not used on public reads yet. */
export class BranchAvailabilityDto {
  @IsEnum(BranchAvailabilityMode)
  mode!: BranchAvailabilityMode;

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  locationIds!: string[];
}

export class OptionalBranchAvailabilityDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => BranchAvailabilityDto)
  branchAvailability?: BranchAvailabilityDto;
}
