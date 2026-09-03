import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  CreateServiceItemDto,
  ListServiceItemsQueryDto,
  UpdateServiceItemDto,
} from './dto/service-item.dto';
import { ServiceItemsService } from './service-items.service';

@Controller('service-items')
export class ServiceItemsController {
  constructor(private readonly serviceItemsService: ServiceItemsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ListServiceItemsQueryDto) {
    return this.serviceItemsService.findByBusiness(query);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Get('manage/:businessId')
  findForManage(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
  ) {
    return this.serviceItemsService.findForManage(user, businessId);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceItemDto) {
    return this.serviceItemsService.create(user, dto);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceItemDto,
  ) {
    return this.serviceItemsService.update(user, id, dto);
  }

  @Roles(UserRole.BUSINESS, UserRole.ADMIN, UserRole.CITY_ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.serviceItemsService.remove(user, id);
  }
}
