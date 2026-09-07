import { AnalyticsEventType, AudienceDistanceBucket, BusinessTrafficSource } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateAnalyticsEventDto {
  @IsString()
  businessId!: string;

  @IsEnum(AnalyticsEventType)
  type!: AnalyticsEventType;

  /** Explicit consumer navigation source — only for VIEW_BUSINESS (Stage 5H). */
  @ValidateIf((dto: CreateAnalyticsEventDto) => dto.type === AnalyticsEventType.VIEW_BUSINESS)
  @IsOptional()
  @IsEnum(BusinessTrafficSource)
  trafficSource?: BusinessTrafficSource;

  /** Normalized search term — only when trafficSource=SEARCH (Stage 5I). */
  @ValidateIf((dto: CreateAnalyticsEventDto) => dto.type === AnalyticsEventType.VIEW_BUSINESS)
  @IsOptional()
  @IsString()
  @Max(100)
  searchQuery?: string;

  /** Coarse distance bucket — only for VIEW_BUSINESS (Stage 5J). No raw coordinates. */
  @ValidateIf((dto: CreateAnalyticsEventDto) => dto.type === AnalyticsEventType.VIEW_BUSINESS)
  @IsOptional()
  @IsEnum(AudienceDistanceBucket)
  audienceDistanceBucket?: AudienceDistanceBucket;
}

export class AnalyticsWindowQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}
