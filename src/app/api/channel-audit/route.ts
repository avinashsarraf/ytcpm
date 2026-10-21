import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/calculate-input";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { parseChannelInput } from "@/lib/auditor/input";
import { readCursor } from "@/lib/auditor/cursor";
import { AuditError, loadAuditPage, startAudit } from "@/lib/auditor/youtube";
import { signExport } from "@/lib/auditor/cursor";
import { auditConfigured, effectiveLimits, launchMode } from "@/lib/auditor/policy";
import { readEntitlement } from "@/lib/auditor/entitlement";
import { cookies } from "next/headers";
export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403, headers });
  const limit = rateLimit(`auditor:${clientKey(req)}`, 12, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Please wait a moment before running another audit." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
  const parsed = await readLimitedJson(req, 8192);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid or oversized audit request." }, { status: parsed.status, headers });
  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Enter a channel URL or @handle." }, { status: 422, headers });
  const input = body as Record<string, unknown>;
  if (input.cursor !== undefined) {
    const cursor = readCursor(input.cursor);
    if (!cursor) return NextResponse.json({ error: "This audit page has expired. Run the channel audit again." }, { status: 422, headers });
    try { return NextResponse.json({ page: await loadAuditPage(cursor) }, { headers }); }
    catch (error) { return NextResponse.json({ error: error instanceof AuditError ? error.message : "That page could not be loaded." }, { status: error instanceof AuditError ? error.status : 500, headers }); }
  }
  const locator = parseChannelInput(input.channel);
  if (!locator) return NextResponse.json({ error: "Use a YouTube @handle, an @handle URL or a /channel/UC… URL." }, { status: 422, headers });
  const requested = input.level === "half" || input.level === "full" ? input.level : "free";
  if (requested !== "free" && !launchMode()) {
    const store = await cookies();
    const entitlement = readEntitlement(store.get("ytcpm_audit_plan")?.value);
    if (!entitlement || (requested === "full" && entitlement.plan !== "full")) {
      return NextResponse.json({ error: "This depth is part of a paid audit. Upgrade to run a Half or Full audit.", code: "premium_required" }, { status: 402, headers });
    }
  }
  if (!auditConfigured()) return NextResponse.json({ error: "Live audits need a YouTube API key. Open the sample report to review the full experience.", code: "not_configured" }, { status: 503, headers });
  const limits = effectiveLimits(requested);
  try {
    const report = await startAudit(locator, requested === "free" ? "overview" : "full", limits);
    return NextResponse.json({ report, exportToken: signExport(report.channel.id, requested) }, { headers });
  } catch (error) {
    const status = error instanceof AuditError ? error.status : 500;
    return NextResponse.json({ error: error instanceof AuditError ? error.message : "The audit could not finish. Please try again." }, { status, headers });
  }
}
