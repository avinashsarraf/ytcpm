import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuditLevel } from "./types";
import type { AuditPlan } from "./catalog";
export type AuditCursor = { channelId: string; collection: "videos" | "playlists"; playlistId: string; pageToken: string; level: AuditLevel; expires: number };
const secret = () => { const value = process.env.AUDIT_SIGNING_SECRET; if (!value || value.length < 32) throw new Error("Audit signing is not configured"); return value; };
export function signCursor(value: Omit<AuditCursor, "expires">) {
  const body = Buffer.from(JSON.stringify({ ...value, expires: Date.now() + 60 * 60 * 1000 })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function readCursor(raw: unknown): AuditCursor | null {
  if (typeof raw !== "string" || raw.length > 4096) return null;
  try {
    const [body, signature, extra] = raw.split("."); if (!body || !signature || extra) return null;
    const expected = createHmac("sha256", secret()).update(body).digest(); const supplied = Buffer.from(signature, "base64url");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const value = JSON.parse(Buffer.from(body, "base64url").toString()) as AuditCursor;
    if (!/^UC[A-Za-z0-9_-]{22}$/.test(value.channelId) || !["videos", "playlists"].includes(value.collection) || !["overview", "full"].includes(value.level) || typeof value.pageToken !== "string" || value.pageToken.length > 1000 || typeof value.playlistId !== "string" || value.playlistId.length > 100 || !Number.isFinite(value.expires) || value.expires < Date.now()) return null;
    return value;
  } catch { return null; }
}
export type ExportToken = { channelId: string; level: AuditPlan; expires: number };
/** Signed export token: the export endpoint re-fetches data instead of trusting client input. */
export function signExport(channelId: string, level: AuditPlan): string {
  const body = Buffer.from(JSON.stringify({ channelId, level, expires: Date.now() + 30 * 60 * 1000 })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function readExport(raw: unknown): ExportToken | null {
  if (typeof raw !== "string" || raw.length > 4096) return null;
  try {
    const [body, signature, extra] = raw.split("."); if (!body || !signature || extra) return null;
    const expected = createHmac("sha256", secret()).update(body).digest(); const supplied = Buffer.from(signature, "base64url");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const value = JSON.parse(Buffer.from(body, "base64url").toString()) as ExportToken;
    if (!/^UC[A-Za-z0-9_-]{22}$/.test(value.channelId) || !["free", "half", "full"].includes(value.level) || !Number.isFinite(value.expires) || value.expires < Date.now()) return null;
    return value;
  } catch { return null; }
}
