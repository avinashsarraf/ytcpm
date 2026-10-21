import { signCursor, type AuditCursor } from "./cursor";
import type { ChannelLocator } from "./input";
import type { AuditChannel, AuditLevel, AuditPage, AuditPlaylist, AuditReport, AuditVideo } from "./types";

type Item = { id?: string; snippet?: { title?: string; description?: string; customUrl?: string; publishedAt?: string; country?: string; tags?: string[]; categoryId?: string; resourceId?: { videoId?: string } }; statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean; viewCount?: string; videoCount?: string; likeCount?: string; commentCount?: string }; contentDetails?: { relatedPlaylists?: { uploads?: string }; duration?: string; itemCount?: number }; brandingSettings?: { channel?: { keywords?: string } } };
type YouTubeResponse = { items?: Item[]; nextPageToken?: string; error?: { errors?: { reason?: string }[] } };
export class AuditError extends Error { constructor(public status: number, message: string) { super(message); } }
/** Test helper — clears the short-lived response cache. */
export function clearAuditCache() { cache.clear(); }
const count = (value: unknown) => { const n = Number(value); return Number.isFinite(n) && n >= 0 ? Math.min(n, Number.MAX_SAFE_INTEGER) : 0; };
const optionalCount = (value: unknown) => value === undefined ? null : count(value);
const cache = new Map<string, { expires: number; value: YouTubeResponse }>();
async function api(path: string, params: Record<string, string>): Promise<YouTubeResponse> {
  const key = process.env.YOUTUBE_API_KEY; if (!key) throw new AuditError(503, "Live audits are not configured yet. Explore the clearly labeled sample report instead.");
  const cacheKey = `${path}:${JSON.stringify(params)}`; const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value as YouTubeResponse;
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [name, value] of Object.entries({ ...params, key })) url.searchParams.set(name, value);
  let response: Response;
  try { response = await fetch(url, { signal: AbortSignal.timeout(12000), cache: "no-store" }); }
  catch { throw new AuditError(502, "YouTube could not be reached. Please try again shortly."); }
  let data: YouTubeResponse; try { data = await response.json(); } catch { throw new AuditError(502, "YouTube returned an unreadable response."); }
  if (!response.ok) {
    const reason = data.error?.errors?.[0]?.reason;
    if (reason === "quotaExceeded" || reason === "dailyLimitExceeded" || response.status === 429) throw new AuditError(429, "The YouTube request quota is temporarily unavailable. Please try again later.");
    if (response.status === 404) throw new AuditError(404, "This public channel or playlist could not be found.");
    throw new AuditError(502, "YouTube rejected the request. The site operator may need to check API access.");
  }
  if (cache.size >= 300) cache.delete(cache.keys().next().value!);
  cache.set(cacheKey, { expires: Date.now() + 15 * 60 * 1000, value: data });
  return data;
}
function continuation(channelId: string, collection: AuditCursor["collection"], playlistId: string, level: AuditLevel, pageToken?: string) {
  return pageToken ? signCursor({ channelId, collection, playlistId, level, pageToken }) : null;
}
export async function loadAuditPage(cursor: Omit<AuditCursor, "expires">): Promise<AuditPage> {
  const size = cursor.level === "overview" ? "12" : "50";
  if (cursor.collection === "playlists") {
    const data = await api("playlists", { part: "snippet,contentDetails", channelId: cursor.channelId, maxResults: size, ...(cursor.pageToken ? { pageToken: cursor.pageToken } : {}) });
    const playlists: AuditPlaylist[] = (data.items ?? []).filter(i => /^[A-Za-z0-9_-]+$/.test(i.id ?? "")).map(i => ({ id: i.id!, title: i.snippet?.title ?? "Untitled playlist", description: i.snippet?.description ?? "", itemCount: count(i.contentDetails?.itemCount) }));
    return { playlists, cursor: continuation(cursor.channelId, "playlists", "", cursor.level, data.nextPageToken), fetchedAt: new Date().toISOString() };
  }
  const data = await api("playlistItems", { part: "snippet", playlistId: cursor.playlistId, maxResults: size, ...(cursor.pageToken ? { pageToken: cursor.pageToken } : {}) });
  const ids = [...new Set((data.items ?? []).map(i => i.snippet?.resourceId?.videoId).filter((id): id is string => Boolean(id && /^[A-Za-z0-9_-]{11}$/.test(id))))];
  const details = ids.length ? await api("videos", { part: "snippet,contentDetails,statistics", id: ids.join(",") }) : { items: [] };
  const videos: AuditVideo[] = (details.items ?? []).filter(i => /^[A-Za-z0-9_-]{11}$/.test(i.id ?? "")).map(i => ({ id: i.id!, title: i.snippet?.title ?? "Untitled video", description: i.snippet?.description ?? "", publishedAt: i.snippet?.publishedAt ?? "", tags: i.snippet?.tags ?? [], categoryId: i.snippet?.categoryId ?? "", views: count(i.statistics?.viewCount), likes: optionalCount(i.statistics?.likeCount), comments: optionalCount(i.statistics?.commentCount), duration: i.contentDetails?.duration ?? "" }));
  return { videos, cursor: continuation(cursor.channelId, "videos", cursor.playlistId, cursor.level, data.nextPageToken), fetchedAt: new Date().toISOString() };
}
/** Walks several playlist pages so a deep audit covers the whole upload history. */
async function collectVideos(channelId: string, playlistId: string, level: AuditLevel, maxVideos: number, maxPages: number): Promise<{ videos: AuditVideo[]; cursor: string | null }> {
  const videos: AuditVideo[] = []; const seen = new Set<string>(); let pageToken: string | undefined; let cursor: string | null = null;
  for (let page = 0; page < maxPages && videos.length < maxVideos; page += 1) {
    const result = await loadAuditPage({ channelId, collection: "videos", playlistId, pageToken: pageToken ?? "", level });
    for (const video of result.videos ?? []) {
      if (seen.has(video.id)) continue;
      seen.add(video.id); videos.push(video);
    }
    const next = result.cursor ? readToken(result.cursor) : null;
    cursor = result.cursor;
    if (!next) break;
    pageToken = next;
  }
  return { videos: videos.slice(0, maxVideos), cursor };
}
function readToken(cursor: string): string | null {
  try { const [body, signature] = cursor.split("."); if (!body || !signature) return null; const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as { pageToken?: string }; return typeof parsed.pageToken === "string" && parsed.pageToken ? parsed.pageToken : null; } catch { return null; }
}
export async function startAudit(locator: ChannelLocator, level: AuditLevel, limits: { videos: number; playlists: number }): Promise<AuditReport> {
  const filter: Record<string, string> = locator.kind === "id" ? { id: locator.value } : locator.kind === "handle" ? { forHandle: locator.value } : { forUsername: locator.value };
  const data = await api("channels", { part: "snippet,statistics,contentDetails,brandingSettings", ...filter });
  const item = data.items?.[0]; const uploads = item?.contentDetails?.relatedPlaylists?.uploads;
  if (!item?.id || !uploads) throw new AuditError(404, "Channel not found. Try its current @handle or /channel/UC… URL; custom /c/ links are not supported.");
  const channel: AuditChannel = { id: item.id, title: item.snippet?.title ?? "YouTube channel", description: item.snippet?.description ?? "", handle: item.snippet?.customUrl ?? "", publishedAt: item.snippet?.publishedAt ?? "", country: item.snippet?.country ?? null, subscribers: item.statistics?.hiddenSubscriberCount ? null : optionalCount(item.statistics?.subscriberCount), views: count(item.statistics?.viewCount), videoCount: count(item.statistics?.videoCount), keywords: item.brandingSettings?.channel?.keywords ?? null };
  const maxPages = level === "full" ? 20 : level === "overview" ? 1 : 4;
  const videos = await collectVideos(item.id, uploads, level, limits.videos, maxPages);
  const playlists = await collectPlaylists(item.id, level, limits.playlists);
  return { channel, videos: videos.videos, playlists: playlists.playlists, videoCursor: videos.cursor, playlistCursor: playlists.cursor, fetchedAt: new Date().toISOString(), level };
}
async function collectPlaylists(channelId: string, level: AuditLevel, maxPlaylists: number): Promise<{ playlists: AuditPlaylist[]; cursor: string | null }> {
  const playlists: AuditPlaylist[] = []; const seen = new Set<string>(); let pageToken: string | undefined; let cursor: string | null = null;
  const maxPages = level === "full" ? 10 : level === "overview" ? 1 : 2;
  for (let page = 0; page < maxPages && playlists.length < maxPlaylists; page += 1) {
    const result = await loadAuditPage({ channelId, collection: "playlists", playlistId: "", pageToken: pageToken ?? "", level });
    for (const playlist of result.playlists ?? []) {
      if (seen.has(playlist.id)) continue;
      seen.add(playlist.id); playlists.push(playlist);
    }
    cursor = result.cursor;
    const next = result.cursor ? readToken(result.cursor) : null;
    if (!next) break;
    pageToken = next;
  }
  return { playlists: playlists.slice(0, maxPlaylists), cursor };
}
/** Re-fetches a channel's uploads for a server-side export. */
export async function collectChannelVideos(channelId: string, maxVideos: number): Promise<AuditVideo[]> {
  const data = await api("channels", { part: "contentDetails", id: channelId });
  const uploads = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new AuditError(404, "Channel not found.");
  const maxPages = Math.max(1, Math.ceil(maxVideos / 50));
  const collected = await collectVideos(channelId, uploads, "full", maxVideos, Math.min(20, maxPages));
  return collected.videos;
}
