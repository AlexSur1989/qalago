import { AnalyticsEventType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAnalyticsEventDto {
  @IsString()
  businessId!: string;

  @IsEnum(AnalyticsEventType)
  type!: AnalyticsEventType;
}

export class AnalyticsWindowQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number = 30;
}
