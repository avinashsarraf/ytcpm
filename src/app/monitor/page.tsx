import type { Metadata } from "next";
import { sql, desc, gte, count } from "drizzle-orm";
import Link from "next/link";
import { Activity, Database, MousePointerClick, CircleDollarSign, Globe2, Layers, Clock3 } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { calculations } from "@/db/schema";
import { Reveal } from "@/components/motion";
import { StatBar } from "@/components/charts";
import { viewsLabel, money } from "@/lib/data";
import { logOnce } from "@/lib/log";

export const metadata: Metadata = { title: "Calculator API Usage Monitor", description: "Usage analytics for the ytcpm.online YouTube CPM calculator.", robots: { index: false, follow: true }, alternates: { canonical: "/monitor" } };

/**
 * Rendered on demand, never prerendered: a build-time query against the
 * placeholder DATABASE_URL produced noise in CI/Docker builds and cached a
 * "database not connected" page for the first minute after a deploy.
 * Results are memoised in-process instead (cheap, per-instance, 60s).
 */
export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 60_000;
const FAILURE_TTL_MS = 15_000;

interface DayRow { day: string; dv: string; c: number }
interface GroupRow { name: string; c: number }

type Stats = Awaited<ReturnType<typeof loadStats>>;

let cache: { at: number; value: Stats } | null = null;

async function getStats(): Promise<Stats> {
  if (cache && Date.now() - cache.at < (cache.value.ok ? CACHE_TTL_MS : FAILURE_TTL_MS)) {
    return cache.value;
  }
  const value = await loadStats();
  cache = { at: Date.now(), value };
  return value;
}

async function loadStats() {
  if (!isDatabaseConfigured()) return { ok: false as const };
  try {
    const [totalRow] = await db.select({ c: count() }).from(calculations);
    const [avgRow] = await db.select({ avg: sql<number>`coalesce(avg((est_low::numeric + est_high::numeric) / 2), 0)` }).from(calculations);
    const [weekRow] = await db.select({ c: count() }).from(calculations).where(gte(calculations.createdAt, sql`now() - interval '7 days'`));
    const byNiche = (await db.select({ name: calculations.nicheName, c: count() }).from(calculations).groupBy(calculations.nicheName).orderBy(desc(count())).limit(8)) as GroupRow[];
    const byCountry = (await db.select({ name: calculations.countryName, c: count() }).from(calculations).groupBy(calculations.countryName).orderBy(desc(count())).limit(8)) as GroupRow[];
    const byDay = (await db.select({ day: sql<string>`to_char(date_trunc('day', created_at), 'DD Mon')`, dv: sql<string>`to_char(date_trunc('day', created_at), 'YYYY-MM-DD')`, c: count() }).from(calculations).where(gte(calculations.createdAt, sql`now() - interval '14 days'`)).groupBy(sql`date_trunc('day', created_at)`).orderBy(sql`date_trunc('day', created_at)`)) as unknown as DayRow[];
    const recent = await db.select().from(calculations).orderBy(desc(calculations.createdAt)).limit(9);
    const shortsRow = await db.select({ c: count() }).from(calculations).where(sql`content_type = 'shorts'`);
    const usesAssumptions = await db.select({ c: count() }).from(calculations).where(sql`season <> 'annual' OR monetized_share < 1`);
    return { ok: true as const, total: Number(totalRow?.c ?? 0), avgEst: Number(avgRow?.avg ?? 0), week: Number(weekRow?.c ?? 0), assumptions: Number(usesAssumptions[0]?.c ?? 0), shortsPct: Number(totalRow?.c ?? 0) > 0 ? Math.round((Number(shortsRow[0]?.c ?? 0) / Number(totalRow?.c ?? 1)) * 100) : 0, byNiche, byCountry, byDay, recent };
  } catch (e) { logOnce("monitor", "aggregate query failed", e); return { ok: false as const }; }
}

export default async function MonitorPage() {
  const s = await getStats();
  const maxDay = s.ok ? Math.max(1, ...s.byDay.map((d) => Number(d.c))) : 1;
  const maxNiche = s.ok && s.byNiche.length ? Number(s.byNiche[0].c) : 1;
  const maxCountry = s.ok && s.byCountry.length ? Number(s.byCountry[0].c) : 1;

  return (
    <section className="relative overflow-hidden pt-10 sm:pt-14 lg:pt-16">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
      <div className="relative shell">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-yt-red-bg"><Activity className="h-4 w-4 text-yt-red" /></span>
            <span className="flex items-center gap-1.5 tag-red text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse-dot" /> API usage · PostgreSQL</span>
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl">Calculator Usage <span className="text-yt-gradient">Monitor</span></h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fog">Anonymous calculation API activity, not YouTube channel CPM monitoring. Browser-only estimates are not logged here. Cached for 60 seconds.</p>
        </Reveal>

        {!s.ok ? (
          <div className="panel mt-10 p-10 text-center"><Database className="mx-auto h-6 w-6 text-yt-red" /><p className="mt-3 font-semibold text-heading">Database not connected yet</p></div>
        ) : (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:gap-4">
              {[
                { icon: MousePointerClick, label: "Total calculations", value: s.total.toLocaleString(), accent: "text-heading" },
                { icon: Activity, label: "Last 7 days", value: s.week.toLocaleString(), accent: "text-yt-red" },
                { icon: CircleDollarSign, label: "Avg est. earnings", value: `${money(s.avgEst)}/mo`, accent: "text-mint" },
                { icon: Clock3, label: "Shorts checks", value: `${s.shortsPct}%`, accent: "text-gold" },
              ].map((c, i) => (
                <Reveal key={c.label} delay={i * 0.05}><div className="panel p-5"><c.icon className="h-5 w-5 text-yt-red" /><p className={`num-mono mt-3 font-display text-3xl font-bold ${c.accent}`}>{c.value}</p><p className="mt-1 text-sm font-medium text-heading">{c.label}</p></div></Reveal>
              ))}
            </div>

            <Reveal delay={0.1}><div className="panel mt-5 p-6">
              <h2 className="font-display text-lg font-bold text-heading">Calculations per day</h2>
              {s.byDay.length === 0 && <p className="mt-5 text-sm text-fog">No API calculations logged yet. Browser-only calculators do not populate this chart.</p>}
              <div className="mt-5 flex h-36 items-end gap-1.5 sm:gap-2.5">
                {s.byDay.map((d, i) => (<div key={d.dv} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"><span className="num-mono text-[10px] text-fog opacity-0 group-hover:opacity-100">{Number(d.c)}</span><div style={{ height: `${Math.max((Number(d.c) / maxDay) * 85, 4)}%` }} className={`w-full rounded-t-md transition-colors ${i === s.byDay.length - 1 ? "bg-gradient-to-t from-yt-red-deep to-yt-red" : "bg-gradient-to-t from-yt-red-bg to-yt-red/40 group-hover:to-yt-red/70"}`} /><span className="num-mono hidden text-[9px] text-fog sm:block">{d.day.split(" ")[1] ?? d.day}</span></div>))}
              </div>
            </div></Reveal>

            <div className="mt-5 grid gap-5 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr]">
              <Reveal delay={0.05}><div className="panel p-6"><h2 className="flex items-center gap-2 font-display text-lg font-bold text-heading"><Layers className="h-4 w-4 text-yt-red" /> Most-checked niches</h2><div className="mt-5 space-y-2">{s.byNiche.map((r, i) => (<StatBar key={r.name} label={r.name} value={Number(r.c)} max={maxNiche} right={`${Number(r.c)}`} delay={i * 0.04} />))}</div></div></Reveal>
              <Reveal delay={0.1}><div className="panel p-6"><h2 className="flex items-center gap-2 font-display text-lg font-bold text-heading"><Globe2 className="h-4 w-4 text-yt-red" /> Most-checked countries</h2><div className="mt-5 space-y-2">{s.byCountry.map((r, i) => (<StatBar key={r.name} label={r.name} value={Number(r.c)} max={maxCountry} right={`${Number(r.c)}`} delay={i * 0.04} />))}</div></div></Reveal>
            </div>

            <Reveal delay={0.1}><div className="panel mt-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3"><h2 className="font-display text-lg font-bold text-heading">Latest calculations</h2><span className="flex items-center gap-1.5 text-[10px] font-bold text-mint"><span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse-dot" /> streaming</span></div>
              <div className="divide-y divide-border">{s.recent.map((r) => { const mid = (Number(r.estLow) + Number(r.estHigh)) / 2; return (<div key={r.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_1fr_auto_auto] sm:gap-5 sm:px-5"><span className="num-mono hidden w-20 text-xs text-fog sm:block">#{String(r.id).padStart(5, "0")}</span><span className="truncate text-sm font-medium text-heading">{r.nicheName} <span className="text-fog">in</span> {r.countryName}</span><span className="num-mono hidden text-xs text-fog sm:block">{viewsLabel(r.views)} · {r.contentType === "shorts" ? "Shorts" : "Long"}</span><span className="num-mono text-right text-sm font-bold text-mint">{money(mid)}/mo</span><span className="num-mono hidden w-24 text-right text-[11px] text-fog sm:block">{new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>); })}</div>
            </div></Reveal>
            <p className="mt-4 text-center text-xs text-fog">{s.assumptions.toLocaleString()} runs used a season or ad-impression adjustment.</p>
            <p className="mt-6 pb-4 text-center text-xs text-fog">Anonymous aggregates only. <Link href="/#calculator" className="font-semibold text-heading underline decoration-brand/40 hover:decoration-brand">Run the calculator</Link>.</p>
          </>
        )}
      </div>
    </section>
  );
}
