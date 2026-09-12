import { Module } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { SubcategoriesService } from './subcategories.service';

@Module({
  imports: [AuditLogModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, SubcategoriesService, CityScopeService],
  exports: [CategoriesService, SubcategoriesService],
})
export class CategoriesModule {}
