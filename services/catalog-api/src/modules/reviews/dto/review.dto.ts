import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class ListReviewsQueryDto {
  @IsString()
  businessId!: string;
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
