import { describe, expect, it } from "vitest";
import { collapseContext, diffLines, omittedCount } from "@/lib/cms/diff";

const kinds = (before: string, after: string) => diffLines(before, after).lines.map((line) => `${line.type}:${line.text}`);

describe("line diff", () => {
  it("reports no changes for identical documents", () => {
    const result = diffLines("one\ntwo\nthree", "one\ntwo\nthree");
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.lines.every((line) => line.type === "same")).toBe(true);
    expect(result.lines).toHaveLength(3);
  });

  it("treats an empty document as empty", () => {
    const result = diffLines("", "");
    expect(result.lines).toEqual([]);
  });

  it("marks a pure addition", () => {
    const result = diffLines("one\ntwo", "one\ntwo\nthree");
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.lines.at(-1)).toEqual({ type: "add", text: "three" });
  });

  it("marks a pure removal", () => {
    const result = diffLines("one\ntwo\nthree", "one\nthree");
    expect(result.removed).toBe(1);
    expect(result.added).toBe(0);
    expect(result.lines.some((line) => line.type === "remove" && line.text === "two")).toBe(true);
  });

  it("aligns a rewritten line as one removal and one addition", () => {
    expect(kinds("alpha\nbeta\ngamma", "alpha\nBETA\ngamma")).toEqual([
      "same:alpha",
      "remove:beta",
      "add:BETA",
      "same:gamma",
    ]);
  });

  it("keeps the unchanged head and tail out of the comparison", () => {
    const before = ["head", "a", "b", "c", "tail"].join("\n");
    const after = ["head", "a", "B", "c", "tail"].join("\n");
    const result = diffLines(before, after);
    expect(result.lines[0]).toEqual({ type: "same", text: "head" });
    expect(result.lines.at(-1)).toEqual({ type: "same", text: "tail" });
    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
  });

  it("handles a completely different document", () => {
    const result = diffLines("a\nb", "x\ny\nz");
    expect(result.removed).toBe(2);
    expect(result.added).toBe(3);
  });

  it("handles a document that starts empty", () => {
    const result = diffLines("", "first\nsecond");
    expect(result.added).toBe(2);
    expect(result.removed).toBe(0);
  });

  it("handles a document that becomes empty", () => {
    const result = diffLines("first\nsecond", "");
    expect(result.removed).toBe(2);
    expect(result.added).toBe(0);
  });

  it("does not invent a trailing empty line", () => {
    expect(diffLines("one\n", "one\n").lines).toHaveLength(1);
  });

  it("normalises Windows line endings", () => {
    expect(diffLines("one\r\ntwo", "one\ntwo").added).toBe(0);
    expect(diffLines("one\r\ntwo", "one\ntwo").removed).toBe(0);
  });

  it("caps very large documents and says so", () => {
    const big = Array.from({ length: 50 }, (_, index) => `line ${index}`).join("\n");
    const result = diffLines(big, big, { maxLines: 10 });
    expect(result.truncated).toBe(true);
  });

  it("counts additions and removals consistently", () => {
    const result = diffLines("a\nb\nc\nd", "a\nc\nd\ne");
    expect(result.removed).toBe(1);
    expect(result.added).toBe(1);
    expect(result.lines.filter((line) => line.type === "same")).toHaveLength(3);
  });
});

describe("context collapsing", () => {
  const document = Array.from({ length: 20 }, (_, index) => `line ${index}`);

  it("keeps a few unchanged lines around a change", () => {
    const before = document.join("\n");
    const after = [...document.slice(0, 10), "CHANGED", ...document.slice(11)].join("\n");
    const { lines, hidden } = collapseContext(diffLines(before, after).lines, 2);
    expect(hidden).toBeGreaterThan(0);
    expect(lines.some((line) => line.type === "add" && line.text === "CHANGED")).toBe(true);
    // Two lines of context on each side survive.
    expect(lines.some((line) => line.text === "line 8")).toBe(true);
    expect(lines.some((line) => line.text === "line 12")).toBe(true);
  });

  it("leaves a document with no changes untouched", () => {
    const { lines, hidden } = collapseContext(diffLines("a\nb", "a\nb").lines, 3);
    expect(hidden).toBe(0);
    expect(lines).toHaveLength(2);
  });

  it("encodes the omitted count in the marker", () => {
    const before = document.join("\n");
    const after = [...document.slice(0, 1), "NEW", ...document.slice(2)].join("\n");
    const { lines } = collapseContext(diffLines(before, after).lines, 1);
    const marker = lines.find((line) => omittedCount(line.text) !== null);
    expect(marker).toBeDefined();
    expect(omittedCount(marker!.text)).toBeGreaterThan(0);
  });

  it("returns a non-marker for ordinary text", () => {
    expect(omittedCount("hello")).toBeNull();
    expect(omittedCount("__omitted__")).toBeNull();
  });
});
