import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readEntitlement } from "@/lib/auditor/entitlement";
import { launchMode } from "@/lib/auditor/policy";
import { billingEnabled } from "@/lib/auditor/premium";
import { planAllows, type AuditPlan } from "@/lib/auditor/catalog";
import { effectiveLimits } from "@/lib/auditor/policy";
export const runtime = "nodejs";
/** Capability discovery for the client. It never grants access on its own. */
export async function GET() {
  const store = await cookies();
  const entitlement = readEntitlement(store.get("ytcpm_audit_plan")?.value);
  const plan: AuditPlan = entitlement?.plan ?? "free";
  const free = launchMode();
  return NextResponse.json({
    mode: free ? "free" : "paid",
    plan: free ? "full" : plan,
    entitlements: { half: free || planAllows(plan, "half"), full: free || planAllows(plan, "full"), copy: free || planAllows(plan, "copy"), export: free || planAllows(plan, "export") },
    checkout: billingEnabled() && !free,
    depths: { free: true, half: true, full: true },
    limits: { free: effectiveLimits("free"), half: effectiveLimits("half"), full: effectiveLimits("full") },
  }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
