import { Global, Module, forwardRef } from '@nestjs/common';
import { CommonAccessModule } from '../../common/common-access.module';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

@Global()
@Module({
  imports: [forwardRef(() => CommonAccessModule)],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
