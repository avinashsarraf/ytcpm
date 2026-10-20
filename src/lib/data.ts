// ─── ytcpm.online — Central CPM/RPM dataset (2026 benchmarks) ───────────────
// Sources: public creator disclosures, Influencer Marketing Hub surveys,
// YTLarge trackers, eMarketer ad-spend forecasts. Ranges are directional
// estimates, reviewed against Q4-2025 / Q1-2026 seasonality.
// FX rates: approximate 2026 spot levels — used for display conversion only;
// benchmarks themselves are quoted in USD (industry standard).

export type ContentType = "long" | "shorts";

export interface Country {
  slug: string;
  name: string;
  code: string;
  tier: 1 | 2 | 3 | 4;
  cpmLow: number; // advertiser CPM, USD per 1k ad impressions
  cpmHigh: number;
  currency: string; // ISO 4217
  fx: number; // local units per 1 USD (approx)
  locale: string; // Intl formatting locale
  note: string;
}

export interface Niche {
  slug: string;
  name: string;
  icon: string; // lucide icon key (mapped in client components)
  tier: "S" | "A" | "B" | "C";
  cpmLow: number; // US-audience advertiser CPM baseline
  cpmHigh: number;
  desc: string;
  tip: string;
}

export const DATA_YEAR = 2026;
/** Last time the benchmark table itself was reviewed (not the build date). */
export const DATA_UPDATED_AT = "2026-10-20";
export const CREATOR_SHARE = 0.55; // creator share of ad revenue (YouTube keeps ~45%)
/** FX rates are indicative spot levels captured with DATA_UPDATED_AT. */
export const FX_UPDATED_AT = DATA_UPDATED_AT;

// ─── Countries (23) ──────────────────────────────────────────────────────────
export const COUNTRIES: Country[] = [
  { slug: "united-states", name: "United States", code: "US", tier: 1, cpmLow: 6, cpmHigh: 30, currency: "USD", fx: 1, locale: "en-US", note: "The world's largest and most competitive ad market. Finance, insurance and SaaS advertisers drive premium bids year-round, with Q4 rates frequently doubling." },
  { slug: "australia", name: "Australia", code: "AU", tier: 1, cpmLow: 5.5, cpmHigh: 25, currency: "AUD", fx: 1.55, locale: "en-AU", note: "Small but wealthy market with intense competition between banks and fintechs. Lifestyle and finance niches routinely outperform US rates in Q4." },
  { slug: "norway", name: "Norway", code: "NO", tier: 1, cpmLow: 5, cpmHigh: 18, currency: "NOK", fx: 10.8, locale: "nb-NO", note: "High purchasing power and limited inventory make Norway one of the best CPM countries in Europe, especially for energy and finance content." },
  { slug: "switzerland", name: "Switzerland", code: "CH", tier: 1, cpmLow: 4.5, cpmHigh: 20, currency: "CHF", fx: 0.88, locale: "de-CH", note: "Luxury, banking and B2B advertisers pay top rates. Multilingual audiences can fragment demand, but premium niches clear CHF 18 CPM easily." },
  { slug: "united-kingdom", name: "United Kingdom", code: "UK", tier: 1, cpmLow: 5, cpmHigh: 22, currency: "GBP", fx: 0.79, locale: "en-GB", note: "Strong financial and tech advertiser base. London-driven fintech spend keeps RPMs among the highest in the world for business content." },
  { slug: "new-zealand", name: "New Zealand", code: "NZ", tier: 1, cpmLow: 4.5, cpmHigh: 18, currency: "NZD", fx: 1.7, locale: "en-NZ", note: "High income per capita and low content supply in local topics push CPMs up, particularly for lifestyle and finance channels." },
  { slug: "sweden", name: "Sweden", code: "SE", tier: 1, cpmLow: 4, cpmHigh: 16, currency: "SEK", fx: 10.5, locale: "sv-SE", note: "Adoption of digital video ads is near-universal. Tech and productivity niches perform far above the European average." },
  { slug: "denmark", name: "Denmark", code: "DK", tier: 1, cpmLow: 4, cpmHigh: 16, currency: "DKK", fx: 6.9, locale: "da-DK", note: "Affluent, highly digital population. Sustainability and tech content commands strong premiums from Nordic advertisers." },
  { slug: "canada", name: "Canada", code: "CA", tier: 1, cpmLow: 4, cpmHigh: 19, currency: "CAD", fx: 1.4, locale: "en-CA", note: "Tracks the US market closely with slightly softer bids. Finance and real estate niches are the strongest performers." },
  { slug: "netherlands", name: "Netherlands", code: "NL", tier: 1, cpmLow: 3.5, cpmHigh: 15, currency: "EUR", fx: 0.92, locale: "nl-NL", note: "High English proficiency means Dutch audiences often see international premium ads. Tech and B2B content monetize best." },
  { slug: "germany", name: "Germany", code: "DE", tier: 1, cpmLow: 4, cpmHigh: 18, currency: "EUR", fx: 0.92, locale: "de-DE", note: "Europe's biggest economy with the continent's highest RPMs for B2B, engineering and tech review content." },
  { slug: "ireland", name: "Ireland", code: "IE", tier: 2, cpmLow: 3.5, cpmHigh: 15, currency: "EUR", fx: 0.92, locale: "en-IE", note: "European HQ of Google, Meta and Apple means strong tech-ad demand spills into Irish viewer sessions." },
  { slug: "finland", name: "Finland", code: "FI", tier: 2, cpmLow: 3.5, cpmHigh: 14, currency: "EUR", fx: 0.92, locale: "fi-FI", note: "Steady Nordic CPMs with peaks in education and tech niches. Smaller audience but loyal, long watch sessions." },
  { slug: "belgium", name: "Belgium", code: "BE", tier: 2, cpmLow: 3.2, cpmHigh: 13, currency: "EUR", fx: 0.92, locale: "nl-BE", note: "Bilingual market (Dutch/French) splits demand; tech and education content still achieves solid mid-tier CPMs." },
  { slug: "singapore", name: "Singapore", code: "SG", tier: 2, cpmLow: 3, cpmHigh: 12, currency: "SGD", fx: 1.34, locale: "en-SG", note: "Asia's ad-hub. Finance and B2B CPMs rival Western Europe thanks to regional banking and SaaS ad budgets." },
  { slug: "france", name: "France", code: "FR", tier: 2, cpmLow: 3, cpmHigh: 12, currency: "EUR", fx: 0.92, locale: "fr-FR", note: "Luxury, automotive and education advertisers anchor rates. French-language inventory keeps competition domestic." },
  { slug: "japan", name: "Japan", code: "JP", tier: 2, cpmLow: 2.5, cpmHigh: 11, currency: "JPY", fx: 155, locale: "ja-JP", note: "Massive ad economy with conservative digital spend. Tech and gaming content monetize best; watch time is exceptionally high." },
  { slug: "south-korea", name: "South Korea", code: "KR", tier: 2, cpmLow: 2, cpmHigh: 9, currency: "KRW", fx: 1380, locale: "ko-KR", note: "One of the most engaged viewer bases on earth. Gaming and beauty niches exceed these averages significantly." },
  { slug: "brazil", name: "Brazil", code: "BR", tier: 3, cpmLow: 0.8, cpmHigh: 3.5, currency: "BRL", fx: 5.6, locale: "pt-BR", note: "Huge audience with modest advertiser budgets — volume strategy wins. Entertainment and music niches dominate watch time." },
  { slug: "india", name: "India", code: "IN", tier: 3, cpmLow: 0.5, cpmHigh: 2.6, currency: "INR", fx: 86, locale: "en-IN", note: "India's CPM is roughly 5% of US rates, but English-language finance, tech and education content aimed at metro audiences earns 2–4× the national average. Scale + sponsorships is the winning model." },
  { slug: "indonesia", name: "Indonesia", code: "ID", tier: 3, cpmLow: 0.4, cpmHigh: 2, currency: "IDR", fx: 16200, locale: "id-ID", note: "Fast-growing digital ad market. Brand deals and affiliate income usually outweigh AdSense for Indonesian creators." },
  { slug: "pakistan", name: "Pakistan", code: "PK", tier: 4, cpmLow: 0.3, cpmHigh: 1.5, currency: "PKR", fx: 278, locale: "en-PK", note: "Low baseline CPMs; English content targeting overseas Pakistanis (UK/US/UAE diaspora) can multiply effective RPM by 3–5×." },
  { slug: "bangladesh", name: "Bangladesh", code: "BD", tier: 4, cpmLow: 0.2, cpmHigh: 1.2, currency: "BDT", fx: 120, locale: "bn-BD", note: "Lowest-tier ad rates. Watch-time-heavy strategies, memberships and direct sponsorships matter more than raw CPM." },
];

export const US = COUNTRIES[0];

/** US blended CPM (average of the US range) — the anchor for seasonality copy. */
export const US_BLENDED_CPM = (US.cpmLow + US.cpmHigh) / 2;
/** @deprecated alias kept for descriptive imports */
export const SEASON_BASELINE = US_BLENDED_CPM;

// ─── Niches (18) — US-audience baseline CPMs ─────────────────────────────────
export const NICHES: Niche[] = [
  { slug: "finance-investing", name: "Finance & Investing", icon: "landmark", tier: "S", cpmLow: 15, cpmHigh: 50, desc: "The highest-paying YouTube niche. Credit cards, insurance, mortgages and brokerage apps bid aggressively because a single converted viewer is worth hundreds of dollars to advertisers.", tip: "Target specific money keywords (e.g. 'best index funds') rather than broad finance topics — intent-rich queries attract the biggest CPC bids." },
  { slug: "insurance-legal", name: "Insurance & Legal", icon: "scale", tier: "S", cpmLow: 12, cpmHigh: 40, desc: "Law firms and insurance companies run some of the most expensive ad auctions on the platform. Explainer-style content monetizes exceptionally well.", tip: "Long, trust-driven explainers (10+ min) unlock premium mid-roll inventory that legal advertisers compete for." },
  { slug: "business-marketing", name: "Business & Marketing", icon: "briefcase", tier: "S", cpmLow: 12, cpmHigh: 35, desc: "B2B SaaS, agencies and course platforms pay premium CPMs to reach founders and marketers. Case-study formats perform best.", tip: "Name real tools and show real dashboards — advertisers bid up content adjacent to software purchase intent." },
  { slug: "make-money-online", name: "Make Money Online", icon: "trending-up", tier: "A", cpmLow: 10, cpmHigh: 28, desc: "Hustle, side-income and e-commerce content attracts high-intent viewers and heavy competition between fintech and SaaS advertisers.", tip: "Avoid hype language — advertiser-friendly framing ('how freelancing works') unlocks far higher bids than 'get rich quick' angles." },
  { slug: "real-estate", name: "Real Estate", icon: "home", tier: "A", cpmLow: 10, cpmHigh: 30, desc: "Property tours, investing breakdowns and market analysis draw mortgage and brokerage advertisers with enormous budgets.", tip: "Local market titles ('Dubai property explained') concentrate high-value regional advertisers on your videos." },
  { slug: "technology-software", name: "Tech & Software", icon: "cpu", tier: "A", cpmLow: 8, cpmHigh: 22, desc: "Reviews, tutorials and comparisons of gadgets and software. Intent-rich viewers make this the safest high-CPM niche on YouTube.", tip: "Comparison videos ('X vs Y') capture bottom-funnel viewers and consistently out-earn general news content." },
  { slug: "health-fitness", name: "Health & Fitness", icon: "heart-pulse", tier: "A", cpmLow: 6, cpmHigh: 18, desc: "Supplements, apps and wellness brands spend heavily. Medically-reviewed, credible content escapes the 'limited ads' filter.", tip: "Cite sources and avoid miracle claims — it protects full monetization and invites premium wellness brands." },
  { slug: "education-science", name: "Education & Science", icon: "graduation-cap", tier: "A", cpmLow: 5, cpmHigh: 18, desc: "EdTech platforms and publishers pay well for attentive learners. Long watch sessions make RPMs surprisingly durable.", tip: "Evergreen tutorial libraries compound — old videos keep earning at Q4 rates every year." },
  { slug: "automotive", name: "Automotive & EV", icon: "car", tier: "B", cpmLow: 6, cpmHigh: 16, desc: "Car reviews and EV explainers attract manufacturers, insurers and financing brands — a triple stack of high-value advertisers.", tip: "Ownership-cost and insurance-angle videos pull finance-tier CPMs inside a mid-tier niche." },
  { slug: "food-cooking", name: "Food & Cooking", icon: "chef-hat", tier: "B", cpmLow: 4, cpmHigh: 12, desc: "Broad, family-safe appeal with steady CPG advertiser demand. Volumes are huge; per-view rates are mid-range.", tip: "Recipe content with grocery-brand-friendly framing unlocks CPG campaigns above typical rates." },
  { slug: "lifestyle-motivation", name: "Lifestyle & Motivation", icon: "sparkles", tier: "B", cpmLow: 5, cpmHigh: 14, desc: "Productivity, self-improvement and day-in-the-life content. App and audiobook advertisers (Audible, Notion) lift CPMs.", tip: "Productivity-angles outperform pure vlogs because viewers are in 'upgrade myself' purchase mode." },
  { slug: "travel", name: "Travel & Adventure", icon: "plane", tier: "B", cpmLow: 3, cpmHigh: 10, desc: "Seasonal but brand-safe. Airlines, booking platforms and gear brands buy against aspirational audiences.", tip: "Publish 6–8 weeks before holiday seasons when travel ad budgets peak, not during them." },
  { slug: "beauty-fashion", name: "Beauty & Fashion", icon: "palette", tier: "B", cpmLow: 3, cpmHigh: 10, desc: "Massive advertiser demand but equally massive supply. Affiliate and brand-deal income typically beats AdSense 3:1.", tip: "Treat CPM as a bonus — build the business model around affiliate links and sponsorships." },
  { slug: "entertainment-comedy", name: "Entertainment & Comedy", icon: "clapperboard", tier: "C", cpmLow: 3, cpmHigh: 12, desc: "Huge reach, mixed advertiser intent. Reaction and commentary formats earn the least per view but scale hardest.", tip: "Volume plus memberships is the model — ad rates alone rarely sustain pure entertainment channels." },
  { slug: "music", name: "Music & Audio", icon: "music", tier: "C", cpmLow: 2, cpmHigh: 6, desc: "Background-listening behavior produces low ad-view rates, and much inventory is claimed via Content ID.", tip: "Own your masters — Content ID claims can redirect 100% of ad revenue away from uploader channels." },
  { slug: "gaming", name: "Gaming", icon: "gamepad-2", tier: "C", cpmLow: 1.5, cpmHigh: 6, desc: "Young demographics mean low advertiser bids, but watch time is unparalleled. Energy drinks and peripherals dominate ads.", tip: "Tutorial and guide content ('how to beat X') ages well and out-earns raw gameplay per view." },
  { slug: "vlogs", name: "Vlogs & Daily Life", icon: "camera", tier: "C", cpmLow: 2, cpmHigh: 8, desc: "Personality-driven content with broad but shallow advertiser fit. Loyal audiences convert better on memberships.", tip: "Anchor vlogs to searchable events and places to capture intent-driven sessions with better CPMs." },
  { slug: "kids-family", name: "Kids & Family", icon: "baby", tier: "C", cpmLow: 1.5, cpmHigh: 5, desc: "Made-for-kids content is legally restricted from personalized ads (COPPA), capping CPMs regardless of views.", tip: "Family co-viewing content (not 'made for kids') keeps personalized ads — and CPMs — alive." },
];

// ─── Seasonality (index multiplier vs annual baseline) ───────────────────────
export const SEASONS = [
  { q: "Q1", label: "Jan – Mar", mult: 0.85, note: "Post-holiday ad budgets reset. January is the cheapest month for advertisers — expect the year's lowest CPMs." },
  { q: "Q2", label: "Apr – Jun", mult: 0.95, note: "Steady recovery as new fiscal budgets deploy. Finance and education content rebounds first." },
  { q: "Q3", label: "Jul – Sep", mult: 1.0, note: "Baseline quarter. Back-to-school spending lifts education, tech and productivity niches in August–September." },
  { q: "Q4", label: "Oct – Dec", mult: 1.6, note: "Black Friday → Christmas drives the year's biggest auctions. December CPMs routinely run +60–160% above January." },
];

// ─── Calculation engine ───────────────────────────────────────────────────────
export interface EstimateInput {
  views: number;
  niche: Niche;
  country: Country;
  type: ContentType;
  /** Seasonality multiplier (Q1 0.85 … Q4 1.60). Defaults to 1 (full-year average). */
  season?: number;
  /** Share of views that actually serve an ad (0–1). Defaults to 1 (all views). */
  monetizedShare?: number;
}

export interface Estimate {
  cpmLow: number;
  cpmHigh: number;
  rpmLow: number;
  rpmHigh: number;
  monthlyLow: number;
  monthlyHigh: number;
  multiplier: number;
  season: number;
  monetizedShare: number;
}

/** Shorts pay from a pooled revenue share, not classic CPM. */
const SHORTS_RPM_LOW = 0.02;
const SHORTS_RPM_HIGH = 0.08;
/** Country rates below this share of US CPM are treated as one blended tier. */
const SHORTS_COUNTRY_FLOOR = 0.25;
const SHORTS_NICHE_FACTOR: Record<Niche["tier"], number> = { S: 1.25, A: 1.15, B: 1, C: 0.85 };

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

export function countryMultiplier(c: Country): number {
  return (c.cpmLow + c.cpmHigh) / (US.cpmLow + US.cpmHigh);
}

export function estimateEarnings({
  views,
  niche,
  country,
  type,
  season = 1,
  monetizedShare = 1,
}: EstimateInput): Estimate {
  const m = countryMultiplier(country);
  const s = clamp(season, 0.5, 2);
  const adShare = clamp(monetizedShare, 0, 1);
  let rpmLow: number, rpmHigh: number, cpmLow: number, cpmHigh: number;

  if (type === "shorts") {
    // Pooled Shorts revenue: low per-view rates, mildly country/niche sensitive.
    const cf = clamp(m, SHORTS_COUNTRY_FLOOR, 1);
    const nf = SHORTS_NICHE_FACTOR[niche.tier];
    rpmLow = SHORTS_RPM_LOW * cf * nf * s;
    rpmHigh = SHORTS_RPM_HIGH * cf * nf * s;
    cpmLow = 0;
    cpmHigh = 0;
  } else {
    cpmLow = niche.cpmLow * m * s;
    cpmHigh = niche.cpmHigh * m * s;
    // RPM = CPM × creator share × share of views that were monetized.
    rpmLow = cpmLow * CREATOR_SHARE * adShare;
    rpmHigh = cpmHigh * CREATOR_SHARE * adShare;
  }

  return {
    cpmLow, cpmHigh, rpmLow, rpmHigh,
    monthlyLow: (views / 1000) * rpmLow,
    monthlyHigh: (views / 1000) * rpmHigh,
    multiplier: m,
    season: s,
    monetizedShare: adShare,
  };
}

// ─── Formatters ──────────────────────────────────────────────────────────────
export function money(n: number, digits?: number): string {
  const d = digits ?? (n < 10 ? 2 : 0);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function viewsLabel(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1000)}K`;
  return `${v}`;
}

// ─── Currency helpers (local-currency display) ───────────────────────────────
/** Format a USD amount in the country's local currency. */
export function localMoney(usdAmount: number, c: Country, digits?: number): string {
  const v = usdAmount * c.fx;
  const d = digits ?? (v >= 100 ? 0 : v >= 10 ? 1 : 2);
  try {
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.currency,
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(v);
  } catch {
    return `${c.currency} ${v.toFixed(d)}`;
  }
}

/** Currency symbol for a country (₹, £, €, ¥, kr…). */
export function currencySymbol(c: Country): string {
  try {
    const parts = new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.currency,
    }).formatToParts(1);
    return parts.find((p) => p.type === "currency")?.value ?? c.currency;
  } catch {
    return c.currency;
  }
}

/** Short "1 USD ≈ ₹86" line for converter notes. */
export function fxNote(c: Country): string {
  if (c.currency === "USD") return "Values in US Dollars";
  return `Converted at ≈ 1 USD = ${currencySymbol(c)}${c.fx >= 100 ? Math.round(c.fx) : c.fx}`;
}

export const getSeason = (q: string) => SEASONS.find((s) => s.q === q);

// ─── Lookup helpers ──────────────────────────────────────────────────────────
export const getCountry = (slug: string) => COUNTRIES.find((c) => c.slug === slug);
export const getNiche = (slug: string) => NICHES.find((n) => n.slug === slug);

export const COUNTRIES_BY_CPM = [...COUNTRIES].sort(
  (a, b) => (b.cpmLow + b.cpmHigh) / 2 - (a.cpmLow + a.cpmHigh) / 2
);
export const NICHES_BY_CPM = [...NICHES].sort(
  (a, b) => (b.cpmLow + b.cpmHigh) / 2 - (a.cpmLow + a.cpmHigh) / 2
);

export const TIER_LABEL: Record<Country["tier"], string> = {
  1: "Tier 1 — Premium",
  2: "Tier 2 — Strong",
  3: "Tier 3 — Emerging",
  4: "Tier 4 — Volume",
};

export function perMillionViews(rpmLow: number, rpmHigh: number) {
  return { low: rpmLow * 1000, high: rpmHigh * 1000 };
}

// Preset view counts for earnings tables ("How much does YouTube pay for X views")
export const VIEW_PRESETS = [1_000, 10_000, 100_000, 1_000_000];
