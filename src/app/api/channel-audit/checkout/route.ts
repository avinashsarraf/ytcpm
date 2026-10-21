import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/calculate-input";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { billingEnabled, depthPrice } from "@/lib/auditor/premium";
import { createOrder } from "@/lib/auditor/razorpay";
import { launchMode } from "@/lib/auditor/policy";
import type { AuditDepth } from "@/lib/auditor/catalog";
export const runtime = "nodejs";
export const maxDuration = 30;
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
/** Creates a Razorpay order. The amount always comes from the server depth table. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403, headers });
  const limit = rateLimit(`checkout:${clientKey(req)}`, 5, 300_000);
  if (!limit.ok) return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
  if (launchMode()) return NextResponse.json({ error: "Checkout is not open yet — every audit is free right now." }, { status: 503, headers });
  if (!billingEnabled()) return NextResponse.json({ error: "Payments are not configured yet. No charge can be made." }, { status: 503, headers });
  const parsed = await readLimitedJson(req, 2048);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid checkout request." }, { status: parsed.status, headers });
  const body = parsed.value as Record<string, unknown> | null;
  const depth: AuditDepth | null = body?.depth === "deep" || body?.depth === "complete" ? body.depth : null;
  if (!depth) return NextResponse.json({ error: "Choose a valid audit depth." }, { status: 422, headers });
  try {
    const order = await createOrder(depth, `audit_${depth}_${Date.now().toString(36)}`);
    return NextResponse.json({ order, depth, priceInr: depthPrice(depth) }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The payment order could not be created." }, { status: 502, headers });
  }
}
