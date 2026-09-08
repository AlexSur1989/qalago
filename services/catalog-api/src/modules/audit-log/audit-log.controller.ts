import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AuditLogService } from './audit-log.service';
import { ListAuditLogsQueryDto } from './dto/audit-log.dto';

@Controller('admin/audit-logs')
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN)
export class AuditLogController {
  constructor(private readonly auditLog: AuditLogService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListAuditLogsQueryDto) {
    return this.auditLog.listAdmin(user, query);
  }
}
