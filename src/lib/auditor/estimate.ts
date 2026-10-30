import { COUNTRIES, CREATOR_SHARE, NICHES, countryMultiplier, estimateEarnings, type Country, type Niche } from "@/lib/data";
import { viewsPerDay } from "./analysis";
import type { AuditVideo } from "./types";

export const WORLDWIDE: Country = { slug: "worldwide", name: "Worldwide (unweighted)", code: "WW", tier: 3, cpmLow: 0, cpmHigh: 0, currency: "USD", fx: 1, locale: "en-US", note: "Unweighted worldwide scenario — no audience-country mix is applied." };
export const SHORT_LIMIT_SECONDS = 180;
export function parseDuration(iso: string): number {
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!match) return 0;
  const [, d, h, m, s] = match.map(Number) as unknown as number[];
  return (d || 0) * 86400 + (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}
export function isShort(durationIso: string): boolean {
  const seconds = parseDuration(durationIso);
  return seconds > 0 && seconds <= SHORT_LIMIT_SECONDS;
}
export type Scenario = {
  market: Country; niche: Niche; longViews: number; shortViews: number;
  cpmLow: number; cpmHigh: number; rpmLow: number; rpmHigh: number;
  lifetimeLow: number; lifetimeHigh: number; monthlyLow: number; monthlyHigh: number;
  monthlyViews: number; dailyViews: number; longRpmLow: number; longRpmHigh: number; shortRpmLow: number; shortRpmHigh: number;
};
/**
 * Scenario only. Uses the site's own benchmark model, an explicit market
 * assumption and an inferred/selected niche — never a channel's real payout.
 */
export function buildScenario(videos: AuditVideo[], options: { marketSlug?: string; nicheSlug?: string; lifetimeViews?: number }): Scenario {
  const market = COUNTRIES.find(c => c.slug === options.marketSlug) ?? WORLDWIDE;
  const niche = NICHES.find(n => n.slug === options.nicheSlug) ?? NICHES.find(n => n.slug === "technology-software") ?? NICHES[0];
  let longViews = 0; let shortViews = 0;
  for (const video of videos) { if (isShort(video.duration)) shortViews += video.views; else longViews += video.views; }
  const long = estimateEarnings({ views: longViews, niche, country: market, type: "long" });
  const shorts = estimateEarnings({ views: shortViews, niche, country: market, type: "shorts" });
  const recent = [...videos].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 12);
  const rates = recent.map(v => viewsPerDay(v)).filter(r => Number.isFinite(r) && r > 0).sort((a, b) => a - b);
  const dailyViews = rates.length ? rates[Math.floor(rates.length / 2)] : 0;
  const monthlyViews = dailyViews * 30;
  const monthlyRatio = longViews + shortViews > 0 ? monthlyViews / ((longViews + shortViews) || 1) : 0;
  const monthlyLong = monthlyViews * (longViews / ((longViews + shortViews) || 1));
  const monthlyShort = monthlyViews * (shortViews / ((longViews + shortViews) || 1));
  const monthlyLongEstimate = estimateEarnings({ views: monthlyLong, niche, country: market, type: "long" });
  const monthlyShortEstimate = estimateEarnings({ views: monthlyShort, niche, country: market, type: "shorts" });
  const lifetime = estimateEarnings({ views: options.lifetimeViews ?? longViews + shortViews, niche, country: market, type: "long" });
  return {
    market, niche, longViews, shortViews,
    cpmLow: long.cpmLow, cpmHigh: long.cpmHigh,
    rpmLow: long.rpmLow, rpmHigh: long.rpmHigh,
    longRpmLow: long.rpmLow, longRpmHigh: long.rpmHigh,
    shortRpmLow: shorts.rpmLow, shortRpmHigh: shorts.rpmHigh,
    lifetimeLow: lifetime.monthlyLow, lifetimeHigh: lifetime.monthlyHigh,
    monthlyLow: monthlyLongEstimate.monthlyLow + monthlyShortEstimate.monthlyLow,
    monthlyHigh: monthlyLongEstimate.monthlyHigh + monthlyShortEstimate.monthlyHigh,
    monthlyViews, dailyViews,
  };
}
export function engagementRate(video: AuditVideo): number | null {
  if (!video.views || video.likes === null && video.comments === null) return null;
  const interactions = (video.likes ?? 0) + (video.comments ?? 0);
  return (interactions / video.views) * 100;
}
export { countryMultiplier, CREATOR_SHARE };
