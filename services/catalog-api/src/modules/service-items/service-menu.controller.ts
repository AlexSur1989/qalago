import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { ListManageMenuItemsQueryDto } from './dto/manage-menu-items.dto';
import { ListMenuGroupsQueryDto } from './dto/service-menu-group.dto';
import { ServiceMenuService } from './service-menu.service';

@Controller('service-menu')
export class ServiceMenuController {
  constructor(private readonly serviceMenuService: ServiceMenuService) {}

  @Public()
  @Get()
  findPublic(@Query() query: ListMenuGroupsQueryDto) {
    return this.serviceMenuService.findPublicMenu(query.businessId);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('manage/:businessId/items')
  findManageItems(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Query() query: ListManageMenuItemsQueryDto,
  ) {
    return this.serviceMenuService.findManageItemsPaginated(user, businessId, query);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('manage/:businessId')
  findForManage(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
  ) {
    return this.serviceMenuService.findManageMenu(user, businessId);
  }
}
