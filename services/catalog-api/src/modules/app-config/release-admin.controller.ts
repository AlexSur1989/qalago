import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
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

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('settings')
  updateSettings(@CurrentUser() user: AuthUser, @Body() dto: UpdateReleaseSettingsDto) {
    return this.releaseAdmin.updateReleaseSettings(user, dto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('feature-flags')
  upsertFeatureFlag(@CurrentUser() user: AuthUser, @Body() dto: UpsertFeatureFlagDto) {
    return this.releaseAdmin.upsertGlobalFeatureFlag(user, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Patch('cities/:cityId/feature-flags')
  upsertCityFeatureFlag(
    @CurrentUser() user: AuthUser,
    @Param('cityId') cityId: string,
    @Body() dto: UpsertCityFeatureFlagDto,
  ) {
    return this.releaseAdmin.upsertCityFeatureFlag(user, cityId, dto);
  }
}
