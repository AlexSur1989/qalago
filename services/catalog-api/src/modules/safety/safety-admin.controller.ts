import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  ApplyModerationActionDto,
  CreateSecurityIncidentDto,
  ListModerationCasesQueryDto,
  UpdateGovernmentRequestDto,
  UpdateSecurityIncidentDto,
} from './dto/safety.dto';
import { DataRightsService } from './data-rights.service';
import { LegalService } from './legal.service';
import { ModerationService } from './moderation.service';
import { RestrictedAdminService } from './restricted-admin.service';
import { DataRightsRequestStatus } from '@prisma/client';

@Controller('admin')
export class SafetyAdminController {
  constructor(
    private readonly legal: LegalService,
    private readonly moderation: ModerationService,
    private readonly dataRights: DataRightsService,
    private readonly restricted: RestrictedAdminService,
  ) {}

  @Get('moderation/cases')
  @Roles(UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN)
  listCases(@CurrentUser() user: AuthUser, @Query() query: ListModerationCasesQueryDto) {
    return this.moderation.listCases(user, query);
  }

  @Get('moderation/cases/:id')
  @Roles(UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN)
  async getCase(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const row = await this.moderation.assertCanAccessCase(user, id);
    return row;
  }

  @Post('moderation/cases/:id/actions')
  @Roles(UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN)
  applyAction(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApplyModerationActionDto,
  ) {
    return this.moderation.applyAction(user, id, dto);
  }

  @Post('legal/documents/:id/publish')
  @Roles(UserRole.SUPER_ADMIN)
  publishLegal(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.legal.publishDocument(user, id);
  }

  @Patch('data-rights/requests/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateDataRequest(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('status') status: DataRightsRequestStatus,
  ) {
    return this.dataRights.updateStatus(user, id, status);
  }

  @Get('legal/government-requests')
  @Roles(UserRole.SUPER_ADMIN)
  listGovernment(@CurrentUser() user: AuthUser) {
    return this.restricted.listGovernmentRequests(user);
  }

  @Patch('legal/government-requests/:id')
  @Roles(UserRole.SUPER_ADMIN)
  updateGovernment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateGovernmentRequestDto,
  ) {
    return this.restricted.updateGovernmentRequest(user, id, dto);
  }

  @Get('legal/security-incidents')
  @Roles(UserRole.SUPER_ADMIN)
  listIncidents(@CurrentUser() user: AuthUser) {
    return this.restricted.listSecurityIncidents(user);
  }

  @Post('legal/security-incidents')
  @Roles(UserRole.SUPER_ADMIN)
  createIncident(@CurrentUser() user: AuthUser, @Body() dto: CreateSecurityIncidentDto) {
    return this.restricted.createSecurityIncident(user, dto);
  }

  @Patch('legal/security-incidents/:id')
  @Roles(UserRole.SUPER_ADMIN)
  updateIncident(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSecurityIncidentDto,
  ) {
    return this.restricted.updateSecurityIncident(user, id, dto);
  }
}
