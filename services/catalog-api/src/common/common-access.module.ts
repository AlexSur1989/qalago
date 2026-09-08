import { Global, Module } from '@nestjs/common';
import { BusinessAccessService } from './services/business-access.service';
import { BusinessMembershipService } from './services/business-membership.service';
import { CityScopeService } from './services/city-scope.service';

@Global()
@Module({
  providers: [CityScopeService, BusinessMembershipService, BusinessAccessService],
  exports: [CityScopeService, BusinessMembershipService, BusinessAccessService],
})
export class CommonAccessModule {}
