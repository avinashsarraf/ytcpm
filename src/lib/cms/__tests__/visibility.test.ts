import { describe, expect, it } from "vitest";
import { isPostLive, isPostPending } from "@/lib/cms/visibility";

const now = new Date("2026-10-22T12:00:00Z");
const past = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const future = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

const post = (status: string, publishedAt: Date | null, scheduledFor: Date | null) => ({ status, publishedAt, scheduledFor });

describe("post visibility", () => {
  it("shows a published post whose date has passed", () => {
    expect(isPostLive(post("published", past(48), null), now)).toBe(true);
  });

  it("hides a published post whose date is in the future", () => {
    expect(isPostLive(post("published", future(1), null), now)).toBe(false);
  });

  it("treats a published post with no date as live", () => {
    expect(isPostLive(post("published", null, null), now)).toBe(true);
  });

  it("shows a scheduled post once its date has passed", () => {
    expect(isPostLive(post("scheduled", null, past(1)), now)).toBe(true);
  });

  it("hides a scheduled post before its date", () => {
    expect(isPostLive(post("scheduled", null, future(1)), now)).toBe(false);
    expect(isPostPending(post("scheduled", null, future(1)), now)).toBe(true);
  });

  it("never shows a scheduled post with no date", () => {
    expect(isPostLive(post("scheduled", null, null), now)).toBe(false);
  });

  it("never shows drafts or archived posts, even with a date", () => {
    expect(isPostLive(post("draft", past(1), past(1)), now)).toBe(false);
    expect(isPostLive(post("archived", past(1), null), now)).toBe(false);
  });

  it("treats the exact publish moment as live", () => {
    expect(isPostLive(post("published", now, null), now)).toBe(true);
    expect(isPostLive(post("scheduled", null, now), now)).toBe(true);
  });

  it("ignores a stray publish date on a draft", () => {
    expect(isPostLive(post("draft", past(500), null), now)).toBe(false);
  });
});
