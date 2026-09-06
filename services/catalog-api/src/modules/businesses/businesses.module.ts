import { Module } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlansModule } from '../plans/plans.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessPublicContentService } from './business-public-content.service';

@Module({
  imports: [PlansModule],
  controllers: [BusinessesController],
  providers: [BusinessesService, BusinessPublicContentService, CityScopeService],
  exports: [BusinessesService, BusinessPublicContentService],
})
export class BusinessesModule {}
