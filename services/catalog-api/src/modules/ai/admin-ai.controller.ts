import { Body, Controller, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
} from '../../common/decorators/require-staff-permission.decorator';
import { CityScopeService } from '../../common/services/city-scope.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AiProxyService } from './ai-proxy.service';

@Controller('admin/ai')
@AdminStaffRoute()
export class AdminAiController {
  constructor(
    private readonly aiProxy: AiProxyService,
    private readonly cityScope: CityScopeService,
  ) {}

  @RequireStaffPermission(StaffPermission.MODERATION_VIEW)
  @Post('moderation/analyze')
  analyzeModeration(@Body() body: Record<string, unknown>) {
    return this.aiProxy.post('/moderation/analyze', body);
  }

  @RequireStaffPermission(StaffPermission.CONTENT_EDIT)
  @Post('content/draft')
  async createContentDraft(
    @CurrentUser() user: AuthUser,
    @Body() body: { citySlug?: string; topic?: string; limit?: number },
  ) {
    const citySlug = String(body.citySlug ?? 'uralsk');
    if (user.role === UserRole.CITY_ADMIN) {
      const cityId = await this.cityScope.resolveCityId({ citySlug });
      await this.cityScope.assertCityInAdminScope(user, cityId);
    }
    return this.aiProxy.post('/content/draft', {
      citySlug,
      topic: body.topic,
      limit: body.limit,
    });
  }
}
