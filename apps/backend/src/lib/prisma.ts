import { PrismaClient } from '@prisma/client';

/**
 * Single shared PrismaClient instance. In dev we cache it on `globalThis` so
 * tsx/HMR reloads don't open a new connection pool on every file change.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
