import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  AdminListBusinessesQueryDto,
  UpdateBusinessFeaturedDto,
  UpdateBusinessStatusDto,
  UpdateUserRoleDto,
} from './dto/admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('businesses')
  listBusinesses(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListBusinessesQueryDto,
  ) {
    return this.adminService.listBusinesses(user, query);
  }

  @Patch('businesses/:id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessStatusDto,
  ) {
    return this.adminService.updateBusinessStatus(user, id, dto);
  }

  @Patch('businesses/:id/featured')
  updateFeatured(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessFeaturedDto,
  ) {
    return this.adminService.updateBusinessFeatured(user, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Roles(UserRole.ADMIN)
  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto);
  }
}
