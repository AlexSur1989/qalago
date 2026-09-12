import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessApplicationsService } from './business-applications.service';
import {
  AdminListBusinessApplicationsQueryDto,
  RejectBusinessApplicationDto,
} from './dto/business-application.dto';

@Controller('admin/business-applications')
@AdminStaffRoute()
export class BusinessApplicationsAdminController {
  constructor(private readonly service: BusinessApplicationsService) {}

  @RequireStaffPermission(StaffPermission.BUSINESS_APPLICATION_REVIEW)
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListBusinessApplicationsQueryDto) {
    return this.service.adminList(user, query);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_APPLICATION_REVIEW)
  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.adminGet(user, id);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_APPLICATION_REVIEW)
  @Post(':id/approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.adminApprove(user, id);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_APPLICATION_REVIEW)
  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectBusinessApplicationDto,
  ) {
    return this.service.adminReject(user, id, dto);
  }
}
