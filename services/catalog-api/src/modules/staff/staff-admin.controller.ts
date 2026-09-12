import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
  RequireStaffStepUp,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  CreateStaffAccessDto,
  SetStaffCityScopesDto,
  UpdateStaffRoleDto,
} from './dto/staff.dto';
import { StaffAccessService } from './staff-access.service';

@Controller('admin/staff')
@AdminStaffRoute()
export class StaffAdminController {
  constructor(private readonly staff: StaffAccessService) {}

  @RequireStaffPermission(StaffPermission.STAFF_VIEW)
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.staff.listStaff(user);
  }

  @RequireStaffPermission(StaffPermission.STAFF_VIEW)
  @Get('overview')
  overview(@CurrentUser() user: AuthUser) {
    return this.staff.getStaffOverview(user);
  }

  @RequireStaffPermission(StaffPermission.STAFF_VIEW)
  @Get(':userId')
  detail(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.staff.getStaffDetail(user, userId);
  }

  @RequireStaffPermission(StaffPermission.STAFF_CREATE, StaffPermission.STAFF_ROLE_ASSIGN)
  @RequireStaffStepUp()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffAccessDto) {
    return this.staff.createStaff(user, dto);
  }

  @RequireStaffPermission(StaffPermission.STAFF_ROLE_ASSIGN)
  @RequireStaffStepUp()
  @Put(':userId/role')
  updateRole(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateStaffRoleDto,
  ) {
    return this.staff.updateStaffRole(user, userId, dto);
  }

  @RequireStaffPermission(StaffPermission.STAFF_CITY_SCOPE_ASSIGN)
  @RequireStaffStepUp()
  @Put(':userId/city-scopes')
  setCityScopes(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: SetStaffCityScopesDto,
  ) {
    return this.staff.setCityScopes(user, userId, dto);
  }

  @RequireStaffPermission(StaffPermission.STAFF_DISABLE)
  @RequireStaffStepUp()
  @Post(':userId/disable')
  disable(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.staff.disableStaff(user, userId);
  }

  @RequireStaffPermission(StaffPermission.STAFF_UPDATE)
  @RequireStaffStepUp()
  @Post(':userId/restore')
  restore(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.staff.restoreStaff(user, userId);
  }

  @RequireStaffPermission(StaffPermission.STAFF_SESSION_REVOKE)
  @RequireStaffStepUp()
  @Post(':userId/sessions/revoke-all')
  revokeAllSessions(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    return this.staff.revokeAllSessions(user, userId);
  }

  @RequireStaffPermission(StaffPermission.STAFF_SESSION_REVOKE)
  @RequireStaffStepUp()
  @Post(':userId/sessions/:sessionId/revoke')
  revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.staff.revokeSession(user, userId, sessionId);
  }
}
