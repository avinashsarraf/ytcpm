/**
 * Editorial content for the Channel Auditor page. Kept separate from the
 * component so the copy, schema and tests share one source of truth.
 */

export type AuditStep = { title: string; body: string };
export const AUDIT_STEPS: AuditStep[] = [
  { title: "Paste the channel URL or @handle", body: "Copy the channel link from YouTube and paste it here. A channel URL, an @handle URL and a /channel/UC… link all work — the tool resolves the public channel for you." },
  { title: "We pull the public catalogue", body: "The YouTube Data API returns the channel's public videos, playlists, tags, categories, durations and view/like/comment counts. Private, unlisted and deleted uploads are never visible to anyone." },
  { title: "Read the report and the scenarios", body: "See the best and worst performers, strongest and weakest repeated phrases, upload cadence and engagement — plus clearly labelled CPM and RPM scenarios you can adjust to your own market assumption." },
];

export type CoverageItem = { label: string; detail: string; source: "Public" | "Inferred" | "Estimated" };
export const AUDIT_COVERAGE: CoverageItem[] = [
  { label: "Channel snapshot", detail: "Name, handle, description, creation date, channel keywords, subscriber count (reported as hidden when the creator hides it), lifetime views and published video count.", source: "Public" },
  { label: "Every public upload", detail: "Title, description, publication date, tags, category, duration and the public view, like and comment counts for each video the API returns.", source: "Public" },
  { label: "Playlists", detail: "Public playlists with their item counts, so you can see how the channel organises its catalogue.", source: "Public" },
  { label: "Best and worst performers", detail: "The most and least viewed uploads, plus the fastest riser measured by views per day since publication.", source: "Inferred" },
  { label: "Keyword and tag analysis", detail: "Repeated phrases from titles and public tags, ranked by the views behind them, with tag coverage and description gaps.", source: "Inferred" },
  { label: "Upload cadence and engagement", detail: "Videos published each month, median views per day and an engagement rate of (likes + comments) ÷ views, which can exceed 100%.", source: "Inferred" },
  { label: "CPM and RPM scenarios", detail: "Modeled advertiser CPM and creator RPM ranges from the ytcpm.online benchmark model, using an audience-market assumption that you control.", source: "Estimated" },
  { label: "Monthly and lifetime revenue", detail: "A run rate built from the median daily velocity of recent uploads and a lifetime scenario applied to public lifetime views.", source: "Estimated" },
];

export type ProvenanceItem = { label: string; title: string; body: string };
export const PROVENANCE: ProvenanceItem[] = [
  { label: "Public", title: "Published by YouTube", body: "Counts, titles, tags, categories and playlists that anyone can see on the channel page. Nothing here is estimated." },
  { label: "Inferred", title: "Derived from public data", body: "Rankings, keyword phrases, cadence and engagement rates that we calculate from the public numbers. The formula is on the page, but the conclusion is ours." },
  { label: "Estimated", title: "Modeled scenario", body: "CPM, RPM and revenue ranges built from directional benchmark assumptions. They are planning scenarios, not the channel's real earnings." },
];

export type UseCase = { title: string; body: string };
export const USE_CASES: UseCase[] = [
  { title: "Competitor and benchmark research", body: "Compare how often comparable channels publish, which formats travel and how their catalogues are structured — using the same labelled method for every channel." },
  { title: "Sponsorship and brand research", body: "Size up a channel's audience and cadence before you pitch, then model an ad-only revenue range as a reference point instead of guessing." },
  { title: "Content gap analysis", body: "Find the repeated phrases that travel and the ones that do not, then check which videos are missing descriptions or tags entirely." },
  { title: "Checking your own channel", body: "Audit your own public page to review the same view the market sees, then verify your real numbers with YouTube Studio and our report-based calculators." },
];

export type ComparisonRow = { capability: string; publicAudit: string; studio: string };
export const COMPARISON: ComparisonRow[] = [
  { capability: "Public views, likes, comments", publicAudit: "Shown, exactly as published", studio: "Shown, with your date range" },
  { capability: "Titles, descriptions, tags, categories", publicAudit: "Shown for every public upload", studio: "Shown for your uploads" },
  { capability: "Playlists and upload cadence", publicAudit: "Shown", studio: "Shown" },
  { capability: "Subscriber count", publicAudit: "Shown, or reported as hidden", studio: "Your own is always visible" },
  { capability: "Audience country and city mix", publicAudit: "Never available", studio: "Shown for your channel" },
  { capability: "Watch time, retention and CTR", publicAudit: "Never available", studio: "Shown for your channel" },
  { capability: "Ad impressions and advertiser CPM", publicAudit: "Never available", studio: "Shown for your channel" },
  { capability: "Actual creator revenue", publicAudit: "Never available — only modeled scenarios", studio: "Shown for your channel" },
];

export type Limitation = { title: string; body: string };
export const LIMITATIONS: Limitation[] = [
  { title: "No private analytics, ever", body: "A public URL cannot expose ad impressions, advertiser spend, retention, audience geography or creator revenue. The auditor never asks for a YouTube login and never connects to a channel account." },
  { title: "Only what YouTube publishes", body: "Deleted, private, unlisted, members-only and age-restricted uploads stay invisible, so an analysed catalogue can be smaller than the channel's own video counter." },
  { title: "Phrases are not search volumes", body: "Keywords are inferred from public titles and tags. They are not verified monthly searches, keyword difficulty scores, live rankings or an assessment of how the YouTube algorithm works." },
  { title: "Revenue figures are scenarios", body: "CPM, RPM and revenue ranges come from the ytcpm.online benchmark model with an audience-market assumption you choose. They describe a planning range, never a payout." },
  { title: "Not professional advice", body: "Nothing here is financial, tax, legal or business advice. Check important decisions against your own YouTube Studio reports and a qualified professional." },
];

export const AUDITOR_FAQS = [
  { q: "What does the Channel Auditor actually pull?", a: "Public YouTube data only: channel name, handle, description, published date, subscriber count when the creator has not hidden it, lifetime views, published video count, public videos with titles, descriptions, tags, categories, durations and public view/like/comment counts, plus public playlists. Anything private, unlisted, deleted or owner-only stays private." },
  { q: "Can I see a channel's real CPM, RPM or revenue?", a: "No. A public channel URL never exposes ad impressions, advertiser spend or creator revenue. The auditor shows modeled CPM and RPM ranges from the ytcpm.online benchmark model using an explicit audience-market assumption and a chosen niche, and every estimated figure is labelled as estimated." },
  { q: "Where do the keywords and best/worst performing content come from?", a: "Phrases are inferred from public titles and public tags on the videos that were analysed, ranked by the views associated with them. Best and worst performers are ranked by views and by views per day since publication. These are content signals — they are not verified search volumes, keyword rankings or a verdict on strategy." },
  { q: "Which channels can be audited?", a: "Any public channel that can be resolved from its current @handle, an @handle URL or a /channel/UC… URL. Custom vanity /c/ links, deleted channels and private channels cannot be resolved. You need the YouTube Data API key configured on the server for live audits." },
  { q: "Can I audit my own channel's private analytics?", a: "Not yet. Connecting a channel with Google authorization to read private analytics is a separate flow. Until it exists, this tool never presents owner-only numbers as if they came from a public audit, and a public audit of your own channel still shows public data only." },
  { q: "How is this different from YouTube Studio analytics?", a: "Studio shows your own private metrics — audience geography, watch time, retention, CTR, ad impressions and actual revenue — for the periods you choose. The auditor shows only what the public already reveals, for any channel, and never asks you to connect an account. Use the public audit to review how a channel looks from the outside, then verify your own numbers in Studio and with our report-based CPM and RPM calculators." },
  { q: "Is the audit really free?", a: "Yes. Every audit is free, with no signup, no card and no limits on how much of a channel is analysed. You can also copy the written summary or download the analysed video table as a CSV." },
  { q: "How accurate are the engagement and revenue numbers?", a: "The engagement rate is exactly (likes + comments) ÷ views on the videos that were analysed, so it can exceed 100% on a video with heavy comment activity. The revenue figures are modeled scenarios: they apply benchmark CPM and RPM ranges to public view counts, and the difference between the range and reality is usually larger than the range itself." },
  { q: "Can I audit a channel that hides its subscriber count?", a: "Yes. When a creator hides the subscriber count, the auditor reports it as hidden instead of guessing or showing a stale third-party number. Every other public figure for that channel is still reported normally." },
  { q: "Does auditing a channel need permission?", a: "No permission and no account connection is needed for public data — the tool reads only what YouTube already publishes for everyone. Data that requires the owner's authorization, such as private analytics and monetary reports, is never accessible through a public channel URL." },
];
