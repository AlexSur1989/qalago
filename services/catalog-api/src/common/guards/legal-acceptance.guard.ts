import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../types/jwt-payload.type';
import { SKIP_LEGAL_ACCEPTANCE_KEY } from '../decorators/skip-legal-acceptance.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { LegalService } from '../../modules/safety/legal.service';
import { SafetyErrorCode } from '../../modules/safety/safety-errors';
import { resolveLegalLocaleFromRequest } from '../utils/legal-locale.util';

@Injectable()
export class LegalAcceptanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly legal: LegalService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_LEGAL_ACCEPTANCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{ user?: AuthUser; headers?: Record<string, string | string[] | undefined> }>();
    const user = request.user;
    if (!user) {
      return true;
    }

    if (!this.legal.userRequiresMandatoryLegalAcceptance(user.role)) {
      return true;
    }

    const locale = resolveLegalLocaleFromRequest(request);
    const types = this.legal.platformAccessTypesForRole(user.role);
    const requiredPublished = await this.legal.listCurrentDocumentsForTypes(locale, types);
    if (!requiredPublished.length) {
      return true;
    }

    const ok = await this.legal.hasAcceptedAllMandatory(user.id, locale, types);
    if (ok) {
      return true;
    }

    if (isPublic) {
      return true;
    }

    throw new ForbiddenException({
      message: 'Legal acceptance required',
      code: SafetyErrorCode.LEGAL_ACCEPTANCE_REQUIRED,
    });
  }
}
