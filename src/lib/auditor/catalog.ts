export type AuditPlan = "free" | "half" | "full";
export type PremiumFeature = "copy" | "export" | "half" | "full";
export type PlanDefinition = {
  id: AuditPlan; name: string; priceInr: number; tagline: string; features: string[]; limits: string; highlight?: boolean;
};
/** Client-safe plan catalog. Prices are display values; the server owns billing. */
export const PLANS: PlanDefinition[] = [
  { id: "free", name: "Free Overview", priceInr: 0, tagline: "A quick public snapshot of any channel.", limits: "12 videos · 8 playlists · on-screen report", features: ["Channel snapshot and public stats", "Top and weakest content signals", "Keyword and tag analysis", "Modeled CPM/RPM scenarios"] },
  { id: "half", name: "Half Audit", priceInr: 499, tagline: "The deep read for one channel.", limits: "Up to 200 videos · 50 playlists · full keyword table", highlight: true, features: ["Everything in Free Overview", "Full video catalogue with sorting", "Complete keyword and tag table", "Copyable report summary", "CSV download of the video table"] },
  { id: "full", name: "Full Audit", priceInr: 1499, tagline: "Complete channel intelligence.", limits: "Up to 1,000 videos · every playlist · priority processing", features: ["Everything in Half Audit", "Entire upload history with pagination", "Per-video scenario revenue ranges", "Channel-vs-benchmark comparison", "Priority re-runs and re-exports"] },
];
export const FREE_VIDEO_LIMIT = 12;
export const FREE_PLAYLIST_LIMIT = 8;
export const HALF_VIDEO_LIMIT = 200;
export const FULL_VIDEO_LIMIT = 1000;
export function planAllows(plan: AuditPlan, feature: PremiumFeature): boolean {
  if (plan === "full") return true;
  if (plan === "half") return feature !== "full";
  return false;
}
