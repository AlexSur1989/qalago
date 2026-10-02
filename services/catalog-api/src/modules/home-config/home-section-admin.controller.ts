import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AdminListHomeSectionsQueryDto, UpsertHomeSectionDto } from './dto/home-section.dto';
import { HomeSectionConfigService } from './home-section-config.service';

@Controller('admin/home-sections')
@AdminStaffRoute()
export class HomeSectionAdminController {
  constructor(private readonly homeSections: HomeSectionConfigService) {}

  @RequireStaffPermission(StaffPermission.HOME_CONFIG_VIEW)
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListHomeSectionsQueryDto) {
    return this.homeSections.listForAdmin(user, query.citySlug);
  }

  @RequireStaffPermission(StaffPermission.HOME_CONFIG_EDIT)
  @Patch()
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertHomeSectionDto) {
    return this.homeSections.upsertForAdmin(user, dto);
  }
}
