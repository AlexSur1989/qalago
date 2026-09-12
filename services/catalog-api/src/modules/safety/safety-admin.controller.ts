import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
  RequireStaffStepUp,
} from '../../common/decorators/require-staff-permission.decorator';
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

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.MODERATION_VIEW)
  @Get('moderation/cases')
  listCases(@CurrentUser() user: AuthUser, @Query() query: ListModerationCasesQueryDto) {
    return this.moderation.listCases(user, query);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.MODERATION_VIEW)
  @Get('moderation/cases/:id')
  async getCase(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.moderation.assertCanAccessCase(user, id);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.MODERATION_ACT)
  @Post('moderation/cases/:id/actions')
  applyAction(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApplyModerationActionDto,
  ) {
    return this.moderation.applyAction(user, id, dto);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.LEGAL_PUBLISH)
  @RequireStaffStepUp()
  @Post('legal/documents/:id/publish')
  publishLegal(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.legal.publishDocument(user, id);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.DATA_RIGHTS_MANAGE)
  @Patch('data-rights/requests/:id/status')
  updateDataRequest(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('status') status: DataRightsRequestStatus,
  ) {
    return this.dataRights.updateStatus(user, id, status);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.GOVERNMENT_REQUEST_MANAGE)
  @Get('legal/government-requests')
  listGovernment(@CurrentUser() user: AuthUser) {
    return this.restricted.listGovernmentRequests(user);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.GOVERNMENT_REQUEST_MANAGE)
  @RequireStaffStepUp()
  @Patch('legal/government-requests/:id')
  updateGovernment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateGovernmentRequestDto,
  ) {
    return this.restricted.updateGovernmentRequest(user, id, dto);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.SECURITY_INCIDENT_MANAGE)
  @Get('legal/security-incidents')
  listIncidents(@CurrentUser() user: AuthUser) {
    return this.restricted.listSecurityIncidents(user);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.SECURITY_INCIDENT_MANAGE)
  @RequireStaffStepUp()
  @Post('legal/security-incidents')
  createIncident(@CurrentUser() user: AuthUser, @Body() dto: CreateSecurityIncidentDto) {
    return this.restricted.createSecurityIncident(user, dto);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.SECURITY_INCIDENT_MANAGE)
  @RequireStaffStepUp()
  @Patch('legal/security-incidents/:id')
  updateIncident(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSecurityIncidentDto,
  ) {
    return this.restricted.updateSecurityIncident(user, id, dto);
  }
}
