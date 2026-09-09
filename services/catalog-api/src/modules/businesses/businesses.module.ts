import { Module } from '@nestjs/common';
import { CommonAccessModule } from '../../common/common-access.module';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlansModule } from '../plans/plans.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessTeamService } from './business-team.service';
import { BusinessInvitationService } from './business-invitation.service';
import { InvitationsController } from './invitations.controller';
import { BusinessPublicContentService } from './business-public-content.service';

@Module({
  imports: [PlansModule, CommonAccessModule],
  controllers: [BusinessesController, InvitationsController],
  providers: [
    BusinessesService,
    BusinessTeamService,
    BusinessInvitationService,
    BusinessPublicContentService,
    CityScopeService,
  ],
  exports: [BusinessesService, BusinessPublicContentService],
})
export class BusinessesModule {}
