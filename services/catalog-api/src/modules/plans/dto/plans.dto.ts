import { BusinessPlanTier, PlanPaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class MockPlanCheckoutDto {
  @IsEnum(BusinessPlanTier)
  tier!: BusinessPlanTier;
}

export class CreatePlanPurchaseDto {
  @IsEnum(BusinessPlanTier)
  tier!: BusinessPlanTier;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class AdminListPlanPaymentsQueryDto {
  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsEnum(PlanPaymentStatus)
  status?: PlanPaymentStatus;

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
