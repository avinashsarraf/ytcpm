import type { AuditPlaylist, AuditReport, AuditVideo } from "./types";
/** Deterministic sample channel so the UI can be reviewed without API access. */
const DAY = 86_400_000;
const base = Date.parse("2026-10-20T00:00:00Z");
const titles = [
  "We tested 5 budget laptops for video editing", "The 10 minute setup that doubles your editing speed",
  "Quiet mechanical keyboards worth buying in 2026", "Why your renders look slow (and how to fix it)",
  "Portable SSD speed test — 8 real files", "Free tools that replace expensive editing software",
  "Camera settings for solo creators", "Monitors for editing: what actually matters",
  "Microphones under $80 compared honestly", "Colour grading basics for beginners",
  "Migrating a project from an old laptop", "Desk setups that keep focus (2026)",
];
const tagsFor = (i: number) => ["tech review", "editing", "creator setup", "gear", i % 2 ? "productivity" : "budget tech"].slice(0, 3 + (i % 3));
const viewsFor = (i: number) => [184_320, 96_450, 58_120, 41_990, 27_400, 18_760, 12_300, 9_450, 7_180, 4_920, 3_310, 2_140][i] ?? 1_000;
export function sampleReport(): AuditReport {
  const videos: AuditVideo[] = titles.map((title, i) => ({
    id: `sample${String(i).padStart(8, "0")}`,
    title,
    description: i % 3 === 0 ? `Full notes, timings and gear links in the description.\n\nChapters:\n0:00 Intro\n1:20 Setup\n4:30 Results` : "Sample description from the demonstration report.",
    publishedAt: new Date(base - i * 11 * DAY).toISOString(),
    tags: tagsFor(i),
    categoryId: "17",
    views: viewsFor(i),
    likes: Math.round(viewsFor(i) * (0.031 - i * 0.0012)),
    comments: Math.round(viewsFor(i) * (0.0032 - i * 0.00015)),
    duration: `PT${8 + i}M${(i * 7) % 60}S`,
  }));
  const playlists: AuditPlaylist[] = [
    { id: "sample-pl-1", title: "Editing workflow series", description: "Step-by-step editing workflow episodes.", itemCount: 6 },
    { id: "sample-pl-2", title: "Budget gear picks", description: "Short, honest gear recommendations.", itemCount: 9 },
  ];
  return {
    channel: { id: "sample-channel", title: "Sample Tech Channel", description: "Demonstration channel used to preview the auditor layout. This is not a real channel and every figure is synthetic.", handle: "@sample-tech-channel", publishedAt: "2021-04-12T00:00:00Z", country: "IN", subscribers: 248_300, views: 19_400_000, videoCount: 214, keywords: "tech, editing, creator gear" },
    videos, playlists, videoCursor: null, playlistCursor: null,
    fetchedAt: new Date(base).toISOString(), level: "standard", isDemo: true,
  };
}
