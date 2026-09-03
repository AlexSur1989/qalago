import { Module } from '@nestjs/common';
import { MenuAccessService } from './menu-access.service';
import { ServiceItemsController } from './service-items.controller';
import { ServiceItemsService } from './service-items.service';
import { ServiceMenuController } from './service-menu.controller';
import { ServiceMenuGroupsController } from './service-menu-groups.controller';
import { ServiceMenuGroupsService } from './service-menu-groups.service';
import { ServiceMenuService } from './service-menu.service';

@Module({
  controllers: [
    ServiceItemsController,
    ServiceMenuController,
    ServiceMenuGroupsController,
  ],
  providers: [
    MenuAccessService,
    ServiceItemsService,
    ServiceMenuService,
    ServiceMenuGroupsService,
  ],
  exports: [ServiceMenuService],
})
export class ServiceItemsModule {}
