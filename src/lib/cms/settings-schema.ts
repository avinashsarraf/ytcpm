/**
 * The settings schema.
 *
 * This module deliberately has no database import, so a client component can
 * render the settings form without pulling the database driver into the
 * browser bundle.
 */

export type CmsSettingKey =
  | "blog.title"
  | "blog.description"
  | "blog.postsPerPage"
  | "blog.defaultOgImage"
  | "blog.commentsEnabled"
  | "blog.authorName"
  | "blog.authorBio"
  | "seo.titleSuffix"
  | "seo.defaultKeywords"
  | "revalidate.webhookSecret"
  | "security.sessionIdleMinutes";

export const SETTING_DEFAULTS: Record<CmsSettingKey, string> = {
  "blog.title": "YouTube CPM & RPM Blog",
  "blog.description":
    "Practical guides on YouTube CPM, RPM, earnings modelling and channel growth — with worked examples and stated sources.",
  "blog.postsPerPage": "9",
  "blog.defaultOgImage": "/opengraph-image",
  "blog.commentsEnabled": "true",
  "blog.authorName": "YTCPM Editorial",
  "blog.authorBio":
    "We publish practical, source-linked explanations of YouTube earnings metrics. Every figure on this site is a labelled model scenario, not a promise of payment.",
  "seo.titleSuffix": " | ytcpm.online",
  "seo.defaultKeywords": "youtube cpm, youtube rpm, youtube earnings, youtube monetization",
  "revalidate.webhookSecret": "",
  "security.sessionIdleMinutes": "10080",
};

export const SETTING_LABELS: Record<CmsSettingKey, { label: string; help: string; type: "text" | "textarea" | "number" | "boolean" | "secret" }> = {
  "blog.title": { label: "Blog title", help: "Shown on the blog index and used as the default archive name.", type: "text" },
  "blog.description": { label: "Blog description", help: "The default meta description for the blog index.", type: "textarea" },
  "blog.postsPerPage": { label: "Posts per page", help: "How many posts appear on one page of the blog index.", type: "number" },
  "blog.defaultOgImage": { label: "Default social image", help: "Used when a post has no social image of its own.", type: "text" },
  "blog.commentsEnabled": { label: "Comments enabled", help: "Turn off to hide the comment form and the comment list.", type: "boolean" },
  "blog.authorName": { label: "Author name", help: "Shown in the author box at the end of every post.", type: "text" },
  "blog.authorBio": { label: "Author bio", help: "One or two sentences about who writes the blog.", type: "textarea" },
  "seo.titleSuffix": { label: "Title suffix", help: "Appended to every page title. Leave empty to publish titles unchanged.", type: "text" },
  "seo.defaultKeywords": { label: "Default keywords", help: "Comma separated fallback keywords for posts without their own set.", type: "text" },
  "revalidate.webhookSecret": { label: "Revalidation webhook secret", help: "Shared secret for POST /api/cms/revalidate. Leave empty to disable the webhook.", type: "secret" },
  "security.sessionIdleMinutes": { label: "Session lifetime (minutes)", help: "How long an editor stays signed in without signing in again.", type: "number" },
};

export type CmsSettings = Record<CmsSettingKey, string>;

/** Reads every setting, filling in defaults for missing rows. */
