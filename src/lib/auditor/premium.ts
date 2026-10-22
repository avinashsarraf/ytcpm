import { DEPTH_BY_ID, depthAllows, type AuditDepth, type DepthFeature } from "./catalog";
export type { AuditDepth, DepthFeature };
export { DEPTH_BY_ID, depthAllows } from "./catalog";
/**
 * Server-only billing helpers. No amount is ever rendered on the public site
 * during the launch period — checkout stays closed until the operator enables
 * it and supplies credentials.
 */
export function depthPrice(depth: AuditDepth): number {
  const raw = depth === "deep" ? process.env.RAZORPAY_DEEP_AUDIT_PRICE_INR : depth === "complete" ? process.env.RAZORPAY_COMPLETE_AUDIT_PRICE_INR : undefined;
  const override = Number(raw ?? NaN);
  return Number.isFinite(override) && override > 0 ? override : (depth === "deep" ? 499 : depth === "complete" ? 1499 : 0);
}
export function depthLimits(depth: AuditDepth) { return DEPTH_BY_ID.get(depth) ?? DEPTH_BY_ID.get("standard")!; }
export function featureAllowed(depth: AuditDepth, feature: DepthFeature): boolean { return depthAllows(depth, feature); }
export function billingEnabled(): boolean { return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET); }
