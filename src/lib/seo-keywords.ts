import { usdRange } from "@/lib/data";

/**
 * Focus-keyword registry.
 *
 * One page owns one intent. This file records the focus keyword and the
 * supporting keyword set for every indexable route so the copy, the metadata
 * and the audit tests all read from a single source of truth.
 *
 * Rules that keep this honest:
 * - A focus keyword belongs to exactly one page. Synonyms of the same task
 *   are covered by that page's sections, not by a new URL.
 * - No invented search volumes and no keyword stuffing. A keyword set here
 *   is a list of real query phrasings a creator might type.
 * - Benchmark routes are generated from the country and niche data, so their
 *   keywords always match the on-page name.
 */

import { COUNTRIES, DATA_YEAR, NICHES } from "./data";
import { CREATOR_TOOLS } from "./creator-tools";
import { GUIDES } from "./editorial";
import { LEGAL_POLICIES } from "./legal";

export type PageSeo = { focus: string; keywords: string[]; shortDescription: string };

export const STATIC_PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    focus: "youtube earnings calculator",
    keywords: [
      "youtube earnings calculator", "youtube money calculator", "how much does youtube pay",
      "youtube revenue estimator", "youtube views to money", "youtube cpm and rpm calculator",
      "free youtube earnings calculator",
    ],
    shortDescription: `Estimate YouTube earnings from views, CPM, RPM, audience country and niche with a ${DATA_YEAR} model.`,
  },
  "/tools": {
    focus: "free youtube creator tools",
    keywords: [
      "free youtube creator tools", "youtube calculator tools", "youtube tools for creators",
      "creator toolkit youtube", "youtube earnings and planning tools", "best free youtube tools",
    ],
    shortDescription: "Seven focused YouTube calculators for earnings, sponsorships, engagement and watch time.",
  },
  "/channel-auditor": {
    focus: "youtube channel auditor",
    keywords: [
      "youtube channel auditor", "youtube channel audit tool", "audit youtube channel",
      "youtube channel analyzer", "free youtube channel audit", "youtube channel analysis",
      "youtube keyword analysis tool", "youtube tag analyzer", "best performing videos finder",
      "youtube channel stats checker", "youtube competitor analysis", "youtube channel revenue estimate",
    ],
    shortDescription: "Audit any public YouTube channel: videos, playlists, tags, keywords, top performers and modeled revenue scenarios.",
  },
  "/cpm-by-country": {
    focus: "youtube cpm by country",
    keywords: [
      "youtube cpm by country", "youtube cpm india", "youtube cpm usa", "youtube cpm uk",
      "youtube rpm by country", "youtube cpm by audience country", "country cpm benchmark",
    ],
    shortDescription: `Compare modeled YouTube CPM and RPM scenarios for ${COUNTRIES.length} audience countries in ${DATA_YEAR}.`,
  },
  "/cpm-by-niche": {
    focus: "youtube cpm by niche",
    keywords: [
      "youtube cpm by niche", "youtube cpm gaming", "youtube cpm finance",
      "youtube rpm by niche", "niche cpm benchmark", "youtube cpm for tech channel",
    ],
    shortDescription: `Compare modeled YouTube CPM and RPM scenarios for ${NICHES.length} content niches in ${DATA_YEAR}.`,
  },
  "/methodology": {
    focus: "youtube cpm methodology",
    keywords: [
      "youtube cpm methodology", "how youtube cpm is calculated", "youtube rpm calculation formula",
      "cpm benchmark methodology", "youtube earnings model assumptions", "how we calculate youtube earnings",
    ],
    shortDescription: `How the ${DATA_YEAR} CPM, RPM and earnings model is built: sources, formulas, seasonality and FX handling.`,
  },
  "/sources": {
    focus: "youtube cpm sources",
    keywords: [
      "youtube cpm sources", "youtube analytics api documentation", "youtube revenue metrics definition",
      "editorial policy youtube earnings", "cpm benchmark limitations", "youtube data api reference",
    ],
    shortDescription: "Official YouTube and Google sources behind the metric definitions, plus how model assumptions differ from measured data.",
  },
  "/guides": {
    focus: "youtube cpm and rpm guides",
    keywords: [
      "youtube cpm guides", "youtube rpm guides", "how to check youtube cpm",
      "youtube cpm vs rpm", "youtube earnings guides", "youtube monetization guides",
    ],
    shortDescription: "Practical guides to checking your own CPM, comparing metrics and avoiding misleading earnings estimates.",
  },
  "/about": {
    focus: "about ytcpm.online",
    keywords: [
      "about ytcpm online", "free youtube cpm calculator", "youtube earnings model website",
      "independent youtube calculator", "youtube benchmark library", "ytcpm online review",
    ],
    shortDescription: "Why ytcpm.online exists, what its model covers and how it stays free and independent.",
  },
  "/contact": {
    focus: "contact ytcpm.online",
    keywords: [
      "contact ytcpm online", "youtube cpm data correction", "youtube calculator feedback",
      "youtube cpm benchmark request", "report wrong cpm data",
    ],
    shortDescription: "Send a data correction, product feedback or a privacy request to the ytcpm.online team.",
  },
  "/legal": {
    focus: "youtube tools legal center",
    keywords: [
      "youtube calculator privacy policy", "youtube tools terms of use",
      "youtube earnings disclaimer", "youtube calculator cookie policy",
      "legal center youtube cpm tools",
    ],
    shortDescription: "Privacy, terms, cookies and earnings disclaimers for the ytcpm.online calculators and channel auditor.",
  },
  "/youtube-cpm-calculator": {
    focus: "youtube cpm calculator",
    keywords: [
      "youtube cpm calculator", "calculate youtube cpm", "youtube ad revenue calculator",
      "cpm from ad revenue and impressions", "playback based cpm vs impression cpm",
    ],
    shortDescription: "Calculate YouTube CPM from gross ad revenue and ad impressions, with the formula and a worked example.",
  },
  "/youtube-rpm-calculator": {
    focus: "youtube rpm calculator",
    keywords: [
      "youtube rpm calculator", "calculate youtube rpm", "revenue per 1000 views calculator",
      "youtube rpm from revenue and views", "shorts rpm vs long form rpm",
    ],
    shortDescription: "Calculate YouTube RPM from creator revenue and matching views, with long-form and Shorts denominators.",
  },
};

/** Per-policy SEO, keyed by legal route. */
export const LEGAL_PAGE_SEO: Record<string, PageSeo> = {
  "/privacy": {
    focus: "youtube calculator privacy policy",
    keywords: ["youtube calculator privacy policy", "youtube earnings data privacy", "cpm calculator data collection", "youtube api privacy", "google adsense privacy youtube tools"],
    shortDescription: "What the calculators and the channel auditor store, what stays in the browser and how to make a privacy request.",
  },
  "/terms": {
    focus: "youtube tools terms of use",
    keywords: ["youtube calculator terms of use", "youtube cpm tool terms", "api usage terms youtube", "cpm calculator acceptable use", "youtube earnings tool conditions"],
    shortDescription: "The terms that apply to the ytcpm.online calculators, guides, channel auditor and public API.",
  },
  "/disclaimer": {
    focus: "youtube earnings disclaimer",
    keywords: ["youtube earnings disclaimer", "youtube cpm estimates disclaimer", "cpm calculator limitations", "youtube revenue estimate warning", "cpm not guaranteed earnings"],
    shortDescription: "Why YouTube CPM, RPM and earnings figures on this site are modeled scenarios, not guaranteed payouts.",
  },
  "/cookies": {
    focus: "youtube calculator cookie policy",
    keywords: ["youtube calculator cookie policy", "cpm tool cookies", "youtube earnings site cookies", "local storage vs cookies", "no tracking youtube calculator"],
    shortDescription: "Which cookies, local storage and server-side records this calculator site uses, and which it deliberately avoids.",
  },
};

/**
 * The SERP title and description for a country page.
 *
 * Search Console showed the old titles — "YouTube CPM in Bangladesh — 2026
 * Model" — ranking at an average position of 7 on 193 impressions and earning
 * zero clicks. A searcher who types "bangladesh cpm" wants a number; the word
 * "Model" told them twice that this page only had an estimate, and they went
 * somewhere that looked like data.
 *
 * So the number leads, the year follows and the word "Model" is gone from the
 * title. The page is still an honest model — that is what the body and the
 * methodology page are for — but the title stops apologising before anyone has
 * read it.
 *
 * The final <title> carries a 15-character suffix (" | ytcpm.online"), and the
 * audit budget is 60, so the page title has 45 characters to work with. The
 * candidates are tried longest first and the first one that fits wins, which
 * keeps a long name like "United Kingdom" inside the budget.
 */

export const SERP_TITLE_BUDGET = 45;

export function countrySerpTitle(
  country: { name: string; cpmLow: number; cpmHigh: number },
  year: string | number,
  budget: number = SERP_TITLE_BUDGET,
): string {
  const range = usdRange(country.cpmLow, country.cpmHigh);
  const candidates = [
    `YouTube CPM in ${country.name} (${year}): ${range}`,
    `YouTube CPM in ${country.name}: ${range}`,
    `${country.name} YouTube CPM ${year}: ${range}`,
    `${country.name} YouTube CPM: ${range}`,
    `${country.name} CPM ${year}: ${range}`,
  ];
  return candidates.find((value) => value.length <= budget) ?? candidates[candidates.length - 1];
}

export function nicheSerpTitle(
  niche: { name: string; cpmLow: number; cpmHigh: number },
  year: string | number,
  budget: number = SERP_TITLE_BUDGET,
): string {
  const range = usdRange(niche.cpmLow, niche.cpmHigh);
  const candidates = [
    `${niche.name} YouTube CPM (${year}): ${range}`,
    `${niche.name} YouTube CPM: ${range}`,
    `${niche.name} CPM ${year}: ${range}`,
  ];
  return candidates.find((value) => value.length <= budget) ?? candidates[candidates.length - 1];
}

export function countrySerpDescription(
  country: { name: string; cpmLow: number; cpmHigh: number },
  localRange: string | null,
  year: string | number,
  budget = 160,
): string {
  const range = usdRange(country.cpmLow, country.cpmHigh);
  const local = localRange ? ` (≈ ${localRange})` : "";
  const candidates = [
    `YouTube CPM in ${country.name} is ${range} per 1,000 ad views in ${year}${local}. Compare creator RPM and per-1M-view earnings.`,
    `YouTube CPM in ${country.name}: ${range} per 1,000 ad views in ${year}${local}. Compare creator RPM and 1M-view earnings.`,
    `YouTube CPM in ${country.name}: ${range} per 1,000 ad views${local}. Compare creator RPM and 1M-view earnings.`,
    `YouTube CPM in ${country.name} is ${range} per 1,000 ad views. Compare creator RPM and earnings.`,
  ];
  return candidates.find((value) => value.length <= budget) ?? candidates[candidates.length - 1];
}

export function countrySeo(country: { name: string; slug: string; code: string }): PageSeo {
  return {
    focus: `youtube cpm in ${country.name}`,
    keywords: [
      `youtube cpm in ${country.name}`, `youtube rpm in ${country.name}`, `${country.name} youtube cpm`,
      `youtube earnings in ${country.name}`, `youtube cpm ${country.name.toLowerCase()}`,
      `youtube ad rates ${country.name.toLowerCase()}`,
    ],
    shortDescription: `Modeled YouTube CPM and RPM for a ${country.name} audience in ${DATA_YEAR}, with local-currency scenarios.`,
  };
}

export function nicheSeo(niche: { name: string; slug: string }): PageSeo {
  return {
    focus: `youtube cpm for ${niche.name.toLowerCase()}`,
    keywords: [
      `youtube cpm for ${niche.name.toLowerCase()}`, `${niche.name.toLowerCase()} youtube cpm`,
      `youtube rpm ${niche.name.toLowerCase()}`, `${niche.name.toLowerCase()} channel earnings`,
      `youtube ad rates ${niche.name.toLowerCase()}`,
    ],
    shortDescription: `Modeled YouTube CPM and RPM for ${niche.name.toLowerCase()} channels in ${DATA_YEAR}.`,
  };
}

export function toolSeo(tool: { slug: string; title: string; keyword: string; description: string }): PageSeo {
  const base = tool.keyword.toLowerCase();
  return {
    focus: base,
    keywords: [
      base,
      `${base} free`,
      `how to use ${base}`,
      `${base} explained`,
      `${base} formula`,
    ],
    shortDescription: tool.description,
  };
}

export function guideSeo(guide: { slug: string; title: string; description: string }): PageSeo {
  const focus = guide.title.toLowerCase();
  return {
    focus,
    keywords: [
      focus,
      `${focus} guide`,
      `${focus} explained`,
      `${focus} step by step`,
      `${focus} youtube`,
    ],
    shortDescription: guide.description,
  };
}

/** Every indexable route with its focus keyword, for the audit and tests. */
export function allPageSeo(): { path: string; seo: PageSeo }[] {
  const entries: { path: string; seo: PageSeo }[] = Object.entries(STATIC_PAGE_SEO).map(([path, seo]) => ({ path, seo }));
  for (const [path, seo] of Object.entries(LEGAL_PAGE_SEO)) entries.push({ path, seo });
  for (const tool of CREATOR_TOOLS) entries.push({ path: `/${tool.slug}`, seo: toolSeo(tool) });
  for (const guide of GUIDES) entries.push({ path: `/guides/${guide.slug}`, seo: guideSeo(guide) });
  for (const country of COUNTRIES) entries.push({ path: `/cpm-by-country/${country.slug}`, seo: countrySeo(country) });
  for (const niche of NICHES) entries.push({ path: `/cpm-by-niche/${niche.slug}`, seo: nicheSeo(niche) });
  return entries;
}
