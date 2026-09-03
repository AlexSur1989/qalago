import { Module } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService, CityScopeService],
})
export class PromotionsModule {}
