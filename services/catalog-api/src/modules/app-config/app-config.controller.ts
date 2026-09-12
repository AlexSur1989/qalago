import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AppConfigService } from './app-config.service';
import { AppConfigQueryDto } from './dto/app-config-query.dto';

@Controller()
export class AppConfigController {
  constructor(private readonly appConfig: AppConfigService) {}

  @Public()
  @Get('app-config')
  getAppConfig(@Query() query: AppConfigQueryDto) {
    return this.appConfig.getPublicConfig(query);
  }

  @Public()
  @Get('version')
  getVersion() {
    return this.appConfig.getServiceVersion();
  }
}
