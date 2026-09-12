import { Module } from '@nestjs/common';
import { CommonAccessModule } from '../../common/common-access.module';
import { CityScopeService } from '../../common/services/city-scope.service';
import { CategoriesModule } from '../categories/categories.module';
import { PlansModule } from '../plans/plans.module';
import { BusinessSubcategoryService } from './business-subcategory.service';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessTeamService } from './business-team.service';
import { BusinessInvitationService } from './business-invitation.service';
import { InvitationsController } from './invitations.controller';
import { BusinessPublicContentService } from './business-public-content.service';

@Module({
  imports: [PlansModule, CommonAccessModule, CategoriesModule],
  controllers: [BusinessesController, InvitationsController],
  providers: [
    BusinessSubcategoryService,
    BusinessesService,
    BusinessTeamService,
    BusinessInvitationService,
    BusinessPublicContentService,
    CityScopeService,
  ],
  exports: [BusinessesService, BusinessPublicContentService, BusinessSubcategoryService],
})
export class BusinessesModule {}
