import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessApplicationsService } from './business-applications.service';
import {
  AdminListBusinessApplicationsQueryDto,
  RejectBusinessApplicationDto,
} from './dto/business-application.dto';

@Controller('admin/business-applications')
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN)
export class BusinessApplicationsAdminController {
  constructor(private readonly service: BusinessApplicationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListBusinessApplicationsQueryDto) {
    return this.service.adminList(user, query);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.adminGet(user, id);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.adminApprove(user, id);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectBusinessApplicationDto,
  ) {
    return this.service.adminReject(user, id, dto);
  }
}
