import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SkipLegalAcceptance } from '../../common/decorators/skip-legal-acceptance.decorator';

@SkipLegalAcceptance()
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok', service: 'catalog-api' };
  }
}
