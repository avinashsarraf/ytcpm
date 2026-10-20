import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Lazy database initialization.
 *
 * `src/db` is imported by route modules, and Next.js evaluates those modules
 * while collecting page data — so throwing here at import time used to break
 * `next build` whenever DATABASE_URL was absent. The pool is now created on
 * first query, which keeps static builds (and the calculator) working without a
 * database. Routes degrade gracefully with a 503 instead of crashing.
 */

type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __ytcpmPool?: Pool;
  __ytcpmDb?: Db;
};

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!globalForDb.__ytcpmPool) {
    globalForDb.__ytcpmPool = new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS ?? 10_000),
      ...(process.env.DATABASE_SSL === "true"
        ? { ssl: { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "true" } }
        : {}),
    });
  }

  return globalForDb.__ytcpmPool;
}

export function getDb(): Db {
  if (!globalForDb.__ytcpmDb) {
    globalForDb.__ytcpmDb = drizzle(getPool(), { schema });
  }
  return globalForDb.__ytcpmDb;
}

/**
 * Proxy keeps every existing `db.select(...)` / `db.insert(...)` call site
 * unchanged while deferring connection setup until the first real query.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real as object, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
