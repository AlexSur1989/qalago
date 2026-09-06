import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  PUBLIC_CATALOG_DEFAULT_LIMIT,
  PUBLIC_CATALOG_MAX_LIMIT,
} from '../../../common/constants/public-preview.constants';

export class ListBusinessCatalogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_CATALOG_MAX_LIMIT)
  limit?: number;

  /** Business catalog section (ServiceMenuGroup id). */
  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export const BUSINESS_CATALOG_DEFAULT_LIMIT = PUBLIC_CATALOG_DEFAULT_LIMIT;
