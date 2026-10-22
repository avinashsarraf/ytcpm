import { describe, expect, it } from "vitest";
import { LEGAL_POLICIES, LEGAL_REFERENCES, LEGAL_UPDATED } from "../legal";
import { pageMetadata } from "../seo";

describe("legal editorial contract", () => {
  it("keeps four separate stable policy routes", () => {
    expect(LEGAL_POLICIES.map(p => p.path)).toEqual(["/privacy", "/terms", "/disclaimer", "/cookies"]);
    expect(new Date(LEGAL_UPDATED).toISOString().startsWith(LEGAL_UPDATED)).toBe(true);
  });
  for (const policy of LEGAL_POLICIES) {
    it(`${policy.path} has distinct metadata, readable summaries, topics and FAQs`, () => {
      expect(policy.seoTitle.length).toBeGreaterThan(25);
      expect(policy.description.length).toBeGreaterThan(100);
      expect(policy.description.length).toBeLessThanOrEqual(160);
      expect(policy.summary).toHaveLength(3);
      expect(policy.topics).toHaveLength(3);
      expect(policy.faqs).toHaveLength(3);
      expect(new Set(policy.sections.map(s => s.id)).size).toBe(policy.sections.length);
      expect(policy.sections.every(s => /^[a-z-]+$/.test(s.id) && s.paragraphs.length > 0)).toBe(true);
      const metadata = pageMetadata(policy.seoTitle, policy.description, policy.path);
      expect(metadata.alternates?.canonical).toBe(policy.path);
      expect(metadata.openGraph).toMatchObject({ url: `https://ytcpm.online${policy.path}` });
    });
  }
  it("includes qualified regional context and official reference URLs", () => {
    const privacy = LEGAL_POLICIES[0].sections.flatMap(s => s.paragraphs).join(" ");
    for (const term of ["European", "United Kingdom", "California", "India", "outside"]) expect(privacy).toContain(term);
    expect(LEGAL_REFERENCES).toHaveLength(4);
    for (const r of LEGAL_REFERENCES) expect(new URL(r.url).protocol).toBe("https:");
    expect(new Set(LEGAL_POLICIES.map(p => p.seoTitle)).size).toBe(4);
  });
});
