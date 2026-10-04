import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Neon recommends the direct endpoint for migrations and the pooled
    // endpoint for application traffic.
    url: process.env.DIRECT_DATABASE_URL ?? env("DATABASE_URL"),
  },
});
