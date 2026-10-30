/**
 * Audit depth catalogue. The public site runs every depth free during the
 * launch period, so no price, plan name or tier is exposed to visitors yet.
 * Depths are internal capability levels used by the server and the API.
 */
export type AuditDepth = "standard" | "deep" | "complete";
export type DepthFeature = "export" | "copy" | "deep" | "complete";

export type DepthDefinition = {
  id: AuditDepth; videos: number; playlists: number; pages: number;
};

export const DEPTHS: DepthDefinition[] = [
  { id: "standard", videos: 50, playlists: 20, pages: 1 },
  { id: "deep", videos: 300, playlists: 100, pages: 6 },
  { id: "complete", videos: 1000, playlists: 500, pages: 20 },
];

export const DEPTH_BY_ID = new Map(DEPTHS.map(depth => [depth.id, depth]));

export function depthAllows(depth: AuditDepth, feature: DepthFeature): boolean {
  if (depth === "complete") return true;
  if (depth === "deep") return feature !== "complete";
  return false;
}
