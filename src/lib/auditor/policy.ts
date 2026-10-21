import { FREE_PLAYLIST_LIMIT, FREE_VIDEO_LIMIT, HALF_VIDEO_LIMIT, type AuditPlan } from "./premium";
/** Launch mode keeps every audit free until billing is switched on. */
export function launchMode(): boolean { return (process.env.AUDIT_BILLING_MODE ?? "free") === "free"; }
export function auditConfigured(): boolean { return Boolean(process.env.YOUTUBE_API_KEY && (process.env.AUDIT_SIGNING_SECRET?.length ?? 0) >= 32); }
export function effectiveLimits(level: AuditPlan): { videos: number; playlists: number } {
  // While billing is closed every depth is free, so the limits follow the plan
  // the visitor asked for rather than being silently capped.
  if (level === "full") return { videos: 1000, playlists: 500 };
  if (level === "half") return { videos: HALF_VIDEO_LIMIT, playlists: 50 };
  return { videos: FREE_VIDEO_LIMIT, playlists: FREE_PLAYLIST_LIMIT };
}
export type AuditPolicy = { mode: "free" | "paid"; freeAudits: boolean; copy: boolean; export: boolean; checkout: boolean; plans: string[] };
export function auditPolicy(plan: AuditPlan = "free"): AuditPolicy {
  const free = launchMode();
  return { mode: free ? "free" : "paid", freeAudits: free || plan !== "free", copy: free || plan !== "free", export: free || plan !== "free", checkout: !free, plans: ["free", "half", "full"] };
}
