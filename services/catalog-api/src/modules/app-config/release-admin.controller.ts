import { Body, Controller, Param, Patch } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
  RequireStaffStepUp,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  UpdateReleaseSettingsDto,
  UpsertCityFeatureFlagDto,
  UpsertFeatureFlagDto,
} from './dto/release-admin.dto';
import { ReleaseAdminService } from './release-admin.service';

@Controller('admin/release')
export class ReleaseAdminController {
  constructor(private readonly releaseAdmin: ReleaseAdminService) {}

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.RELEASE_CONFIG_EDIT)
  @RequireStaffStepUp()
  @Patch('settings')
  updateSettings(@CurrentUser() user: AuthUser, @Body() dto: UpdateReleaseSettingsDto) {
    return this.releaseAdmin.updateReleaseSettings(user, dto);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.FEATURE_FLAG_EDIT)
  @RequireStaffStepUp()
  @Patch('feature-flags')
  upsertFeatureFlag(@CurrentUser() user: AuthUser, @Body() dto: UpsertFeatureFlagDto) {
    return this.releaseAdmin.upsertGlobalFeatureFlag(user, dto);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.FEATURE_FLAG_EDIT)
  @Patch('cities/:cityId/feature-flags')
  upsertCityFeatureFlag(
    @CurrentUser() user: AuthUser,
    @Param('cityId') cityId: string,
    @Body() dto: UpsertCityFeatureFlagDto,
  ) {
    return this.releaseAdmin.upsertCityFeatureFlag(user, cityId, dto);
  }
}
