"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Layers, Globe2, Clock3, ArrowLeftRight, Sparkles, ArrowRight, SlidersHorizontal } from "lucide-react";
import {
  COUNTRIES, NICHES, SEASONS, estimateEarnings, viewsLabel, money,
  localMoney, currencySymbol, fxNote, type ContentType, type Country,
} from "@/lib/data";
import { AnimatedMoney } from "./motion";

/**
 * Views snap to human-readable stops so the tick labels, the readout and the
 * estimate always agree (the old log slider showed "10K" at 1,000 views).
 */
const VIEW_STOPS = [
  1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000,
  250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000,
] as const;
const DEFAULT_STOP = 6; // 100K
const TICK_STOPS = [0, 3, 6, 9, 12];

const AD_SHARE_OPTIONS = [
  { value: 1, label: "100% — every view monetized" },
  { value: 0.85, label: "85% — strong ad fill" },
  { value: 0.7, label: "70% — typical long-form" },
  { value: 0.55, label: "55% — heavy ad-blocking" },
  { value: 0.4, label: "40% — limited ads" },
];

export default function Calculator() {
  const [stop, setStop] = useState(DEFAULT_STOP);
  const [nicheSlug, setNicheSlug] = useState("technology-software");
  const [countrySlug, setCountrySlug] = useState("united-states");
  const [type, setType] = useState<ContentType>("long");
  const [seasonKey, setSeasonKey] = useState("annual");
  const [adShare, setAdShare] = useState(1);

  const views = VIEW_STOPS[stop];
  const niche = NICHES.find((n) => n.slug === nicheSlug) ?? NICHES[0];
  const country = COUNTRIES.find((c) => c.slug === countrySlug) ?? COUNTRIES[0];
  const season = SEASONS.find((s) => s.q === seasonKey);
  const seasonMult = season?.mult ?? 1;

  const est = useMemo(
    () => estimateEarnings({ views, niche, country, type, season: seasonMult, monetizedShare: adShare }),
    [views, niche, country, type, seasonMult, adShare]
  );

  const mid = (est.monthlyLow + est.monthlyHigh) / 2;
  const rpmMid = (est.rpmLow + est.rpmHigh) / 2;
  const cpmMid = (est.cpmLow + est.cpmHigh) / 2;
  const cur = useMemo(() => (usd: number, d?: number) => localMoney(usd, country as Country, d), [country]);
  const sym = currencySymbol(country);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          views, niche: niche.slug, country: country.slug, type,
          season: seasonKey, monetizedShare: adShare,
        }),
        keepalive: true,
      }).catch(() => {});
    }, 900);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [views, niche.slug, country.slug, type, seasonKey, adShare]);

  const tiers = useMemo(() => {
    const g: Record<number, typeof COUNTRIES> = { 1: [], 2: [], 3: [], 4: [] };
    COUNTRIES.forEach((c) => g[c.tier].push(c));
    return g;
  }, []);

  return (
    <div className="panel overflow-hidden !rounded-2xl !shadow-[0_4px_8px_rgba(0,0,0,0.04),0_16px_48px_-12px_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <span className="rounded-full bg-yt-red px-5 py-2 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
          Basic Calculator
        </span>
        <Link
          href="/cpm-by-niche"
          className="group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-fog transition-colors hover:bg-surface-2 hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yt-red/40"
        >
          Compare niches
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT */}
        <div className="border-b border-border p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label htmlFor="views" className="flex items-center gap-2 text-sm font-bold text-heading">
                <Eye className="h-4 w-4 text-yt-red" /> Monthly Views
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5">
                <Eye className="h-3.5 w-3.5 text-fog" />
                <span className="num-mono text-sm font-bold text-heading">{views.toLocaleString("en-US")}</span>
              </div>
            </div>
            <input
              id="views"
              type="range"
              min={0}
              max={VIEW_STOPS.length - 1}
              step={1}
              value={stop}
              aria-valuetext={`${views.toLocaleString("en-US")} monthly views`}
              onChange={(e) => setStop(Number(e.target.value))}
              className="slider"
              style={{ ["--fill" as string]: `${(stop / (VIEW_STOPS.length - 1)) * 100}%` }}
            />
            {/* Labels sit at the exact thumb positions (0/25/50/75/100%). */}
            <div className="relative h-4 text-[10px] font-mono font-medium text-fog/80" aria-hidden>
              {TICK_STOPS.map((i) => {
                const pct = (i / (VIEW_STOPS.length - 1)) * 100;
                return (
                  <span
                    key={i}
                    className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
                    style={{ left: `${pct}%` }}
                  >
                    {viewsLabel(VIEW_STOPS[i])}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="niche" className="mb-1.5 flex items-center gap-2 text-sm font-bold text-heading">
              <Layers className="h-4 w-4 text-yt-red" /> Channel Niche
            </label>
            <select id="niche" className="select-field" value={nicheSlug} onChange={(e) => setNicheSlug(e.target.value)}>
              <optgroup label="S & A tier">{NICHES.filter((n) => n.tier === "S" || n.tier === "A").map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}</optgroup>
              <optgroup label="B & C tier">{NICHES.filter((n) => n.tier === "B" || n.tier === "C").map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}</optgroup>
            </select>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="country" className="flex items-center gap-2 text-sm font-bold text-heading">
                <Globe2 className="h-4 w-4 text-yt-red" /> Audience Country
              </label>
              <motion.span key={country.currency} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="num-mono inline-flex items-center gap-1 rounded-md bg-yt-red-bg px-2 py-0.5 text-[10px] font-bold text-yt-red">
                <ArrowLeftRight className="h-2.5 w-2.5" /> {sym} {country.currency}
              </motion.span>
            </div>
            <select id="country" className="select-field" value={countrySlug} onChange={(e) => setCountrySlug(e.target.value)}>
              {([1, 2, 3, 4] as const).map((t) => (
                <optgroup key={t} label={["Tier 1 — Premium", "Tier 2 — Strong", "Tier 3 — Emerging", "Tier 4 — Volume"][t - 1]}>
                  {tiers[t].map((c) => <option key={c.slug} value={c.slug}>{c.name} ({c.currency})</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-heading">
              <Clock3 className="h-4 w-4 text-yt-red" /> Content Type
            </p>
            <div className="flex gap-2" role="group" aria-label="Content type">
              {([{ v: "long", label: "Long Form" }, { v: "shorts", label: "Shorts" }] as const).map((o) => (
                <button key={o.v} type="button" onClick={() => setType(o.v)} aria-pressed={type === o.v}
                  className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yt-red/40 ${type === o.v ? "bg-yt-red text-white shadow-[0_2px_12px_rgba(0,0,0,0.2)] scale-[1.02]" : "border border-border bg-white text-fog hover:border-yt-red/30 hover:text-heading"}`}
                >{o.label}</button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface p-3.5">
            <p className="flex items-center gap-2 text-[12px] font-bold text-heading">
              <SlidersHorizontal className="h-3.5 w-3.5 text-yt-red" /> Assumptions
            </p>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-fog">Season</span>
                <select className="select-field !py-2 !text-xs" value={seasonKey} onChange={(e) => setSeasonKey(e.target.value)}>
                  <option value="annual">Full year (1.00×)</option>
                  {SEASONS.map((s) => <option key={s.q} value={s.q}>{s.q} · {s.label} ({s.mult.toFixed(2)}×)</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-fog">Ad-impression rate</span>
                <select className="select-field !py-2 !text-xs" value={adShare} onChange={(e) => setAdShare(Number(e.target.value))}>
                  {AD_SHARE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-fog">
              RPM = CPM × 55% creator share × ad-impression rate. Lower the rate if many views are ad-blocked or non-monetized.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col p-5 sm:p-7">
          <div aria-live="polite">
            <p className="text-sm font-bold text-heading">Estimated Monthly Earnings</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <AnimatedMoney value={mid} format={(v) => cur(v)} className="num-mono font-display text-5xl font-bold tracking-tight text-heading" />
              <span className="num-mono text-xs font-semibold text-yt-red">{money(est.rpmLow, 2)} ~ {money(est.rpmHigh, 2)} per 1K views</span>
            </div>
            <p className="num-mono mt-1 text-[11px] text-fog">
              Range {cur(est.monthlyLow)} – {cur(est.monthlyHigh)} per month
            </p>
            {country.currency !== "USD" && <p className="num-mono mt-1 text-xs text-fog">≈ {money(mid)} USD · {fxNote(country)}</p>}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-yt-red/20 hover:shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fog">CPM Range</p>
              <p className="num-mono mt-1.5 text-lg font-bold text-heading">{type === "shorts" ? "n/a" : `${cur(est.cpmLow)} - ${cur(est.cpmHigh)}`}</p>
              <p className="mt-0.5 text-[11px] text-fog">{type === "shorts" ? "pooled Shorts revenue" : "per 1,000 ad impressions"}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-mint/20 hover:shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fog">RPM Range</p>
              <p className="num-mono mt-1.5 text-lg font-bold text-mint">{cur(est.rpmLow)} - {cur(est.rpmHigh)}</p>
              <p className="mt-0.5 text-[11px] text-fog">per 1,000 total views</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-surface px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-fog">Earnings Breakdown</div>
            <div className="divide-y divide-border text-sm">
              {[
                ["Estimated Views", viewsLabel(views)],
                ["Season", seasonKey === "annual" ? "Full year" : `${seasonKey} (${seasonMult.toFixed(2)}×)`],
                ["Monetized views", `${Math.round(adShare * 100)}%`],
                ["CPM (avg.)", type === "shorts" ? "n/a" : cur(cpmMid)],
                ["RPM (avg.)", cur(rpmMid)],
                ["Yearly Projection", cur(mid * 12)],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-surface">
                  <span className="text-fog">{l}</span><span className="num-mono font-semibold text-heading">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-yt-red-light px-4 py-3">
                <span className="font-bold text-heading">Total Estimated Earnings</span>
                <span className="num-mono text-xl font-bold text-yt-red">{cur(mid)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-yt-red-light p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-yt-red" />
            <p className="text-xs leading-relaxed text-fog">
              <strong className="text-heading">Note:</strong> CPM and RPM vary with audience mix, niche, seasonality and ad fill.
              These are directional 2026 benchmarks, not a guarantee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
