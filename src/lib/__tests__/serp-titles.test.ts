import { describe, expect, it } from "vitest";
import { COUNTRIES, NICHES, DATA_YEAR } from "@/lib/data";
import { countrySerpDescription, countrySerpTitle, nicheSerpTitle, SERP_TITLE_BUDGET } from "@/lib/seo-keywords";

/** The layout template appends this to every page title. */
const SUFFIX = " | ytcpm.online";
const TITLE_MAX = 60;

describe("country SERP titles", () => {
  it("leads with the CPM number for every country", () => {
    for (const country of COUNTRIES) {
      const title = countrySerpTitle(country, DATA_YEAR);
      // A dollar figure must appear before the first colon or bracket.
      expect(title, `${country.name}: ${title}`).toMatch(/\$[\d.]/);
    }
  });

  it("never says 'Model' in the title", () => {
    for (const country of COUNTRIES) {
      expect(countrySerpTitle(country, DATA_YEAR)).not.toMatch(/model/i);
    }
  });

  it("keeps the rendered title inside the 60-character budget", () => {
    for (const country of COUNTRIES) {
      const rendered = `${countrySerpTitle(country, DATA_YEAR)}${SUFFIX}`;
      expect(rendered.length, `${country.name}: "${rendered}" is ${rendered.length}`).toBeLessThanOrEqual(TITLE_MAX);
    }
  });

  it("keeps the page title inside its own budget", () => {
    for (const country of COUNTRIES) {
      expect(countrySerpTitle(country, DATA_YEAR).length).toBeLessThanOrEqual(SERP_TITLE_BUDGET);
    }
  });

  it("mentions the country and the year", () => {
    for (const country of COUNTRIES) {
      const title = countrySerpTitle(country, DATA_YEAR);
      expect(title).toContain(country.name);
      expect(title).toContain(String(DATA_YEAR));
    }
  });

  it("contains both ends of the range", () => {
    const india = COUNTRIES.find((country) => country.slug === "india")!;
    const title = countrySerpTitle(india, DATA_YEAR);
    expect(title).toContain(String(india.cpmLow));
    expect(title).toContain(String(india.cpmHigh));
  });

  it("falls back gracefully for a name too long to fit", () => {
    const madeUp = { name: "The Democratic Republic of Somewhere Very Long", cpmLow: 3, cpmHigh: 9 };
    const title = countrySerpTitle(madeUp, DATA_YEAR);
    expect(title).toContain("$3–$9");
  });

  it("accepts a custom budget", () => {
    const india = COUNTRIES.find((country) => country.slug === "india")!;
    expect(countrySerpTitle(india, DATA_YEAR, 30).length).toBeLessThanOrEqual(30);
  });
});

describe("country SERP descriptions", () => {
  it("opens with the number and stays inside 160 characters", () => {
    for (const country of COUNTRIES) {
      const description = countrySerpDescription(country, null, DATA_YEAR);
      expect(description.length, `${country.name}: ${description.length}`).toBeLessThanOrEqual(160);
      expect(description, country.name).toMatch(/\$[\d.]/);
      expect(description, country.name).toContain(country.name);
    }
  });

  it("is long enough to fill a snippet", () => {
    for (const country of COUNTRIES) {
      expect(countrySerpDescription(country, null, DATA_YEAR).length).toBeGreaterThanOrEqual(90);
    }
  });

  it("includes a local-currency range when one is given", () => {
    const india = COUNTRIES.find((country) => country.slug === "india")!;
    const description = countrySerpDescription(india, "₹33–₹133", DATA_YEAR);
    expect(description).toContain("₹33–₹133");
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("drops the local range rather than exceeding the budget", () => {
    const long = { name: "United Kingdom of Great Britain", cpmLow: 6, cpmHigh: 14 };
    const description = countrySerpDescription(long, "£100–£250 per thousand views", DATA_YEAR);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("does not use the word 'model' as a hedge in the opening", () => {
    for (const country of COUNTRIES) {
      const opening = countrySerpDescription(country, null, DATA_YEAR).split(".")[0];
      expect(opening).not.toMatch(/model range/i);
    }
  });
});

describe("niche SERP titles", () => {
  it("keeps every rendered niche title inside the budget", () => {
    for (const niche of NICHES) {
      const rendered = `${nicheSerpTitle(niche, DATA_YEAR)}${SUFFIX}`;
      expect(rendered.length, `${niche.name}: "${rendered}" is ${rendered.length}`).toBeLessThanOrEqual(TITLE_MAX);
    }
  });

  it("leads with the number and drops 'Model'", () => {
    for (const niche of NICHES) {
      const title = nicheSerpTitle(niche, DATA_YEAR);
      expect(title, niche.name).toMatch(/\$[\d.]/);
      expect(title, niche.name).not.toMatch(/model/i);
    }
  });

  it("names the niche", () => {
    for (const niche of NICHES) {
      expect(nicheSerpTitle(niche, DATA_YEAR)).toContain(niche.name);
    }
  });
});
