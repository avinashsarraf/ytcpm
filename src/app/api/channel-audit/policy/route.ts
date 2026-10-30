import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readEntitlement } from "@/lib/auditor/entitlement";
import { billingEnabled } from "@/lib/auditor/premium";
import { launchMode } from "@/lib/auditor/policy";
import { depthAllows, type AuditDepth } from "@/lib/auditor/catalog";
export const runtime = "nodejs";
/** Capability discovery for the client. It never grants access on its own. */
export async function GET() {
  const store = await cookies();
  const entitlement = readEntitlement(store.get("ytcpm_audit_depth")?.value);
  const depth: AuditDepth = entitlement?.depth ?? "standard";
  const free = launchMode();
  return NextResponse.json({
    mode: free ? "free" : "paid",
    depth: free ? "complete" : depth,
    entitlements: { deep: free || depthAllows(depth, "deep"), complete: free || depthAllows(depth, "complete"), copy: true, export: true },
    checkout: billingEnabled() && !free,
  }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
