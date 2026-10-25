import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Neon recommends the direct endpoint for migrations and the pooled endpoint for application traffic.
    // Fallback to placeholder connection string during static generation/builds when DATABASE_URL is not provided.
    url:
      process.env.DIRECT_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "postgresql://placeholder:placeholder@localhost:5432/anmol_placeholder?schema=public",
  },
});

