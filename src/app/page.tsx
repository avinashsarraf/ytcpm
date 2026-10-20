import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, CircleDot, Globe2, Layers, SearchCheck,
  BarChart3, Sparkles, TrendingUp, ShieldCheck,
} from "lucide-react";
import Calculator from "@/components/calculator";
import Faq from "@/components/faq";
import { Reveal } from "@/components/motion";
import { NicheRangeChart, CountryBarChart, CountryFlagCards, SeasonChart } from "@/components/charts";
import { COUNTRIES_BY_CPM, NICHES_BY_CPM, SEASONS, CREATOR_SHARE, DATA_YEAR, DATA_UPDATED_AT, US_BLENDED_CPM, money } from "@/lib/data";
import { flagUrl } from "@/lib/flags";

const TOP6 = COUNTRIES_BY_CPM.slice(0, 6);
const TOP_CPM = COUNTRIES_BY_CPM[0];
const TOP_NICHE = NICHES_BY_CPM[0];
const RPM_LONG = `${money(NICHES_BY_CPM.at(-1)!.cpmLow * CREATOR_SHARE, 2)}–${money(TOP_NICHE.cpmHigh * CREATOR_SHARE, 0)}`;
const SAMPLE_EARNINGS = Math.round((US_BLENDED_CPM * CREATOR_SHARE * 100_000) / 100) * 100;

const FAQS = [
  { q: "What is CPM and how is it calculated?", a: "CPM (Cost Per Mille) is what advertisers pay YouTube for every 1,000 ad impressions. CPM = (total ad spend ÷ impressions) × 1,000. You receive RPM ≈ CPM × 55% after YouTube's cut." },
  { q: "Why does my RPM differ from CPM?", a: "CPM counts only ad-served views. RPM counts ALL views (ad-blocked, non-monetized). RPM = (revenue ÷ total views) × 1,000 — always lower than CPM." },
  { q: "Does YouTube pay differently for Shorts?", a: `Yes. Shorts use a pooled revenue share, not classic CPM. Expect roughly $0.02–$0.10 RPM per 1,000 Shorts views in Tier-1 markets — far below long-form, where ${RPM_LONG} per 1,000 views is common.` },
  { q: "How often does YouTube pay?", a: "Monthly via AdSense, typically 21st–26th. Minimum $100 balance required." },
  { q: "Can I increase my CPM?", a: "Yes: (1) target US/UK/AU audiences, (2) high-intent topics, (3) 8+ min videos for mid-rolls, (4) publish Q4 when ad spend peaks +160%." },
];


export default function Home() {
  const webAppLd = { "@context": "https://schema.org", "@type": "WebApplication", name: "YouTube CPM Calculator — ytcpm.online", url: "https://ytcpm.online", applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* ══════ HERO — Full Width ══════ */}
      <section className="w-full border-b border-border bg-gradient-to-b from-yt-red-light via-white to-white pt-20 sm:pt-24">
        <div className="section-full mx-auto max-w-[1400px] py-12 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Reveal>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tag"><CircleDot className="h-3 w-3 text-yt-red" /> {DATA_YEAR} Benchmarks</span>
                  <span className="tag"><CircleDot className="h-3 w-3 text-yt-red" /> Transparent method</span>
                  <span className="tag"><CircleDot className="h-3 w-3 text-yt-red" /> For YouTube Creators</span>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="mt-7 font-display text-[2.8rem] font-bold leading-[1.08] tracking-tight text-heading sm:text-6xl lg:text-[4.2rem]">
                  YouTube CPM<br />
                  <span className="text-yt-gradient">Calculator</span>
                </h1>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-fog sm:text-base">
                  Estimate your YouTube earnings with <strong className="text-heading">{DATA_YEAR} CPM benchmarks</strong> for
                  {" "}{COUNTRIES_BY_CPM.length} countries and {NICHES_BY_CPM.length} niches — in your local currency.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-7 flex flex-wrap items-center gap-5 text-[13px] text-fog">
                  <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-yt-red-bg"><BarChart3 className="h-3.5 w-3.5 text-yt-red" /></span> Reviewed {DATA_UPDATED_AT}</span>
                  <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-yt-red-bg"><Globe2 className="h-3.5 w-3.5 text-yt-red" /></span> Country & Niche Insights</span>
                  <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-yt-red-bg"><Sparkles className="h-3.5 w-3.5 text-yt-red" /></span> Simple & Easy to Use</span>
                </div>
              </Reveal>
              <Reveal delay={0.26}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#calculator" className="group inline-flex items-center gap-2 rounded-full bg-yt-red px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(255,0,0,0.35)] transition-all duration-300 hover:bg-yt-red-hover hover:shadow-[0_6px_28px_rgba(255,0,0,0.45)] hover:scale-105">
                    Calculate my earnings <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                  <Link href="/cpm-by-country" className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-white px-6 py-3 text-sm font-semibold text-heading transition-all duration-300 hover:border-yt-red hover:text-yt-red hover:shadow-md">
                    <Globe2 className="h-4 w-4" /> CPM by Country
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Hero visual — built from live dataset values (no missing asset) */}
            <Reveal delay={0.15}>
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="animate-float panel !rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-fog">{DATA_YEAR} snapshot</p>
                    <span className="flex items-center gap-1 rounded-full bg-mint-bg px-2 py-0.5 text-[10px] font-bold text-mint">
                      <ShieldCheck className="h-3 w-3" /> {COUNTRIES_BY_CPM.length} markets
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-fog">Top blended CPM</p>
                  <p className="num-mono font-display text-3xl font-bold text-heading">{TOP_CPM.code} · {money((TOP_CPM.cpmLow + TOP_CPM.cpmHigh) / 2)}</p>
                  <div className="mt-4 space-y-2">
                    {TOP6.slice(0, 4).map((c) => {
                      const avg = (c.cpmLow + c.cpmHigh) / 2;
                      const pct = Math.round((avg / ((TOP_CPM.cpmLow + TOP_CPM.cpmHigh) / 2)) * 100);
                      return (
                        <div key={c.slug} className="flex items-center gap-3">
                          <span className="num-mono w-6 text-[11px] font-bold text-fog">{c.code}</span>
                          <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-yt-red-bg">
                            <span className="absolute inset-y-0 left-0 rounded-full bg-yt-red" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="num-mono w-10 text-right text-[11px] font-semibold text-heading">{money(avg)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 border-t border-border pt-3 text-[10px] text-fog">Highest-paying niche: <strong className="text-heading">{TOP_NICHE.name}</strong> · {money(TOP_NICHE.cpmLow, 0)}–{money(TOP_NICHE.cpmHigh, 0)} CPM</p>
                </div>
                {/* Floating earnings card */}
                <div className="absolute -bottom-4 -left-4 rounded-xl bg-white p-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)] sm:p-5">
                  <p className="text-[11px] font-medium text-fog">100K views · US blended</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="num-mono font-display text-3xl font-bold text-heading">{money(SAMPLE_EARNINGS)}</span>
                    <span className="flex items-center gap-0.5 rounded-full bg-mint-bg px-2 py-0.5 text-[10px] font-bold text-mint">
                      <TrendingUp className="h-3 w-3" /> est/mo
                    </span>
                  </div>
                </div>
                {/* Floating tag */}
                <div className="absolute -right-2 -top-2 rounded-lg bg-yt-red px-3 py-1.5 text-[10px] font-bold leading-tight text-white shadow-lg sm:px-4 sm:py-2">
                  Local<br />currency
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ CALCULATOR — Full Width ══════ */}
      <section className="w-full bg-surface py-10">
        <div className="section-full mx-auto max-w-[1400px]">
          <Reveal y={30}>
            <div id="calculator" className="scroll-mt-20">
              <Calculator />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════ CPM STRIP with real flags ══════ */}
      <section className="w-full border-y border-border bg-white py-5">
        <div className="section-full mx-auto max-w-[1400px]">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-yt-red-bg transition-transform hover:scale-110"><Globe2 className="h-5 w-5 text-yt-red" /></span>
                <div><p className="text-sm font-bold text-heading">Average CPM by Country</p></div>
              </div>
              <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                {TOP6.map((c) => {
                  const avg = (c.cpmLow + c.cpmHigh) / 2;
                  return (
                    <Link key={c.slug} href={`/cpm-by-country/${c.slug}`} className="group flex items-center gap-2.5 transition-transform hover:scale-105">
                      <Image src={flagUrl(c.code, "w40")} alt={c.name} width={28} height={20} className="flag-img !w-7 !h-5" unoptimized />
                      <div className="text-center">
                        <span className="block text-[10px] font-semibold text-fog">{c.code}</span>
                        <span className="num-mono block text-sm font-bold text-yt-red">${avg.toFixed(2)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link href="/cpm-by-country" className="flex items-center gap-1 text-xs font-bold text-yt-red transition-all hover:gap-2">View all <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════ CPM BY NICHE — Full Width ══════ */}
      <section className="w-full py-16">
        <div className="section-full mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <Reveal>
              <div className="lg:sticky lg:top-20">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-yt-red-bg transition-transform hover:scale-110"><Layers className="h-5 w-5 text-yt-red" /></span>
                  <div><p className="text-sm font-bold text-heading">CPM by Niche</p><span className="tag-red text-[10px]">Compare & Find Your Best Value</span></div>
                </div>
                <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-heading sm:text-4xl">CPM by Niche</h2>
                <p className="mt-3 text-sm leading-relaxed text-fog">Different niches, different earnings. See how your niche performs compared to others.</p>
                <Link href="/cpm-by-niche" className="group mt-7 inline-flex items-center gap-2 rounded-full border-2 border-yt-red bg-white px-6 py-3 text-sm font-bold text-yt-red transition-all duration-300 hover:bg-yt-red hover:text-white hover:shadow-[0_4px_20px_rgba(255,0,0,0.3)] hover:scale-105">
                  View all niches <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <NicheRangeChart niches={NICHES_BY_CPM.slice(0, 6)} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ GEOGRAPHY — Full Width ══════ */}
      <section className="w-full border-y border-border bg-surface py-16">
        <div className="section-full mx-auto max-w-[1400px]">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-yt-red-bg"><Globe2 className="h-5 w-5 text-yt-red" /></span>
              <div><p className="text-sm font-bold text-heading">Geography</p><span className="tag-red text-[10px]">Where Your Audience Pays More</span></div>
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-heading sm:text-4xl">Geography</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-fog">CPM varies widely by country. Find out which regions offer the best rates for your content.</p>
          </Reveal>
          <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <Reveal delay={0.05}><div className="panel p-6"><CountryBarChart countries={COUNTRIES_BY_CPM.slice(0, 8)} /></div></Reveal>
            <Reveal delay={0.1}><CountryFlagCards countries={COUNTRIES_BY_CPM} /></Reveal>
          </div>
        </div>
      </section>

      {/* ══════ CPM vs RPM — Full Width ══════ */}
      <section className="w-full py-16">
        <div className="section-full mx-auto max-w-[1400px]">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-yt-red-bg"><BarChart3 className="h-5 w-5 text-yt-red" /></span>
              <div><p className="text-sm font-bold text-heading">CPM vs RPM</p><span className="tag-red text-[10px]">Know the Difference</span></div>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-fog">CPM is what advertisers pay. RPM is what you actually earn after YouTube&apos;s cut.</p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Reveal delay={0.06}>
              <div className="panel p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-fog">CPM · US blended</p>
                <p className="num-mono mt-4 font-display text-5xl font-bold text-heading sm:text-6xl">{money(US_BLENDED_CPM)}</p>
                <p className="mt-2 text-sm text-fog">per 1,000 views</p>
                <p className="mt-4 text-xs text-fog">What advertisers pay</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-xl bg-yt-red p-7 text-white shadow-[0_8px_32px_-8px_rgba(255,0,0,0.5)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_-8px_rgba(255,0,0,0.6)]">
                <p className="text-xs font-bold uppercase tracking-wider text-white/60">YouTube Share</p>
                <p className="num-mono mt-4 font-display text-5xl font-bold sm:text-6xl">−45%</p>
                <p className="mt-2 text-sm text-white/80">of total revenue</p>
                <p className="mt-4 text-xs text-white/50">You keep ~55%</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ SEASONALITY — Full Width ══════ */}
      <section className="w-full border-y border-border bg-surface py-16">
        <div className="section-full mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-yt-red-bg"><BarChart3 className="h-5 w-5 text-yt-red" /></span>
                <div><p className="text-sm font-bold text-heading">Seasonality</p><span className="tag-red text-[10px]">January Dip, December Gold Rush</span></div>
              </div>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-fog">Your earnings can change throughout the year. Here&apos;s the seasonal trend based on historical data.</p>
            </Reveal>
            <Reveal delay={0.08}><SeasonChart seasons={SEASONS} /></Reveal>
          </div>
        </div>
      </section>

      {/* ══════ FAQ — Full Width ══════ */}
      <section className="w-full py-16">
        <div className="section-full mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-yt-red-bg"><SearchCheck className="h-5 w-5 text-yt-red" /></span>
                <div><p className="text-sm font-bold text-heading">FAQ</p><span className="tag-red text-[10px]">Quick Answers</span></div>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-fog">Get answers to the most common questions about YouTube CPM and earnings.</p>
            </Reveal>
            <Reveal delay={0.08}><Faq items={FAQS} /></Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
