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

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "true" }
      : undefined,
});

const MAX_ATTEMPTS = Number(process.env.MIGRATION_MAX_ATTEMPTS ?? 10);
const RETRY_MS = Number(process.env.MIGRATION_RETRY_MS ?? 3000);

async function connectWithRetry() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await client.connect();
      return;
    } catch (error) {
      console.warn(`[migrate] connect attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);
      if (attempt === MAX_ATTEMPTS) throw error;
      await new Promise((r) => setTimeout(r, RETRY_MS));
    }
  }
}

try {
  await connectWithRetry();

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
  console.error("[migrate]", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
