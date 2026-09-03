import { Module } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { ServiceItemsModule } from '../service-items/service-items.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [ServiceItemsModule],
  controllers: [BusinessesController],
  providers: [BusinessesService, CityScopeService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
