import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
  RequireStaffStepUp,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CreativeService } from './creative.service';
import {
  AdminListCampaignsQueryDto,
  AdminListCreativesQueryDto,
  AdminListOrdersQueryDto,
  AdminListPaymentsQueryDto,
  CampaignAnalyticsQueryDto,
  ConfirmPaymentDto,
  RejectCreativeDto,
} from './dto/monetization.dto';
import { AdAnalyticsService } from './ad-analytics.service';
import { MonetizationService } from './monetization.service';
import { OrderService } from './order.service';

@Controller('admin/monetization')
@AdminStaffRoute()
export class MonetizationAdminController {
  constructor(
    private readonly orderService: OrderService,
    private readonly monetizationService: MonetizationService,
    private readonly creativeService: CreativeService,
    private readonly adAnalyticsService: AdAnalyticsService,
  ) {}

  @RequireStaffPermission(StaffPermission.ORDER_VIEW)
  @Get('orders')
  listOrders(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListOrdersQueryDto,
  ) {
    return this.orderService.listAdminOrders(user, query);
  }

  @RequireStaffPermission(StaffPermission.ORDER_VIEW)
  @Get('orders/:id')
  getOrder(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orderService.getAdminOrder(user, id);
  }

  @RequireStaffPermission(StaffPermission.PAYMENT_VIEW)
  @Get('payments')
  listPayments(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListPaymentsQueryDto,
  ) {
    return this.orderService.listAdminPayments(user, query);
  }

  @RequireStaffPermission(StaffPermission.PAYMENT_VIEW)
  @Get('payments/:id')
  getPayment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orderService.getAdminPayment(user, id);
  }

  @RequireStaffPermission(StaffPermission.PAYMENT_CONFIRM)
  @RequireStaffStepUp()
  @Post('payments/:id/confirm')
  confirmPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() _dto: ConfirmPaymentDto,
  ) {
    return this.orderService.confirmManualPayment(user, id);
  }

  @RequireStaffPermission(StaffPermission.AD_VIEW)
  @Get('campaigns')
  listCampaigns(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListCampaignsQueryDto,
  ) {
    return this.monetizationService.listAdminCampaigns(user, query);
  }

  @RequireStaffPermission(StaffPermission.AD_VIEW)
  @Get('campaigns/:id')
  getCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.monetizationService.getAdminCampaign(user, id);
  }

  @RequireStaffPermission(StaffPermission.ANALYTICS_VIEW)
  @Get('campaigns/:id/analytics')
  getCampaignAnalytics(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: CampaignAnalyticsQueryDto,
  ) {
    return this.adAnalyticsService.getCampaignAnalytics(user, id, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }

  @RequireStaffPermission(StaffPermission.AD_MANAGE)
  @Post('campaigns/:id/pause')
  pauseCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.monetizationService.pauseCampaign(user, id);
  }

  @RequireStaffPermission(StaffPermission.AD_MANAGE)
  @Post('campaigns/:id/resume')
  resumeCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.monetizationService.resumeCampaign(user, id);
  }

  @RequireStaffPermission(StaffPermission.AD_MANAGE)
  @Post('campaigns/:id/cancel')
  cancelCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.monetizationService.cancelCampaign(user, id);
  }

  @RequireStaffPermission(StaffPermission.AD_MODERATE)
  @Post('creatives/:id/approve')
  approveCreative(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.creativeService.approve(user, id);
  }

  @RequireStaffPermission(StaffPermission.AD_MODERATE)
  @Post('creatives/:id/reject')
  rejectCreative(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectCreativeDto,
  ) {
    return this.creativeService.reject(user, id, dto.moderationComment);
  }

  @RequireStaffPermission(StaffPermission.AD_VIEW)
  @Get('creatives')
  listCreatives(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListCreativesQueryDto,
  ) {
    return this.creativeService.listAdminCreatives(user, query);
  }

  @RequireStaffPermission(StaffPermission.AD_VIEW)
  @Get('creatives/:id')
  getCreative(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.creativeService.getAdminCreative(user, id);
  }

  @RequireStaffPermission(StaffPermission.AD_VIEW)
  @Get('placements')
  listPlacements(@CurrentUser() user: AuthUser) {
    return this.monetizationService.listAdminPlacements(user);
  }
}
