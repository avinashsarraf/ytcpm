import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/db";
import { logOnce } from "@/lib/log";
import { apiKeyConfigured, apiKeyFromRequest, isValidApiKey } from "@/lib/cms/api-auth";
import { uploadMedia } from "@/lib/cms/media";
import { recordActivity } from "@/lib/cms/activity";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/cms/media
 *
 * Uploads one image with a multipart body. The same magic-byte validation the
 * browser form uses applies here — the declared content type is never trusted.
 *
 * Fields: file (required), altText, title
 */
export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "The database is not configured." }, { status: 503, headers: noStore });
  }
  if (!apiKeyConfigured()) {
    return NextResponse.json({ ok: false, error: "CMS_API_KEY is not configured on this deployment." }, { status: 503, headers: noStore });
  }
  if (!isValidApiKey(apiKeyFromRequest(request))) {
    return NextResponse.json({ ok: false, error: "A valid bearer API key is required." }, { status: 401, headers: noStore });
  }

  const limit = rateLimit(`cms-api-media:${clientKey(request)}`, 60, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Too many uploads. Slow down." }, { status: 429, headers: { ...noStore, "Retry-After": String(limit.retryAfterSeconds) } });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Send a multipart form with a file field." }, { status: 400, headers: noStore });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Attach an image in the `file` field." }, { status: 400, headers: noStore });
  }

  const altText = String(form.get("altText") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();

  const result = await uploadMedia(file, { altText, title: title || null, userId: null });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400, headers: noStore });
  }

  await recordActivity({ userId: null, action: "media.uploaded", entity: "media", entityId: result.media.id, summary: `Uploaded ${result.media.filename} through the API.` });

  return NextResponse.json(
    {
      ok: true,
      media: {
        id: result.media.id,
        filename: result.media.filename,
        url: result.media.url,
        mimeType: result.media.mimeType,
        size: result.media.size,
        width: result.media.width,
        height: result.media.height,
        altText: result.media.altText,
      },
    },
    { status: 201, headers: noStore },
  );
}

export async function GET(request: Request) {
  const noStore = { "Cache-Control": "no-store" };
  if (!isValidApiKey(apiKeyFromRequest(request))) {
    return NextResponse.json({ ok: false, error: "A valid bearer API key is required." }, { status: 401, headers: noStore });
  }
  try {
    const { listMedia } = await import("@/lib/cms/media");
    const items = await listMedia(100);
    return NextResponse.json({ ok: true, count: items.length, media: items }, { headers: noStore });
  } catch (error) {
    logOnce("cms", "api media list failed", error);
    return NextResponse.json({ ok: false, error: "The media library could not be read." }, { status: 500, headers: noStore });
  }
}
