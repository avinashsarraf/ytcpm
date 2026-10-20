/** Shared defaults for the browser tools and homepage. Not live market data. */
import { COUNTRIES, NICHES, CREATOR_SHARE, countryMultiplier, type Country } from "./data";

const mean = (values: number[]) => values.reduce((sum, n) => sum + n, 0) / values.length;
export const MAX_VIEWS = 1_000_000_000;
export const MAX_CPM = 10_000;
export const DEFAULT_NICHE = NICHES.find((n) => n.slug === "technology-software") ?? NICHES[0];
export const WORLDWIDE: Country = {
  slug: "worldwide", name: "Worldwide (Average)", code: "WW", tier: 1,
  cpmLow: mean(COUNTRIES.map((c) => c.cpmLow)),
  cpmHigh: mean(COUNTRIES.map((c) => c.cpmHigh)),
  currency: "USD", fx: 1, locale: "en-US",
  note: "Unweighted average of tracked countries, not a traffic-weighted global rate.",
};

export function benchmarkCpm(niche = DEFAULT_NICHE, country = WORLDWIDE, season = 1) {
  return Math.round((niche.cpmLow + niche.cpmHigh) / 2 * countryMultiplier(country) * season * 100) / 100;
}
export const DEFAULT_CPM = benchmarkCpm();

export function revenueFromCpm(views: number, cpm: number, adShare = 1) {
  const gross = views / 1000 * cpm * adShare;
  return { gross, creator: gross * CREATOR_SHARE };
}
export function parseViews(raw: string) {
  const digits = raw.replace(/[^\d]/g, "").slice(0, 12);
  return digits ? Math.min(Number(digits), MAX_VIEWS) : 0;
}
