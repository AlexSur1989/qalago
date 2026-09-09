import {
  AnalyticsDiscoverySurface,
  AnalyticsEventType,
  AnalyticsPlatform,
  AudienceDistanceBucket,
  BusinessTrafficSource,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  ATTRIBUTION_EVENT_TYPES,
  CATALOG_EVENT_TYPES,
  ORGANIC_ANALYTICS_EVENT_TYPES,
  PROMOTION_EVENT_TYPES,
} from '../../../common/utils/analytics-organic-events.util';

const ORGANIC_EVENT_TYPE_VALUES = [...ORGANIC_ANALYTICS_EVENT_TYPES];

const ATTRIBUTION_TYPES = [...ATTRIBUTION_EVENT_TYPES];
const PROMOTION_TYPES = [...PROMOTION_EVENT_TYPES];
const CATALOG_TYPES = [...CATALOG_EVENT_TYPES];

export class CreateAnalyticsEventDto {
  @ValidateIf((dto: CreateAnalyticsEventDto) => dto.type !== AnalyticsEventType.SEARCH_PERFORMED)
  @IsString()
  businessId?: string;

  @IsIn(ORGANIC_EVENT_TYPE_VALUES)
  type!: AnalyticsEventType;

  @ValidateIf((dto: CreateAnalyticsEventDto) => dto.type === AnalyticsEventType.SEARCH_PERFORMED)
  @IsString()
  cityId?: string;

  @ValidateIf((dto: CreateAnalyticsEventDto) => ATTRIBUTION_TYPES.includes(dto.type))
  @IsOptional()
  @IsEnum(BusinessTrafficSource)
  trafficSource?: BusinessTrafficSource;

  @ValidateIf((dto: CreateAnalyticsEventDto) => ATTRIBUTION_TYPES.includes(dto.type))
  @IsOptional()
  @IsEnum(AnalyticsDiscoverySurface)
  discoverySurface?: AnalyticsDiscoverySurface;

  @ValidateIf(
    (dto: CreateAnalyticsEventDto) =>
      ATTRIBUTION_TYPES.includes(dto.type) ||
      dto.type === AnalyticsEventType.SEARCH_PERFORMED,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  searchQuery?: string;

  @ValidateIf((dto: CreateAnalyticsEventDto) => ATTRIBUTION_TYPES.includes(dto.type))
  @IsOptional()
  @IsEnum(AudienceDistanceBucket)
  audienceDistanceBucket?: AudienceDistanceBucket;

  @ValidateIf((dto: CreateAnalyticsEventDto) => PROMOTION_TYPES.includes(dto.type))
  @IsOptional()
  @IsString()
  promotionId?: string;

  @ValidateIf((dto: CreateAnalyticsEventDto) => CATALOG_TYPES.includes(dto.type))
  @IsOptional()
  @IsString()
  catalogItemId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientEventId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  visitorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @IsOptional()
  @IsEnum(AnalyticsPlatform)
  platform?: AnalyticsPlatform;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(500)
  position?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class AnalyticsWindowQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}
