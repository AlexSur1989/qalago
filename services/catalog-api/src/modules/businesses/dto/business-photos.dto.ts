import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  PUBLIC_GALLERY_DEFAULT_LIMIT,
  PUBLIC_GALLERY_MAX_LIMIT,
} from '../../../common/constants/public-preview.constants';

export class ListBusinessPhotosQueryDto {
  /** When set, same active-location resolution as GET /businesses/:id (A.7.6). */
  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_GALLERY_MAX_LIMIT)
  limit?: number;
}

export const BUSINESS_PHOTOS_DEFAULT_LIMIT = PUBLIC_GALLERY_DEFAULT_LIMIT;
