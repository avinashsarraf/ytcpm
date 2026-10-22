import { describe, expect, it } from "vitest";
import { blogPageHref, pageCount, tagPageHref } from "@/lib/cms/pagination";

describe("blog pagination", () => {
  it("gives page one a bare URL", () => {
    expect(blogPageHref({}, 1)).toBe("/blog");
  });

  it("never builds the malformed /blog&page=2 link", () => {
    const href = blogPageHref({}, 2);
    expect(href).toBe("/blog?page=2");
    expect(href).not.toContain("/blog&");
  });

  it("keeps a tag filter when paging", () => {
    expect(blogPageHref({ tag: "rpm" }, 3)).toBe("/blog?tag=rpm&page=3");
  });

  it("keeps a category filter when paging", () => {
    expect(blogPageHref({ category: "CPM & RPM" }, 2)).toBe("/blog?category=CPM+%26+RPM&page=2");
  });

  it("keeps both filters", () => {
    expect(blogPageHref({ tag: "rpm", category: "Guides" }, 2)).toBe("/blog?tag=rpm&category=Guides&page=2");
  });

  it("ignores empty filters", () => {
    expect(blogPageHref({ tag: "", category: null }, 2)).toBe("/blog?page=2");
  });

  it("builds tag archive URLs", () => {
    expect(tagPageHref("rpm", 1)).toBe("/blog/tag/rpm");
    expect(tagPageHref("rpm", 2)).toBe("/blog/tag/rpm?page=2");
  });

  it("escapes a tag that needs it", () => {
    expect(tagPageHref("cpm and rpm", 2)).toBe("/blog/tag/cpm%20and%20rpm?page=2");
  });

  it("counts pages, always at least one", () => {
    expect(pageCount(0, 9)).toBe(1);
    expect(pageCount(1, 9)).toBe(1);
    expect(pageCount(9, 9)).toBe(1);
    expect(pageCount(10, 9)).toBe(2);
    expect(pageCount(27, 9)).toBe(3);
    expect(pageCount(28, 9)).toBe(4);
  });

  it("survives a nonsense page size", () => {
    expect(pageCount(10, 0)).toBe(1);
    expect(pageCount(10, -1)).toBe(1);
  });
});
