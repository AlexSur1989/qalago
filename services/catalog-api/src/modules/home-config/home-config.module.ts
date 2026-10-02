import { Module } from '@nestjs/common';
import { HomeSectionAdminController } from './home-section-admin.controller';
import { HomeSectionConfigService } from './home-section-config.service';
import { HomeSectionPublicController } from './home-section-public.controller';

@Module({
  controllers: [HomeSectionPublicController, HomeSectionAdminController],
  providers: [HomeSectionConfigService],
  exports: [HomeSectionConfigService],
})
export class HomeConfigModule {}
