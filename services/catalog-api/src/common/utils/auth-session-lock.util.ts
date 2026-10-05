import { Prisma } from '@prisma/client';

/** Serialize issuance, rotation, enrollment and revocation across API processes. */
export async function lockAuthSessions(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
}
