#!/usr/bin/env node
/**
 * Spins up a throwaway PostgreSQL for the CMS end-to-end test.
 *
 * The CMS is the one part of this project that needs a real database, so the
 * end-to-end test used to be impossible to run without a Postgres install.
 * PGlite is a real PostgreSQL compiled to WebAssembly, and `pglite-socket`
 * exposes it on a TCP port, so the application connects to it with the same
 * `pg` pool it uses in production — same SQL, same migrations, same code.
 *
 * Nothing here is used by the application itself.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Starts the database, applies every migration and returns the connection
 * string plus a stop() function.
 */
export async function startTestDatabase({ port = 55432, maxConnections = 10, migrationsDir = join(here, "..", "drizzle") } = {}) {
  const db = await PGlite.create();
  // PGlite executes one query at a time; the socket server multiplexes several
  // connections over it, so the application pool behaves like a normal one.
  const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections });
  await server.start();

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: `postgres://postgres:postgres@127.0.0.1:${port}/postgres` });
  await client.connect();

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await client.query(statement);
    }
  }

  await client.end();

  return {
    databaseUrl: `postgres://postgres:postgres@127.0.0.1:${port}/postgres`,
    async stop() {
      await server.stop();
      await db.close();
    },
  };
}
