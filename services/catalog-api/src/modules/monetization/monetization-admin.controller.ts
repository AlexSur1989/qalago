import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CreativeService } from './creative.service';
import {
  AdminListCampaignsQueryDto,
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
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN)
export class MonetizationAdminController {
  constructor(
    private readonly orderService: OrderService,
    private readonly monetizationService: MonetizationService,
    private readonly creativeService: CreativeService,
    private readonly adAnalyticsService: AdAnalyticsService,
  ) {}

  @Get('orders')
  listOrders(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListOrdersQueryDto,
  ) {
    return this.orderService.listAdminOrders(user, query);
  }

  @Get('orders/:id')
  getOrder(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orderService.getOrder(user, id);
  }

  @Get('payments')
  listPayments(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListPaymentsQueryDto,
  ) {
    return this.orderService.listAdminPayments(user, query);
  }

  @Get('payments/:id')
  getPayment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orderService.getAdminPayment(user, id);
  }

  @Post('payments/:id/confirm')
  confirmPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() _dto: ConfirmPaymentDto,
  ) {
    return this.orderService.confirmManualPayment(user, id);
  }

  @Get('campaigns')
  listCampaigns(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListCampaignsQueryDto,
  ) {
    return this.monetizationService.listAdminCampaigns(user, query);
  }

  @Get('campaigns/:id')
  getCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.monetizationService.getAdminCampaign(user, id);
  }

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

  @Post('campaigns/:id/pause')
  pauseCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.monetizationService.pauseCampaign(user, id);
  }

  @Post('campaigns/:id/resume')
  resumeCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.monetizationService.resumeCampaign(user, id);
  }

  @Post('campaigns/:id/cancel')
  cancelCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.monetizationService.cancelCampaign(user, id);
  }

  @Post('creatives/:id/approve')
  approveCreative(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.creativeService.approve(user, id);
  }

  @Post('creatives/:id/reject')
  rejectCreative(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectCreativeDto,
  ) {
    return this.creativeService.reject(user, id, dto.moderationComment);
  }
}
