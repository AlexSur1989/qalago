import { BusinessPlanTier } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class MockPlanCheckoutDto {
  @IsEnum(BusinessPlanTier)
  tier!: BusinessPlanTier;
}
