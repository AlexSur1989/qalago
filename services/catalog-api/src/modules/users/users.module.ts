import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountDeletionService } from './account-deletion.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserAvatarService } from './user-avatar.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UserAvatarService, AccountDeletionService],
  exports: [UsersService, AccountDeletionService],
})
export class UsersModule {}
