import { Body, Controller, ForbiddenException, Get, Patch } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminStaffRoute } from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isSuperAdmin } from '../../common/utils/system-access.util';
import { PatchPlatformFeaturesBodyDto } from './dto/patch-platform-features.dto';
import { PlatformFeaturesAdminService } from './platform-features-admin.service';

@Controller('admin/platform-features')
export class PlatformFeaturesAdminController {
  constructor(private readonly admin: PlatformFeaturesAdminService) {}

  @AdminStaffRoute()
  @Get()
  get(@CurrentUser() user: AuthUser) {
    if (isSuperAdmin(user)) {
      return this.admin.getForAdmin(user);
    }
    if (user.role === UserRole.ADMIN) {
      return this.admin.getReadOnly(user);
    }
    throw new ForbiddenException();
  }

  @AdminStaffRoute()
  @Patch()
  patch(@CurrentUser() user: AuthUser, @Body() dto: PatchPlatformFeaturesBodyDto) {
    return this.admin.patch(user, dto);
  }

  /** Read-only release QA: PASS when monetizationMode is LAUNCH with purchases disabled. */
  @AdminStaffRoute()
  @Get('google-play-launch-check')
  googlePlayLaunchCheck(@CurrentUser() user: AuthUser) {
    if (isSuperAdmin(user)) {
      return this.admin.getGooglePlayLaunchCheck();
    }
    if (user.role === UserRole.ADMIN) {
      return this.admin.getGooglePlayLaunchCheck();
    }
    throw new ForbiddenException();
  }
}
