import { PrismaClient } from "../../generated/prisma/index.js";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis;

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL starts with:", process.env.DATABASE_URL?.slice(0, 15));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaNeon(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

