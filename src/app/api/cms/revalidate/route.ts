import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { getSetting } from "@/lib/cms/settings";
import { logOnce } from "@/lib/log";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_CLOCK_SKEW_SECONDS = 300;

/**
 * POST /api/cms/revalidate
 *
 * A signed webhook so another system (a deploy hook, a scheduler, a script
 * that writes straight to the database) can tell this site that content
 * changed.
 *
 * Headers:
 *   x-cms-timestamp  unix seconds
 *   x-cms-signature  base64url HMAC-SHA256 of "<timestamp>.<raw body>"
 *
 * Body (all optional):
 *   { "slug": "my-post", "tags": ["cms-posts"], "paths": ["/blog"] }
 *
 * The signature covers the timestamp and the exact bytes of the body, so a
 * captured request cannot be replayed later.
 */
async function readSecret(): Promise<string | null> {
  const fromEnv = process.env.CMS_REVALIDATE_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  const fromSettings = await getSetting("revalidate.webhookSecret");
  if (fromSettings && fromSettings.length >= 16) return fromSettings;
  return null;
}

export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };

  const secret = await readSecret();
  if (!secret) {
    return Response.json({ ok: false, error: "The revalidation webhook is not configured." }, { status: 503, headers: noStore });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ ok: false, error: "That request body is too large." }, { status: 413, headers: noStore });
  }

  const timestamp = request.headers.get("x-cms-timestamp") ?? "";
  const signature = request.headers.get("x-cms-signature") ?? "";
  const stamp = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(stamp) || Math.abs(Math.floor(Date.now() / 1000) - stamp) > MAX_CLOCK_SKEW_SECONDS) {
    return Response.json({ ok: false, error: "The request timestamp is missing or too old." }, { status: 401, headers: noStore });
  }
  if (!signature) {
    return Response.json({ ok: false, error: "A signature is required." }, { status: 401, headers: noStore });
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, "base64url");
  } catch {
    return Response.json({ ok: false, error: "The signature is malformed." }, { status: 401, headers: noStore });
  }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return Response.json({ ok: false, error: "The signature does not match." }, { status: 401, headers: noStore });
  }

  let payload: { slug?: string; tags?: string[]; paths?: string[] } = {};
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw);
    } catch {
      return Response.json({ ok: false, error: "Send a JSON body." }, { status: 400, headers: noStore });
    }
  }

  const tags = new Set<string>(payload.tags ?? []);
  const paths = new Set<string>(payload.paths ?? []);
  tags.add("cms-posts");
  paths.add("/blog");
  paths.add("/sitemap.xml");
  if (payload.slug) {
    tags.add(`cms-post:${payload.slug}`);
    paths.add(`/blog/${payload.slug}`);
  }

  try {
    for (const tag of tags) revalidateTag(tag, "max");
    for (const path of paths) revalidatePath(path);
    return Response.json({ ok: true, revalidated: { tags: [...tags], paths: [...paths] } }, { headers: noStore });
  } catch (error) {
    logOnce("cms", "revalidate webhook failed", error);
    return Response.json({ ok: false, error: "The cache could not be revalidated." }, { status: 500, headers: noStore });
  }
}
