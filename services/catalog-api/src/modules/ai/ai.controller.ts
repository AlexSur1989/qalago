import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AiProxyService } from './ai-proxy.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiProxy: AiProxyService) {}

  @Public()
  @Post('recommendations')
  recommendations(@Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.aiProxy.post('/recommendations', body, req.headers.authorization);
  }

  @Post('moderation/analyze')
  analyzeModeration(@Body() body: Record<string, unknown>) {
    return this.aiProxy.post('/moderation/analyze', body);
  }
}
