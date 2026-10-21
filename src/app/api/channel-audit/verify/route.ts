import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/calculate-input";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createHmac, timingSafeEqual } from "node:crypto";
import { entitlementCookie, issueEntitlement, readEntitlement } from "@/lib/auditor/entitlement";
import { planPrice, type AuditPlan } from "@/lib/auditor/premium";
import { verifyPayment } from "@/lib/auditor/razorpay";
export const runtime = "nodejs";
export const maxDuration = 30;
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
/** Confirms a captured payment and grants a signed, HttpOnly plan cookie. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403, headers });
  const limit = rateLimit(`verify:${clientKey(req)}`, 10, 300_000);
  if (!limit.ok) return NextResponse.json({ error: "Too many verification attempts. Please try again later." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
  const parsed = await readLimitedJson(req, 4096);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid verification request." }, { status: parsed.status, headers });
  const body = parsed.value as Record<string, unknown> | null;
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";
  const plan: AuditPlan = body?.plan === "full" ? "full" : "half";
  if (!paymentId || !orderId || !signature) return NextResponse.json({ error: "Missing payment details." }, { status: 422, headers });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503, headers });
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected, "hex"); const b = Buffer.from(signature, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400, headers });
  try {
    const payment = await verifyPayment(paymentId);
    if (payment.status !== "captured") return NextResponse.json({ error: `Payment is ${payment.status}, not captured.` }, { status: 402, headers });
    if (payment.amount !== Math.round(planPrice(plan) * 100)) return NextResponse.json({ error: "The paid amount does not match the selected plan." }, { status: 400, headers });
    const { token } = issueEntitlement(plan, paymentId);
    const response = NextResponse.json({ plan, expiresInDays: 365 }, { headers });
    response.headers.append("Set-Cookie", entitlementCookie(token));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The payment could not be verified." }, { status: 502, headers });
  }
}
