import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  PUBLIC_PROMOTIONS_DEFAULT_LIMIT,
  PUBLIC_PROMOTIONS_MAX_LIMIT,
} from '../../../common/constants/public-preview.constants';

export class ListBusinessPromotionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_PROMOTIONS_MAX_LIMIT)
  limit?: number;

  /** Optional branch scope (Stage 6.12A.7.9.6). Omitted = business-wide public list. */
  @IsOptional()
  @IsString()
  locationId?: string;
}

export const BUSINESS_PROMOTIONS_DEFAULT_LIMIT = PUBLIC_PROMOTIONS_DEFAULT_LIMIT;
