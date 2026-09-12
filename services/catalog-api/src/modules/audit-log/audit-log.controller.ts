import { Controller, Get, Query } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AuditLogService } from './audit-log.service';
import { ListAuditLogsQueryDto } from './dto/audit-log.dto';

@Controller('admin/audit-logs')
@AdminStaffRoute()
export class AuditLogController {
  constructor(private readonly auditLog: AuditLogService) {}

  @RequireStaffPermission(StaffPermission.AUDIT_VIEW)
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListAuditLogsQueryDto) {
    return this.auditLog.listAdmin(user, query);
  }
}
