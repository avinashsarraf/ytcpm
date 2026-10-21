import type { AuditVideo } from "./types";
const stop = new Set("the and for with from this that your you how what why are was will have into our new best top video videos youtube channel shorts official to in on is of a an it as at by we my me be or not can vs".split(" "));
const signals: Record<string, string[]> = {
  "finance-investing": ["investing", "finance", "stocks", "portfolio", "dividend", "trading"],
  "technology-software": ["software", "coding", "programming", "javascript", "python", "technology", "laptop", "smartphone", "developer"],
  "gaming": ["gaming", "gameplay", "minecraft", "fortnite", "roblox", "playthrough"],
  "education-science": ["science", "lesson", "education", "physics", "mathematics", "chemistry"],
  "health-fitness": ["fitness", "workout", "exercise", "nutrition", "yoga"],
  "travel": ["travel", "tourism", "itinerary", "backpacking"],
  "food-cooking": ["recipe", "cooking", "baking", "cuisine"],
  "music": ["music", "guitar", "piano", "song", "singing"],
};
export function viewsPerDay(video: AuditVideo, now = Date.now()) {
  const age = now - Date.parse(video.publishedAt);
  return Number.isFinite(age) ? video.views / Math.max(1, age / 86400000) : 0;
}
export function analyzeVideos(videos: AuditVideo[], channelDescription = "") {
  const phrases = new Map<string, { phrase: string; videos: number; associatedViews: number; source: "tag" | "title" }>();
  for (const video of videos) {
    const terms = new Map<string, "tag" | "title">();
    for (const word of video.title.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []) if (!stop.has(word) && !/^\d+$/.test(word)) terms.set(word, "title");
    for (const tag of video.tags) if (tag.trim()) terms.set(tag.trim().toLocaleLowerCase(), "tag");
    for (const [phrase, source] of terms) { const previous = phrases.get(phrase); phrases.set(phrase, { phrase, source: previous?.source === "tag" ? "tag" : source, videos: (previous?.videos ?? 0) + 1, associatedViews: (previous?.associatedViews ?? 0) + video.views }); }
  }
  const text = `${channelDescription} ${videos.map(v => `${v.title} ${v.tags.join(" ")}`).join(" ")}`.toLowerCase();
  const words = new Set(text.match(/[\p{L}\p{N}]+/gu) ?? []);
  const niches = Object.entries(signals).map(([slug, terms]) => ({ slug, signals: terms.filter(term => words.has(term)).length })).filter(n => n.signals > 0).sort((a,b) => b.signals - a.signals);
  return {
    phrases: [...phrases.values()].sort((a,b) => b.associatedViews - a.associatedViews || b.videos - a.videos).slice(0, 40),
    niche: niches[0]?.slug ?? null, nicheSignals: niches[0]?.signals ?? 0,
    missingDescriptions: videos.filter(v => !v.description.trim()).length,
    withTags: videos.filter(v => v.tags.length > 0).length,
    views: videos.reduce((sum, v) => sum + v.views, 0),
  };
}
