"use client";

import { useMemo, useState } from "react";
import {
  Activity, BarChart3, CalendarClock, Copy, Download, Eye, FileSearch,
  Hash, Heart, ListVideo, PlayCircle, Search, Sparkles, Tag, TrendingDown, TrendingUp,
  Users, X,
} from "lucide-react";
import { COUNTRIES, NICHES, localMoney, money, viewsLabel } from "@/lib/data";
import { buildInsights, type ChannelInsights } from "@/lib/auditor/insights";
import { buildScenario, WORLDWIDE } from "@/lib/auditor/estimate";
import { buildSummaryText } from "@/lib/auditor/report";
import { sampleReport } from "@/lib/auditor/sample";
import type { AuditReport } from "@/lib/auditor/types";

type SortKey = "views" | "published" | "engagement" | "title";
const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "videos", label: "Videos", icon: ListVideo },
  { id: "keywords", label: "Keywords", icon: Hash },
  { id: "revenue", label: "Revenue scenarios", icon: BarChart3 },
] as const;
type TabId = (typeof TABS)[number]["id"];

const num = (value: number) => value.toLocaleString("en-US");
const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const date = (value: string) => (value ? new Date(value).toISOString().slice(0, 10) : "—");

/** Public channel audit. Public, inferred and estimated data stay visibly separate. */
export default function ChannelAuditor() {
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [insights, setInsights] = useState<ChannelInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exportToken, setExportToken] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("views");
  const [query, setQuery] = useState("");
  const [marketSlug, setMarketSlug] = useState("worldwide");
  const [nicheSlug, setNicheSlug] = useState("technology-software");

  const insightsFor = useMemo(() => {
    if (!report) return null;
    return buildInsights(report.videos, { publishedAt: report.channel.publishedAt, description: report.channel.description, views: report.channel.views });
  }, [report]);
  const scenario = useMemo(() => {
    if (!report) return null;
    return buildScenario(report.videos, { marketSlug, nicheSlug, lifetimeViews: report.channel.views });
  }, [report, marketSlug, nicheSlug]);

  const runAudit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); setNotice(null);
    if (!input.trim()) { setError("Enter a channel URL or @handle first."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/channel-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: input }) });
      const data = await response.json().catch(() => null) as { report?: AuditReport; exportToken?: string; error?: string; code?: string } | null;
      if (!response.ok || !data?.report) {
        if (data?.code === "premium_required") setError("This audit depth is not available on your access.");
        else setError(data?.error ?? "The audit could not finish. Please try again.");
        return;
      }
      setReport(data.report); setExportToken(data.exportToken ?? null);
      setInsights(buildInsights(data.report.videos, { publishedAt: data.report.channel.publishedAt, description: data.report.channel.description, views: data.report.channel.views }));
      setNotice(`Audited ${data.report.videos.length} public videos and ${data.report.playlists.length} playlists.`);
    } catch { setError("The audit could not reach the server. Please try again."); }
    finally { setLoading(false); }
  };

  const loadSample = () => {
    const sample = sampleReport();
    setReport(sample); setExportToken(null);
    setInsights(buildInsights(sample.videos, { publishedAt: sample.channel.publishedAt, description: sample.channel.description, views: sample.channel.views }));
    setNotice("Showing a labeled sample report so you can review the format.");
    setError(null);
  };

  const copyReport = async () => {
    if (!report || !insights) return;
    const text = buildSummaryText({ channel: report.channel, videos: report.videos, playlists: report.playlists, insights, fetchedAt: report.fetchedAt });
    try { await navigator.clipboard.writeText(text); setNotice("Audit summary copied to your clipboard."); }
    catch { setNotice("Copying is blocked in this browser. Select the summary text manually."); }
  };

  const downloadCsv = async () => {
    if (!exportToken) { setNotice("Run a live audit to download the CSV — the sample report has no channel to export."); return; }
    setNotice("Preparing your CSV…");
    try {
      const response = await fetch("/api/channel-audit/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: exportToken }) });
      if (!response.ok) { const data = await response.json().catch(() => null) as { error?: string } | null; setNotice(data?.error ?? "The download is not available for this audit."); return; }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `channel-audit-${report?.channel.id.slice(-6) ?? "report"}.csv`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      setNotice("CSV downloaded.");
    } catch { setNotice("The download could not be prepared. Please try again."); }
  };

  const sortedVideos = useMemo(() => {
    if (!insights) return [];
    const filtered = insights.videos.filter(video => !query.trim() || video.title.toLowerCase().includes(query.trim().toLowerCase()));
    return [...filtered].sort((a, b) => sort === "views" ? b.views - a.views : sort === "published" ? Date.parse(b.publishedAt) - Date.parse(a.publishedAt) : sort === "engagement" ? (b.engagement ?? -1) - (a.engagement ?? -1) : a.title.localeCompare(b.title));
  }, [insights, sort, query]);

  const market = marketSlug === "worldwide" ? WORLDWIDE : COUNTRIES.find(c => c.slug === marketSlug) ?? WORLDWIDE;
  const niche = NICHES.find(n => n.slug === nicheSlug) ?? NICHES[0];

  return <div className="auditor-shell">
    <div className="auditor-toolbar">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yt-red-light text-yt-red"><FileSearch aria-hidden className="h-5 w-5" /></span>
        <div className="min-w-0"><p className="truncate text-sm font-bold text-heading">Channel Auditor</p><p className="mt-0.5 truncate text-xs leading-5 text-fog">Public channel data · no login needed</p></div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-2 text-[11px] font-semibold text-mint"><span className="h-1.5 w-1.5 rounded-full bg-mint" />Free · no signup</span>
    </div>

    <form onSubmit={runAudit} className="auditor-inputs border-b border-border p-4 sm:p-6 lg:p-7">
      <label htmlFor="channel-input" className="flex items-center gap-2 text-sm font-semibold text-fog"><PlayCircle aria-hidden className="h-4 w-4 text-yt-red" />Channel URL or @handle</label>
      <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
        <div className="field-with-icon relative flex min-w-0 flex-1 items-center">
          <Search aria-hidden className="pointer-events-none absolute left-3.5 h-4 w-4 text-fog" />
          <input id="channel-input" value={input} onChange={event => setInput(event.target.value)} placeholder="youtube.com/@channel or @handle" className="field pl-10" autoComplete="off" spellCheck={false} />
        </div>
        <button type="submit" disabled={loading} className="hot-gradient inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-[0_6px_18px_-8px_rgba(238,18,73,0.65)] transition-opacity disabled:opacity-60">
          {loading ? "Auditing…" : "Run free audit"}<Sparkles aria-hidden className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="text-xs leading-6 text-fog">Every audit is free right now and covers the full public channel — no depth limits, no signup, no card.</p>
        <button type="button" onClick={loadSample} className="ml-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-fog hover:border-yt-red/25 hover:text-heading">View sample report</button>
      </div>
      <div aria-live="polite" className="mt-3 min-h-5 text-xs font-semibold text-mint">{notice}</div>
      {error && <p role="alert" className="mt-1 flex items-start gap-2 rounded-lg border border-yt-red/25 bg-yt-red-light px-3 py-2 text-xs font-semibold leading-5 text-yt-red"><X aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}</p>}
    </form>

    {!report ? <div className="auditor-empty px-5 py-12 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface text-fog"><FileSearch aria-hidden className="h-6 w-6" /></span>
      <p className="mt-4 text-base font-bold text-heading">Paste a channel to start the audit</p>
      <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-7 text-fog">Public videos, playlists, tags, keywords, best and worst performers plus clearly labeled CPM/RPM revenue scenarios. Private analytics stay private.</p>
    </div> : <div className="min-w-0">
      <div className="auditor-channel border-b border-border bg-gradient-to-br from-[#f7f8fb] to-white p-4 sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-heading sm:text-2xl">{report.channel.title}</h2>
              {report.isDemo && <span className="rounded-full border border-gold/30 bg-amber-bg px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-gold">Sample data</span>}
            </div>
            <p className="mt-1 text-sm text-fog">{report.channel.handle ? `@${report.channel.handle.replace(/^@/, "")}` : "Public channel"} · created {date(report.channel.publishedAt)}</p>
            {report.channel.keywords && <p className="mt-2 text-xs text-fog"><span className="font-semibold text-heading">Channel keywords:</span> {report.channel.keywords}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copyReport} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-xs font-bold text-heading hover:border-yt-red/30"><Copy aria-hidden className="h-4 w-4 text-yt-red" />Copy summary</button>
            <button type="button" onClick={downloadCsv} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-xs font-bold text-heading hover:border-yt-red/30"><Download aria-hidden className="h-4 w-4 text-yt-red" />Download CSV</button>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Subscribers", value: report.channel.subscribers === null ? "Hidden" : compact(report.channel.subscribers), icon: Users, tag: "Public" },
            { label: "Lifetime views", value: compact(report.channel.views), icon: Eye, tag: "Public" },
            { label: "Published videos", value: compact(report.channel.videoCount), icon: ListVideo, tag: "Public" },
            { label: "Uploads / month", value: insights?.uploadsPerMonth.toFixed(1) ?? "—", icon: CalendarClock, tag: "Inferred" },
            { label: "Engagement rate", value: insights?.engagement === null || insights?.engagement === undefined ? "—" : `${insights.engagement.toFixed(2)}%`, icon: Heart, tag: "Inferred" },
            { label: "Tag coverage", value: insights ? `${insights.tagCoverage.toFixed(0)}%` : "—", icon: Tag, tag: "Inferred" },
          ].map(({ label, value, icon: Icon, tag }) => <div key={label} className="rounded-2xl border border-border/80 bg-white p-3.5 shadow-[0_2px_8px_-4px_rgba(15,40,30,0.08)]">
            <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase leading-4 tracking-wider text-fog"><Icon aria-hidden className="h-3 w-3 shrink-0 text-yt-red" />{label}</dt>
            <dd className="mt-2 font-mono text-lg font-bold tracking-tight text-heading">{value}<span className="ml-1.5 align-middle rounded bg-surface px-1.5 py-0.5 font-sans text-[9px] font-semibold text-fog">{tag}</span></dd>
          </div>)}
        </dl>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2.5 sm:px-5" role="tablist" aria-label="Audit sections">
        {TABS.map(({ id, label, icon: Icon }) => <button key={id} role="tab" type="button" id={`auditor-tab-${id}`} aria-selected={tab === id} aria-controls={`auditor-panel-${id}`} onClick={() => setTab(id)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition-colors ${tab === id ? "bg-yt-red-light text-yt-red" : "text-fog hover:bg-surface hover:text-heading"}`}><Icon aria-hidden className="h-4 w-4" />{label}</button>)}
      </div>

      <div id={`auditor-panel-${tab}`} role="tabpanel" aria-labelledby={`auditor-tab-${tab}`} className="auditor-panel p-4 sm:p-6 lg:p-7">
        {tab === "overview" && insights && <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-heading"><TrendingUp aria-hidden className="h-4 w-4 text-mint" />Best and worst performers</h3>
            <ul className="mt-4 space-y-3">
              {[{ title: "Most viewed", video: insights.best, tone: "mint" as const }, { title: "Fastest rising (views per day)", video: insights.fastest, tone: "mint" as const }, { title: "Lowest viewed", video: insights.worst, tone: "red" as const }].map(row => <li key={row.title} className="rounded-xl border border-border/80 bg-surface/60 p-3.5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-fog">{row.title}</p>
                {row.video ? <p className="mt-1.5 text-sm font-semibold leading-6 text-heading">{row.video.title}</p> : <p className="mt-1.5 text-sm text-fog">Not enough public data.</p>}
                {row.video && <p className="mt-1 font-mono text-xs text-fog">{compact(row.video.views)} views · {num(Math.round(row.video.viewsPerDay))} per day · {row.video.categoryName}</p>}
              </li>)}
            </ul>
          </section>
          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-heading"><ListVideo aria-hidden className="h-4 w-4 text-yt-red" />Categories and playlists</h3>
            <ul className="mt-4 space-y-2.5">{insights.categories.map(category => <li key={category.id}>
              <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-heading">{category.name}</span><span className="font-mono text-fog">{category.videos} videos · {compact(category.views)} views</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-yt-red/70" style={{ width: `${Math.max(3, (category.views / Math.max(1, insights.categories[0]?.views ?? 1)) * 100)}%` }} /></div>
            </li>)}</ul>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-fog">Playlists</p>
            <ul className="mt-2 space-y-1.5">{report.playlists.slice(0, 6).map(playlist => <li key={playlist.id} className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold text-heading">{playlist.title}</span><span className="shrink-0 font-mono text-fog">{playlist.itemCount} items</span></li>)}</ul>
            {!report.playlists.length && <p className="mt-2 text-xs text-fog">No public playlists were returned for this channel.</p>}
          </section>
          <section className="rounded-2xl border border-border bg-white p-5 lg:col-span-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-heading"><Activity aria-hidden className="h-4 w-4 text-yt-red" />Content health</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[{ label: "Videos analysed", value: num(report.videos.length), note: "public uploads in this audit" }, { label: "Missing descriptions", value: num(insights.missingDescriptions), note: "helps search and discovery" }, { label: "Inferred niche", value: insights.inferredNiche ? NICHES.find(n => n.slug === insights.inferredNiche)?.name ?? insights.inferredNiche : "Not confident", note: "from titles, tags and description" }, { label: "Strongest phrase", value: insights.topPhrases[0]?.phrase ?? "—", note: `${insights.topPhrases[0]?.videos ?? 0} videos carry it` }].map(item => <div key={item.label} className="rounded-xl border border-border/80 bg-surface/60 p-3.5"><dt className="font-mono text-[9px] uppercase tracking-wider text-fog">{item.label}</dt><dd className="mt-1.5 text-sm font-bold text-heading"><span className="block truncate">{item.value}</span><span className="mt-1 block text-[11px] font-normal leading-5 text-fog">{item.note}</span></dd></div>)}
            </dl>
          </section>
        </div>}

        {tab === "videos" && insights && <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex min-w-0 flex-1 items-center sm:max-w-xs">
              <Search aria-hidden className="pointer-events-none absolute left-3 h-4 w-4 text-fog" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter analysed videos…" aria-label="Filter analysed videos" className="field pl-9" />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-fog">Sort<select value={sort} onChange={event => setSort(event.target.value as SortKey)} className="select-field py-2"><option value="views">Most viewed</option><option value="published">Newest</option><option value="engagement">Engagement</option><option value="title">Title A–Z</option></select></label>
          </div>
          <div className="table-scroll mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[720px] text-left text-xs">
              <caption className="sr-only">Public videos analysed for this channel</caption>
              <thead className="bg-surface text-[10px] uppercase tracking-wider text-fog"><tr><th scope="col" className="px-4 py-3 font-semibold">Video</th><th scope="col" className="px-4 py-3 font-semibold">Published</th><th scope="col" className="px-4 py-3 font-semibold">Views</th><th scope="col" className="px-4 py-3 font-semibold">Likes</th><th scope="col" className="px-4 py-3 font-semibold">Comments</th><th scope="col" className="px-4 py-3 font-semibold">Engagement</th><th scope="col" className="px-4 py-3 font-semibold">Per day</th><th scope="col" className="px-4 py-3 font-semibold">Category</th></tr></thead>
              <tbody>{sortedVideos.map(video => <tr key={video.id} className="border-t border-border/70">
                <th scope="row" className="max-w-[280px] px-4 py-3 text-left font-semibold leading-5 text-heading"><span className="line-clamp-2">{video.title}</span></th>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-fog">{date(video.publishedAt)}</td>
                <td className="px-4 py-3 font-mono font-bold text-heading">{num(video.views)}</td>
                <td className="px-4 py-3 font-mono text-fog">{video.likes === null ? "—" : num(video.likes)}</td>
                <td className="px-4 py-3 font-mono text-fog">{video.comments === null ? "—" : num(video.comments)}</td>
                <td className="px-4 py-3 font-mono text-fog">{video.engagement === null ? "—" : `${video.engagement.toFixed(2)}%`}</td>
                <td className="px-4 py-3 font-mono text-fog">{num(Math.round(video.viewsPerDay))}</td>
                <td className="px-4 py-3 text-fog">{video.categoryName}</td>
              </tr>)}</tbody>
            </table>
          </div>
          {!sortedVideos.length && <p className="mt-4 text-sm text-fog">No analysed video matches that filter.</p>}
        </div>}

        {tab === "keywords" && insights && <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-heading"><TrendingUp aria-hidden className="h-4 w-4 text-mint" />Strongest repeated phrases</h3>
            <p className="mt-1.5 text-xs leading-5 text-fog">Phrases seen across analysed titles and public tags, ranked by associated views.</p>
            <div className="table-scroll mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs">
              <caption className="sr-only">Most repeated phrases with associated views</caption>
              <thead className="bg-surface text-[10px] uppercase tracking-wider text-fog"><tr><th scope="col" className="px-3 py-2.5 font-semibold">Phrase</th><th scope="col" className="px-3 py-2.5 font-semibold">Videos</th><th scope="col" className="px-3 py-2.5 font-semibold">Avg views</th><th scope="col" className="px-3 py-2.5 font-semibold">Source</th></tr></thead>
              <tbody>{insights.topPhrases.slice(0, 12).map(phrase => <tr key={phrase.phrase} className="border-t border-border/70"><th scope="row" className="px-3 py-2.5 text-left font-semibold text-heading">{phrase.phrase}</th><td className="px-3 py-2.5 font-mono text-fog">{phrase.videos}</td><td className="px-3 py-2.5 font-mono text-heading">{compact(phrase.averageViews)}</td><td className="px-3 py-2.5 text-fog">{phrase.source === "tag" ? "Tag" : "Title"}</td></tr>)}</tbody>
            </table></div>
          </section>
          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-heading"><TrendingDown aria-hidden className="h-4 w-4 text-yt-red" />Weakest repeated phrases</h3>
            <p className="mt-1.5 text-xs leading-5 text-fog">Phrases used on two or more videos with the lowest average views. Not a ranking or search-volume verdict.</p>
            <div className="table-scroll mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs">
              <caption className="sr-only">Least performing repeated phrases by average views</caption>
              <thead className="bg-surface text-[10px] uppercase tracking-wider text-fog"><tr><th scope="col" className="px-3 py-2.5 font-semibold">Phrase</th><th scope="col" className="px-3 py-2.5 font-semibold">Videos</th><th scope="col" className="px-3 py-2.5 font-semibold">Avg views</th><th scope="col" className="px-3 py-2.5 font-semibold">Source</th></tr></thead>
              <tbody>{insights.weakPhrases.slice(0, 12).map(phrase => <tr key={phrase.phrase} className="border-t border-border/70"><th scope="row" className="px-3 py-2.5 text-left font-semibold text-heading">{phrase.phrase}</th><td className="px-3 py-2.5 font-mono text-fog">{phrase.videos}</td><td className="px-3 py-2.5 font-mono text-heading">{compact(phrase.averageViews)}</td><td className="px-3 py-2.5 text-fog">{phrase.source === "tag" ? "Tag" : "Title"}</td></tr>)}</tbody>
            </table></div>
          </section>
        </div>}

        {tab === "revenue" && scenario && <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-heading"><BarChart3 aria-hidden className="h-4 w-4 text-yt-red" />Scenario assumptions</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-heading">Audience market<select value={marketSlug} onChange={event => setMarketSlug(event.target.value)} className="select-field mt-1.5"><option value="worldwide">Worldwide (unweighted)</option>{COUNTRIES.map(country => <option key={country.slug} value={country.slug}>{country.name}</option>)}</select></label>
              <label className="block text-xs font-semibold text-heading">Niche assumption<select value={nicheSlug} onChange={event => setNicheSlug(event.target.value)} className="select-field mt-1.5">{NICHES.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
            </div>
            <p className="mt-3 text-xs leading-6 text-fog">The audience market is your assumption, not channel data — a public URL never reveals the viewer-country mix. Swap both values to compare planning scenarios.</p>
            <dl className="mt-4 space-y-2.5 text-xs">
              {[{ label: "Long-form views analysed", value: num(scenario.longViews) }, { label: "Shorts views analysed", value: num(scenario.shortViews) }, { label: "Recent views per day (median)", value: num(Math.round(scenario.dailyViews)) }].map(item => <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface/60 px-3.5 py-2.5"><dt className="font-semibold text-fog">{item.label}</dt><dd className="font-mono font-bold text-heading">{item.value}</dd></div>)}
            </dl>
          </section>
          <section className="rounded-2xl border border-mint/20 bg-gradient-to-br from-[#f0f8f5] via-[#f8fbfa] to-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-heading"><TrendingUp aria-hidden className="h-4 w-4 text-mint" />Modelled revenue scenarios</h3>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-gold">Estimated · not the channel&apos;s real earnings</p>
            <dl className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[{ label: "Advertiser CPM", value: `${localMoney(scenario.cpmLow, market, 2)} – ${localMoney(scenario.cpmHigh, market, 2)}`, note: "per 1,000 ad impressions" },
                { label: "Creator RPM (long-form)", value: `${localMoney(scenario.longRpmLow, market, 2)} – ${localMoney(scenario.longRpmHigh, market, 2)}`, note: "after the 55% creator share" },
                { label: "Creator RPM (Shorts)", value: `${localMoney(scenario.shortRpmLow, market, 2)} – ${localMoney(scenario.shortRpmHigh, market, 2)}`, note: "engaged-view scenario" },
                { label: "Monthly run rate", value: `${localMoney(scenario.monthlyLow, market)} – ${localMoney(scenario.monthlyHigh, market)}`, note: "from the median daily velocity" },
                { label: "Lifetime scenario", value: `${money(scenario.lifetimeLow)} – ${money(scenario.lifetimeHigh)}`, note: "public lifetime views at this CPM" },
                { label: "Monthly views modelled", value: num(Math.round(scenario.monthlyViews)), note: "median views per day × 30" }].map(item => <div key={item.label} className="rounded-xl border border-border/80 bg-white/90 p-3.5"><dt className="font-mono text-[9px] uppercase tracking-wider text-fog">{item.label}</dt><dd className="mt-1.5 break-all font-mono text-sm font-bold text-heading">{item.value}<span className="mt-1 block text-[11px] font-normal leading-5 text-fog">{item.note}</span></dd></div>)}
            </dl>
            <p className="mt-4 text-[11px] leading-5 text-fog">{niche.name} · {market.name} · figures come from the ytcpm.online {new Date().getFullYear()} benchmark model. A channel&apos;s actual CPM, RPM, impressions and revenue are private.</p>
          </section>
        </div>}
      </div>
    </div>}

  </div>;
}
