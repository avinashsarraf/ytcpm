import { createHmac, timingSafeEqual } from "node:crypto";
import { depthPrice, type AuditDepth } from "./premium";

const API = "https://api.razorpay.com/v1";
function credentials(): { id: string; secret: string } | null {
  const id = process.env.RAZORPAY_KEY_ID; const secret = process.env.RAZORPAY_KEY_SECRET;
  return id && secret ? { id, secret } : null;
}
export async function createOrder(depth: AuditDepth, receipt: string) {
  const creds = credentials(); if (!creds) throw new Error("Razorpay is not configured");
  const amount = Math.round(depthPrice(depth) * 100);
  if (amount <= 0) throw new Error("This depth is free and cannot be purchased");
  const body = JSON.stringify({ amount, currency: "INR", receipt, notes: { depth } });
  const response = await fetch(`${API}/orders`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${creds.id}:${creds.secret}`).toString("base64")}` }, body, signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => null) as { id?: string; amount?: number; currency?: string; status?: string; error?: { description?: string } } | null;
  if (!response.ok || !data?.id) throw new Error(data?.error?.description ?? "Razorpay rejected the order request");
  return { id: data.id, amount: data.amount ?? amount, currency: data.currency ?? "INR", status: data.status ?? "created" };
}
export async function verifyPayment(paymentId: string) {
  const creds = credentials(); if (!creds) throw new Error("Razorpay is not configured");
  const response = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Basic ${Buffer.from(`${creds.id}:${creds.secret}`).toString("base64")}` }, signal: AbortSignal.timeout(15000), cache: "no-store" });
  const data = await response.json().catch(() => null) as { id?: string; status?: string; amount?: number; currency?: string; error?: { description?: string } } | null;
  if (!response.ok || !data?.id) throw new Error(data?.error?.description ?? "Payment could not be verified");
  return { id: data.id, status: data.status ?? "", amount: data.amount ?? 0, currency: data.currency ?? "INR" };
}
/** Razorpay webhook HMAC — raw body must stay untouched. */
export function verifyWebhook(raw: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET; if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected, "hex"); const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
