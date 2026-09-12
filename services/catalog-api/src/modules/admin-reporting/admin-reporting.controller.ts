import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AdminReportingService } from './admin-reporting.service';
import {
  AuditReportQueryDto,
  ExportReportQueryDto,
  ReportFiltersDto,
  ReportPaginationDto,
} from './dto/report-query.dto';
import { ReportingExportService } from './reporting-export.service';

@Controller('admin/reports')
@AdminStaffRoute()
export class AdminReportingController {
  constructor(
    private readonly reporting: AdminReportingService,
    private readonly exportService: ReportingExportService,
  ) {}

  @Get('overview')
  @RequireStaffPermission(StaffPermission.REPORT_OVERVIEW_VIEW)
  overview(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getOverview(user, query);
  }

  @Get('users')
  @RequireStaffPermission(StaffPermission.REPORT_USERS_VIEW)
  users(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getUsers(user, query);
  }

  @Get('businesses')
  @RequireStaffPermission(StaffPermission.REPORT_BUSINESSES_VIEW)
  businesses(
    @CurrentUser() user: AuthUser,
    @Query() query: ReportFiltersDto & ReportPaginationDto,
  ) {
    return this.reporting.getBusinesses(user, query, query.page, query.limit);
  }

  @Get('cities')
  @RequireStaffPermission(StaffPermission.REPORT_CITIES_VIEW)
  cities(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getCities(user, query);
  }

  @Get('categories')
  @RequireStaffPermission(StaffPermission.REPORT_CATEGORIES_VIEW)
  categories(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getCategories(user, query);
  }

  @Get('search')
  @RequireStaffPermission(StaffPermission.REPORT_SEARCH_VIEW)
  search(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getSearch(user, query);
  }

  @Get('activity')
  @RequireStaffPermission(StaffPermission.REPORT_ACTIVITY_VIEW)
  activity(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getActivity(user, query);
  }

  @Get('reviews')
  @RequireStaffPermission(StaffPermission.REPORT_REVIEWS_VIEW)
  reviews(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getReviews(user, query);
  }

  @Get('promotions')
  @RequireStaffPermission(StaffPermission.REPORT_PROMOTIONS_VIEW)
  promotions(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getPromotions(user, query);
  }

  @Get('ads')
  @RequireStaffPermission(StaffPermission.REPORT_ADS_VIEW)
  ads(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getAds(user, query);
  }

  @Get('plans')
  @RequireStaffPermission(StaffPermission.REPORT_PLANS_VIEW)
  plans(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getPlans(user, query);
  }

  @Get('finance')
  @RequireStaffPermission(StaffPermission.REPORT_FINANCE_VIEW)
  finance(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getFinance(user, query);
  }

  @Get('moderation')
  @RequireStaffPermission(StaffPermission.REPORT_MODERATION_VIEW)
  moderation(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getModeration(user, query);
  }

  @Get('staff/anomalies')
  @RequireStaffPermission(StaffPermission.REPORT_STAFF_VIEW)
  staffAnomalies(@CurrentUser() user: AuthUser) {
    return this.reporting.getStaffAnomalies(user);
  }

  @Get('staff')
  @RequireStaffPermission(StaffPermission.REPORT_STAFF_VIEW)
  staff(@CurrentUser() user: AuthUser) {
    return this.reporting.getStaff(user);
  }

  @Get('staff/:userId')
  @RequireStaffPermission(StaffPermission.REPORT_STAFF_VIEW)
  staffMember(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.reporting.getStaffMember(user, userId);
  }

  @Get('audit')
  @RequireStaffPermission(StaffPermission.REPORT_AUDIT_VIEW)
  audit(@CurrentUser() user: AuthUser, @Query() query: AuditReportQueryDto) {
    return this.reporting.getAudit(user, query);
  }

  @Get('security')
  @RequireStaffPermission(StaffPermission.REPORT_SECURITY_VIEW)
  security(@CurrentUser() user: AuthUser, @Query() query: ReportFiltersDto) {
    return this.reporting.getSecurity(user, query);
  }

  @Get('system')
  @RequireStaffPermission(StaffPermission.REPORT_TECH_VIEW)
  system(@CurrentUser() user: AuthUser) {
    return this.reporting.getSystem(user);
  }

  @Get('export')
  @RequireStaffPermission(StaffPermission.REPORT_EXPORT)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(@CurrentUser() user: AuthUser, @Query() query: ExportReportQueryDto) {
    const csv = await this.exportService.exportCsv(user, query);
    return csv;
  }
}
