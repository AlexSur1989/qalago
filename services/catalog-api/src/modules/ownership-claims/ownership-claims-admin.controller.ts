import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
  RequireStaffStepUp,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { OwnershipClaimsService } from './ownership-claims.service';
import {
  AdminListOwnershipClaimsQueryDto,
  RejectOwnershipClaimDto,
} from './dto/ownership-claim.dto';

@Controller('admin/ownership-claims')
@AdminStaffRoute()
export class OwnershipClaimsAdminController {
  constructor(private readonly service: OwnershipClaimsService) {}

  @RequireStaffPermission(StaffPermission.BUSINESS_CLAIM_REVIEW)
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListOwnershipClaimsQueryDto) {
    return this.service.adminList(user, query);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_CLAIM_REVIEW)
  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.adminGet(user, id);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_OWNERSHIP_CHANGE)
  @RequireStaffStepUp()
  @Post(':id/approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.adminApprove(user, id);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_CLAIM_REVIEW)
  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectOwnershipClaimDto,
  ) {
    return this.service.adminReject(user, id, dto);
  }
}
