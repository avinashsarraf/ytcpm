#!/usr/bin/env node
/**
 * Creates the first CMS administrator.
 *
 * The CMS has no public sign-up: an account has to exist before anyone can
 * open /cms. Run this once after the migrations have been applied:
 *
 *   node scripts/seed-admin.mjs --email editor@ytcpm.online
 *
 * With no --password, a strong password is generated and printed once. With
 * --password, it is taken from the argument or from CMS_ADMIN_PASSWORD.
 *
 * The script is idempotent: running it again for an existing email resets the
 * password and reactivates the account instead of failing.
 */
import { randomBytes } from "node:crypto";
import { scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";
import { connectWithRetry } from "./db-connection.mjs";

const scrypt = promisify(scryptCallback);

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
}

function generatePassword() {
  // 18 characters from an unambiguous alphabet, with a guaranteed mix.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  const bytes = randomBytes(24);
  for (let i = 0; i < 18; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return `Ytc!${out}`;
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEM,
  });
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64url"), derived.toString("base64url")].join("$");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[seed-admin] DATABASE_URL is not set.");
  process.exit(1);
}

const email = (arg("email") ?? process.env.CMS_ADMIN_EMAIL ?? "").trim().toLowerCase();
const name = (arg("name") ?? process.env.CMS_ADMIN_NAME ?? "Site owner").trim();
const password = arg("password") ?? process.env.CMS_ADMIN_PASSWORD ?? undefined;

if (!email || !email.includes("@")) {
  console.error("[seed-admin] an email address is required: --email editor@ytcpm.online");
  process.exit(1);
}

const plain = password ?? generatePassword();
const generated = !password;
const passwordHash = await hashPassword(plain);

const createClient = () =>
  new pg.Client({
    connectionTimeoutMillis: 5000,
    connectionString: databaseUrl,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "true" }
        : undefined,
  });

let client;
try {
  client = await connectWithRetry(createClient, { attempts: 5, retryMs: 2000 });

  const existing = await client.query("select id from cms_users where lower(email) = lower($1) limit 1", [email]);

  if (existing.rows.length) {
    await client.query(
      `update cms_users
         set password_hash = $2, name = $3, role = 'admin', is_active = true, token_version = token_version + 1, updated_at = now()
       where id = $1`,
      [existing.rows[0].id, passwordHash, name],
    );
    console.log(`[seed-admin] updated the existing account ${email}.`);
  } else {
    await client.query(
      `insert into cms_users (email, name, password_hash, role, is_active, token_version)
       values ($1, $2, $3, 'admin', true, 1)`,
      [email, name, passwordHash],
    );
    console.log(`[seed-admin] created the administrator ${email}.`);
  }

  console.log("");
  console.log("  Sign in at /cms/login with:");
  console.log(`    email:    ${email}`);
  if (generated) {
    console.log(`    password: ${plain}`);
    console.log("");
    console.log("  This password is shown once. Store it in a password manager now.");
  } else {
    console.log("    password: (the one you supplied)");
  }
  console.log("");
} catch (error) {
  console.error("[seed-admin] failed:", error?.message ?? error);
  process.exitCode = 1;
} finally {
  await client?.end().catch(() => {});
}
