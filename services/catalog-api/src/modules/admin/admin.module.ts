import { Module } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { CategoriesModule } from '../categories/categories.module';
import { CitiesModule } from '../cities/cities.module';
import { GeoModule } from '../geo/geo.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [NotificationsModule, CategoriesModule, CitiesModule, GeoModule],
  controllers: [AdminController],
  providers: [AdminService, CityScopeService],
})
export class AdminModule {}
