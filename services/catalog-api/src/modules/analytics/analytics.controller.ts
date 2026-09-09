import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AnalyticsService } from './analytics.service';
import { AnalyticsWindowQueryDto, CreateAnalyticsEventDto } from './dto/analytics.dto';
import { AnalyticsEventsRateLimitGuard } from './guards/analytics-events-rate-limit.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @UseGuards(AnalyticsEventsRateLimitGuard)
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

  @Roles(UserRole.BUSINESS, UserRole.CITY_ADMIN, UserRole.ADMIN)
  @Get('business/:businessId/dashboard')
  dashboard(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsWindowQueryDto,
  ) {
    return this.analyticsService.dashboard(user, businessId, query);
  }

  @Roles(UserRole.BUSINESS, UserRole.CITY_ADMIN, UserRole.ADMIN)
  @Get('business/:businessId/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsWindowQueryDto,
  ) {
    const result = await this.analyticsService.exportCsv(user, businessId, query);
    return new StreamableFile(Buffer.from(result.body, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
      disposition: result.contentDisposition,
    });
  }
}
