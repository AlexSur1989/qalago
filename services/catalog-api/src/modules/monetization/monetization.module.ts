import { Module } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlansModule } from '../plans/plans.module';
import { AvailabilityService } from './availability.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { CampaignStatusService } from './campaign-status.service';
import { CreativeService } from './creative.service';
import { MonetizationAccessService } from './monetization-access.service';
import { MonetizationAdminController } from './monetization-admin.controller';
import { MonetizationController } from './monetization.controller';
import { MonetizationService } from './monetization.service';
import { OrderService } from './order.service';
import { PricingService } from './pricing.service';

@Module({
  imports: [PlansModule],
  controllers: [MonetizationController, MonetizationAdminController],
  providers: [
    MonetizationService,
    PricingService,
    AvailabilityService,
    OrderService,
    CampaignProvisioningService,
    CampaignStatusService,
    CreativeService,
    MonetizationAccessService,
    CityScopeService,
  ],
  exports: [
    MonetizationService,
    PricingService,
    AvailabilityService,
    OrderService,
    CampaignProvisioningService,
  ],
})
export class MonetizationModule {}
