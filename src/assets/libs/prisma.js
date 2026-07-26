import { PrismaClient } from "../../generated/prisma/index.js";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis;
// test
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length);
console.log("DATABASE_URL JSON:", JSON.stringify(process.env.DATABASE_URL)); // //

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

