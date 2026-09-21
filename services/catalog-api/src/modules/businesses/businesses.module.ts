import { Module } from '@nestjs/common';
import { CommonAccessModule } from '../../common/common-access.module';
import { CityScopeService } from '../../common/services/city-scope.service';
import { CategoriesModule } from '../categories/categories.module';
import { PlansModule } from '../plans/plans.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BusinessSubcategoryService } from './business-subcategory.service';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessTeamService } from './business-team.service';
import { BusinessInvitationService } from './business-invitation.service';
import { InvitationsController } from './invitations.controller';
import { BusinessPublicContentService } from './business-public-content.service';
import { BusinessLocationService } from './business-location.service';

@Module({
  imports: [PlansModule, CommonAccessModule, CategoriesModule, NotificationsModule],
  controllers: [BusinessesController, InvitationsController],
  providers: [
    BusinessSubcategoryService,
    BusinessesService,
    BusinessTeamService,
    BusinessInvitationService,
    BusinessPublicContentService,
    BusinessLocationService,
    CityScopeService,
  ],
  exports: [BusinessesService, BusinessPublicContentService, BusinessSubcategoryService],
})
export class BusinessesModule {}
