import { AdCreativeTargetType, AdCreativeType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { AD_ANALYTICS_EVENT_TYPES } from '../constants/monetization.constants';

export class MonetizationCityQueryDto {
  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class ListProductsQueryDto extends MonetizationCityQueryDto {
  @IsOptional()
  @IsString()
  businessId?: string;
}

export class QuoteDto {
  @IsString()
  businessId!: string;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsString()
  packageCode?: string;

  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationHours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsDateString()
  desiredStartAt?: string;

  /** Ignored by backend — pricing is always server-side. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  finalPrice?: number;
}

export class CreateOrderItemDto {
  @IsString()
  productCode!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationHours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  desiredStartAt?: string;

  @IsOptional()
  @IsString()
  promotionId?: string;

  @IsOptional()
  @IsString()
  creativeId?: string;

  /** Ignored by backend. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  finalPrice?: number;
}

export class CreateOrderDto {
  @IsString()
  businessId!: string;

  @IsOptional()
  @IsString()
  packageCode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}

export class ListByBusinessQueryDto {
  @IsString()
  businessId!: string;
}

export class CreateCreativeDto {
  @IsString()
  businessId!: string;

  @IsOptional()
  @IsEnum(AdCreativeType)
  type?: AdCreativeType;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  @Length(2, 200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @IsEnum(AdCreativeTargetType)
  targetType?: AdCreativeTargetType;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  targetUrl?: string;
}

export class UpdateCreativeDto {
  @IsOptional()
  @IsEnum(AdCreativeType)
  type?: AdCreativeType;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @IsEnum(AdCreativeTargetType)
  targetType?: AdCreativeTargetType;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  targetUrl?: string;
}

export class RejectCreativeDto {
  @IsOptional()
  @IsString()
  moderationComment?: string;
}

export class AdminListOrdersQueryDto {
  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class AdminListPaymentsQueryDto extends AdminListOrdersQueryDto {}

export class AdminListCampaignsQueryDto extends AdminListOrdersQueryDto {
  @IsOptional()
  @IsString()
  businessId?: string;
}

export class AdminListCreativesQueryDto {
  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  moderationStatus?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class ConfirmPaymentDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class ServeAdsQueryDto extends MonetizationCityQueryDto {
  @IsString()
  placementCode!: string;

  @IsString()
  @Length(1, 128)
  sessionId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class TrackAdEventDto {
  @IsString()
  campaignId!: string;

  @IsString()
  placementCode!: string;

  @IsString()
  @Length(1, 128)
  sessionId!: string;

  @IsIn([...AD_ANALYTICS_EVENT_TYPES])
  type!: (typeof AD_ANALYTICS_EVENT_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  position?: number;
}

export class CampaignAnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
