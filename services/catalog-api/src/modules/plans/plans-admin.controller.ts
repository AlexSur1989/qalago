import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PlanPaymentStatus } from '@prisma/client';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
  RequireStaffStepUp,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AdminListPlanPaymentsQueryDto } from './dto/plans.dto';
import { PlansService } from './plans.service';

@Controller('admin/plans')
@AdminStaffRoute()
export class PlansAdminController {
  constructor(private readonly plansService: PlansService) {}

  @RequireStaffPermission(StaffPermission.PAYMENT_VIEW)
  @Get('payments')
  listPlanPayments(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListPlanPaymentsQueryDto,
  ) {
    return this.plansService.listAdminPlanPayments(user, {
      citySlug: query.citySlug,
      status: query.status as PlanPaymentStatus | undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  @RequireStaffPermission(StaffPermission.PAYMENT_CONFIRM)
  @RequireStaffStepUp()
  @Post('payments/:id/confirm')
  confirmPlanPayment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.plansService.confirmPlanPayment(user, id);
  }

  @RequireStaffPermission(StaffPermission.PAYMENT_CONFIRM)
  @RequireStaffStepUp()
  @Post('payments/:id/cancel')
  cancelPlanPayment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.plansService.cancelPlanPayment(user, id);
  }
}
