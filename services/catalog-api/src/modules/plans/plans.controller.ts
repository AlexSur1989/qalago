import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { MockPlanCheckoutDto } from './dto/plans.dto';
import { PlansService } from './plans.service';

@Controller()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get('plans')
  listCatalog() {
    return this.plansService.listCatalog();
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('businesses/:businessId/plan')
  getBusinessPlan(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
  ) {
    return this.plansService.getBusinessPlan(user, businessId);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Post('businesses/:businessId/plan/mock-checkout')
  mockCheckout(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body() dto: MockPlanCheckoutDto,
  ) {
    return this.plansService.mockCheckout(user, businessId, dto.tier);
  }
}
