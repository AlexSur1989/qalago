import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AnalyticsService } from './analytics.service';
import { AnalyticsWindowQueryDto, CreateAnalyticsEventDto } from './dto/analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('events')
  track(@Body() dto: CreateAnalyticsEventDto) {
    return this.analyticsService.track(dto);
  }

  @Roles(UserRole.BUSINESS, UserRole.CITY_ADMIN, UserRole.ADMIN)
  @Get('business/:businessId/summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsWindowQueryDto,
  ) {
    return this.analyticsService.summary(user, businessId, query);
  }

  @Roles(UserRole.BUSINESS, UserRole.CITY_ADMIN, UserRole.ADMIN)
  @Get('business/:businessId/trends')
  trends(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsWindowQueryDto,
  ) {
    return this.analyticsService.trends(user, businessId, query);
  }
}
