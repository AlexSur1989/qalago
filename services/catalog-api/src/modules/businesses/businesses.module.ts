import { Module } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlansModule } from '../plans/plans.module';
import { ServiceItemsModule } from '../service-items/service-items.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [ServiceItemsModule, PlansModule],
  controllers: [BusinessesController],
  providers: [BusinessesService, CityScopeService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
