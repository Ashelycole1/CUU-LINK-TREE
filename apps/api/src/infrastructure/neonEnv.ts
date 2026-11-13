import { parseEnv } from "@neon/env";
import neonConfig from "../../../../neon";

export interface NeonDatabase {
  /** Pooled connection (-pooler host): for the app's queries. */
  pooledUrl: string;
  /** Direct connection: for schema migrations. Falls back to the pooled URL when not provided. */
  directUrl: string;
}

/**
 * Reads the Neon Postgres variables through @neon/env, validated against the
 * services declared in neon.ts. Returns null when DATABASE_URL is not set,
 * so local development can keep using JSON files.
 */
export function neonDatabase(env: NodeJS.ProcessEnv = process.env): NeonDatabase | null {
  if (!env.DATABASE_URL?.trim()) return null;
  if (env.DATABASE_URL_UNPOOLED?.trim()) {
    const { postgres } = parseEnv(neonConfig, ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]);
    return { pooledUrl: strictTls(postgres.databaseUrl), directUrl: strictTls(postgres.databaseUrlUnpooled) };
  }
  const { postgres } = parseEnv(neonConfig, ["DATABASE_URL"]);
  return { pooledUrl: strictTls(postgres.databaseUrl), directUrl: strictTls(postgres.databaseUrl) };
}

/**
 * Neon's strings use sslmode=require, which node-postgres treats as
 * verify-full today but will weaken to libpq's meaning in pg 9. Spelling
 * out verify-full keeps certificate checking and silences the warning.
 */
function strictTls(url: string): string {
  return url.replace(/([?&]sslmode=)(require|prefer|verify-ca)(?=&|$)/, "$1verify-full");
}
