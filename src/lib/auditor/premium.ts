import { planAllows, type AuditPlan, type PremiumFeature } from "./catalog";
export type { AuditPlan, PremiumFeature };
export { PLANS, planAllows, FREE_VIDEO_LIMIT, FREE_PLAYLIST_LIMIT, HALF_VIDEO_LIMIT, FULL_VIDEO_LIMIT } from "./catalog";
/** Server-owned price. The client never sends an amount. */
export function planPrice(plan: AuditPlan): number {
  const raw = plan === "half" ? process.env.RAZORPAY_HALF_AUDIT_PRICE_INR : plan === "full" ? process.env.RAZORPAY_FULL_AUDIT_PRICE_INR : undefined;
  const override = Number(raw ?? NaN);
  return Number.isFinite(override) && override > 0 ? override : (plan === "half" ? 499 : plan === "full" ? 1499 : 0);
}
export function premiumAllowed(plan: AuditPlan, feature: PremiumFeature): boolean { return planAllows(plan, feature); }
export function billingEnabled(): boolean { return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET); }
