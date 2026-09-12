import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';
import { AccountDeletionService } from './account-deletion.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserAvatarService } from './user-avatar.service';

@Module({
  imports: [AuthModule, AuditLogModule],
  controllers: [UsersController],
  providers: [UsersService, UserAvatarService, AccountDeletionService],
  exports: [UsersService, AccountDeletionService],
})
export class UsersModule {}
