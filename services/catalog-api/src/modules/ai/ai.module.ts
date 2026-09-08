import { Module } from '@nestjs/common';
import { AdminAiController } from './admin-ai.controller';
import { AiController } from './ai.controller';
import { AiProxyService } from './ai-proxy.service';

@Module({
  controllers: [AiController, AdminAiController],
  providers: [AiProxyService],
  exports: [AiProxyService],
})
export class AiModule {}
