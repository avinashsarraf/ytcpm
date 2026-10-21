/**
 * Focus keywords for the CMS-managed blog routes.
 *
 * The static routes use `src/lib/seo-keywords.ts`. The blog is database-driven,
 * so its own registry lives here — a post's own focus keyword is stored with
 * the post, and these entries cover the archive pages.
 */

export type BlogPageSeo = { focus: string; keywords: string[]; shortDescription: string };

export const blogPageSeo: BlogPageSeo = {
  focus: "youtube cpm and rpm blog",
  keywords: [
    "youtube cpm and rpm blog",
    "youtube earnings blog",
    "youtube monetization guides blog",
    "youtube cpm articles",
    "youtube rpm articles",
    "youtube creator blog",
    "youtube ad revenue blog",
  ],
  shortDescription: "Practical, source-linked guides on YouTube CPM, RPM and earnings modelling.",
};

export const blogTagPageSeo = (tag: string): BlogPageSeo => ({
  focus: `youtube ${tag} articles`,
  keywords: [
    `youtube ${tag}`,
    `youtube ${tag} guide`,
    `youtube ${tag} tips`,
    `youtube ${tag} cpm`,
    `youtube ${tag} rpm`,
  ],
  shortDescription: `Every ytcpm.online article about ${tag}.`,
});
