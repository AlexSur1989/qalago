import { Body, Controller, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CityScopeService } from '../../common/services/city-scope.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AiProxyService } from './ai-proxy.service';

@Controller('admin/ai')
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN)
export class AdminAiController {
  constructor(
    private readonly aiProxy: AiProxyService,
    private readonly cityScope: CityScopeService,
  ) {}

  @Post('moderation/analyze')
  analyzeModeration(@Body() body: Record<string, unknown>) {
    return this.aiProxy.post('/moderation/analyze', body);
  }

  @Post('content/draft')
  async createContentDraft(
    @CurrentUser() user: AuthUser,
    @Body() body: { citySlug?: string; topic?: string; limit?: number },
  ) {
    const citySlug = String(body.citySlug ?? 'uralsk');
    if (user.role === UserRole.CITY_ADMIN) {
      const cityId = await this.cityScope.resolveCityId({ citySlug });
      await this.cityScope.assertBusinessInAdminScope(user, cityId);
    }
    return this.aiProxy.post('/content/draft', {
      citySlug,
      topic: body.topic,
      limit: body.limit,
    });
  }
}
