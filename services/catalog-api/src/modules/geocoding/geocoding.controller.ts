import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { resolveRequestIp } from '../../common/utils/request-ip.util';
import { GeocodingAutocompleteQueryDto, GeocodingReverseQueryDto } from './dto/geocoding.dto';
import { GeocodingRateLimitService } from './geocoding-rate-limit.service';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
export class GeocodingController {
  constructor(
    private readonly geocoding: GeocodingService,
    private readonly rateLimit: GeocodingRateLimitService,
  ) {}

  @Get('autocomplete')
  autocomplete(
    @CurrentUser() user: AuthUser,
    @Query() query: GeocodingAutocompleteQueryDto,
    @Req() req: Request,
  ) {
    this.rateLimit.assertAllowed(user.id, resolveRequestIp(req));
    return this.geocoding.autocomplete(query);
  }

  @Get('reverse')
  reverse(
    @CurrentUser() user: AuthUser,
    @Query() query: GeocodingReverseQueryDto,
    @Req() req: Request,
  ) {
    this.rateLimit.assertAllowed(user.id, resolveRequestIp(req));
    return this.geocoding.reverse(query);
  }
}
