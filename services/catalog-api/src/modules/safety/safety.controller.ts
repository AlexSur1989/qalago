import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { LegalDocumentType, LegalLocale } from '@prisma/client';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { resolveRequestIp } from '../../common/utils/request-ip.util';
import {
  AcceptLegalDto,
  CreateDataRightsRequestDto,
  CreateReportDto,
  PublicLegalQueryDto,
  SubmitAppealDto,
} from './dto/safety.dto';
import { ContentReportService } from './content-report.service';
import { DataRightsService } from './data-rights.service';
import { LegalService } from './legal.service';
import { ModerationService } from './moderation.service';

@Controller()
export class SafetyController {
  constructor(
    private readonly legal: LegalService,
    private readonly reports: ContentReportService,
    private readonly dataRights: DataRightsService,
    private readonly moderation: ModerationService,
  ) {}

  @Public()
  @Get('legal/documents/:type')
  getPublishedLegal(
    @Param('type') type: LegalDocumentType,
    @Query() query: PublicLegalQueryDto,
  ) {
    const locale = query.locale ?? LegalLocale.RU;
    return this.legal.getPublishedDocument(type, locale);
  }

  @Get('legal/me/status')
  getMyLegalStatus(@CurrentUser() user: AuthUser) {
    return this.legal.getUserLegalStatus(user.id);
  }

  @Post('legal/me/accept')
  acceptLegal(@CurrentUser() user: AuthUser, @Body() dto: AcceptLegalDto) {
    return this.legal.recordAcceptance(user, dto);
  }

  @Post('reports')
  createReport(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReportDto,
    @Req() req: Request,
  ) {
    return this.reports.createReport(user, resolveRequestIp(req), dto);
  }

  @Post('data-rights/requests')
  createDataRightsRequest(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDataRightsRequestDto,
  ) {
    return this.dataRights.createRequest(user, dto.type);
  }

  @Get('data-rights/requests/me')
  listMyDataRights(@CurrentUser() user: AuthUser) {
    return this.dataRights.listMine(user.id);
  }

  @Post('moderation/cases/:caseId/appeals')
  submitAppeal(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: SubmitAppealDto,
  ) {
    return this.moderation.submitAppeal(user, caseId, dto.reason);
  }
}
