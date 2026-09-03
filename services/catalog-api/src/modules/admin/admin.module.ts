import { Module } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService, CityScopeService],
})
export class AdminModule {}
