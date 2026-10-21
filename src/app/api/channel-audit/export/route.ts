import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/calculate-input";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readExport } from "@/lib/auditor/cursor";
import { readEntitlement } from "@/lib/auditor/entitlement";
import { launchMode } from "@/lib/auditor/policy";
import { depthAllows } from "@/lib/auditor/catalog";
import { collectChannelVideos } from "@/lib/auditor/youtube";
import { cookies } from "next/headers";
export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const cell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
/**
 * Server-authoritative CSV export. The client sends only a signed token; the
 * rows are re-fetched here so an export cannot be forged from the browser.
 */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403, headers });
  const limit = rateLimit(`export:${clientKey(req)}`, 6, 300_000);
  if (!limit.ok) return NextResponse.json({ error: "Too many export attempts. Please try again later." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
  const parsed = await readLimitedJson(req, 4096);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid export request." }, { status: parsed.status, headers });
  const body = parsed.value as Record<string, unknown> | null;
  const token = readExport(body?.token);
  if (!token) return NextResponse.json({ error: "This export link has expired. Run the audit again." }, { status: 422, headers });
  if (!launchMode()) {
    const store = await cookies();
    const entitlement = readEntitlement(store.get("ytcpm_audit_depth")?.value);
    if (!entitlement || !depthAllows(entitlement.depth, "export")) {
      return NextResponse.json({ error: "CSV download is not included with this access.", code: "premium_required" }, { status: 402, headers });
    }
  }
  try {
    const videos = await collectChannelVideos(token.channelId, token.level === "complete" ? 1000 : token.level === "deep" ? 300 : 50);
    const rows = [["title", "published_at", "views", "likes", "comments", "duration", "category_id", "tags"].join(",")];
    for (const video of videos) rows.push([cell(video.title), cell(video.publishedAt), cell(video.views), cell(video.likes ?? ""), cell(video.comments ?? ""), cell(video.duration), cell(video.categoryId), cell(video.tags.join(" | "))].join(","));
    return new NextResponse(`${rows.join("\n")}\n`, { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="channel-audit-${token.channelId.slice(-6)}.csv"` } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The export could not be generated." }, { status: 502, headers });
  }
}
