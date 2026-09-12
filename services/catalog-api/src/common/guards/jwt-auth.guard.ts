import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthUser, JwtPayload } from '../types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { isStaffRole } from '../utils/staff-access.util';
import { StaffSessionService } from '../services/staff-session.service';
import { staffUnauthorized, StaffAuthErrorCode } from '../errors/staff-auth.errors';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly staffSession: StaffSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();

    if (isPublic) {
      await this.tryAttachUser(request);
      return true;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    await this.attachUserFromToken(request, authHeader.slice(7));
    return true;
  }

  private async tryAttachUser(request: {
    headers: { authorization?: string };
    user?: AuthUser;
  }) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return;
    try {
      await this.attachUserFromToken(request, authHeader.slice(7));
    } catch {
      // Public routes stay public when token is missing/invalid.
    }
  }

  private async attachUserFromToken(
    request: { user?: AuthUser & JwtPayload },
    token: string,
  ) {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.get<string>('app.jwtSecret'),
    });
    const dbUser = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, phone: true, role: true, isActive: true },
    });
    if (!dbUser?.isActive) {
      throw new UnauthorizedException('User inactive');
    }

    let effectiveRole = dbUser.role;
    if (isStaffRole(dbUser.role)) {
      effectiveRole = await this.staffSession.assertStaffAccessActive(dbUser.id, dbUser.role);
      await this.staffSession.assertStaffSessionActive(payload.sid, dbUser.id);
    }

    request.user = {
      sub: dbUser.id,
      id: dbUser.id,
      ...(dbUser.phone != null ? { phone: dbUser.phone } : {}),
      role: effectiveRole,
      sid: payload.sid,
      authAt: payload.authAt,
      stepUpAt: payload.stepUpAt,
    };
  }
}
