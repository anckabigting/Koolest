import { PrismaClient } from "../../generated/prisma/index.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;