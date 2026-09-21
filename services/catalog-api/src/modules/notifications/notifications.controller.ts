import { Body, Controller, Delete, Get, Patch, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { ListNotificationsQueryDto } from './dto/notification.dto';
import {
  RegisterPushDeviceDto,
  RevokePushDeviceDto,
} from './dto/push-device.dto';
import { NotificationsService } from './notifications.service';
import { PushDevicesService } from './push-devices.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushDevicesService: PushDevicesService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListNotificationsQueryDto) {
    return this.notificationsService.findPage(user.id, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.unreadCount(user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post('devices')
  registerDevice(@CurrentUser() user: AuthUser, @Body() dto: RegisterPushDeviceDto) {
    return this.pushDevicesService.register(user.id, dto);
  }

  @Delete('devices')
  revokeDevice(@CurrentUser() user: AuthUser, @Body() dto: RevokePushDeviceDto) {
    return this.pushDevicesService.revoke(user.id, dto.token);
  }
}
