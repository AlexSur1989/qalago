import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  CreateStaffAccessDto,
  SetStaffCityScopesDto,
  UpdateStaffRoleDto,
} from './dto/staff.dto';
import { StaffAccessService } from './staff-access.service';

@Controller('admin/staff')
@Roles(UserRole.SUPER_ADMIN)
export class StaffAdminController {
  constructor(private readonly staff: StaffAccessService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.staff.listStaff(user);
  }

  @Get('overview')
  overview(@CurrentUser() user: AuthUser) {
    return this.staff.getStaffOverview(user);
  }

  @Get(':userId')
  detail(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.staff.getStaffDetail(user, userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffAccessDto) {
    return this.staff.createStaff(user, dto);
  }

  @Put(':userId/role')
  updateRole(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateStaffRoleDto,
  ) {
    return this.staff.updateStaffRole(user, userId, dto);
  }

  @Put(':userId/city-scopes')
  setCityScopes(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: SetStaffCityScopesDto,
  ) {
    return this.staff.setCityScopes(user, userId, dto);
  }

  @Post(':userId/disable')
  disable(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.staff.disableStaff(user, userId);
  }

  @Post(':userId/restore')
  restore(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.staff.restoreStaff(user, userId);
  }

  @Post(':userId/sessions/revoke-all')
  revokeAllSessions(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    return this.staff.revokeAllSessions(user, userId);
  }

  @Post(':userId/sessions/:sessionId/revoke')
  revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.staff.revokeSession(user, userId, sessionId);
  }
}
