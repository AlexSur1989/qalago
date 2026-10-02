import {
  HOME_SECTION_TYPES,
  HomeSectionPlatform,
  HomeSectionType,
} from '@qalago/shared-types';
import { HomeSectionPlatform as PrismaHomeSectionPlatform } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const PLATFORMS = Object.values(HomeSectionPlatform);

export class PublicHomeSectionsQueryDto {
  @IsString()
  citySlug!: string;

  @IsIn(PLATFORMS)
  platform!: PrismaHomeSectionPlatform;
}

export class AdminListHomeSectionsQueryDto {
  /** When set, returns effective config for the city (global + overrides). Omit for global-only rows. */
  @IsOptional()
  @IsString()
  citySlug?: string;
}

export class UpsertHomeSectionDto {
  @IsIn(HOME_SECTION_TYPES)
  sectionType!: HomeSectionType;

  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsBoolean()
  enabled!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  position!: number;

  @IsIn(PLATFORMS)
  platform!: HomeSectionPlatform;
}
