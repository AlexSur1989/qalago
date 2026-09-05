import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AdAnalyticsService } from './ad-analytics.service';
import { AdEventsService } from './ad-events.service';
import { AdServingService } from './ad-serving.service';
import { CreativeService } from './creative.service';
import {
  CampaignAnalyticsQueryDto,
  CreateCreativeDto,
  CreateOrderDto,
  ListByBusinessQueryDto,
  ListProductsQueryDto,
  QuoteDto,
  ServeAdsQueryDto,
  TrackAdEventDto,
  UpdateCreativeDto,
} from './dto/monetization.dto';
import { AdEventsRateLimitGuard } from './guards/ad-events-rate-limit.guard';
import { MonetizationService } from './monetization.service';
import { OrderService } from './order.service';

@Controller('monetization')
export class MonetizationController {
  constructor(
    private readonly monetizationService: MonetizationService,
    private readonly orderService: OrderService,
    private readonly creativeService: CreativeService,
    private readonly adServingService: AdServingService,
    private readonly adEventsService: AdEventsService,
    private readonly adAnalyticsService: AdAnalyticsService,
  ) {}

  @Public()
  @Get('ads/serve')
  serveAds(@Query() query: ServeAdsQueryDto) {
    return this.adServingService.serveAds(query);
  }

  @Public()
  @Post('ads/events')
  @UseGuards(AdEventsRateLimitGuard)
  trackAdEvent(@Body() dto: TrackAdEventDto) {
    return this.adEventsService.trackEvent(dto);
  }

  @Public()
  @Get('products')
  listProducts(@Query() query: ListProductsQueryDto, @CurrentUser() user?: AuthUser) {
    return this.monetizationService.listProducts(query, user);
  }

  @Public()
  @Get('products/:code')
  getProduct(
    @Param('code') code: string,
    @Query() query: ListProductsQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.monetizationService.getProduct(code, query, user);
  }

  @Public()
  @Get('packages')
  listPackages() {
    return this.monetizationService.listPackages();
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Post('quote')
  quote(@CurrentUser() user: AuthUser, @Body() dto: QuoteDto) {
    return this.monetizationService.quote(user, dto);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Post('orders')
  createOrder(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(user, dto);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('orders')
  listOrders(@CurrentUser() user: AuthUser, @Query() query: ListByBusinessQueryDto) {
    return this.orderService.listOrders(user, query.businessId);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('orders/:id')
  getOrder(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orderService.getOrder(user, id);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('campaigns')
  listCampaigns(
    @CurrentUser() user: AuthUser,
    @Query() query: ListByBusinessQueryDto,
  ) {
    return this.monetizationService.listCampaigns(user, query.businessId);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('campaigns/:id')
  getCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.monetizationService.getCampaign(user, id);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
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

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Post('creatives')
  createCreative(@CurrentUser() user: AuthUser, @Body() dto: CreateCreativeDto) {
    return this.creativeService.create(user, dto);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('creatives')
  listCreatives(
    @CurrentUser() user: AuthUser,
    @Query() query: ListByBusinessQueryDto,
  ) {
    return this.creativeService.list(user, query.businessId);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('creatives/:id')
  getCreative(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.creativeService.get(user, id);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Patch('creatives/:id')
  updateCreative(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCreativeDto,
  ) {
    return this.creativeService.update(user, id, dto);
  }
}
