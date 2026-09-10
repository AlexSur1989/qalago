import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlansModule } from '../plans/plans.module';
import { AdAnalyticsService } from './ad-analytics.service';
import { AdEventsService } from './ad-events.service';
import { AdRotationService } from './ad-rotation.service';
import { AdServingService } from './ad-serving.service';
import { AvailabilityService } from './availability.service';
import { CampaignExpirationScheduler } from './campaign-expiration.scheduler';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { CampaignStatusService } from './campaign-status.service';
import { CreativeService } from './creative.service';
import { AdEventsRateLimitGuard } from './guards/ad-events-rate-limit.guard';
import { MonetizationAccessService } from './monetization-access.service';
import { MonetizationAdminController } from './monetization-admin.controller';
import { MonetizationController } from './monetization.controller';
import { MonetizationService } from './monetization.service';
import { OrderService } from './order.service';
import { PricingService } from './pricing.service';
import { PurchaseIntegrityService } from './purchase-integrity.service';
import { PurchaseScopeService } from './purchase-scope.service';
import { PurchaseSchedulingService } from './purchase-scheduling.service';
import { PlacementCapacityService } from './placement-capacity.service';
import { PackageSnapshotService } from './package-snapshot.service';
import { InventoryReservationService } from './inventory-reservation.service';

@Module({
  imports: [PlansModule, ScheduleModule.forRoot()],
  controllers: [MonetizationController, MonetizationAdminController],
  providers: [
    MonetizationService,
    PricingService,
    AvailabilityService,
    PurchaseScopeService,
    PurchaseIntegrityService,
    PurchaseSchedulingService,
    PlacementCapacityService,
    PackageSnapshotService,
    InventoryReservationService,
    OrderService,
    CampaignProvisioningService,
    CampaignStatusService,
    CampaignExpirationScheduler,
    CreativeService,
    MonetizationAccessService,
    AdRotationService,
    AdServingService,
    AdEventsService,
    AdAnalyticsService,
    AdEventsRateLimitGuard,
    CityScopeService,
  ],
  exports: [
    MonetizationService,
    PricingService,
    AvailabilityService,
    OrderService,
    CampaignProvisioningService,
    AdServingService,
    AdEventsService,
    AdAnalyticsService,
  ],
})
export class MonetizationModule {}
