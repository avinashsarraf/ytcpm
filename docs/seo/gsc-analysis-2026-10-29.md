# Search Console analysis — 19–27 October 2026

Source: `ytcpm.online-Performance-on-Search-2026-10-29.pdf` (Google Search Console export,
Search type: Web, filter: Last 3 months).

The export says "last 3 months", but the property has data for **nine days**. The site went
live on 19 October. Everything below is therefore a launch-window read, not a trend.

---

## 1. The headline numbers

| Metric | Value |
|---|---|
| Days with data | 9 (19–27 Oct) |
| Clicks | **7** |
| Impressions | **532** |
| CTR | **1.32%** (95% CI: 0.64% – 2.69%) |
| Pages receiving impressions | 25 listed, more below the cut |
| Queries listed | 85 — **every one of them with 0 clicks** |

Seven clicks is a number that cannot support a firm conclusion about anything. What it *can*
do is show the shape of the launch: how fast Google is expanding the site, where it is placing
it, and whether anyone is clicking.

---

## 2. Impressions are growing; clicks are not

| Date | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|
| 19 Oct | 0 | 0 | — | — |
| 20 Oct | 1 | 1 | 100% | 2.0 |
| 21 Oct | 3 | 37 | 8.11% | 18.3 |
| 22 Oct | 1 | 61 | 1.64% | 16.9 |
| 23 Oct | 0 | **109** | 0% | 35.6 |
| 24 Oct | 1 | 76 | 1.32% | 14.1 |
| 25 Oct | 1 | 88 | 1.14% | 16.6 |
| 26 Oct | 0 | 91 | 0% | 10.0 |
| 27 Oct | 0 | 69 | 0% | **8.3** |

Two curves are moving in opposite directions.

- **Impressions** went from 37/day to a plateau around 70–110/day.
- **Average position** improved from 18.3 → **8.3** (first four days: 18.2, last four: 12.2).
- **Clicks** fell: 5 in the first four days, **2 in the last four**.

The 23 October spike to 109 impressions at position 35.6 looks like a discovery event — Google
indexed a batch of pages and started testing them deep in the results. Positions then climbed
back to page one while impressions held steady. This is the normal shape of a new site being
evaluated. The concern is the third row: as the site climbed into the top ten, clicks did not
follow.

---

## 3. The core finding: eleven page-one URLs, 193 impressions, zero clicks

These pages all average a **top-ten position** and received **no clicks at all**:

| Page | Impressions | Avg position |
|---|---|---|
| `/cpm-by-country/bangladesh` | 40 | 7.70 |
| `/cpm-by-country/finland` | 22 | 5.59 |
| `/guides/how-to-check-youtube-cpm` | 20 | 7.70 |
| `/cpm-by-country/switzerland` | 18 | 6.50 |
| `/cpm-by-country/south-korea` | 16 | 6.56 |
| `/cpm-by-country/sweden` | 11 | 5.82 |
| `/cpm-by-country/denmark` | 11 | 6.91 |
| `/cpm-by-country/canada` | 10 | 6.60 |
| `/cpm-by-country/germany` | 10 | 7.60 |
| `/cpm-by-country/belgium` | 8 | 8.38 |
| `/cpm-by-country/norway` | 7 | 6.86 |

193 impressions at an average position near 7, and not one click. If these results converted at
even a modest 4% — already low for the top ten — they would have produced about eight clicks.

The same pattern is visible by device. Mobile holds an average position of **7.51** on 230
impressions and converts at **1.30%**; desktop holds position 26.42 on 297 impressions and
converts at 1.35%. Mobile is ranking on page one and getting page-three traffic.

A zero here is unlikely to be chance: at 5% CTR, the odds of zero clicks in 193 impressions are
about one in twenty thousand. Something in the result itself is suppressing clicks.

### The likely causes, in order of confidence

1. **The word "Model" in every country title.** The generated title is
   `YouTube CPM in Bangladesh — 2026 Model`. The description opens with
   "YouTube CPM in Bangladesh model range is $0.40–$1.60…". Someone searching *bangladesh cpm*
   wants a number. A result that says "Model" twice signals *we estimated this* — and an
   estimate is exactly what a searcher will skip in favour of a result that looks like data.
   This is the cheapest thing to change and the most likely cause.
2. **Zero-click SERP features.** For `how much does youtube pay`, `cpm`, and country-rate
   queries Google frequently answers directly or shows a video/shopping block above the organic
   results. If the answer is on the SERP, position 6 with 0 clicks is expected.
3. **No brand recognition.** A five-day-old domain beside YouTube's own help pages, Social
   Blade and Influencer Marketing Hub loses the click even when it out-ranks them. This
   resolves with time and with links, not with a title change.

Cause 1 is testable this week. Causes 2 and 3 are not.

---

## 4. Queries: where the site wins, and where it is stuck

**All 85 listed queries have 0 clicks**, and their impressions sum to 133 — not 532. GSC
withholds rare queries, so the seven clicks came from queries that are not in this export. That
is normal, but it means the query table cannot be reconciled against the site total.

### It wins on short, country-plus-metric queries

| Query | Position |
|---|---|
| `pakistan cpm` | 2.0 |
| `canada cpm` | 2.0 |
| `usa cpm` | 2.0 |
| `sponsored stream rate calculator` | 3.0 |
| `cpm rate in pakistan` | 5.0 |
| `france youtube rpm` | 5.0 |
| `germany cpm` | 5.0 |
| `revenue per 1k engaged views (rpm)` | 5.0 |
| `cpm brazil` | 5.5 |
| `cpm youtube` | 6.8 |

These are two-to-four-word queries, and the site is on page one for a cluster of them. They are
also almost all one or two impressions each, so the positions are promising but unproven.

### It is stuck on the "views to money" family

One page, `/youtube-views-to-money-calculator`, absorbs **74 impressions** — the largest single
source on the site — at an average position of **37.2**, with no clicks. Underneath it sits a
family of seventeen query variants that Google is using to test the page:

`youtube views to money` (53) · `calculate youtube views to money` (68) ·
`youtube view to money calculator` (69) · `youtube views to money calculator` (71.5) ·
`view to money calculator youtube` (72) · `views to money youtube` (75) ·
`youtube views money conversion` (75) · `views to money calculator youtube` (76) ·
`youtube views to money conversion` (76) · `views calculator youtube` (76.5) ·
`views money calculator` (77) · `youtube views money converter` (78.5) ·
`youtube views to money converter` (80.67) · `youtube view money` (88)

All of these are on pages six to nine. The page is understood but not trusted, and it is
carrying several distinct intents at once: *convert this number*, *how much do 1,000 views pay*,
and *what is the rate*. One page cannot be the best answer for all three.

### It is invisible on the head terms

`youtube 1000 views how much money` — the single highest-impression query at 6 — sits at
position 65. `cpm calculator youtube` (71), `youtube calculator views` (76). The head terms
belong to established competitors and will not move quickly.

### Long-tail signal worth noting

- `youtube rpm in japan` (22), `japan youtube rpm` (11) — country RPM pages are surfacing.
- `youtube エンゲージメント率 計算` at position 27 — a Japanese engagement-rate query, matched by
  `/youtube-engagement-rate-calculator`. There is non-English demand the single-language site
  currently answers by accident.

---

## 5. Pages: where the impressions are

| Page | Impressions | Clicks | Avg position |
|---|---|---|---|
| `/youtube-views-to-money-calculator` | 74 | 0 | 37.2 |
| `/cpm-by-country/brazil` | 40 | 1 | 7.2 |
| `/cpm-by-country/bangladesh` | 40 | 0 | 7.7 |
| `/cpm-by-country/indonesia` | 27 | 1 | 13.96 |
| `/guides/youtube-earnings-per-1000-views` | 24 | 0 | 43.83 |
| `/cpm-by-country/finland` | 22 | 0 | 5.59 |
| `/guides/how-to-check-youtube-cpm` | 20 | 0 | 7.7 |

By family:

- **Country pages: 17 URLs, 287 impressions (54% of the site), 3 clicks, 1.05% CTR.**
- **Guides: 3 URLs, 61 impressions, 0 clicks**, averaging position 30+.
- **Calculator and tool pages: 102 impressions, 1 click.**

The country family is half the site's visibility and almost none of its traffic. Brazil and
Bangladesh are its two best-ranked pages and they produced one click between them.

---

## 6. A technical finding: the homepage is split across two protocols

GSC lists the homepage twice:

| URL | Impressions | Clicks | Avg position |
|---|---|---|---|
| `http://ytcpm.online/` | **11** | **2** | 26.64 |
| `https://ytcpm.online/` | 6 | 1 | 6.17 |

Google is treating the HTTP and HTTPS homepages as separate URLs, and the HTTP one has the
larger share. The canonical tag correctly points at `https://ytcpm.online/`, so consolidation
should happen on its own — but two clicks landed on the insecure URL, which means at crawl time
the HTTP host was still serving the page rather than redirecting.

`next.config.ts` sends no `Strict-Transport-Security` header, and the app has no host
redirect. If the reverse proxy in front (Coolify/nginx) is not forcing 301 to HTTPS with HSTS,
this will keep splitting whatever authority the homepage earns.

Worth checking in the GSC **Pages** report (not included in this export): any "Page with
redirect" or "Duplicate, Google chose different canonical" entries.

---

## 7. Geography: the audience is the subject

| Country | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|
| India | 4 | 90 | 4.44% | 10.34 |
| Indonesia | 1 | 40 | 2.50% | 11.88 |
| Pakistan | 1 | 36 | 2.78% | 11.14 |
| Turkey | 1 | 9 | 11.11% | 13.11 |
| United States | 0 | **77** | 0% | 46.04 |
| Bangladesh | 0 | **45** | 0% | 8.91 |
| Brazil | 0 | 20 | 0% | 16.0 |
| Finland | 0 | 19 | 0% | 6.32 |

- **Every click came from India, Indonesia, Pakistan or Turkey.** The audience is creators in
  low-CPM markets researching what they can earn — a miniature of the subject matter.
- **The United States is the second-largest impression source and produced nothing**, because
  its average position is 46. That is 14% of all impressions sitting on page five, in the
  hardest market to enter.
- **Bangladesh is the clearest single opportunity**: 45 impressions (8.5% of the site) at an
  average position of 8.91, and zero clicks. The page itself ranks 7.70 on 40 impressions.

---

## 8. What the export does not show

- **The Search Appearance table is empty.** No FAQ, video, product or breadcrumb enhancement is
  being reported. The JSON-LD on the site is valid but is not producing rich results yet.
- **No indexing data.** The Pages report is a separate export.
- **No Core Web Vitals.** Also separate.
- Nine days of data. Everything above is directional.

---

## 9. What to do, ranked by expected impact

Status as of the same day: rows 1, 2, 4 and 5 are shipped, rows 3, 6 and 7 are not
code changes.

| # | Action | Why | Effort | Status |
|---|---|---|---|---|
| 1 | **Rewrite country-page titles to lead with the number**, and drop "Model" | 193 impressions, avg position 7, zero clicks — the title is the only thing standing between that and traffic. e.g. `YouTube CPM in Bangladesh (2026): $0.40–$1.60` | Small — one template | **Shipped.** `countrySerpTitle` / `countrySerpDescription` / `nicheSerpTitle` in `src/lib/seo-keywords.ts`; every one of the 23 country pages and 18 niche pages renders inside the 60-character budget, with a fallback chain that drops the year, then re-orders. |
| 2 | **Force HTTP→HTTPS at the proxy and add HSTS** | The homepage is split across protocols and the insecure copy has more impressions | Small | **Shipped.** HSTS (one year, no `preload`) in `next.config.ts`; http→https and www→apex 308 in `src/proxy.ts`, scoped to `ytcpm.online` only so previews and localhost are never bounced. See the note below on what the first version got wrong. |
| 3 | **Check GSC for the featured snippet above the zero-click pages** | Tells you whether the cause is SERP features (unfixable) or title/description (fixable) | Small | **Cannot be done from here.** It needs a signed-in Search Console session on the live property. The export in hand has an empty Search Appearance tab, which is itself a data point: no SERP feature was awarded in this period. |
| 4 | **Split the views-to-money page by intent** | 74 impressions on one page across 17 query variants at positions 53–88. Three intents, one page | Medium | **Partly shipped.** The strongest single intent — "how much does YouTube pay for 1,000 views" — now has its own answer table above the fold of the tool page (`src/components/views-to-money-answers.tsx`), covering $0.50 to $10 RPM. The other two intents (100,000 views, and revenue targets) already had sections and a separate calculator. Splitting into separate URLs would be a larger restructure and is deliberately not done yet: one page still owns one focus keyword. |
| 5 | **Strengthen `/cpm-by-country/bangladesh` specifically** | Best-ranked page-country match on the site: 40 impressions, position 7.7, no clicks | Small | **Shipped.** A written local-market block (`src/lib/country-notes.ts`) with four sections — why the rate is low when the audience is large, what actually moves it for a Bangladeshi channel, currency/tax/payout, and how to compare against Studio — plus three questions merged into the page's FAQ and its `FAQPage` schema. Other countries render unchanged. |
| 6 | **Check the Rich Results Test for the FAQ and breadcrumb markup** | Search Appearance is empty; the enhancements are not being awarded | Small | **Cannot be done from here.** The Rich Results Test fetches the live URL. What was verified locally is that the markup is present and valid JSON: `FAQPage` and `BreadcrumbList` on the country, niche and tool pages, with the new Bangladesh questions included (6 questions on that page, up from 3). |
| 7 | **Treat the Japanese engagement query as a signal, not a job** | Non-English demand exists, but a translated site is a project, not a task | Large | **Deferred, deliberately.** No change made. |

### A correction worth recording, because it was found by testing and not by reading

The first version of the HTTPS redirect could never have worked. It compared
`request.nextUrl.hostname` with the canonical host, and Next builds `nextUrl` from
the address the server bound to — so every request looked like it came from
`localhost`, and a redirect cloned from it would have sent visitors to localhost.
The second version fixed the comparison but dropped the **port** when building the
redirect, which is invisible on production (port 443) and breaks any deployment on
another port; the CMS end-to-end suite, which serves on `:3131`, caught it within
one run.

Both rules now live in `src/lib/request-origin.ts`, as plain functions with 28
tests, because neither failure produces an error: a redirect that never fires
still returns a normal page, and one that loses the port still returns a redirect.

Alongside them, one display bug on the same pages: ranges were interpolated raw,
so the body of a page could read `$0.2–$1.2` while its own title read
`$0.20–$1.20`. `usdRange()` in `src/lib/data.ts` is now the single formatter for
every range on the site.

---

## 10. What not to conclude from this

- **Do not conclude the SEO work failed.** Rankings improved from position 18 to 8 in nine days
  and 54% of impressions now land on the country pages. That is the expected curve.
- **Do not conclude the CTR problem is permanent.** Nine days and 532 impressions cannot prove
  a CTR deficit; they can only suggest where to look. Re-read this in three weeks with ten times
  the data.
- **Do not chase the head terms yet.** `youtube 1000 views how much money` at position 65 is not
  a content problem to solve this month; the long-tail country cluster already ranks and only
  needs to convert.
