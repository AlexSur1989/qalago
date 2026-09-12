import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { AppConfigService } from './app-config.service';

const MAINTENANCE_EXEMPT_PATHS = [
  '/api/v1/health',
  '/api/v1/version',
  '/api/v1/app-config',
  '/api/v1/auth/logout',
  '/api/v1/auth/refresh',
];

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isPublic) {
      // Authenticated routes still respect maintenance unless exempt path.
    }

    const req = context.switchToHttp().getRequest<Request>();
    const path = req.path;
    if (MAINTENANCE_EXEMPT_PATHS.some((p) => path.startsWith(p))) {
      return true;
    }

    if (!(await this.appConfig.isMaintenanceActive())) {
      return true;
    }

    throw new ServiceUnavailableException({
      message: 'Service temporarily unavailable',
      maintenance: true,
    });
  }
}
