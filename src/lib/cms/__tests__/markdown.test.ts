import { describe, expect, it } from "vitest";
import { escapeHtml, markdownExcerpt, renderMarkdown, safeUrl, slugify } from "@/lib/cms/markdown";

/**
 * The Markdown renderer is the only place raw author text becomes HTML, so
 * these tests are the security boundary for every published post.
 */
describe("renderMarkdown", () => {
  it("escapes raw HTML instead of executing it", () => {
    const result = renderMarkdown('Hello <script>alert("x")</script> world');
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
  });

  it("drops javascript: and data: link targets", () => {
    const result = renderMarkdown("[click](javascript:alert(1)) and [more](data:text/html;base64,PHNjcmlwdD4=)");
    // The unsafe target is left as inert text — never as a link.
    expect(result.html).not.toContain('href="javascript:');
    expect(result.html).not.toContain('href="data:');
    expect(result.html).not.toContain("<a ");
  });

  it("drops links that smuggle a scheme with control characters", () => {
    const result = renderMarkdown("[click](java\u0000script:alert(1))");
    expect(result.html).not.toContain("href");
  });

  it("keeps http, https, mailto and relative links", () => {
    const result = renderMarkdown("[a](https://example.com/x) [b](/guides) [c](mailto:hi@example.com)");
    expect(result.html).toContain("https://example.com/x");
    expect(result.html).toContain("/guides");
    expect(result.html).toContain("mailto:hi@example.com");
  });

  it("marks external links noopener and ugc", () => {
    const result = renderMarkdown("[a](https://example.com/x)");
    expect(result.html).toContain('rel="noopener noreferrer nofollow ugc"');
  });

  it("adds ids to headings and reports them for a table of contents", () => {
    const result = renderMarkdown("## First section\n\ntext\n\n## Second section", { collectHeadings: true });
    expect(result.headings.map((h) => h.id)).toEqual(["first-section", "second-section"]);
    expect(result.html).toContain('id="first-section"');
  });

  it("shifts heading levels with headingOffset", () => {
    const result = renderMarkdown("## Section", { collectHeadings: true, headingOffset: 1 });
    expect(result.headings[0].level).toBe(3);
    expect(result.html).toContain("<h3");
  });

  it("counts words and reading time", () => {
    const result = renderMarkdown("one two three four five six seven eight nine ten");
    expect(result.wordCount).toBe(10);
    expect(result.readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it("collects internal and external links separately", () => {
    const result = renderMarkdown("[a](/guides) [b](/methodology) [c](https://support.google.com/youtube)");
    expect(result.internalLinks).toEqual(["/guides", "/methodology"]);
    expect(result.externalLinks).toEqual(["https://support.google.com/youtube"]);
  });

  it("keeps image alt text", () => {
    const result = renderMarkdown('![A CPM chart](/media/2026/10/chart.png "Title")');
    expect(result.images).toEqual([{ src: "/media/2026/10/chart.png", alt: "A CPM chart" }]);
    expect(result.html).toContain('alt="A CPM chart"');
  });

  it("renders lists, tables and blockquotes", () => {
    const result = renderMarkdown("- one\n- two\n\n> quote\n\n| a | b |\n| --- | --- |\n| 1 | 2 |");
    expect(result.html).toContain("<ul>");
    expect(result.html).toContain("<blockquote>");
    expect(result.html).toContain("<table>");
  });
});

describe("slugify", () => {
  it("produces a lowercase hyphenated slug", () => {
    expect(slugify("YouTube CPM vs RPM: What's Real?")).toBe("youtube-cpm-vs-rpm-whats-real");
  });

  it("falls back when nothing usable is left", () => {
    expect(slugify("!!!")).toBe("post");
    expect(slugify("", "article")).toBe("article");
  });

  it("keeps the slug inside the URL budget", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe("safeUrl", () => {
  it("rejects protocol-relative URLs", () => {
    expect(safeUrl("//evil.example.com")).toBeNull();
  });

  it("rejects control characters", () => {
    expect(safeUrl("java\u0000script:alert(1)")).toBeNull();
  });

  it("allows anchors and relative paths", () => {
    expect(safeUrl("#section")).toBe("#section");
    expect(safeUrl("/blog/post")).toBe("/blog/post");
  });
});

describe("escapeHtml and markdownExcerpt", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });

  it("builds a plain-text excerpt", () => {
    const excerpt = markdownExcerpt("# Title\n\nSome **bold** text that runs on.", 40);
    expect(excerpt.length).toBeLessThanOrEqual(41);
    expect(excerpt).not.toContain("#");
  });
});
