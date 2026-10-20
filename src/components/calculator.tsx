"use client";

import { useState, type CSSProperties } from "react";
import { ArrowRight, BarChart3, CalendarDays, Clock3, Eye, Gauge, Layers, SlidersHorizontal, TrendingUp, Zap } from "lucide-react";
import { COUNTRIES, NICHES, SEASONS, CREATOR_SHARE, DATA_YEAR, countryMultiplier, estimateEarnings, localMoney, viewsLabel, fxNote } from "@/lib/data";
import CountrySelector from "@/components/country-selector";
import { WORLDWIDE, DEFAULT_NICHE, MAX_CPM, MAX_VIEWS, benchmarkCpm, parseViews } from "@/lib/calculator";

const QUICK = [1_000, 10_000, 100_000, 1_000_000, 10_000_000, 50_000_000];
const MARKETS = [WORLDWIDE, ...COUNTRIES];
const num = (value: number) => value.toLocaleString("en-US");
const LOG_MAX = Math.log10(MAX_VIEWS + 1);
const eyebrow = "flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-[11px]";

/** Local-only scenario planner. Neither the rate assumptions nor FX are live feeds. */
export default function Calculator() {
  const [views, setViews] = useState(100_000);
  const [viewsText, setViewsText] = useState("100,000");
  const [nicheSlug, setNicheSlug] = useState(DEFAULT_NICHE.slug);
  const [countrySlug, setCountrySlug] = useState("united-states");
  const [type, setType] = useState<"long" | "shorts">("long");
  const [seasonKey, setSeasonKey] = useState("annual");
  const [advanced, setAdvanced] = useState(false);
  const [adShare, setAdShare] = useState(1);
  const [cpmOverride, setCpmOverride] = useState<string | null>(null);
  const niche = NICHES.find(n => n.slug === nicheSlug) ?? DEFAULT_NICHE;
  const country = MARKETS.find(c => c.slug === countrySlug) ?? WORLDWIDE;
  const season = SEASONS.find(s => s.q === seasonKey)?.mult ?? 1;
  const benchmark = benchmarkCpm(niche, country, season);
  const custom = cpmOverride !== null && cpmOverride !== "";
  const cpm = custom ? Number(cpmOverride) / country.fx : benchmark;
  const range = estimateEarnings({ views, niche, country, type, season, monetizedShare: adShare });
  const cpmLow = custom ? cpm : range.cpmLow;
  const cpmHigh = custom ? cpm : range.cpmHigh;
  const rpmLow = type === "shorts" ? range.rpmLow : cpmLow * CREATOR_SHARE * adShare;
  const rpmHigh = type === "shorts" ? range.rpmHigh : cpmHigh * CREATOR_SHARE * adShare;
  const rpm = (rpmLow + rpmHigh) / 2;
  const monthly = views / 1000 * rpm;
  const format = (usd: number, digits?: number) => localMoney(usd, country, digits);
  const currency = country.currency;
  const updateViews = (value: number) => { setViews(value); setViewsText(num(value)); };
  const changeViewsText = (raw: string) => { const value = parseViews(raw); setViews(value); setViewsText(raw.replace(/[^\d]/g, "") ? num(value) : ""); };
  const resetBenchmark = () => setCpmOverride(null);

  return <>
    <noscript><p className="mb-4 rounded-xl border border-border p-4">Enable JavaScript for interactive estimates. Country, niche and methodology pages remain readable without it.</p></noscript>
    <div data-home-calculator className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_55px_-24px_rgba(11,22,38,0.22)]">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0 p-4 sm:p-7 xl:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className={`${eyebrow} text-yt-red`}><Gauge aria-hidden="true" className="h-4 w-4" />Build your earnings estimate</h2><span className="rounded-full border border-mint/30 bg-mint/5 px-3 py-1.5 font-mono text-[10px] font-semibold text-mint">{DATA_YEAR} MODEL · NOT LIVE</span></div>
          <div className="mt-7 flex items-center justify-between gap-4"><label htmlFor="monthly-views" className="flex items-center gap-2 text-sm font-semibold text-fog"><Eye aria-hidden="true" className="h-4 w-4 text-yt-red" />{type === "shorts" ? "Monthly engaged views" : "Monthly views"}</label><input id="monthly-views" aria-label="Total views" inputMode="numeric" value={viewsText} onChange={e => changeViewsText(e.target.value)} onBlur={() => setViewsText(num(views))} className="w-[52%] min-w-0 rounded-lg border border-transparent bg-transparent p-2 text-right font-mono text-xl font-bold tracking-tight text-heading hover:border-border focus:border-yt-red sm:text-2xl" /></div>
          <input aria-label="Monthly views slider" aria-valuetext={`${num(views)} ${type === "shorts" ? "engaged " : ""}views per month`} type="range" min="0" max="100" step="0.01" value={Math.log10(views + 1) / LOG_MAX * 100} onChange={e => updateViews(Math.min(MAX_VIEWS, Math.round(10 ** (Number(e.target.value) / 100 * LOG_MAX) - 1)))} style={{ "--fill": `${Math.log10(views + 1) / LOG_MAX * 100}%` } as CSSProperties} className="slider mt-3" />
          <div role="group" aria-label="Quick view presets" className="mt-1 grid grid-cols-3 gap-1 sm:grid-cols-6">{QUICK.map(v => <button key={v} type="button" aria-pressed={views === v} onClick={() => updateViews(v)} className={`min-h-11 rounded-lg px-1 text-xs font-semibold transition-colors ${views === v ? "bg-yt-red-light text-yt-red" : "text-fog hover:bg-surface"}`}>{viewsLabel(v)}</button>)}</div>
          <div className="mt-5 space-y-5">
            <CountrySelector countries={MARKETS} value={country} onChange={slug => { setCountrySlug(slug); resetBenchmark(); }} />
            <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-fog"><Layers aria-hidden="true" className="h-4 w-4 text-yt-red" />Channel niche</span><select aria-label="Channel niche" className="select-field min-h-12" value={nicheSlug} onChange={e => { setNicheSlug(e.target.value); resetBenchmark(); }}>{NICHES.map(n => <option key={n.slug} value={n.slug}>{n.name}{type === "long" ? ` — ${format(n.cpmLow * countryMultiplier(country) * season, 2)}–${format(n.cpmHigh * countryMultiplier(country) * season, 2)} CPM` : ""}</option>)}</select></label>
            <fieldset><legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-fog"><Clock3 aria-hidden="true" className="h-4 w-4 text-yt-red" />Content type</legend><div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">{([['long', 'Long-form', 'Watch-page ad scenario'], ['shorts', 'Shorts', 'Engaged-view RPM scenario']] as const).map(([id, label, detail]) => <button key={id} type="button" aria-pressed={type === id} onClick={() => setType(id)} className={`min-h-[64px] min-w-0 rounded-lg p-3 text-left transition-colors ${type === id ? "hot-gradient text-white shadow-md" : "text-fog hover:bg-white"}`}><span className="block text-sm font-bold">{label}</span><span className={`mt-1 block text-[10px] leading-relaxed ${type === id ? "text-white/90" : "text-fog"}`}>{detail}</span></button>)}</div></fieldset>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2"><button type="button" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced} aria-controls="calculator-assumptions" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-yt-red hover:bg-yt-red-light"><SlidersHorizontal aria-hidden="true" className="h-4 w-4" />{advanced ? "Hide assumptions" : "Edit assumptions"}</button><a href="#results" className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-fog hover:text-yt-red">View Results<ArrowRight aria-hidden="true" className="h-4 w-4" /></a></div>
          {advanced && <div id="calculator-assumptions" className="mt-3 space-y-4 rounded-xl border border-border bg-surface p-4">
            <label className="block text-sm font-semibold text-heading">Season<select className="select-field mt-2" value={seasonKey} onChange={e => { setSeasonKey(e.target.value); resetBenchmark(); }}><option value="annual">Annual baseline (1.00×)</option>{SEASONS.map(s => <option key={s.q} value={s.q}>{s.q} · {s.label} ({s.mult.toFixed(2)}×)</option>)}</select></label>
            {type === "long" ? <><label className="block text-sm font-semibold text-heading">Custom CPM ({currency})<input aria-label={`CPM in ${currency}`} inputMode="decimal" value={cpmOverride ?? String(Number((benchmark * country.fx).toFixed(2)))} onChange={e => { const raw = e.target.value === "." ? "0." : e.target.value; if (/^\d*(\.\d{0,4})?$/.test(raw) && Number(raw) <= MAX_CPM * country.fx) setCpmOverride(raw); }} onBlur={() => { if (cpmOverride === "") resetBenchmark(); }} className="field mt-2" /></label><label className="block text-sm font-semibold text-heading">Views serving ads: {Math.round(adShare * 100)}%<input aria-label="Views serving ads" aria-valuetext={`${Math.round(adShare * 100)} percent`} type="range" min="0" max="100" step="5" value={Math.round(adShare * 100)} onChange={e => setAdShare(Number(e.target.value) / 100)} style={{ "--fill": `${adShare * 100}%` } as CSSProperties} className="slider mt-3" /></label><button type="button" onClick={resetBenchmark} className="min-h-11 text-sm font-semibold text-yt-red underline">Reset to model CPM</button></> : <p className="text-sm leading-relaxed text-fog">Shorts uses a separate, unverified RPM scenario. Long-form CPM, ad fill and the 55% watch-page share are not applied to Shorts.</p>}
            <p className="text-xs leading-relaxed text-fog">Changing niche, country or season resets custom CPM. Worldwide is unweighted. Maximum {num(MAX_VIEWS)} views and {format(MAX_CPM)} CPM. All calculations stay in this browser.</p>
          </div>}
        </div>
        <div id="results" role="region" aria-label="Earnings estimate" tabIndex={-1} className="min-w-0 scroll-mt-24 border-t border-border bg-gradient-to-br from-surface/80 to-white p-4 sm:p-7 lg:border-l lg:border-t-0 xl:p-8">
          <div className="flex items-start justify-between gap-3"><h2 className={`${eyebrow} text-mint`}><TrendingUp aria-hidden="true" className="h-4 w-4 shrink-0" />Estimated monthly earnings</h2><span aria-label="Result currency" className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-navy px-3 font-mono text-xs font-bold text-white">{currency}</span></div>
          <div aria-live="polite" aria-atomic="true" className="mt-4"><p className="break-all font-mono text-[clamp(2rem,4.3vw,3.75rem)] font-bold leading-tight tracking-tighter text-mint">{format(monthly)}</p><p className="mt-3 text-sm leading-relaxed text-fog">{custom && type === "long" ? "Custom CPM scenario" : "Model scenario range"} <strong className="font-mono text-heading">{format(views / 1000 * rpmLow)} – {format(views / 1000 * rpmHigh)}</strong> / month</p></div>
          <dl className="mt-7 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">{[
            { label: "Modeled ad-only RPM", value: `${format(rpmLow, 2)}–${format(rpmHigh, 2)}`, note: `per 1,000 ${type === "shorts" ? "engaged " : ""}views`, icon: BarChart3 },
            { label: "Advertiser CPM", value: type === "shorts" ? "Not applicable" : `${format(cpmLow, 2)}–${format(cpmHigh, 2)}`, note: type === "shorts" ? "Shorts is modeled using RPM" : "per 1,000 ad impressions", icon: Zap },
            { label: "Yearly projection", value: format(monthly * 12), note: "same monthly estimate × 12", icon: CalendarDays },
            { label: "Per 1M views", value: format(rpm * 1000), note: "midpoint scenario, not a payout", icon: Eye },
          ].map(({ label, value, note, icon: Icon }) => <div key={label} className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-sm"><dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-fog"><Icon aria-hidden="true" className="h-3 w-3 shrink-0 text-yt-red" />{label}</dt><dd className="mt-2 break-all font-mono text-lg font-bold tracking-tight text-heading sm:text-xl">{value}</dd><p className="mt-1 text-xs leading-relaxed text-fog">{note}</p></div>)}</dl>
          <aside className="mt-6 rounded-xl border border-yt-red/20 bg-yt-red-light/30 p-4 text-sm leading-relaxed text-fog"><strong className="text-heading">Scenario insight — </strong>{type === "shorts" ? "Shorts has a separate pooled-revenue model. These assumed RPM ranges are not verified averages or a conversion from long-form CPM." : <>The {country.slug === "worldwide" ? "unweighted worldwide" : country.name} model uses {countryMultiplier(country).toFixed(2)}× the US baseline. {custom ? "You are using a custom CPM instead of that benchmark." : "This multiplier is a planning assumption, not a measured channel rate."}</>}</aside>
          <div data-assumptions-summary className="mt-5 text-xs leading-relaxed text-fog">{niche.name} · {country.name} · {seasonKey === "annual" ? "Annual baseline" : seasonKey} · {type === "long" ? `${format(cpm, 2)} ${currency} ${custom ? "custom" : "benchmark"} CPM · ${Math.round(adShare * 100)}% ad fill` : "Shorts engaged-view scenario"}</div>
          {type === "long" && adShare === 1 && <p className="mt-3 text-xs font-semibold leading-relaxed text-gold">100% ad fill — optimistic scenario, not a guaranteed payout</p>}
          {country.currency !== "USD" && <p className="mt-3 text-xs leading-relaxed text-fog">{fxNote(country)} (approximate, not live). All results are shown in {currency}.</p>}
        </div>
      </div>
      <div className="border-t border-border bg-surface px-4 py-4 text-center font-mono text-[10px] leading-relaxed tracking-wide text-fog sm:px-7">{type === "long" ? "EARNINGS = VIEWS ÷ 1,000 × CPM × 55% × AD FILL · ONE AD IMPRESSION PER MONETIZED VIEW" : "SHORTS SCENARIO = ENGAGED VIEWS ÷ 1,000 × ASSUMED SHORTS RPM · NO EXTRA 55% DEDUCTION"}</div>
    </div>
  </>;
}
