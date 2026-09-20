import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';
import {
  PUBLIC_REVIEWS_DEFAULT_LIMIT,
  PUBLIC_REVIEWS_MAX_LIMIT,
} from '../../../common/constants/review.constants';

export class ListReviewsQueryDto {
  @IsString()
  businessId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_REVIEWS_MAX_LIMIT)
  limit?: number;
}

export class CreateReviewDto {
  @IsString()
  businessId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  text?: string;
}

export class ReplyReviewDto {
  @IsString()
  @MaxLength(2000)
  ownerReply!: string;
}

export const resolvePublicReviewsPageLimit = (query: ListReviewsQueryDto) => {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? PUBLIC_REVIEWS_DEFAULT_LIMIT, PUBLIC_REVIEWS_MAX_LIMIT);
  return { page, limit };
};
