export type ChannelLocator = { kind: "id" | "handle" | "username"; value: string };
const channelId = /^UC[A-Za-z0-9_-]{22}$/;
const handle = /^[\p{L}\p{M}\p{N}_.\-·]{1,100}$/u;
/** Resolve identifiers, never fetch a user-provided URL (SSRF protection). */
export function parseChannelInput(raw: unknown): ChannelLocator | null {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 300) return null;
  const value = raw.trim();
  if (channelId.test(value)) return { kind: "id", value };
  if (value.startsWith("@") && handle.test(value.slice(1))) return { kind: "handle", value: value.slice(1) };
  try {
    const url = new URL(value.startsWith("youtube.com/") || value.startsWith("www.youtube.com/") ? `https://${value}` : value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) return null;
    const parts = decodeURIComponent(url.pathname).split("/").filter(Boolean);
    if (parts.length > 2 && !["videos", "shorts", "streams", "playlists", "featured", "about"].includes(parts[parts.length - 1])) return null;
    if (parts[0]?.startsWith("@") && parts.length <= 2 && handle.test(parts[0].slice(1))) return { kind: "handle", value: parts[0].slice(1) };
    if (parts[0] === "channel" && channelId.test(parts[1] ?? "") && parts.length <= 3) return { kind: "id", value: parts[1] };
    if (parts[0] === "user" && /^[A-Za-z0-9_.-]{1,100}$/.test(parts[1] ?? "") && parts.length <= 3) return { kind: "username", value: parts[1] };
  } catch { /* Unsupported input is a validation error, never a network target. */ }
  return null;
}
