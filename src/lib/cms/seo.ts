import { renderMarkdown, markdownExcerpt, type MarkdownResult } from "./markdown";

/**
 * On-page SEO analysis for CMS blog posts.
 *
 * The editor shows this live so an author can see exactly what is missing
 * before publishing, and the publish action refuses to mark a post "ready"
 * while a blocking check fails. Every check is derived from the rendered
 * article, never from a guess.
 */

export type SeoStatus = "pass" | "warn" | "fail";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoStatus;
  detail: string;
  /** Blocking checks stop a post from being marked SEO-ready. */
  blocking: boolean;
};

export type SeoReport = {
  score: number;
  checks: SeoCheck[];
  blocking: SeoCheck[];
  focusKeyword: string | null;
  wordCount: number;
  readingMinutes: number;
  keywordDensity: number;
  headings: { level: number; text: string; id: string }[];
  internalLinks: number;
  externalLinks: number;
  internalLinkList: string[];
  externalLinkList: string[];
  images: number;
  imagesWithoutAlt: number;
  titleLength: number;
  descriptionLength: number;
  slugLength: number;
  /** 0-100. */
  scoreBand: "poor" | "needs-work" | "good" | "excellent";
};

export type SeoInput = {
  title: string;
  slug: string;
  excerpt: string;
  contentMd: string;
  focusKeyword?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  ogImageUrl?: string | null;
  ogImageAlt?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;
};

export const SEO_BUDGETS = {
  titleMin: 30,
  titleMax: 60,
  descriptionMin: 90,
  descriptionMax: 160,
  slugMax: 60,
  minWords: 600,
  goodWords: 1200,
  maxKeywordDensity: 2.5,
} as const;

const TITLE_SUFFIX = " | ytcpm.online";

/** The <title> a post will actually publish with. */
export function effectiveTitle(input: Pick<SeoInput, "title" | "seoTitle">): string {
  const base = (input.seoTitle ?? input.title).trim();
  return `${base}${TITLE_SUFFIX}`;
}

/** The meta description a post will actually publish with. */
export function effectiveDescription(input: Pick<SeoInput, "excerpt" | "seoDescription" | "contentMd">): string {
  const explicit = input.seoDescription?.trim();
  if (explicit) return explicit;
  const excerpt = input.excerpt.trim();
  if (excerpt) return excerpt;
  return markdownExcerpt(input.contentMd, SEO_BUDGETS.descriptionMax);
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

/**
 * Runs the full analysis. Pure and synchronous so it can run in the editor
 * (client-side preview) and on the server without duplicating logic.
 */
export function analyzePost(input: SeoInput): SeoReport {
  const rendered: MarkdownResult = renderMarkdown(input.contentMd);
  const checks: SeoCheck[] = [];

  const focus = (input.focusKeyword ?? "").trim();
  const focusNorm = normalise(focus);
  const title = effectiveTitle(input);
  const description = effectiveDescription(input);
  const titleNorm = normalise(title);
  const descriptionNorm = normalise(description);
  const slugNorm = normalise(input.slug.replace(/-/g, " "));

  const plainText = rendered.html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const firstParagraph = rendered.html.match(/<p>([\s\S]*?)<\/p>/)?.[1]?.replace(/<[^>]+>/g, " ") ?? "";
  const firstWords = normalise(plainText).split(" ").slice(0, 120).join(" ");

  /* ── title ─────────────────────────────────────────────────────────── */
  if (!input.title.trim()) {
    checks.push({ id: "title", label: "Title", status: "fail", detail: "A title is required.", blocking: true });
  } else if (title.length < SEO_BUDGETS.titleMin) {
    checks.push({ id: "title", label: "Title length", status: "warn", detail: `${title.length} characters — aim for ${SEO_BUDGETS.titleMin}–${SEO_BUDGETS.titleMax}.`, blocking: false });
  } else if (title.length > SEO_BUDGETS.titleMax) {
    checks.push({ id: "title", label: "Title length", status: "warn", detail: `${title.length} characters — search results truncate around ${SEO_BUDGETS.titleMax}.`, blocking: false });
  } else {
    checks.push({ id: "title", label: "Title length", status: "pass", detail: `${title.length} characters, inside the ${SEO_BUDGETS.titleMin}–${SEO_BUDGETS.titleMax} range.`, blocking: false });
  }

  /* ── description ───────────────────────────────────────────────────── */
  if (description.length < SEO_BUDGETS.descriptionMin) {
    checks.push({ id: "description", label: "Meta description", status: "warn", detail: `${description.length} characters — aim for ${SEO_BUDGETS.descriptionMin}–${SEO_BUDGETS.descriptionMax}.`, blocking: false });
  } else if (description.length > SEO_BUDGETS.descriptionMax) {
    checks.push({ id: "description", label: "Meta description", status: "warn", detail: `${description.length} characters — it will be truncated.`, blocking: false });
  } else {
    checks.push({ id: "description", label: "Meta description", status: "pass", detail: `${description.length} characters, inside the ${SEO_BUDGETS.descriptionMin}–${SEO_BUDGETS.descriptionMax} range.`, blocking: false });
  }

  /* ── slug ──────────────────────────────────────────────────────────── */
  if (!input.slug.trim()) {
    checks.push({ id: "slug", label: "URL slug", status: "fail", detail: "A slug is required.", blocking: true });
  } else if (input.slug.length > SEO_BUDGETS.slugMax) {
    checks.push({ id: "slug", label: "URL slug", status: "warn", detail: `${input.slug.length} characters — keep it under ${SEO_BUDGETS.slugMax}.`, blocking: false });
  } else {
    checks.push({ id: "slug", label: "URL slug", status: "pass", detail: `/${input.slug} — short, lowercase and readable.`, blocking: false });
  }

  /* ── focus keyword ─────────────────────────────────────────────────── */
  if (!focus) {
    checks.push({ id: "keyword", label: "Focus keyword", status: "fail", detail: "Choose the one query this post should rank for.", blocking: true });
  } else {
    const inTitle = titleNorm.includes(focusNorm);
    const inDescription = descriptionNorm.includes(focusNorm);
    const inSlug = slugNorm.includes(focusNorm);
    const inOpening = normalise(firstParagraph).includes(focusNorm);
    const inHeading = rendered.headings.some((h) => normalise(h.text).includes(focusNorm));

    const missing: string[] = [];
    if (!inTitle) missing.push("title");
    if (!inDescription) missing.push("meta description");
    if (!inSlug) missing.push("URL slug");
    if (!inOpening) missing.push("opening paragraph");
    if (!inHeading) missing.push("a sub-heading");

    if (missing.length === 0) {
      checks.push({ id: "keyword", label: "Focus keyword", status: "pass", detail: `"${focus}" appears in the title, description, slug, opening paragraph and a sub-heading.`, blocking: false });
    } else {
      checks.push({
        id: "keyword",
        label: "Focus keyword",
        status: missing.length > 2 ? "fail" : "warn",
        detail: `Add "${focus}" to the ${missing.join(", ")}.`,
        blocking: false,
      });
    }

    const occurrences = countOccurrences(normalise(plainText), focusNorm);
    const density = rendered.wordCount > 0 ? (occurrences / rendered.wordCount) * 100 : 0;
    if (density > SEO_BUDGETS.maxKeywordDensity) {
      checks.push({ id: "density", label: "Keyword density", status: "warn", detail: `${density.toFixed(1)}% — above ${SEO_BUDGETS.maxKeywordDensity}%. Rewrite some sentences.`, blocking: false });
    } else if (occurrences === 0) {
      checks.push({ id: "density", label: "Keyword density", status: "warn", detail: "The focus keyword does not appear in the body text.", blocking: false });
    } else {
      checks.push({ id: "density", label: "Keyword density", status: "pass", detail: `${occurrences} uses (${density.toFixed(1)}%) — a natural density.`, blocking: false });
    }

    const inOpeningWords = firstWords.includes(focusNorm);
    if (!inOpeningWords) {
      checks.push({ id: "keyword-opening", label: "Keyword in first 120 words", status: "warn", detail: "Mention the focus keyword early so the topic is unambiguous.", blocking: false });
    } else {
      checks.push({ id: "keyword-opening", label: "Keyword in first 120 words", status: "pass", detail: "The focus keyword appears in the opening.", blocking: false });
    }
  }

  /* ── content length ────────────────────────────────────────────────── */
  if (rendered.wordCount < 300) {
    checks.push({ id: "length", label: "Content length", status: "fail", detail: `${rendered.wordCount} words — too thin to rank. Aim for at least ${SEO_BUDGETS.minWords}.`, blocking: true });
  } else if (rendered.wordCount < SEO_BUDGETS.minWords) {
    checks.push({ id: "length", label: "Content length", status: "warn", detail: `${rendered.wordCount} words — aim for at least ${SEO_BUDGETS.minWords}.`, blocking: false });
  } else if (rendered.wordCount < SEO_BUDGETS.goodWords) {
    checks.push({ id: "length", label: "Content length", status: "pass", detail: `${rendered.wordCount} words — a solid article. ${SEO_BUDGETS.goodWords}+ would cover the topic more completely.`, blocking: false });
  } else {
    checks.push({ id: "length", label: "Content length", status: "pass", detail: `${rendered.wordCount} words — comprehensive coverage.`, blocking: false });
  }

  /* ── headings ──────────────────────────────────────────────────────── */
  const h2 = rendered.headings.filter((h) => h.level === 2).length;
  const h3 = rendered.headings.filter((h) => h.level === 3).length;
  if (rendered.headings.length === 0) {
    checks.push({ id: "headings", label: "Sub-headings", status: "fail", detail: "Break the article into sections with ## and ### headings.", blocking: true });
  } else if (h2 < 2) {
    checks.push({ id: "headings", label: "Sub-headings", status: "warn", detail: `Only ${h2} H2 sections — long pages read better with three or more.`, blocking: false });
  } else {
    checks.push({ id: "headings", label: "Sub-headings", status: "pass", detail: `${h2} H2 sections and ${h3} H3 sub-sections.`, blocking: false });
  }

  let skipped = 0;
  for (let i = 1; i < rendered.headings.length; i += 1) {
    if (rendered.headings[i].level - rendered.headings[i - 1].level > 1) skipped += 1;
  }
  if (skipped > 0) {
    checks.push({ id: "heading-order", label: "Heading order", status: "warn", detail: `${skipped} heading level(s) skipped — go H2 → H3, never H2 → H4.`, blocking: false });
  } else {
    checks.push({ id: "heading-order", label: "Heading order", status: "pass", detail: "The heading levels are in order.", blocking: false });
  }

  /* ── images ────────────────────────────────────────────────────────── */
  const images = rendered.images;
  const withoutAlt = images.filter((image) => !image.alt.trim()).length;
  if (images.length === 0) {
    checks.push({ id: "images", label: "Images", status: "warn", detail: "Add at least one image — image search is a real traffic source.", blocking: false });
  } else if (withoutAlt > 0) {
    checks.push({ id: "images", label: "Image alt text", status: "fail", detail: `${withoutAlt} of ${images.length} images have no alt text.`, blocking: true });
  } else {
    checks.push({ id: "images", label: "Images", status: "pass", detail: `${images.length} image(s), all with alt text.`, blocking: false });
  }

  /* ── social image ──────────────────────────────────────────────────── */
  if (!input.ogImageUrl) {
    checks.push({ id: "og-image", label: "Social image", status: "warn", detail: "Set a social image so the post shares with a card instead of a bare link.", blocking: false });
  } else if (!input.ogImageAlt?.trim()) {
    checks.push({ id: "og-image", label: "Social image alt text", status: "warn", detail: "Describe the social image for screen readers and image crawlers.", blocking: false });
  } else {
    checks.push({ id: "og-image", label: "Social image", status: "pass", detail: "A social image and its alt text are set.", blocking: false });
  }

  /* ── links ─────────────────────────────────────────────────────────── */
  const internalLinks = rendered.internalLinks.length;
  const externalLinks = rendered.externalLinks.length;
  if (internalLinks === 0) {
    checks.push({ id: "internal-links", label: "Internal links", status: "fail", detail: "Link to at least one other page on this site.", blocking: true });
  } else if (internalLinks < 2) {
    checks.push({ id: "internal-links", label: "Internal links", status: "warn", detail: `${internalLinks} internal link — two or more is better.`, blocking: false });
  } else {
    checks.push({ id: "internal-links", label: "Internal links", status: "pass", detail: `${internalLinks} internal link(s) to other pages on this site.`, blocking: false });
  }
  if (externalLinks === 0) {
    checks.push({ id: "external-links", label: "Source links", status: "warn", detail: "Cite at least one authoritative source (for example YouTube or Google documentation).", blocking: false });
  } else {
    checks.push({ id: "external-links", label: "Source links", status: "pass", detail: `${externalLinks} external source link(s).`, blocking: false });
  }

  /* ── canonical & index ─────────────────────────────────────────────── */
  if (input.canonicalUrl && !/^https?:\/\//i.test(input.canonicalUrl)) {
    checks.push({ id: "canonical", label: "Canonical URL", status: "fail", detail: "The canonical URL must be an absolute https:// URL.", blocking: true });
  } else if (input.canonicalUrl && !/ytcpm\.online/i.test(input.canonicalUrl)) {
    checks.push({ id: "canonical", label: "Canonical URL", status: "warn", detail: "The canonical URL points at another domain — the page will not rank for this site.", blocking: false });
  } else {
    checks.push({ id: "canonical", label: "Canonical URL", status: "pass", detail: "This page owns its canonical URL.", blocking: false });
  }

  if (input.noindex) {
    checks.push({ id: "index", label: "Indexing", status: "warn", detail: "noindex is on — search engines are told not to index this page.", blocking: false });
  } else {
    checks.push({ id: "index", label: "Indexing", status: "pass", detail: "The page is indexable.", blocking: false });
  }

  /* ── keywords meta ─────────────────────────────────────────────────── */
  const keywordCount = input.seoKeywords?.length ?? 0;
  if (keywordCount === 0) {
    checks.push({ id: "keywords", label: "Keyword list", status: "warn", detail: "Add the keyword variants this post should also match.", blocking: false });
  } else if (keywordCount < 3) {
    checks.push({ id: "keywords", label: "Keyword list", status: "warn", detail: `${keywordCount} keyword(s) — three or more is better.`, blocking: false });
  } else {
    checks.push({ id: "keywords", label: "Keyword list", status: "pass", detail: `${keywordCount} keyword variants.`, blocking: false });
  }

  /* ── score ─────────────────────────────────────────────────────────── */
  const weights: Record<SeoStatus, number> = { pass: 1, warn: 0.5, fail: 0 };
  const total = checks.reduce((sum, check) => sum + weights[check.status], 0);
  const score = Math.round((total / Math.max(1, checks.length)) * 100);
  const scoreBand: SeoReport["scoreBand"] = score >= 90 ? "excellent" : score >= 70 ? "good" : score >= 45 ? "needs-work" : "poor";

  const density = focus && rendered.wordCount > 0 ? (countOccurrences(normalise(plainText), focusNorm) / rendered.wordCount) * 100 : 0;

  return {
    score,
    checks,
    blocking: checks.filter((check) => check.blocking && check.status === "fail"),
    focusKeyword: focus || null,
    wordCount: rendered.wordCount,
    readingMinutes: rendered.readingMinutes,
    keywordDensity: Number(density.toFixed(2)),
    headings: rendered.headings,
    internalLinks: rendered.internalLinks.length,
    externalLinks: rendered.externalLinks.length,
    internalLinkList: rendered.internalLinks,
    externalLinkList: rendered.externalLinks,
    images: rendered.images.length,
    imagesWithoutAlt: withoutAlt,
    titleLength: title.length,
    descriptionLength: description.length,
    slugLength: input.slug.length,
    scoreBand,
  };
}

/** Short human summary used in the editor header and the activity log. */
export function describeSeoReport(report: SeoReport): string {
  const fails = report.checks.filter((check) => check.status === "fail").length;
  const warns = report.checks.filter((check) => check.status === "warn").length;
  if (fails === 0 && warns === 0) return `SEO ${report.score}/100 — everything checks out.`;
  if (fails === 0) return `SEO ${report.score}/100 — ${warns} suggestion${warns === 1 ? "" : "s"} left.`;
  return `SEO ${report.score}/100 — ${fails} issue${fails === 1 ? "" : "s"} and ${warns} suggestion${warns === 1 ? "" : "s"}.`;
}
