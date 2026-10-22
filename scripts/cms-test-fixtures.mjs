#!/usr/bin/env node
/**
 * Seed data for the CMS end-to-end test.
 *
 * Creates the administrator account the test signs in with, plus one post,
 * one comment, one media row and one redirect so every admin screen has
 * something real to render.
 */
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import pg from "pg";

const scrypt = promisify(scryptCallback);

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEM,
  });
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64url"), derived.toString("base64url")].join("$");
}

export const ADMIN_EMAIL = "owner@ytcpm.online";
export const ADMIN_PASSWORD = "Ytc!TestOwner2026";

const BODY = [
  "## What the number means",
  "",
  "A YouTube CPM is the gross revenue YouTube pays for a thousand impressions. It is not a salary and it is not a promise, but it is the cleanest way to compare two channels of different sizes.",
  "",
  "## How the estimate is built",
  "",
  "The model here takes the audience country, the content niche and the monetisation mix, then applies a published rate for that combination. Every assumption is listed on the methodology page so the arithmetic can be checked by hand.",
  "",
  "![A worked CPM example](/media/2026/10/cpm-chart.png)",
  "",
  "The [CPM calculator](/youtube-cpm-calculator) runs the same numbers in the browser, and the [RPM calculator](/youtube-rpm-calculator) converts the result into what a thousand views actually earn once the watch time is taken into account.",
  "",
  "## What to do with the number",
  "",
  "Treat the result as a range rather than a single figure. If the channel is small, a shift in audience country or a change in the upload format moves the estimate more than anything else.",
].join("\n");

/** A 1200x630 PNG so the fixture image is a real file, not a broken link. */
const CHART_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFklEQVR4nGP8z8Dwn4EIwESMolGFlAEAiTkDEbUyort/AAAAAElFTkSuQmCC",
  "base64",
);

export async function seedFixtures(databaseUrl, storageDir) {
  if (storageDir) {
    const target = join(storageDir, "2026", "10");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "cpm-chart.png"), CHART_PNG);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  const user = await client.query(
    `insert into cms_users (email, name, password_hash, role, is_active, token_version)
     values ($1, 'Site owner', $2, 'admin', true, 1)
     returning id`,
    [ADMIN_EMAIL, passwordHash],
  );
  const userId = user.rows[0].id;

  const post = await client.query(
    `insert into cms_posts
       (title, slug, excerpt, content_md, status, author_id, focus_keyword, seo_title, seo_description, seo_keywords,
        og_image_url, og_image_alt, published_at, created_at, updated_at)
     values ($1, $2, $3, $4, 'published', $5, $6, $7, $8, $9, $10, $11, now(), now(), now())
     returning id`,
    [
      "What a YouTube CPM actually tells you",
      "what-a-youtube-cpm-actually-tells-you",
      "A CPM is the gross revenue per thousand impressions. Here is how to read it without fooling yourself.",
      BODY,
      userId,
      "youtube cpm",
      "What a YouTube CPM actually tells you",
      "A YouTube CPM is the gross revenue per thousand impressions. Learn how the estimate is built and how to read it.",
      ["youtube cpm", "cpm meaning", "youtube earnings per thousand views"],
      "/media/2026/10/cpm-chart.png",
      "A creator filming a short explainer video",
    ],
  );
  const postId = post.rows[0].id;

  await client.query(
    `insert into cms_comments (post_id, author_name, author_email, body, status)
     values ($1, 'Priya S.', 'priya@example.com', 'This finally explained the difference in plain language.', 'pending')`,
    [postId],
  );

  await client.query(
    `insert into cms_media (filename, storage_key, url, mime_type, size, width, height, alt_text, uploaded_by_id)
     values ('cpm-chart.png', '2026/10/cpm-chart.png', '/media/2026/10/cpm-chart.png', 'image/png', 20480, 1200, 630, 'A CPM comparison chart', $1)`,
    [userId],
  );

  await client.query(
    `insert into cms_redirects (from_path, to_path, status_code, is_active)
     values ('/old-cpm', '/youtube-cpm-calculator', 301, true)`,
  );

  await client.query(
    `insert into cms_activity (user_id, action, entity, entity_id, summary)
     values ($1, 'post.published', 'post', $2, 'Published "What a YouTube CPM actually tells you"')`,
    [userId, String(postId)],
  );

  await client.end();
  return { userId, postId };
}
