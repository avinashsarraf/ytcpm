import { depthLimits, type AuditDepth } from "./premium";
/** Launch mode keeps every audit depth free and shows no pricing anywhere. */
export function launchMode(): boolean { return (process.env.AUDIT_BILLING_MODE ?? "free") === "free"; }
export function auditConfigured(): boolean { return Boolean(process.env.YOUTUBE_API_KEY && (process.env.AUDIT_SIGNING_SECRET?.length ?? 0) >= 32); }
/** Depth actually granted to the caller. Launch mode grants the deepest one. */
export function effectiveDepth(requested: AuditDepth): AuditDepth {
  if (launchMode()) return "complete";
  return requested;
}
export function effectiveLimits(depth: AuditDepth): { videos: number; playlists: number } {
  const limits = depthLimits(depth);
  return { videos: limits.videos, playlists: limits.playlists };
}
export type AuditPolicy = { mode: "free" | "paid"; freeAudits: boolean; copy: boolean; export: boolean; checkout: boolean };
export function auditPolicy(depth: AuditDepth = "standard"): AuditPolicy {
  const free = launchMode();
  return { mode: free ? "free" : "paid", freeAudits: true, copy: true, export: true, checkout: !free && depth !== "standard" };
}
