import { analyzeVideos, viewsPerDay } from "./analysis";
import { categoryName } from "./categories";
import { engagementRate } from "./estimate";
import type { AuditVideo } from "./types";

export type VideoInsight = AuditVideo & { engagement: number | null; viewsPerDay: number; isShort: boolean; categoryName: string };
export type ChannelInsights = {
  videos: VideoInsight[];
  totalViews: number; totalLikes: number; totalComments: number; engagement: number | null;
  best: VideoInsight | null; worst: VideoInsight | null; fastest: VideoInsight | null;
  topPhrases: { phrase: string; videos: number; associatedViews: number; averageViews: number; source: string }[];
  weakPhrases: { phrase: string; videos: number; associatedViews: number; averageViews: number; source: string }[];
  categories: { id: string; name: string; videos: number; views: number }[];
  uploadsPerMonth: number; ageDays: number; publishedAt: string | null;
  tagCoverage: number; missingDescriptions: number; inferredNiche: string | null; nicheSignals: number;
};
const median = (values: number[]) => { if (!values.length) return 0; const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };
export function buildInsights(videos: AuditVideo[], channel: { publishedAt?: string; description?: string; views?: number } = {}): ChannelInsights {
  const analysis = analyzeVideos(videos, channel.description ?? "");
  const enriched: VideoInsight[] = videos.map(video => ({
    ...video,
    engagement: engagementRate(video),
    viewsPerDay: viewsPerDay(video),
    isShort: video.duration ? /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.test(video.duration) !== null && (() => { const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(video.duration)!; const [, d, h, mi, s] = m.map(Number) as unknown as number[]; return (d || 0) * 86400 + (h || 0) * 3600 + (mi || 0) * 60 + (s || 0) <= 180; })() : false,
    categoryName: categoryName(video.categoryId),
  }));
  const totalViews = enriched.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = enriched.reduce((sum, v) => sum + (v.likes ?? 0), 0);
  const totalComments = enriched.reduce((sum, v) => sum + (v.comments ?? 0), 0);
  const sortedByViews = [...enriched].sort((a, b) => b.views - a.views);
  const sortedByVelocity = [...enriched].sort((a, b) => b.viewsPerDay - a.viewsPerDay);
  const categoriesMap = new Map<string, { id: string; name: string; videos: number; views: number }>();
  for (const video of enriched) {
    const entry = categoriesMap.get(video.categoryId) ?? { id: video.categoryId, name: video.categoryName, videos: 0, views: 0 };
    entry.videos += 1; entry.views += video.views; categoriesMap.set(video.categoryId, entry);
  }
  const published = enriched.map(v => Date.parse(v.publishedAt)).filter(value => Number.isFinite(value)).sort((a, b) => a - b);
  const ageDays = published.length ? Math.max(1, (Date.now() - published[0]) / 86_400_000) : 0;
  const months = Math.max(1, ageDays / 30.44);
  const multiVideo = analysis.phrases.filter(p => p.videos >= 2);
  return {
    videos: enriched,
    totalViews, totalLikes, totalComments,
    engagement: totalViews ? ((totalLikes + totalComments) / totalViews) * 100 : null,
    best: sortedByViews[0] ?? null,
    worst: [...enriched].sort((a, b) => a.views - b.views)[0] ?? null,
    fastest: sortedByVelocity[0] ?? null,
    topPhrases: analysis.phrases.slice(0, 20).map(p => ({ ...p, averageViews: p.videos ? Math.round(p.associatedViews / p.videos) : 0 })),
    weakPhrases: multiVideo.sort((a, b) => (a.associatedViews / a.videos) - (b.associatedViews / b.videos)).slice(0, 12).map(p => ({ ...p, averageViews: Math.round(p.associatedViews / p.videos) })),
    categories: [...categoriesMap.values()].sort((a, b) => b.views - a.views),
    uploadsPerMonth: enriched.length / months,
    ageDays, publishedAt: published.length ? new Date(published[0]).toISOString() : null,
    tagCoverage: videos.length ? (analysis.withTags / videos.length) * 100 : 0,
    missingDescriptions: analysis.missingDescriptions,
    inferredNiche: analysis.niche,
    nicheSignals: analysis.nicheSignals,
  };
}
export function medianViewsPerDay(videos: AuditVideo[]): number { return median(videos.map(v => viewsPerDay(v)).filter(v => v > 0)); }
