import { describe, it, expect } from "vitest";
import { COUNTRY_NOTES, countryNote } from "@/lib/country-notes";
import { COUNTRIES } from "@/lib/data";

const entries = Object.entries(COUNTRY_NOTES);

describe("country notes", () => {
  it("only keys notes that match a real country slug", () => {
    const slugs = new Set(COUNTRIES.map((c) => c.slug));
    for (const [slug] of entries) expect(slugs.has(slug), slug).toBe(true);
  });

  it("gives every note real content in every field", () => {
    for (const [slug, note] of entries) {
      expect(note.heading.length, slug).toBeGreaterThan(20);
      expect(note.intro.length, slug).toBeGreaterThan(80);
      expect(note.sections.length, slug).toBeGreaterThanOrEqual(3);
      expect(note.faqs.length, slug).toBeGreaterThanOrEqual(2);
      expect(note.links.length, slug).toBeGreaterThanOrEqual(2);

      for (const section of note.sections) {
        expect(section.title.length, `${slug} › ${section.title}`).toBeGreaterThan(10);
        expect(section.body.length, `${slug} › ${section.title}`).toBeGreaterThan(0);
        for (const para of section.body) expect(para.length, section.title).toBeGreaterThan(120);
      }
    }
  });

  it("links only to paths on this site", () => {
    for (const [slug, note] of entries) {
      for (const link of note.links) {
        expect(link.href.startsWith("/"), `${slug} › ${link.href}`).toBe(true);
        expect(link.href.startsWith("//"), `${slug} › ${link.href}`).toBe(false);
        expect(link.label.length, `${slug} › ${link.href}`).toBeGreaterThan(10);
      }
    }
  });

  it("asks distinct questions, each phrased as a question", () => {
    for (const [slug, note] of entries) {
      const seen = new Set<string>();
      for (const faq of note.faqs) {
        expect(faq.q.endsWith("?"), `${slug} › ${faq.q}`).toBe(true);
        expect(seen.has(faq.q), `${slug} › duplicate: ${faq.q}`).toBe(false);
        seen.add(faq.q);
        expect(faq.a.length, `${slug} › ${faq.q}`).toBeGreaterThan(80);
      }
    }
  });

  it("does not repeat a section title within a note", () => {
    for (const [slug, note] of entries) {
      const titles = note.sections.map((s) => s.title.toLowerCase());
      expect(new Set(titles).size, slug).toBe(titles.length);
    }
  });

  it("does not repeat the page heading inside the note", () => {
    for (const [slug, note] of entries) {
      const country = COUNTRIES.find((c) => c.slug === slug)!;
      expect(note.heading.toLowerCase(), slug).not.toBe(`youtube cpm in ${country.name}`.toLowerCase());
    }
  });

  it("returns null for a country with no written note", () => {
    expect(countryNote("india")).toBeNull();
    expect(countryNote("not-a-country")).toBeNull();
  });

  it("returns the note for a country that has one", () => {
    expect(countryNote("bangladesh")?.heading).toMatch(/Bangladesh/);
  });
});
