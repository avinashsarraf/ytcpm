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
  { slug: "finance-investing", name: "Finance & Investing", icon: "landmark", tier: "S", cpmLow: 15, cpmHigh: 50, desc: "Finance videos cover investing, credit, budgeting and other money decisions. Our model assigns a high CPM scenario, but a category label alone cannot establish advertiser demand or a particular channel's revenue.", tip: "Separate educational reporting from financial advice. Compare the same audience and topic across your own Studio periods rather than switching topics solely for a benchmark." },
  { slug: "insurance-legal", name: "Insurance & Legal", icon: "scale", tier: "S", cpmLow: 12, cpmHigh: 40, desc: "Insurance and legal explainers can address specific purchase or professional-service questions. Geography, topic and ad suitability matter; the displayed rates are directional US-audience model inputs.", tip: "Use appropriately qualified sources for legal or insurance explanations. Professional credibility and accurate context matter more than a promise of a premium ad rate." },
  { slug: "business-marketing", name: "Business & Marketing", icon: "briefcase", tier: "S", cpmLow: 12, cpmHigh: 35, desc: "Business content includes software tutorials, marketing education and company case studies. A software comparison and a general entrepreneurship vlog may serve very different audiences.", tip: "Distinguish sponsorship payments from YouTube ad revenue. Record audience country, video format and date range when comparing business videos." },
  { slug: "make-money-online", name: "Make Money Online", icon: "trending-up", tier: "A", cpmLow: 10, cpmHigh: 28, desc: "Freelancing, side projects and online-business tutorials fall into this broad category. The model is not evidence that income claims or specific business strategies will work.", tip: "Show costs, uncertainty and verifiable outcomes. Do not use unsupported earnings claims to attract clicks or imply that a high CPM guarantees a profitable business." },
  { slug: "real-estate", name: "Real Estate", icon: "home", tier: "A", cpmLow: 10, cpmHigh: 30, desc: "Property tours, local market reporting and real-estate education have different audience intent. A market-specific report should not be compared with a global channel average without context.", tip: "Keep the audience location separate from the property location and creator residence. Report dates and currency are essential for meaningful comparisons." },
  { slug: "technology-software", name: "Tech & Software", icon: "cpu", tier: "A", cpmLow: 8, cpmHigh: 22, desc: "Tech covers gadget reviews, software tutorials, comparisons and news. These formats can reach different audiences, so the same category does not imply the same monetization rate.", tip: "Compare tutorials and news separately. Disclose paid placements and track sponsorship revenue outside an ad-only earnings forecast." },
  { slug: "health-fitness", name: "Health & Fitness", icon: "heart-pulse", tier: "A", cpmLow: 6, cpmHigh: 18, desc: "Health and fitness content requires particular care with evidence and medical claims. A source citation or professional review does not guarantee ad eligibility or a particular CPM.", tip: "Use qualified health sources and avoid miracle claims. Check actual ad-suitability decisions and do not promise that any wording will secure full monetization." },
  { slug: "education-science", name: "Education & Science", icon: "graduation-cap", tier: "A", cpmLow: 5, cpmHigh: 18, desc: "Education ranges from classroom lessons to professional training and science communication. Viewer geography, subject, format and season can all affect comparisons.", tip: "Keep lessons and Shorts in separate reports. An evergreen lesson can remain useful without retaining the same RPM indefinitely." },
  { slug: "automotive", name: "Automotive & EV", icon: "car", tier: "B", cpmLow: 6, cpmHigh: 16, desc: "Automotive content includes vehicle reviews, repairs, ownership costs and EV explanations. The rate shown is a planning scenario, not an observed payout for every car channel.", tip: "Compare repair tutorials with similar tutorials rather than a vehicle launch report. Track referral and sponsorship income separately from YouTube advertising." },
  { slug: "food-cooking", name: "Food & Cooking", icon: "chef-hat", tier: "B", cpmLow: 4, cpmHigh: 12, desc: "Recipes, cooking tutorials and food reviews can differ in viewing patterns and audience. The category-wide model cannot capture every region, format or ad placement.", tip: "Use comparable recipe formats and date ranges when reviewing revenue. Product placement and affiliate commissions are not included in our ad forecast." },
  { slug: "lifestyle-motivation", name: "Lifestyle & Motivation", icon: "sparkles", tier: "B", cpmLow: 5, cpmHigh: 14, desc: "Lifestyle and self-improvement content spans personal stories, routines and practical tutorials. Broad labels can conceal substantial differences between individual videos.", tip: "Use your own comparable videos to evaluate changes. Do not infer that adding a productivity keyword will increase advertiser bids." },
  { slug: "travel", name: "Travel & Adventure", icon: "plane", tier: "B", cpmLow: 3, cpmHigh: 10, desc: "Travel content can mix destination guides, personal vlogs and gear reviews. Audience location, destination and publication timing should be recorded separately.", tip: "Compare similar destinations and formats across matching periods. A holiday-related upload is not a guarantee of higher CPM or more views." },
  { slug: "beauty-fashion", name: "Beauty & Fashion", icon: "palette", tier: "B", cpmLow: 3, cpmHigh: 10, desc: "Beauty and fashion content includes demonstrations, reviews and personal style. Paid partnerships and affiliate revenue are separate from the YouTube ad-only scenarios shown here.", tip: "Disclose commercial relationships. Use measured revenue rather than a fixed sponsorship-to-ad-income ratio when planning a channel business." },
  { slug: "entertainment-comedy", name: "Entertainment & Comedy", icon: "clapperboard", tier: "C", cpmLow: 3, cpmHigh: 12, desc: "Comedy, commentary and entertainment cover many audience and format combinations. Reach alone does not establish a channel's CPM or revenue efficiency.", tip: "Track ad revenue, memberships and other income separately. Check format and audience changes before attributing earnings movement to a niche benchmark." },
  { slug: "music", name: "Music & Audio", icon: "music", tier: "C", cpmLow: 2, cpmHigh: 6, desc: "Music monetization can depend on rights ownership, licensing and claims as well as views and advertising. This model does not resolve rights or predict the allocation of claimed revenue.", tip: "Check rights and claim status in your own reports. Do not assume all revenue belongs to the uploader or that a claim always redirects a fixed percentage." },
  { slug: "gaming", name: "Gaming", icon: "gamepad-2", tier: "C", cpmLow: 1.5, cpmHigh: 6, desc: "Gaming includes tutorials, reviews, livestreams and recorded gameplay. Game, audience, format and suitability can affect revenue; none of these formats has a guaranteed CPM.", tip: "Separate live, Shorts and long-form reports. Use matching periods when comparing a guide with gameplay, and avoid assuming a format always earns more." },
  { slug: "vlogs", name: "Vlogs & Daily Life", icon: "camera", tier: "C", cpmLow: 2, cpmHigh: 8, desc: "Vlogs are personal and audience-specific. A broad category rate is not a substitute for the channel's actual advertiser and creator-revenue reports.", tip: "Record audience mix and format changes alongside CPM. Sponsorships and memberships can matter to the business but should not be presented as ad revenue." },
  { slug: "kids-family", name: "Kids & Family", icon: "baby", tier: "C", cpmLow: 1.5, cpmHigh: 5, desc: "Kids and family content requires an accurate audience designation and compliance with YouTube's policies. Advertising restrictions and viewing context can affect monetization; our model is not legal advice.", tip: "Set the audience accurately. Never misclassify made-for-kids content to seek personalized ads or a higher CPM. Use current YouTube guidance for audience and monetization decisions." },
];

// ─── Seasonality (index multiplier vs annual baseline) ───────────────────────
export const SEASONS = [
  { q: "Q1", label: "Jan – Mar", mult: 0.85, note: "Lower-rate planning scenario. Use it to test a lower-rate quarter; it is not a measured forecast for your channel." },
  { q: "Q2", label: "Apr – Jun", mult: 0.95, note: "Below-baseline planning scenario. Compare with your own historical periods rather than assuming a universal recovery." },
  { q: "Q3", label: "Jul – Sep", mult: 1.0, note: "Baseline planning scenario. Viewer mix and video format can outweigh calendar effects." },
  { q: "Q4", label: "Oct – Dec", mult: 1.6, note: "Higher-rate planning scenario. This higher-rate case does not guarantee a seasonal uplift or payout." },
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
/**
 * A USD range as it is written on the page: "$0.20–$1.20".
 *
 * Whole dollars drop the cents, but fractional amounts keep two decimals, so a
 * table never shows "$0.2" next to a title that says "$0.20". One function for
 * every range on the site keeps titles, headings, FAQ text and JSON-LD in step.
 */
export function usdRange(low: number, high: number): string {
  const fmt = (value: number) => (Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`);
  return `${fmt(low)}–${fmt(high)}`;
}

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
