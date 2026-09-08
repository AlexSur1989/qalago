import { Global, Module } from '@nestjs/common';
import { BusinessAccessService } from './services/business-access.service';
import { CityScopeService } from './services/city-scope.service';

@Global()
@Module({
  providers: [CityScopeService, BusinessAccessService],
  exports: [CityScopeService, BusinessAccessService],
})
export class CommonAccessModule {}
