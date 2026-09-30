import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PlatformFeaturesService } from './platform-features.service';

@Controller()
export class PlatformFeaturesController {
  constructor(private readonly platformFeatures: PlatformFeaturesService) {}

  @Public()
  @Get('platform-features')
  getPlatformFeatures() {
    return this.platformFeatures.getPlatformFeatures();
  }
}
