import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SocialAuthRateLimitService } from '../../../common/services/social-auth-rate-limit.service';
import { AuthIdentityService } from '../auth-identity.service';
import { GoogleIdTokenVerifierService } from './google-id-token-verifier.service';
import { VerifiedGoogleClaims } from './social-auth.types';

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

@Injectable()
export class GoogleAuthLoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authIdentity: AuthIdentityService,
    private readonly googleVerifier: GoogleIdTokenVerifierService,
    private readonly socialAuthRateLimit: SocialAuthRateLimitService,
    private readonly config: ConfigService,
  ) {}

  isGoogleAuthEnabled(): boolean {
    return this.config.get<boolean>('app.googleAuthEnabled') === true;
  }

  assertGoogleAuthEnabled(): void {
    if (!this.isGoogleAuthEnabled()) {
      throw new NotFoundException();
    }
  }

  async loginWithGoogle(idToken: string, ip: string) {
    this.assertGoogleAuthEnabled();
    this.socialAuthRateLimit.assertCanAttemptGoogle(ip);

    const claims = await this.googleVerifier.verifyIdToken(idToken);
    const providerUserId = claims.providerUserId;

    if (await this.authIdentity.isTombstoned(AuthProvider.GOOGLE, providerUserId)) {
      throw new UnauthorizedException('Authentication failed');
    }

    const existingIdentity = await this.authIdentity.findIdentityWithUser(
      AuthProvider.GOOGLE,
      providerUserId,
    );

    if (existingIdentity) {
      const user = await this.resolveActiveUserFromIdentity(existingIdentity, claims);
      const accessToken = await this.signToken(user);
      return { accessToken, user: this.toAuthUser(user) };
    }

    const user = await this.createGoogleUser(claims);
    const accessToken = await this.signToken(user);
    return { accessToken, user: this.toAuthUser(user) };
  }

  private async resolveActiveUserFromIdentity(
    identity: IdentityWithUser,
    claims: VerifiedGoogleClaims,
  ) {
    if (!identity.user.isActive) {
      throw new UnauthorizedException('Authentication failed');
    }

    await this.authIdentity.updateIdentityMetadata(identity.id, {
      email: claims.email ?? null,
      emailVerified: claims.emailVerified ?? null,
    });

    return identity.user;
  }

  private async createGoogleUser(claims: VerifiedGoogleClaims) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            role: UserRole.USER,
            phone: null,
            name: claims.name ?? null,
          },
          select: userSelect,
        });

        await this.authIdentity.createIdentity(
          {
            userId: user.id,
            provider: AuthProvider.GOOGLE,
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
        AuthProvider.GOOGLE,
        claims.providerUserId,
      );
      if (!racedIdentity) {
        throw error;
      }

      return this.resolveActiveUserFromIdentity(racedIdentity, claims);
    }
  }

  private async signToken(user: Pick<User, 'id' | 'phone' | 'role'>) {
    return this.jwtService.signAsync({
      sub: user.id,
      ...(user.phone != null ? { phone: user.phone } : {}),
      role: user.role,
    });
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
