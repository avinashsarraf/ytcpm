import type { AuditDepth } from "./catalog";
export type { AuditDepth };
export type AuditVideo = {
  id: string; title: string; description: string; publishedAt: string; tags: string[];
  categoryId: string; views: number; likes: number | null; comments: number | null; duration: string;
};
export type AuditPlaylist = { id: string; title: string; description: string; itemCount: number };
export type AuditChannel = { id: string; title: string; description: string; handle: string; publishedAt: string; country: string | null; subscribers: number | null; views: number; videoCount: number; keywords: string | null };
export type AuditReport = {
  channel: AuditChannel; videos: AuditVideo[]; playlists: AuditPlaylist[];
  videoCursor: string | null; playlistCursor: string | null;
  fetchedAt: string; level: AuditDepth; isDemo?: boolean;
};
export type AuditPage = { videos?: AuditVideo[]; playlists?: AuditPlaylist[]; cursor: string | null; fetchedAt: string };
