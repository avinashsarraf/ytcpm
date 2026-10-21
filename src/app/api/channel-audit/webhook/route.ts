import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/auditor/razorpay";
export const runtime = "nodejs";
/** Razorpay webhook. The signature is verified before anything is trusted. */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!verifyWebhook(raw, signature)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; notes?: { depth?: string } } } } } | null = null;
  try { event = JSON.parse(raw); } catch { event = null; }
  const depth = event?.payload?.payment?.entity?.notes?.depth;
  console.info(`[razorpay] ${event?.event ?? "event"} received${depth ? ` for depth ${depth}` : ""}`);
  return NextResponse.json({ received: true }, { headers: { "Cache-Control": "no-store" } });
}
