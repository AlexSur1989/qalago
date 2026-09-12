import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthProvider, Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthIdentityService } from '../auth-identity.service';
import { AuthSessionService } from '../auth-session.service';
import { SocialLoginClaims } from './social-auth.types';

const userSelect = {
  id: true,
  phone: true,
  email: true,
  name: true,
  role: true,
} as const;

type IdentityWithUser = Prisma.AuthIdentityGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        phone: true;
        email: true;
        name: true;
        role: true;
        isActive: true;
      };
    };
  };
}>;

export type CompleteSocialLoginInput = {
  provider: AuthProvider;
  claims: SocialLoginClaims;
  /** Optional display name on first registration (Google verified name or Apple first-login client metadata). */
  initialName?: string | null;
};

@Injectable()
export class SocialAuthLoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authIdentity: AuthIdentityService,
    private readonly authSession: AuthSessionService,
  ) {}

  async completeSocialLogin(input: CompleteSocialLoginInput) {
    const { provider, claims } = input;
    const providerUserId = claims.providerUserId;

    if (await this.authIdentity.isTombstoned(provider, providerUserId)) {
      throw new UnauthorizedException('Authentication failed');
    }

    const existingIdentity = await this.authIdentity.findIdentityWithUser(
      provider,
      providerUserId,
    );

    if (existingIdentity) {
      const user = await this.resolveActiveUserFromIdentity(existingIdentity, claims);
      const session = await this.authSession.issueQalaGoSession(user);
      return { ...session, user: this.toAuthUser(session.user) };
    }

    const user = await this.createSocialUser(provider, claims, input.initialName ?? null);
    const session = await this.authSession.issueQalaGoSession(user);
    return { ...session, user: this.toAuthUser(session.user) };
  }

  private async resolveActiveUserFromIdentity(
    identity: IdentityWithUser,
    claims: SocialLoginClaims,
  ) {
    if (!identity.user.isActive) {
      throw new UnauthorizedException('Authentication failed');
    }

    await this.authIdentity.updateIdentityMetadata(identity.id, {
      ...(claims.email !== undefined ? { email: claims.email } : {}),
      ...(claims.emailVerified !== undefined ? { emailVerified: claims.emailVerified } : {}),
    });

    return identity.user;
  }

  private async createSocialUser(
    provider: AuthProvider,
    claims: SocialLoginClaims,
    initialName: string | null,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            role: UserRole.USER,
            phone: null,
            name: initialName,
          },
          select: userSelect,
        });

        await this.authIdentity.createIdentity(
          {
            userId: user.id,
            provider,
            providerUserId: claims.providerUserId,
            email: claims.email ?? null,
            emailVerified: claims.emailVerified ?? null,
          },
          tx,
        );

        return user;
      });
    } catch (error) {
      if (!isPrismaUniqueViolation(error)) {
        throw error;
      }

      const racedIdentity = await this.authIdentity.findIdentityWithUser(
        provider,
        claims.providerUserId,
      );
      if (!racedIdentity) {
        throw error;
      }

      return this.resolveActiveUserFromIdentity(racedIdentity, claims);
    }
  }

  private toAuthUser(user: Pick<User, 'id' | 'phone' | 'email' | 'name' | 'role'>) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}
