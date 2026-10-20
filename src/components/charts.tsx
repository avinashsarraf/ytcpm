"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, ArrowRight } from "lucide-react";
import type { Country, Niche } from "@/lib/data";
import { CREATOR_SHARE, US_BLENDED_CPM } from "@/lib/data";
import { NICHE_ICONS } from "@/lib/niche-icons";
import { flagUrl } from "@/lib/flags";

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Highest", color: "text-mint" },
  2: { label: "High", color: "text-heading" },
  3: { label: "Good", color: "text-fog" },
  4: { label: "Low", color: "text-fog" },
};

/** ── Niche bar chart with animated bars ── */
export function NicheRangeChart({ niches, max = 50 }: { niches: Niche[]; max?: number }) {
  const reduced = useReducedMotion();
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="hidden grid-cols-[1.8fr_2fr_0.8fr_0.8fr] gap-2 border-b border-border bg-surface px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-fog sm:grid">
        <span>Niche</span><span /><span className="text-right">Avg. CPM</span><span className="text-right">Est. RPM</span>
      </div>
      <div className="divide-y divide-border">
        {niches.map((n, i) => {
          const Icon = NICHE_ICONS[n.icon] ?? TrendingUp;
          const avgCpm = (n.cpmLow + n.cpmHigh) / 2;
          const avgRpm = avgCpm * CREATOR_SHARE;
          const pct = Math.max((avgCpm / max) * 100, 4);
          return (
            <Link key={n.slug} href={`/cpm-by-niche/${n.slug}`}
              className="group grid grid-cols-[1fr_auto] gap-2 px-4 py-3.5 transition-all duration-200 hover:bg-yt-red-light sm:grid-cols-[1.8fr_2fr_0.8fr_0.8fr] sm:items-center"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-heading">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface transition-all duration-200 group-hover:bg-yt-red group-hover:text-white group-hover:shadow-lg group-hover:scale-110">
                  <Icon className="h-4 w-4" />
                </span>
                {n.name}
              </span>
              <span className="hidden sm:block">
                <span className="relative block h-5 w-full overflow-hidden rounded-full bg-yt-red-bg">
                  <motion.span
                    initial={reduced ? false : { width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={reduced ? { duration: 0 } : { duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-yt-red to-red-400 shadow-[0_0_12px_rgba(0,0,0,0.08)]"
                  />
                </span>
              </span>
              <span className="num-mono text-right text-sm font-bold text-heading">${avgCpm.toFixed(2)}</span>
              <span className="num-mono hidden text-right text-sm font-semibold text-mint sm:block">${avgRpm.toFixed(2)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** ── Country bar chart ── */
export function CountryBarChart({ countries }: { countries: Country[] }) {
  const reduced = useReducedMotion();
  const peak = Math.max(...countries.map((c) => (c.cpmLow + c.cpmHigh) / 2));
  const axisMax = Math.max(5, Math.ceil(peak / 5) * 5);
  const ticks = Array.from({ length: axisMax / 5 + 1 }, (_, i) => i * 5);

  return (
    <div>
      <p className="mb-5 text-xs font-bold uppercase tracking-wider text-fog">Average CPM by Country (USD)</p>
      <div className="relative flex h-52 items-end gap-2 border-b border-l border-border pl-7 sm:gap-3">
        {ticks.map((v) => (
          <span key={v} className="num-mono absolute left-0 -translate-y-1/2 text-[10px] text-fog" style={{ bottom: `${(v / axisMax) * 100}%` }}>{v}</span>
        ))}
        {countries.map((c, i) => {
          const avg = (c.cpmLow + c.cpmHigh) / 2;
          return (
            <Link key={c.slug} href={`/cpm-by-country/${c.slug}`} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              <span className="num-mono absolute -top-5 text-[10px] font-bold text-yt-red opacity-0 transition-opacity group-hover:opacity-100">${avg.toFixed(1)}</span>
              <motion.span
                initial={reduced ? false : { height: 0 }}
                whileInView={{ height: `${(avg / axisMax) * 100}%` }}
                viewport={{ once: true, margin: "-40px" }}
                transition={reduced ? { duration: 0 } : { duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="block w-full max-w-9 rounded-t-md bg-gradient-to-t from-yt-red/60 to-yt-red transition-all duration-300 group-hover:from-yt-red group-hover:to-red-400 group-hover:shadow-[0_0_16px_rgba(0,0,0,0.12)]"
              />
              <span className="mt-2"><Image src={flagUrl(c.code, "w40")} alt={`${c.name} flag`} width={24} height={16} className="flag-img !w-6 !h-4" unoptimized /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** ── Country flag cards (grid) ── */
export function CountryFlagCards({ countries }: { countries: Country[] }) {
  const top = countries.slice(0, 6);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {top.map((c) => {
        const avg = (c.cpmLow + c.cpmHigh) / 2;
        const tier = TIER_LABELS[c.tier];
        return (
          <Link key={c.slug} href={`/cpm-by-country/${c.slug}`}
            className="panel panel-lift group flex flex-col items-center gap-2 p-5 text-center"
          >
            <Image src={flagUrl(c.code, "w160")} alt={`${c.name} flag`} width={48} height={32} className="flag-img !w-12 !h-8 !rounded" unoptimized />
            <span className="text-sm font-semibold text-heading">{c.name}</span>
            <span className="num-mono text-xl font-bold text-yt-red">${avg.toFixed(2)}</span>
            <span className={`text-[10px] font-semibold ${tier.color}`}>{tier.label}</span>
          </Link>
        );
      })}
      <Link href="/cpm-by-country"
        className="panel panel-lift group flex flex-col items-center justify-center gap-2 bg-yt-red-light p-5 text-center"
      >
        <span className="text-2xl font-bold text-yt-red">+{countries.length - 6}</span>
        <span className="text-xs font-medium text-fog">more countries</span>
        <span className="flex items-center gap-1 text-xs font-bold text-yt-red transition-all group-hover:gap-2">View all <ArrowRight className="h-3 w-3" /></span>
      </Link>
    </div>
  );
}

/** ── Seasonality cards ── */
export function SeasonChart({ seasons }: { seasons: { q: string; label: string; mult: number; note: string }[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {seasons.map((s, i) => {
        // Previously `mult × 12` (an unexplained magic number). Anchor to the
        // published US blended CPM instead so the card matches the dataset.
        const avg = (s.mult * US_BLENDED_CPM).toFixed(2);
        return (
          <motion.div key={s.q}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={reduced ? { duration: 0 } : { duration: 0.5, delay: i * 0.08 }}
            className={`panel p-5 transition-all duration-300 hover:scale-[1.02] ${s.q === "Q4" ? "!border-yt-red/30 bg-yt-red-light shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]" : ""}`}
          >
            <p className="text-xs font-semibold text-fog">{s.label}</p>
            <p className={`num-mono mt-2 font-display text-2xl font-bold ${s.q === "Q4" ? "text-yt-red" : "text-heading"}`}>${avg}</p>
            <p className="mt-0.5 text-[11px] text-fog">Avg. US CPM · {s.mult.toFixed(2)}×</p>
            <p className="mt-2 text-xs leading-relaxed text-fog">{s.note}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/** ── Stat bar (monitor) ── */
export function StatBar({ label, value, max, right, href, delay = 0 }: { label: string; value: number; max: number; right?: string; href?: string; delay?: number; }) {
  const reduced = useReducedMotion();
  const inner = (<>
    <span className="w-36 truncate text-sm text-heading">{label}</span>
    <span className="relative h-5 flex-1 overflow-hidden rounded-full bg-yt-red-bg">
      <motion.span
        initial={reduced ? false : { width: 0 }}
        whileInView={{ width: `${max ? (value / max) * 100 : 0}%` }}
        viewport={{ once: true }}
        transition={reduced ? { duration: 0 } : { duration: 0.7, delay }}
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-yt-red/70 to-yt-red"
      />
    </span>
    <span className="num-mono w-12 text-right text-xs font-bold text-heading">{right ?? value}</span>
  </>);
  const cls = "flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface";
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}
