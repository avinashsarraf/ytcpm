"use client";

import { useMemo, useState } from "react";
import {
  Calculator as CalcIcon, Eye, DollarSign, Globe, BarChart3, Users,
  ArrowRight, SlidersHorizontal,
} from "lucide-react";
import {
  COUNTRIES, NICHES, SEASONS, CREATOR_SHARE, money, viewsLabel,
} from "@/lib/data";

import { WORLDWIDE, DEFAULT_NICHE, MAX_CPM, MAX_VIEWS, benchmarkCpm as getBenchmarkCpm, revenueFromCpm, parseViews } from "@/lib/calculator";

/**
 * Reference-style calculator: views + CPM + country on one row, quick-view
 * chips, and four pastel metric tiles. The CPM field is pre-filled from the
 * reference benchmark for the chosen niche/country but stays editable, so visitors
 * who already know their CPM can type it and the ones who don't get a value.
 */

const QUICK = [1_000, 10_000, 100_000, 1_000_000, 10_000_000, 50_000_000];
const DEFAULT_VIEWS = 1_000_000;


const COUNTRIES_WITH_WORLD = [WORLDWIDE, ...COUNTRIES];
const num = (n: number) => n.toLocaleString("en-US");
const TABS = [
  { id: "cpm", label: "CPM Calculator", icon: CalcIcon },
  { id: "views", label: "Earnings by Views", icon: BarChart3 },
  { id: "channel", label: "Channel Estimator", icon: Users },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function Calculator() {
  const [tab, setTab] = useState<TabId>("cpm");
  const [views, setViews] = useState(DEFAULT_VIEWS);
  const [viewsText, setViewsText] = useState(num(DEFAULT_VIEWS));
  const [nicheSlug, setNicheSlug] = useState(DEFAULT_NICHE.slug);
  const [countrySlug, setCountrySlug] = useState("worldwide");
  const [seasonKey, setSeasonKey] = useState("annual");
  const [advanced, setAdvanced] = useState(false);

  const niche = NICHES.find((n) => n.slug === nicheSlug) ?? NICHES[0];
  const country = COUNTRIES_WITH_WORLD.find((c) => c.slug === countrySlug) ?? WORLDWIDE;
  const season = SEASONS.find((s) => s.q === seasonKey);
  const seasonMult = season?.mult ?? 1;

  const benchmarkCpm = useMemo(
    () => getBenchmarkCpm(niche, country, seasonMult),
    [niche, country, seasonMult]
  );

  /* Derived, not synced: the benchmark is the value until the visitor types
     their own CPM, and clearing the override snaps it back to the benchmark. */
  const [cpmOverride, setCpmOverride] = useState<string | null>(null);
  const [adShare, setAdShare] = useState(1);
  const cpm = cpmOverride === null || cpmOverride === "" ? benchmarkCpm : Number(cpmOverride);
  const { gross, creator: afterShare } = revenueFromCpm(views, cpm, adShare);
  const fill70 = revenueFromCpm(views, cpm, 0.7).creator;

  const setViewsFromInput = (raw: string) => {
    const value = parseViews(raw);
    setViews(value);
    setViewsText(raw.replace(/[^\d]/g, "") ? num(value) : "");
  };

  return (
    <>
      <noscript><p className="mb-4 rounded-xl border border-border bg-surface p-4 text-sm text-heading">Enable JavaScript to use the interactive calculator. You can still browse the country and niche benchmark pages.</p></noscript>
      <div className="card overflow-hidden !rounded-[20px] !shadow-[0_2px_6px_rgba(11,22,38,0.05),0_24px_60px_-24px_rgba(11,22,38,0.22)]">
        <div className="p-4 sm:p-6 xl:p-8">
        {/* ── Tabs ── */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-white p-1.5 min-[480px]:flex-row" role="group" aria-label="Calculator mode">
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                aria-pressed={active}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-bold transition-all duration-200 xl:px-4 xl:text-[13.5px] ${
                  active
                    ? "hot-gradient text-white shadow-[0_6px_18px_-6px_rgba(238,18,73,0.6)]"
                    : "text-[#4a5a6e] hover:bg-surface"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-heading">Results update instantly as you type</p>
            <button type="button" onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced} aria-controls="calculator-assumptions" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-bold text-yt-red hover:bg-yt-red-light">
              <SlidersHorizontal className="h-4 w-4" />{advanced ? "Hide assumptions" : "Edit assumptions"}
            </button>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[#4a5a6e]" data-assumptions-summary="">
            {niche.name} · {countrySlug === "worldwide" ? "Worldwide (unweighted)" : country.name} · {seasonKey === "annual" ? "Annual baseline" : seasonKey} · {money(cpm, 2)} {cpmOverride === null || cpmOverride === "" ? "benchmark" : "custom"} CPM · {Math.round(adShare * 100)}% ad fill
          </p>
          {adShare === 1 && <p className="mt-2 inline-flex rounded-md bg-amber-bg px-2.5 py-1 text-sm font-semibold text-gold">100% ad fill — optimistic scenario, not a guaranteed payout</p>}
        </div>
            {advanced && (
              <div id="calculator-assumptions" className="mt-3 grid gap-3 rounded-xl border border-border bg-surface p-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-[#5b6b80]">Channel niche</span>
                  <select value={nicheSlug} onChange={(e) => { setNicheSlug(e.target.value); setCpmOverride(null); }} className="select-field !py-2 !text-[13px]">
                    {NICHES.map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-[#5b6b80]">Season</span>
                  <select value={seasonKey} onChange={(e) => { setSeasonKey(e.target.value); setCpmOverride(null); }} className="select-field !py-2 !text-[13px]">
                    <option value="annual">Full year (1.00×)</option>
                    {SEASONS.map((s) => <option key={s.q} value={s.q}>{s.q} · {s.label} ({s.mult.toFixed(2)}×)</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-[#5b6b80]">Audience location</span>
                  <select value={countrySlug} onChange={(e) => { setCountrySlug(e.target.value); setCpmOverride(null); }} className="select-field">
                    {COUNTRIES_WITH_WORLD.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-[#64748b]">Views serving ads: {Math.round(adShare * 100)}%</span>
                  <input aria-valuetext={`${Math.round(adShare * 100)} percent of views serving ads`} aria-label="Views serving ads" type="range" min="0" max="100" step="5" value={Math.round(adShare * 100)} onChange={(e) => setAdShare(Number(e.target.value) / 100)} className="slider" />
                </label>
                <p className="text-xs leading-relaxed sm:col-span-2 lg:col-span-4">
                  Long-form model: one ad impression per monetized view. Country, niche or season changes reset a custom CPM to the benchmark. Worldwide is an unweighted market average. Maximum {num(MAX_VIEWS)} views and {money(MAX_CPM)} CPM.
                </p>
              </div>
            )}

        {/* ── Mode: CPM calculator ── */}
        {tab === "cpm" && (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.85fr_1fr_auto] lg:items-end xl:gap-5">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-heading">Total Views</span>
                <span className="relative block">
                  <Eye className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    inputMode="numeric"
                    value={viewsText}
                    onChange={(e) => setViewsFromInput(e.target.value)}
                    placeholder="e.g. 1,000,000"
                    className="field field-with-icon"
                    aria-label="Total views"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-heading">CPM (USD)</span>
                <span className="relative block">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    inputMode="decimal"
                    value={cpmOverride ?? String(benchmarkCpm)}
                    onChange={(e) => {
                      const next = e.target.value === "." ? "0." : e.target.value;
                      if (/^\d*(\.\d{0,4})?$/.test(next) && Number(next) <= MAX_CPM) setCpmOverride(next);
                    }}
                    onBlur={() => { if (cpmOverride === "") setCpmOverride(null); }}
                    placeholder={String(benchmarkCpm)}
                    className="field field-with-icon"
                    aria-label="CPM in US dollars"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-heading">
                  Country <span className="font-medium text-[#94a3b8]">(Optional)</span>
                </span>
                <span className="relative block">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <select
                    value={countrySlug}
                    onChange={(e) => { setCountrySlug(e.target.value); setCpmOverride(null); }}
                    aria-label="Audience country"
                    className="select-field field-with-icon"
                  >
                    <option value="worldwide">Worldwide (Average)</option>
                    {([1, 2, 3, 4] as const).map((tier) => (
                      <optgroup
                        key={tier}
                        label={["Tier 1 — Premium", "Tier 2 — Strong", "Tier 3 — Emerging", "Tier 4 — Volume"][tier - 1]}
                      >
                        {COUNTRIES.filter((c) => c.tier === tier).map((c) => (
                          <option key={c.slug} value={c.slug}>{c.name} ({c.currency})</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </span>
              </label>

              <a
                href="#results"
                className="hot-gradient inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-lg px-6 text-[13.5px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(238,18,73,0.7)] transition-transform hover:scale-[1.02] lg:h-[42px] lg:w-auto"
              >
                <CalcIcon className="h-4 w-4" /> View Results <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Quick views */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[14px] font-semibold text-[#4a5a6e]">Quick Views:</span>
              {QUICK.map((v) => {
                const active = views === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setViews(v); setViewsText(num(v)); }}
                    aria-pressed={active}
                    className={`rounded-md border px-3 py-1 text-[14px] font-bold transition-all ${
                      active
                        ? "border-yt-red bg-yt-red-light text-yt-red"
                        : "border-border text-[#4a5a6e] hover:border-yt-red/40 hover:text-yt-red"
                    }`}
                  >
                    {viewsLabel(v)}
                  </button>
                );
              })}

            </div>


          </>
        )}

        {/* ── Mode: earnings by views ── */}
        {tab === "views" && (
          <div className="mt-5">
            <p className="text-[13px] text-[#64748b]">
              Earnings for <strong className="text-heading">{niche.name}</strong> at a {money(cpm, 2)} CPM
              ({countrySlug === "worldwide" ? "worldwide average" : country.name}).
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-3 gap-2 border-b border-border bg-surface px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide text-[#5b6b80]">
                <span>Views</span>
                <span className="text-right">Gross ad revenue</span>
                <span className="text-right">Creator earnings</span>
              </div>
              <div className="divide-y divide-border">
                {QUICK.map((v) => {
                  const g = revenueFromCpm(v, cpm, adShare).gross;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setViews(v); setViewsText(num(v)); setTab("cpm"); }}
                      className="grid w-full grid-cols-3 gap-2 px-4 py-2.5 text-left transition-colors hover:bg-yt-red-light"
                    >
                      <span className="text-sm font-semibold text-heading">{viewsLabel(v)}</span>
                      <span className="num-mono text-right text-sm text-[#4a5a6e]">{money(g)}</span>
                      <span className="num-mono text-right text-sm font-bold text-mint">{money(g * CREATOR_SHARE)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-3 text-[12px] text-[#64748b]">
              Tap a row to load it into the calculator. Creator estimates assume the selected ad fill and a{" "}
              {Math.round(CREATOR_SHARE * 100)}% creator share.
            </p>
          </div>
        )}

        {/* ── Mode: channel estimator ── */}
        {tab === "channel" && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-heading">Monthly views</span>
                <span className="relative block">
                  <Eye className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    inputMode="numeric"
                    value={viewsText}
                    onChange={(e) => setViewsFromInput(e.target.value)}
                    className="field field-with-icon"
                    aria-label="Channel monthly views"
                  />
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-heading">Niche</span>
                <select value={nicheSlug} onChange={(e) => { setNicheSlug(e.target.value); setCpmOverride(null); }} className="select-field">
                  {NICHES.map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-heading">Audience country</span>
                <select value={countrySlug} onChange={(e) => { setCountrySlug(e.target.value); setCpmOverride(null); }} className="select-field">
                  <option value="worldwide">Worldwide (Average)</option>
                  {COUNTRIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
            </div>

            <div role="region" aria-label="Channel projection" className="rounded-xl border border-border bg-surface p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#5b6b80]">Channel projection</p>
              <p className="num-mono mt-1 font-display text-3xl font-extrabold tracking-tight text-heading">
                {money(afterShare)}
                <span className="ml-1 text-[13px] font-semibold text-[#64748b]">/ month</span>
              </p>
              <dl className="mt-3 space-y-2 text-[13px]">
                {[
                  ["Annualized (same monthly rate)", money(afterShare * 12)],
                  ["Q4 scenario / month", money(afterShare / seasonMult * Math.max(...SEASONS.map((s) => s.mult)))],
                  ["Per 1,000 views", money(cpm * CREATOR_SHARE * adShare, 2)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-border/70 pb-1.5 last:border-0 last:pb-0">
                    <dt className="text-[#64748b]">{k}</dt>
                    <dd className="num-mono font-bold text-heading">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[13px] leading-relaxed text-[#64748b]">
                Estimates from the view count you enter — we never query YouTube&apos;s API or scrape a channel.
              </p>
            </div>
            </div>
          )}

        </div>
      </div>

      {/* Result tiles sit outside the card, as in the reference */}
      <div role="region" aria-label="Earnings estimate" id="results" tabIndex={-1} className="mt-4 grid scroll-mt-24 grid-cols-1 min-[420px]:grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 xl:gap-4">
        <div className="tile tile-mint !px-3 !py-3 sm:!px-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d3f3e1] text-mint sm:h-11 sm:w-11"><Eye className="h-5 w-5" /></span>
          <span className="min-w-0">
            <span title={num(views)} className="num-mono block truncate text-[17px] font-extrabold leading-tight tracking-tight text-heading sm:text-[19px] xl:text-[21px]">{num(views)}</span>
            <span className="mt-0.5 block text-[12px] font-medium leading-tight text-[#5b6b80] sm:text-[13px]">{tab === "channel" ? "Monthly Views" : "Total Views"}</span>
          </span>
        </div>
        <div className="tile tile-blue !px-3 !py-3 sm:!px-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d8e6fa] text-blue"><DollarSign className="h-5 w-5" /></span>
          <span className="min-w-0">
            <span className="num-mono block truncate text-[17px] font-extrabold leading-tight tracking-tight text-heading sm:text-[19px] xl:text-[21px]">{money(cpm, 2)}</span>
            <span className="mt-0.5 block text-[12px] font-medium leading-tight text-[#5b6b80] sm:text-[13px]">CPM (USD)</span>
          </span>
        </div>
        <div className="tile tile-amber !px-3 !py-3 sm:!px-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fbe9b8] text-[#c2810a]"><BarChart3 className="h-5 w-5" /></span>
          <span className="min-w-0">
            <span className="num-mono block truncate text-[17px] font-extrabold leading-tight tracking-tight text-heading sm:text-[19px] xl:text-[21px]">{money(gross)}</span>
            <span className="mt-0.5 block text-[12px] font-medium leading-tight text-[#5b6b80] sm:text-[13px]">Gross Ad Revenue</span>
          </span>
        </div>
        <div className="tile tile-pink !px-3 !py-3 sm:!px-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fbd6e0] text-yt-red">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="num-mono block truncate text-[17px] font-extrabold leading-tight tracking-tight text-heading sm:text-[19px] xl:text-[21px]">{money(afterShare)}</span>
            <span className="mt-0.5 block text-[12px] font-medium leading-tight text-[#5b6b80] sm:text-[13px]">Creator Earnings ({Math.round(CREATOR_SHARE * 100)}%)</span>
          </span>
        </div>
      </div>

      <aside aria-label="Estimate limitations" className="mt-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-[#4a5a6e]">
        <p className="font-semibold text-heading">Indicative long-form ad revenue only. Excludes taxes, sponsorships and other income.</p>
        <p className="mt-1">Model: one ad impression per monetized view · {Math.round(CREATOR_SHARE * 100)}% creator share · {Math.round(adShare * 100)}% ad fill. For comparison, {viewsLabel(views)} views at an illustrative 70% fill return <strong>{money(fill70)}</strong> to the creator.</p>
        <a href="/methodology" className="mt-1 inline-block py-1 font-semibold text-yt-red underline underline-offset-4">How this estimate works</a>
      </aside>
    </>
  );
}
