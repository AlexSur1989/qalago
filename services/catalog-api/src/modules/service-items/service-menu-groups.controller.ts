import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  CreateServiceMenuGroupDto,
  UpdateServiceMenuGroupDto,
} from './dto/service-menu-group.dto';
import { ServiceMenuGroupsService } from './service-menu-groups.service';

@Controller('service-menu-groups')
export class ServiceMenuGroupsController {
  constructor(private readonly groupsService: ServiceMenuGroupsService) {}

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceMenuGroupDto) {
    return this.groupsService.create(user, dto);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceMenuGroupDto,
  ) {
    return this.groupsService.update(user, id, dto);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.groupsService.remove(user, id);
  }
}
