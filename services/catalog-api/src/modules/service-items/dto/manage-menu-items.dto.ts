import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  OWNER_CATALOG_DEFAULT_LIMIT,
  OWNER_CATALOG_MAX_LIMIT,
} from '../../../common/constants/public-preview.constants';

export class ListManageMenuItemsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(OWNER_CATALOG_MAX_LIMIT)
  limit?: number;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export const MANAGE_MENU_ITEMS_DEFAULT_LIMIT = OWNER_CATALOG_DEFAULT_LIMIT;
