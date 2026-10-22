import { categoryName } from "./categories";
import type { ChannelInsights } from "./insights";
import type { AuditChannel, AuditPlaylist, AuditVideo } from "./types";

export type ReportSummary = {
  channel: AuditChannel; videos: AuditVideo[]; playlists: AuditPlaylist[]; insights: ChannelInsights; fetchedAt: string;
};
const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const plain = (value: number) => new Intl.NumberFormat("en-US").format(value);
/** Plain-text audit summary used by the copy action and the exported report. */
export function buildSummaryText(summary: ReportSummary): string {
  const { channel, videos, playlists, insights } = summary;
  const lines: string[] = [];
  lines.push(`Channel Auditor report — ${channel.title}${channel.handle ? ` (${channel.handle})` : ""}`);
  lines.push(`Public channel data analysed on ${new Date(summary.fetchedAt).toISOString().slice(0, 10)} · ${videos.length} videos · ${playlists.length} playlists`);
  lines.push("");
  lines.push("CHANNEL");
  lines.push(`Subscribers: ${channel.subscribers === null ? "hidden by the creator" : plain(channel.subscribers)}`);
  lines.push(`Lifetime views: ${plain(channel.views)}`);
  lines.push(`Published videos: ${plain(channel.videoCount)}`);
  lines.push(`Channel created: ${channel.publishedAt ? channel.publishedAt.slice(0, 10) : "unknown"}`);
  if (channel.keywords) lines.push(`Channel keywords: ${channel.keywords}`);
  lines.push("");
  lines.push("CONTENT SIGNALS");
  lines.push(`Main category: ${insights.categories[0]?.name ?? "not available"}`);
  lines.push(`Upload pace: ${insights.uploadsPerMonth.toFixed(1)} videos per month`);
  lines.push(`Engagement (likes + comments ÷ views): ${insights.engagement === null ? "not available" : `${insights.engagement.toFixed(2)}%`}`);
  lines.push(`Tag coverage: ${insights.tagCoverage.toFixed(0)}% of analysed videos carry tags`);
  if (insights.best) lines.push(`Best performing video by views: "${insights.best.title}" — ${compact(insights.best.views)} views`);
  if (insights.worst) lines.push(`Lowest performing video by views: "${insights.worst.title}" — ${compact(insights.worst.views)} views`);
  if (insights.topPhrases[0]) lines.push(`Strongest repeated phrase: "${insights.topPhrases[0].phrase}" (${insights.topPhrases[0].videos} videos)`);
  if (insights.weakPhrases[0]) lines.push(`Weakest repeated phrase: "${insights.weakPhrases[0].phrase}" (average ${compact(insights.weakPhrases[0].averageViews)} views)`);
  lines.push("");
  lines.push("TOP VIDEOS");
  for (const video of [...videos].sort((a, b) => b.views - a.views).slice(0, 10)) lines.push(`- ${video.title} — ${plain(video.views)} views · ${video.publishedAt.slice(0, 10)} · ${categoryName(video.categoryId)}`);
  lines.push("");
  lines.push("NOTES");
  lines.push("Views, likes, comments, tags, playlists and categories are public YouTube data.");
  lines.push("CPM, RPM and revenue figures are modelled scenarios from the ytcpm.online benchmark model, not the channel's real earnings.");
  lines.push("Keywords are phrases inferred from public titles and tags; they are not verified search volumes or search rankings.");
  return lines.join("\n");
}
