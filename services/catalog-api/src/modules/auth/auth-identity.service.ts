import { Injectable } from '@nestjs/common';
import { AuthProvider, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type CreateAuthIdentityInput = {
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  email?: string | null;
  emailVerified?: boolean | null;
};

@Injectable()
export class AuthIdentityService {
  constructor(private readonly prisma: PrismaService) {}

  findByProviderIdentity(provider: AuthProvider, providerUserId: string) {
    return this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: { provider, providerUserId },
      },
    });
  }

  findIdentityWithUser(provider: AuthProvider, providerUserId: string) {
    return this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: { provider, providerUserId },
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  updateIdentityMetadata(
    identityId: string,
    metadata: { email?: string | null; emailVerified?: boolean | null },
    tx?: Prisma.TransactionClient,
  ) {
    const data: Prisma.AuthIdentityUpdateInput = {};
    if (metadata.email !== undefined) {
      data.email = metadata.email;
    }
    if (metadata.emailVerified !== undefined) {
      data.emailVerified = metadata.emailVerified;
    }
    if (Object.keys(data).length === 0) {
      return Promise.resolve(null);
    }

    const client = tx ?? this.prisma;
    return client.authIdentity.update({
      where: { id: identityId },
      data,
    });
  }

  async isTombstoned(provider: AuthProvider, providerUserId: string): Promise<boolean> {
    const row = await this.prisma.authIdentityTombstone.findUnique({
      where: {
        provider_providerUserId: { provider, providerUserId },
      },
      select: { id: true },
    });
    return row != null;
  }

  createIdentity(input: CreateAuthIdentityInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.authIdentity.create({
      data: {
        userId: input.userId,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email ?? null,
        emailVerified: input.emailVerified ?? null,
      },
    });
  }

  /**
   * Tombstone all external identities for a user and remove AuthIdentity rows.
   * Called during account deletion — provider emails are NOT stored in tombstones.
   */
  async tombstoneUserIdentities(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const identities = await client.authIdentity.findMany({
      where: { userId },
      select: { provider: true, providerUserId: true },
    });

    for (const identity of identities) {
      await client.authIdentityTombstone.upsert({
        where: {
          provider_providerUserId: {
            provider: identity.provider,
            providerUserId: identity.providerUserId,
          },
        },
        create: {
          provider: identity.provider,
          providerUserId: identity.providerUserId,
        },
        update: {},
      });
    }

    if (identities.length > 0) {
      await client.authIdentity.deleteMany({ where: { userId } });
    }

    return identities.length;
  }
}
