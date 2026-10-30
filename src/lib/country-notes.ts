/**
 * Hand-written local context for individual country pages.
 *
 * Why this exists: Search Console showed the country pages ranking on page one
 * with no clicks at all — Bangladesh held 45 impressions at an average
 * position of 8.9 and zero clicks. A page that only swaps a country name into
 * a template gives a searcher nothing they could not get from the table above
 * it, so there is no reason to click. These notes are the opposite: they answer
 * the follow-up questions a creator from that market actually has, in the
 * market's own currency and payment context.
 *
 * Only countries with a written note appear here. Everything else renders the
 * standard page unchanged, so an absent entry is never a broken page — it is
 * simply a country we have not researched yet.
 *
 * Rules for adding an entry:
 *   - No invented statistics. Numbers either come from `src/lib/data.ts` (and
 *     are interpolated at render time) or are stated as something to check in
 *     the creator's own account.
 *   - Payout wording must stay conditional ("the methods AdSense lists for your
 *     country"), because payment options and thresholds change per account and
 *     per country.
 *   - Every section links to at least one page on this site.
 */

export type CountryNoteSection = {
  /** Sentence-case sub-heading. */
  title: string;
  /** One or two short paragraphs. */
  body: string[];
};

export type CountryNoteFaq = { q: string; a: string };

export type CountryNote = {
  /** H2 shown above the note. Must not repeat the page's H1. */
  heading: string;
  intro: string;
  sections: CountryNoteSection[];
  faqs: CountryNoteFaq[];
  /** Internal links shown at the end of the block. */
  links: { href: string; label: string }[];
};

export const COUNTRY_NOTES: Record<string, CountryNote> = {
  bangladesh: {
    heading: "Bangladesh: what the local ad market actually pays",
    intro:
      "Bangladesh sits in the lowest CPM tier on this site, and that single fact explains most of what Bangladeshi creators ask us. The rate below is what advertisers pay per 1,000 ad impressions on a Bangladeshi audience — not what a creator in Dhaka receives, and not what YouTube pays for a view.",
    sections: [
      {
        title: "Why the rate is low when the audience is large",
        body: [
          "YouTube ad rates are set by auction, and the auction reflects what an advertiser expects a thousand impressions to be worth in that market. Bangladesh has an enormous viewing audience and a comparatively small advertising budget per viewer, so competition for a Bangladeshi impression is weaker than for a US or UK impression. Volume does not raise the rate; it only increases how many impressions you can sell at it.",
          "Audience country, not creator country, sets the rate. A channel run from Dhaka whose viewers are mostly in the United States is paid closer to US rates, and a channel run from London whose viewers are mostly in Bangladesh is paid closer to Bangladeshi rates. Check the audience geography in YouTube Studio before assuming which table applies to you.",
        ],
      },
      {
        title: "What actually moves the number for a Bangladeshi channel",
        body: [
          "Advertiser-friendly topics and longer watch time do more for revenue here than any attempt to chase a higher-CPM country. A longer video can carry more ad impressions per view, and an audience that arrives from search or recommendations watches more of each video than one that arrives from a short clip.",
          "Diversifying beyond ads matters more in a low-CPM market than in a high one. Channel memberships, Super Thanks and Super Chat, direct sponsorships and affiliate arrangements can each pay more per viewer than advertising does, but eligibility for the creator-support features depends on the channel meeting YouTube's current requirements, and sponsorship rates are negotiated privately rather than published.",
        ],
      },
      {
        title: "Currency, tax and getting paid",
        body: [
          "Earnings are reported in US dollars and shown here converted to Bangladeshi taka at a fixed working rate, which is an estimate for planning rather than an exchange rate you will be paid at. YouTube pays creators through AdSense, after the balance passes the payment threshold set for the account, using the payment methods AdSense lists for Bangladesh — check those options in your own AdSense account, because availability and thresholds differ by country and can change.",
          "Tax information is part of that setup. Complete the tax forms AdSense asks for, and read the current instructions for your situation rather than relying on a general guide, since withholding depends on the account and the treaty position.",
        ],
      },
      {
        title: "Compare before you change anything",
        body: [
          "Use the calculator on this page with your own view counts, and compare the result with your actual Studio revenue for the same period. If the two disagree, the Studio figure is the real one and the model is simply an assumption. Our methodology page explains exactly which assumptions the model makes.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is the YouTube CPM in Bangladesh lower than in India?",
        a: "In our model, yes. The Bangladesh range is narrower and lower than the India range, which reflects the difference in advertising spend per viewer between the two markets. Both are model inputs rather than measured payouts, and an individual channel's CPM depends on its audience geography, topic and the time of year, so a channel can beat or fall short of the country table.",
      },
      {
        q: "Does the creator's location decide the CPM?",
        a: "No. Advertisers bid for the viewer, so the audience's country sets the rate. A creator in Bangladesh with mostly US viewers earns closer to the US table, and a creator abroad with mostly Bangladeshi viewers earns closer to the Bangladeshi table. YouTube Studio's audience geography report shows where your views actually came from.",
      },
      {
        q: "How many views do I need for a payout in Bangladesh?",
        a: "There is no single view count. AdSense pays when the account balance passes the payment threshold for the account, so the number of views depends on your RPM, on how much of the audience is in higher-rate countries, and on any other revenue in the account. Divide the threshold by your own RPM to estimate the views required for your channel, and treat the answer as an estimate.",
      },
    ],
    links: [
      { href: "/guides/youtube-cpm-vs-rpm", label: "CPM vs RPM: which number should you plan with?" },
      { href: "/guides/youtube-earnings-per-1000-views", label: "What 1,000 views is worth, step by step" },
      { href: "/youtube-rpm-calculator", label: "Work out your own RPM" },
      { href: "/cpm-by-country/india", label: "Compare with India" },
      { href: "/methodology", label: "How these estimates are built" },
    ],
  },
};

/** The note for a country slug, or null when we have not written one. */
export function countryNote(slug: string): CountryNote | null {
  return COUNTRY_NOTES[slug] ?? null;
}
