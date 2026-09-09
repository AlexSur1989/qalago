import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { OwnershipClaimsService } from './ownership-claims.service';
import {
  CreateOwnershipClaimDto,
  ListMyOwnershipClaimsQueryDto,
} from './dto/ownership-claim.dto';

@Controller('ownership-claims')
export class OwnershipClaimsController {
  constructor(private readonly service: OwnershipClaimsService) {}

  @Get('my')
  listMine(@CurrentUser() user: AuthUser, @Query() query: ListMyOwnershipClaimsQueryDto) {
    return this.service.listMine(user, query);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getOwn(user, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.cancel(user, id);
  }
}

@Controller('businesses/:businessId/ownership-claims')
export class BusinessOwnershipClaimsCreateController {
  constructor(private readonly service: OwnershipClaimsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body() dto: CreateOwnershipClaimDto,
  ) {
    return this.service.create(user, businessId, dto);
  }
}
