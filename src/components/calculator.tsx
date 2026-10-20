"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Layers, Globe2, Clock3, ArrowLeftRight, Sparkles } from "lucide-react";
import { COUNTRIES, NICHES, estimateEarnings, viewsLabel, money, localMoney, currencySymbol, fxNote, type ContentType, type Country } from "@/lib/data";
import { AnimatedMoney } from "./motion";

const MIN_V = 3, MAX_V = 7;
function sliderToViews(v: number) { return Math.round(Math.pow(10, MIN_V + (v / 100) * (MAX_V - MIN_V)) / 1000) * 1000; }

export default function Calculator() {
  const [slider, setSlider] = useState(50);
  const [nicheSlug, setNicheSlug] = useState("technology-software");
  const [countrySlug, setCountrySlug] = useState("united-states");
  const [type, setType] = useState<ContentType>("long");

  const views = sliderToViews(slider);
  const niche = NICHES.find((n) => n.slug === nicheSlug) ?? NICHES[0];
  const country = COUNTRIES.find((c) => c.slug === countrySlug) ?? COUNTRIES[0];
  const est = useMemo(() => estimateEarnings({ views, niche, country, type }), [views, niche, country, type]);
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
      fetch("/api/calculate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ views, niche: niche.slug, country: country.slug, type }), keepalive: true }).catch(() => {});
    }, 900);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [views, niche.slug, country.slug, type]);

  const tiers = useMemo(() => { const g: Record<number, typeof COUNTRIES> = { 1: [], 2: [], 3: [], 4: [] }; COUNTRIES.forEach((c) => g[c.tier].push(c)); return g; }, []);

  return (
    <div className="panel overflow-hidden !rounded-2xl !shadow-[0_4px_8px_rgba(0,0,0,0.04),0_16px_48px_-12px_rgba(0,0,0,0.1)]">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <span className="rounded-full bg-yt-red px-5 py-2 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(255,0,0,0.25)]">Basic Calculator</span>
        <span className="rounded-full px-5 py-2 text-[13px] font-medium text-fog transition-colors hover:bg-surface-2 hover:text-heading cursor-default">Advanced</span>
        <span className="rounded-full px-5 py-2 text-[13px] font-medium text-fog transition-colors hover:bg-surface-2 hover:text-heading cursor-default">Compare Niches</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT */}
        <div className="border-b border-border p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="views" className="flex items-center gap-2 text-sm font-bold text-heading"><Eye className="h-4 w-4 text-yt-red" /> Monthly Views</label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5"><Eye className="h-3.5 w-3.5 text-fog" /><span className="num-mono text-sm font-bold text-heading">{views.toLocaleString()}</span></div>
            </div>
            <input id="views" type="range" min={0} max={100} value={slider} onChange={(e) => setSlider(Number(e.target.value))} className="slider" style={{ ["--fill" as string]: `${slider}%` }} />
            <div className="flex justify-between text-[10px] font-mono font-medium text-fog/70"><span>10K</span><span>100K</span><span>500K</span><span>1M</span><span>5M</span><span>10M</span></div>
          </div>

          <div className="mt-5">
            <label htmlFor="niche" className="mb-1.5 flex items-center gap-2 text-sm font-bold text-heading"><Layers className="h-4 w-4 text-yt-red" /> Channel Niche</label>
            <select id="niche" className="select-field" value={nicheSlug} onChange={(e) => setNicheSlug(e.target.value)}>
              <optgroup label="S & A tier">{NICHES.filter((n) => n.tier === "S" || n.tier === "A").map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}</optgroup>
              <optgroup label="B & C tier">{NICHES.filter((n) => n.tier === "B" || n.tier === "C").map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}</optgroup>
            </select>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="country" className="flex items-center gap-2 text-sm font-bold text-heading"><Globe2 className="h-4 w-4 text-yt-red" /> Audience Country</label>
              <motion.span key={country.currency} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="num-mono inline-flex items-center gap-1 rounded-md bg-yt-red-bg px-2 py-0.5 text-[10px] font-bold text-yt-red">
                <ArrowLeftRight className="h-2.5 w-2.5" /> {sym} {country.currency}
              </motion.span>
            </div>
            <select id="country" className="select-field" value={countrySlug} onChange={(e) => setCountrySlug(e.target.value)}>
              {([1, 2, 3, 4] as const).map((t) => (<optgroup key={t} label={["Tier 1 — Premium", "Tier 2 — Strong", "Tier 3 — Emerging", "Tier 4 — Volume"][t - 1]}>{tiers[t].map((c) => <option key={c.slug} value={c.slug}>{c.name} ({c.currency})</option>)}</optgroup>))}
            </select>
          </div>

          <div className="mt-5">
            <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-heading"><Clock3 className="h-4 w-4 text-yt-red" /> Content Type</p>
            <div className="flex gap-2">
              {([{ v: "long", label: "Long Form" }, { v: "shorts", label: "Shorts" }] as const).map((o) => (
                <button key={o.v} type="button" onClick={() => setType(o.v)}
                  className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-300 ${type === o.v ? "bg-yt-red text-white shadow-[0_2px_12px_rgba(255,0,0,0.3)] scale-[1.02]" : "border border-border bg-white text-fog hover:border-yt-red/30 hover:text-heading"}`}
                >{o.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col p-5 sm:p-7">
          <div>
            <p className="text-sm font-bold text-heading">Estimated Monthly Earnings</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <AnimatedMoney value={mid} format={(v) => cur(v)} className="num-mono font-display text-5xl font-bold tracking-tight text-heading" />
              <span className="num-mono text-xs font-semibold text-yt-red">{money(est.rpmLow, 2)} ~ {money(est.rpmHigh, 2)} per 1K views</span>
            </div>
            {country.currency !== "USD" && <p className="num-mono mt-1 text-xs text-fog">≈ {money(mid)} USD · {fxNote(country)}</p>}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-yt-red/20 hover:shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fog">CPM Range</p>
              <p className="num-mono mt-1.5 text-lg font-bold text-heading">{type === "shorts" ? "n/a" : `${cur(est.cpmLow)} - ${cur(est.cpmHigh)}`}</p>
              <p className="mt-0.5 text-[11px] text-fog">per 1,000 views</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-mint/20 hover:shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fog">RPM Range</p>
              <p className="num-mono mt-1.5 text-lg font-bold text-mint">{cur(est.rpmLow)} - {cur(est.rpmHigh)}</p>
              <p className="mt-0.5 text-[11px] text-fog">per 1,000 views</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-surface px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-fog">Earnings Breakdown</div>
            <div className="divide-y divide-border text-sm">
              {[["Estimated Views", viewsLabel(views)], ["CPM (avg.)", type === "shorts" ? "n/a" : cur(cpmMid)], ["RPM (avg.)", cur(rpmMid)], ["Yearly Projection", cur(mid * 12)]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-surface"><span className="text-fog">{l}</span><span className="num-mono font-semibold text-heading">{v}</span></div>
              ))}
              <div className="flex items-center justify-between bg-yt-red-light px-4 py-3">
                <span className="font-bold text-heading">Total Estimated Earnings</span>
                <span className="num-mono text-xl font-bold text-yt-red">{cur(mid)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-yt-red-light p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-yt-red" />
            <p className="text-xs leading-relaxed text-fog"><strong className="text-heading">Note:</strong> CPM and RPM can vary based on location, niche, seasonality and audience engagement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
