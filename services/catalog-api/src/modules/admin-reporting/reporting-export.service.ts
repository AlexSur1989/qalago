import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { StaffPermission, staffRoleHasPermission } from '@qalago/shared-types';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction, AuditResourceType } from '@prisma/client';
import { AdminReportingService } from './admin-reporting.service';
import { ExportReportQueryDto } from './dto/report-query.dto';
import { ReportingScopeService } from './reporting-scope.service';

const MAX_EXPORT_ROWS = 5000;

@Injectable()
export class ReportingExportService {
  constructor(
    private readonly reports: AdminReportingService,
    private readonly scope: ReportingScopeService,
    private readonly auditLog: AuditLogService,
  ) {}

  async exportCsv(user: AuthUser, query: ExportReportQueryDto): Promise<string> {
    if (!staffRoleHasPermission(user.role as UserRole, StaffPermission.REPORT_EXPORT)) {
      throw new ForbiddenException('Report export not allowed');
    }
    if (user.role === UserRole.CITY_ADMIN) {
      await this.scope.resolveScope(user, query);
    }
    const allowed = new Set(['overview', 'cities', 'categories', 'plans', 'finance']);
    if (!allowed.has(query.report)) {
      throw new BadRequestException('Export not supported for this report');
    }
    if (query.report === 'finance' && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FINANCE) {
      throw new ForbiddenException('Finance export restricted');
    }

    let payload: unknown;
    switch (query.report) {
      case 'overview':
        payload = await this.reports.getOverview(user, query);
        break;
      case 'cities':
        payload = await this.reports.getCities(user, query);
        break;
      case 'categories':
        payload = await this.reports.getCategories(user, query);
        break;
      case 'plans':
        payload = await this.reports.getPlans(user, query);
        break;
      case 'finance':
        payload = await this.reports.getFinance(user, query);
        break;
      default:
        throw new BadRequestException('Unknown report');
    }

    const lines = this.flattenToCsv(payload);
    if (lines.length > MAX_EXPORT_ROWS) {
      throw new BadRequestException('Export too large');
    }

    await this.auditLog.record({
      actor: user,
      action: AuditAction.PLAN_CHECKOUT,
      resourceType: AuditResourceType.ORDER,
      metadata: { reportExport: true, reportKey: query.report, rowCount: lines.length },
    });

    return lines.join('\n');
  }

  private flattenToCsv(payload: unknown): string[] {
    const header = 'key,value';
    const rows: string[] = [header];
    const walk = (prefix: string, value: unknown) => {
      if (rows.length > MAX_EXPORT_ROWS) return;
      if (value == null || typeof value !== 'object') {
        rows.push(`${JSON.stringify(prefix)},${JSON.stringify(value)}`);
        return;
      }
      if (Array.isArray(value)) {
        value.slice(0, 100).forEach((item, i) => walk(`${prefix}[${i}]`, item));
        return;
      }
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        walk(prefix ? `${prefix}.${k}` : k, v);
      }
    };
    walk('report', payload);
    return rows;
  }
}
