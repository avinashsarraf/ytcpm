#!/usr/bin/env node
/**
 * Minimal, dependency-light migration runner.
 *
 * Applies every `drizzle/*.sql` file exactly once, tracked in a `_migrations`
 * table. Uses the same SQL files Drizzle Kit generates, so `npm run db:generate`
 * stays the source of truth for schema changes.
 *
 * Runs inside the production container via docker-entrypoint.sh when
 * RUN_MIGRATIONS=true (default). Safe to run repeatedly; exits non-zero only if
 * a migration genuinely fails or DATABASE_URL is missing.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { connectWithRetry } from "./db-connection.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = process.env.MIGRATIONS_DIR ?? join(here, "..", "drizzle");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("[migrate] DATABASE_URL is not set — skipping migrations.");
  process.exit(1);
}

const sqlFiles = (await readdir(migrationsDir))
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (sqlFiles.length === 0) {
  console.log("[migrate] no .sql files found in", migrationsDir);
  process.exit(0);
}

function mask(url) {
  return url.replace(/(:\/\/)[^:/@]+(:[^@]*)?@/, "$1***:***@");
}

console.log(`[migrate] target: ${mask(databaseUrl)}`);

const createClient = () => new pg.Client({
  connectionTimeoutMillis: 2000,
  connectionString: databaseUrl,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "true" }
      : undefined,
});

// Keep total wait under the container's 20s healthcheck start period.
const MAX_ATTEMPTS = Number(process.env.MIGRATION_MAX_ATTEMPTS ?? 5);
const RETRY_MS = Number(process.env.MIGRATION_RETRY_MS ?? 2000);

let client;

try {
  client = await connectWithRetry(createClient, { attempts: MAX_ATTEMPTS, retryMs: RETRY_MS });
  // Serialize concurrent container starts; the session lock releases on disconnect.
  await client.query("select pg_advisory_lock($1)", [20261021]);

  await client.query(`
    CREATE TABLE IF NOT EXISTS "_migrations" (
      "name" text PRIMARY KEY,
      "applied_at" timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query('select "name" from "_migrations"');
  const applied = new Set(rows.map((r) => r.name));

  for (const file of sqlFiles) {
    if (applied.has(file)) {
      console.log(`[migrate] skip ${file} (already applied)`);
      continue;
    }

    const sql = await readFile(join(migrationsDir, file), "utf8");
    // Drizzle separates statements with a marker comment.
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`[migrate] applying ${file} (${statements.length} statements)`);
    await client.query("BEGIN");
    try {
      for (const statement of statements) {
        await client.query(statement);
      }
      await client.query('insert into "_migrations" ("name") values ($1) on conflict do nothing', [file]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`migration ${file} failed: ${error.message}`);
    }
  }

  console.log("[migrate] database is up to date");
} catch (error) {
  console.error("[migrate]", error.code ?? "", mask(String(error.message).split(databaseUrl).join("[DATABASE_URL]")));
  process.exitCode = 1;
} finally {
  await client?.end().catch(() => {});
}
