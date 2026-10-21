import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CHANNEL_ID = "UCabcdefghijklmnopqrstuv";
process.env.YOUTUBE_API_KEY = "test-key";
process.env.AUDIT_SIGNING_SECRET = "test-secret-that-is-long-enough-0000000000";

const channelResponse = {
  items: [{
    id: CHANNEL_ID,
    snippet: { title: "Test Channel", description: "Tech and editing videos", customUrl: "@testchannel", publishedAt: "2020-01-01T00:00:00Z", country: "IN" },
    statistics: { subscriberCount: "1000", viewCount: "500000", videoCount: "3" },
    contentDetails: { relatedPlaylists: { uploads: "PLuploads" } },
    brandingSettings: { channel: { keywords: "tech,editing" } },
  }],
};
const playlistItems = {
  items: [
    { snippet: { resourceId: { videoId: "vid00000001" } } },
    { snippet: { resourceId: { videoId: "vid00000002" } } },
  ],
  nextPageToken: "page2",
};
const videoDetails = {
  items: [
    { id: "vid00000001", snippet: { title: "First video", description: "desc", publishedAt: "2026-01-01T00:00:00Z", tags: ["tech", "editing"], categoryId: "17" }, statistics: { viewCount: "500", likeCount: "20", commentCount: "3" }, contentDetails: { duration: "PT8M" } },
    { id: "vid00000002", snippet: { title: "Second video", description: "", publishedAt: "2026-02-01T00:00:00Z", tags: [], categoryId: "10" }, statistics: { viewCount: "50" }, contentDetails: { duration: "PT30S" } },
  ],
};
const playlists = { items: [{ id: "PL123", snippet: { title: "Best of", description: "d" }, contentDetails: { itemCount: 2 } }] };

const calls: string[] = [];
beforeEach(async () => {
  calls.length = 0;
  const { clearAuditCache } = await import("../auditor/youtube");
  clearAuditCache();
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/channels")) return new Response(JSON.stringify(channelResponse), { status: 200 });
    if (url.includes("/playlistItems")) return new Response(JSON.stringify(playlistItems), { status: 200 });
    if (url.includes("/videos")) return new Response(JSON.stringify(videoDetails), { status: 200 });
    if (url.includes("/playlists")) return new Response(JSON.stringify(playlists), { status: 200 });
    return new Response(JSON.stringify({ error: { errors: [{ reason: "notFound" }] } }), { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe("YouTube audit data layer", () => {
  it("resolves a channel, reads uploads and playlists and keeps the API key server-side", async () => {
    const { startAudit } = await import("../auditor/youtube");
    const report = await startAudit({ kind: "handle", value: "testchannel" }, "overview", { videos: 12, playlists: 8 });
    expect(report.channel.title).toBe("Test Channel");
    expect(report.channel.subscribers).toBe(1000);
    expect(report.channel.keywords).toBe("tech,editing");
    expect(report.videos).toHaveLength(2);
    expect(report.videos[0].tags).toEqual(["tech", "editing"]);
    expect(report.videos[1].likes).toBeNull();
    expect(report.playlists[0].itemCount).toBe(2);
    expect(calls.every(url => url.includes("key=test-key"))).toBe(true);
    expect(calls.some(url => url.includes("forHandle=testchannel"))).toBe(true);
  });

  it("walks to the next page of uploads and issues a signed cursor", async () => {
    const { startAudit } = await import("../auditor/youtube");
    const report = await startAudit({ kind: "id", value: CHANNEL_ID }, "full", { videos: 200, playlists: 50 });
    expect(report.videoCursor).toBeTruthy();
    expect(calls.filter(url => url.includes("playlistItems")).length).toBeGreaterThan(1);
    expect(calls.some(url => url.includes("pageToken=page2"))).toBe(true);
  });

  it("reports a friendly error for a missing channel", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { errors: [{ reason: "notFound" }] } }), { status: 404 })));
    const { startAudit, AuditError } = await import("../auditor/youtube");
    await expect(startAudit({ kind: "handle", value: "missing" }, "overview", { videos: 12, playlists: 8 })).rejects.toBeInstanceOf(AuditError);
  });

  it("explains quota exhaustion instead of failing silently", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { errors: [{ reason: "quotaExceeded" }] } }), { status: 403 })));
    const { startAudit, AuditError } = await import("../auditor/youtube");
    await expect(startAudit({ kind: "handle", value: "testchannel" }, "overview", { videos: 12, playlists: 8 })).rejects.toThrow(/quota/i);
  });

  it("never requests a user-supplied URL", async () => {
    const { startAudit } = await import("../auditor/youtube");
    await startAudit({ kind: "username", value: "someone" }, "overview", { videos: 12, playlists: 8 });
    expect(calls.every(url => url.startsWith("https://www.googleapis.com/youtube/v3/"))).toBe(true);
  });
});
