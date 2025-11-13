import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || 
         `mysql://${process.env.TIDB_USER}:${process.env.TIDB_PASSWORD}@${process.env.TIDB_HOST}:${process.env.TIDB_PORT || 4000}/${process.env.TIDB_DATABASE}`,
  },
} satisfies Config;
