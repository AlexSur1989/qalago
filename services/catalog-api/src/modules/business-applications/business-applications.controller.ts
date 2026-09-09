import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessApplicationsService } from './business-applications.service';
import {
  CreateBusinessApplicationDto,
  UpdateBusinessApplicationDto,
} from './dto/business-application.dto';

@Controller('business-applications')
export class BusinessApplicationsController {
  constructor(private readonly service: BusinessApplicationsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBusinessApplicationDto) {
    return this.service.createDraft(user, dto);
  }

  @Get('my')
  listMine(@CurrentUser() user: AuthUser) {
    return this.service.listMine(user);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getOwn(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessApplicationDto,
  ) {
    return this.service.updateOwn(user, id, dto);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.submit(user, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.cancel(user, id);
  }
}
