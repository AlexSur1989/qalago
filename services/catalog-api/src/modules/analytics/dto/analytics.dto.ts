import { AnalyticsEventType, BusinessTrafficSource } from '@prisma/client';
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
}

export class AnalyticsWindowQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}
