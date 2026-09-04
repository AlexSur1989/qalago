import { Module } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CityScopeService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
