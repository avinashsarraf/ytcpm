import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuditPlan } from "./premium";

export type Entitlement = { plan: AuditPlan; issuedAt: number; expiresAt: number; paymentId: string };
const COOKIE = "ytcpm_audit_plan";
function secret(): string { const value = process.env.AUDIT_SIGNING_SECRET; if (!value || value.length < 32) throw new Error("Audit signing is not configured"); return value; }
export function issueEntitlement(plan: AuditPlan, paymentId: string, days = 365): { token: string; entitlement: Entitlement } {
  const now = Date.now();
  const entitlement: Entitlement = { plan, issuedAt: now, expiresAt: now + days * 86_400_000, paymentId };
  const body = Buffer.from(JSON.stringify(entitlement)).toString("base64url");
  return { token: `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`, entitlement };
}
export function readEntitlement(token: string | undefined | null): Entitlement | null {
  if (!token || token.length > 2048) return null;
  try {
    const [body, signature, extra] = token.split("."); if (!body || !signature || extra) return null;
    const expected = createHmac("sha256", secret()).update(body).digest(); const supplied = Buffer.from(signature, "base64url");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const value = JSON.parse(Buffer.from(body, "base64url").toString()) as Entitlement;
    if (!["free", "half", "full"].includes(value.plan) || !Number.isFinite(value.expiresAt) || value.expiresAt < Date.now()) return null;
    return value;
  } catch { return null; }
}
export const ENTITLEMENT_COOKIE = COOKIE;
export function entitlementCookie(token: string) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
}
