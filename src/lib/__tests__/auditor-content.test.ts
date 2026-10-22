import { describe, expect, it } from "vitest";
import {
  AUDIT_COVERAGE, AUDIT_STEPS, AUDITOR_FAQS, COMPARISON, LIMITATIONS, PROVENANCE, USE_CASES,
} from "@/lib/auditor/content";

describe("channel auditor page content", () => {
  it("covers every data class with a provenance label", () => {
    expect(AUDIT_COVERAGE.length).toBeGreaterThanOrEqual(8);
    for (const item of AUDIT_COVERAGE) {
      expect(["Public", "Inferred", "Estimated"]).toContain(item.source);
      expect(item.label.length).toBeGreaterThan(3);
      expect(item.detail.length).toBeGreaterThan(40);
    }
  });

  it("describes the three steps of a how-to schema", () => {
    expect(AUDIT_STEPS).toHaveLength(3);
    AUDIT_STEPS.forEach((step, index) => {
      expect(step.title.length).toBeGreaterThan(10);
      expect(step.body.length).toBeGreaterThan(80);
      expect(step.body).not.toMatch(/\\bper month\\b/i);
    });
  });

  it("answers the comparison intent with a public vs studio table", () => {
    expect(COMPARISON.length).toBeGreaterThanOrEqual(8);
    const capability = COMPARISON.map(row => row.capability);
    expect(capability.some(label => /public views, likes, comments/i.test(label))).toBe(true);
    expect(capability.some(label => /audience country/i.test(label))).toBe(true);
    expect(capability.some(label => /actual creator revenue/i.test(label))).toBe(true);
    for (const row of COMPARISON) {
      expect(row.publicAudit.length).toBeGreaterThanOrEqual(5);
      expect(row.studio.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("states that private analytics and real revenue are unavailable", () => {
    const text = [COMPARISON, LIMITATIONS, PROVENANCE].flatMap(rows => rows.map(row => Object.values(row).join(" "))).join(" ");
    expect(text).toMatch(/never available/i);
    expect(text).toMatch(/not.*search volumes|no search volumes/i);
    const limitationText = LIMITATIONS.map(item => `${item.title} ${item.body}`).join(" ");
    expect(limitationText).toMatch(/private analytics/i);
    expect(limitationText).toMatch(/scenarios/i);
  });

  it("keeps every FAQ answer substantive and free of pricing wording", () => {
    expect(AUDITOR_FAQS.length).toBeGreaterThanOrEqual(10);
    for (const faq of AUDITOR_FAQS) {
      expect(faq.q.length).toBeGreaterThan(15);
      expect(faq.a.length).toBeGreaterThan(80);
      expect(faq.a).not.toMatch(/\\b(₹|rs\\.?|price|upgrade|subscription|per month)\\b/i);
    }
  });

  it("explains each provenance label and lists creator use cases", () => {
    expect(PROVENANCE.map(item => item.label)).toEqual(["Public", "Inferred", "Estimated"]);
    for (const item of PROVENANCE) expect(item.body.length).toBeGreaterThan(60);
    expect(USE_CASES.length).toBeGreaterThanOrEqual(4);
    for (const item of USE_CASES) {
      expect(item.title.length).toBeGreaterThan(10);
      expect(item.body.length).toBeGreaterThan(60);
    }
  });
});
