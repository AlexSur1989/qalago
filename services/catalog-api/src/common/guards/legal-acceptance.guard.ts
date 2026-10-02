import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LegalLocale } from '@prisma/client';
import { AuthUser } from '../types/jwt-payload.type';
import { SKIP_LEGAL_ACCEPTANCE_KEY } from '../decorators/skip-legal-acceptance.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { LegalService } from '../../modules/safety/legal.service';
import { SafetyErrorCode } from '../../modules/safety/safety-errors';

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

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      return true;
    }

    if (!this.legal.userRequiresMandatoryLegalAcceptance(user.role)) {
      return true;
    }

    const locale = LegalLocale.RU;
    const requiredPublished = await this.legal.listCurrentMandatoryDocuments(locale);
    if (!requiredPublished.length) {
      return true;
    }

    const ok = await this.legal.hasAcceptedAllMandatory(user.id, locale);
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
