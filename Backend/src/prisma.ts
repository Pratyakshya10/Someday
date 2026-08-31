// The Prisma Client — your one connection to the database.
//
// Why the "globalThis" dance: in development, Next.js reloads your code on
// every save. A plain `new PrismaClient()` would run again on each reload and
// pile up database connections until Postgres refuses more. So we cache one
// client on the global object and reuse it. In production this runs once, so
// the cache isn't needed there.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Reuse the cached client if it exists, otherwise create one.
export const db = globalForPrisma.prisma ?? new PrismaClient();

// Remember it (only outside production).
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
