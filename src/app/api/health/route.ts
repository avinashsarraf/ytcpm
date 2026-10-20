import { db, isDatabaseConfigured } from "@/db";
import { sql } from "drizzle-orm";
import { logOnce } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * Readiness probe.
 *
 * 200 { ok: true,  database: "up" }             — database reachable
 * 503 { ok: false, database: "not_configured" } — DATABASE_URL missing
 * 503 { ok: false, database: "down" }           — configured but unreachable
 *
 * The failure body carries a `hint` (and a sanitised `code`) so the Coolify
 * health log says what to fix instead of only "down".
 */

type Failure = {
  code?: string;
  hint: string;
  detail?: string;
};

const HINTS: Record<string, string> = {
  ECONNREFUSED:
    "No Postgres is listening at that host and port. Create a PostgreSQL resource in Coolify and use its internal connection URL.",
  ENOTFOUND:
    "The database hostname does not resolve. Inside a container use the Coolify service name (e.g. @postgres:5432), not localhost.",
  EAI_AGAIN:
    "DNS lookup failed. Check the Coolify network/service name and retry.",
  ETIMEDOUT:
    "Connection timed out. Check the database is running and that the host/port are reachable from the app container.",
  "28P01":
    "Postgres rejected the password. Copy the password from the database resource again — special characters must be URL-encoded.",
  "28000":
    "Postgres rejected the login. Check the username and the database's allowed hosts.",
  "3D000":
    "That database name does not exist. Use the database created by the Postgres resource, or run CREATE DATABASE first.",
  "42501":
    "The database user lacks privileges. Grant it rights on the target schema or use the resource's owner user.",
  SELF_SIGNED_CERT_IN_CHAIN:
    "The server uses a self-signed certificate. Set DATABASE_SSL_STRICT=false (keep DATABASE_SSL=true).",
  DEPTH_ZERO_SELF_SIGNED_CERT:
    "The server uses a self-signed certificate. Set DATABASE_SSL_STRICT=false (keep DATABASE_SSL=true).",
  UNABLE_TO_VERIFY_LEAF_SIGNATURE:
    "The server certificate chain is incomplete. Set DATABASE_SSL_STRICT=false or install the CA certificate.",
};

const SSL_HINT =
  "Many managed Postgres providers require TLS — set DATABASE_SSL=true.";

function mask(text: string): string {
  const url = process.env.DATABASE_URL;
  let out = text;
  if (url) out = out.split(url).join("[DATABASE_URL]");
  // postgres://user:secret@host -> postgres://***:***@host
  return out.replace(/(postgres(?:ql)?:\/\/)[^@/\s]+@/gi, "$1***:***@");
}

/**
 * Drizzle wraps driver failures (`Failed query: select 1`), keeping the useful
 * `code`/message on `error.cause`. Walk the chain and keep the deepest message.
 */
function unwrap(error: unknown): { code?: string; message: string } {
  let current: unknown = error;
  let code: string | undefined;
  let message = "";

  for (let depth = 0; current && depth < 5; depth += 1) {
    const err = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (!code && typeof err.code === "string") code = err.code;
    if (typeof err.message === "string" && err.message.trim()) message = err.message;
    if (err.cause === undefined || err.cause === current) break;
    current = err.cause;
  }

  if (!message) message = String(error);
  return { code, message };
}

function describe(error: unknown): Failure {
  const { code, message: rawMessage } = unwrap(error);
  const message = mask(rawMessage);

  let hint = code ? HINTS[code] : undefined;

  if (!hint && /self.signed|certificate/i.test(message)) hint = SSL_HINT;

  if (!hint && /timeout|timed out/i.test(message)) hint = HINTS.ETIMEDOUT;

  if (!hint) {
    hint =
      "Check DATABASE_URL (host, port, user, password, database name) and that the Postgres resource is running.";
  }

  // A container reaching localhost is talking to itself, not to Postgres.
  if (/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) {
    hint =
      "DATABASE_URL points at localhost. Inside a container localhost is the app itself — use the Postgres service name or the external host from the database resource.";
  }

  return { code, hint, detail: message };
}

export async function GET() {
  const headers = { "Cache-Control": "no-store" };

  if (!isDatabaseConfigured()) {
    return Response.json(
      {
        ok: false,
        database: "not_configured",
        missing: ["DATABASE_URL"],
        hint: "Set DATABASE_URL in Coolify → the app → Environment Variables. Until then the site works, but /monitor, calculation logging and this probe stay in fallback mode.",
      },
      { status: 503, headers }
    );
  }

  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json(
      { ok: true, database: "up", latencyMs: Date.now() - startedAt },
      { headers }
    );
  } catch (error) {
    logOnce("health", "database unreachable", error);
    return Response.json(
      { ok: false, database: "down", ...describe(error) },
      { status: 503, headers }
    );
  }
}
