import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isProductionNodeEnv } from '../utils/production-config.util';

@Catch()
export class ProductionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProductionExceptionFilter.name);

  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    const production = isProductionNodeEnv(nodeEnv);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let body: Record<string, unknown> = { statusCode: status, message };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res != null && 'message' in res) {
        const msg = (res as { message: unknown }).message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      body = { statusCode: status, message };
    } else if (production) {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    } else if (exception instanceof Error) {
      message = exception.message;
      body = { statusCode: status, message, stack: exception.stack };
    }

    if (production && status >= 500) {
      body = { statusCode: status, message: 'Internal server error' };
    }

    response.status(status).json(body);
  }
}
