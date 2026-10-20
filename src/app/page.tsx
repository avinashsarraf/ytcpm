import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Globe2, Layers, BarChart3, Sparkles, ShieldCheck,
  TrendingUp, Percent, Sigma, Compass,
} from "lucide-react";
import Calculator from "@/components/calculator";
import Faq from "@/components/faq";
import SectionHeading from "@/components/section-heading";
import { Reveal } from "@/components/motion";
import { NicheRangeChart, CountryBarChart, CountryFlagCards, SeasonChart } from "@/components/charts";
import {
  COUNTRIES, COUNTRIES_BY_CPM, NICHES_BY_CPM, SEASONS, CREATOR_SHARE,
  DATA_YEAR, DATA_UPDATED_AT, US_BLENDED_CPM, money,
} from "@/lib/data";
import { flagUrl } from "@/lib/flags";

const TOP6 = COUNTRIES_BY_CPM.slice(0, 6);
/** 18 — EUR is shared by six markets, so this is unique currencies, not countries. */
const CURRENCY_COUNT = new Set(COUNTRIES.map((c) => c.currency)).size;
const TOP_CPM = COUNTRIES_BY_CPM[0];
const TOP_NICHE = NICHES_BY_CPM[0];
const LOW_COUNTRY = COUNTRIES_BY_CPM.at(-1)!;
const LOW_NICHE = NICHES_BY_CPM.at(-1)!;

const avg = (c: { cpmLow: number; cpmHigh: number }) => (c.cpmLow + c.cpmHigh) / 2;
const LOW_CPM = avg(LOW_COUNTRY);
/** ~26× — computed from the dataset so the copy can never drift from the chart. */
const GEO_RATIO = Math.round(US_BLENDED_CPM / LOW_CPM);
/** 50 ÷ 5 = 10× between the best and worst paying niche at the top of each band. */
const NICHE_RATIO = Math.round(TOP_NICHE.cpmHigh / LOW_NICHE.cpmHigh);

const RPM_FULL = US_BLENDED_CPM * CREATOR_SHARE;
const RPM_TYPICAL = RPM_FULL * 0.7;
/** 100K views = 100 × RPM. (The old copy multiplied by 100,000 and showed $990,000.) */
const SAMPLE_EARNINGS = Math.round(RPM_FULL * 100);

const FAQS = [
  {
    q: "What is CPM on YouTube and how is it calculated?",
    a: `CPM (cost per mille) is what advertisers pay for 1,000 ad impressions: CPM = (ad spend ÷ impressions) × 1,000. It is not your payout. YouTube keeps about 45% of long-form ad revenue, so your RPM is roughly CPM × ${Math.round(CREATOR_SHARE * 100)}% — and lower still when some views carry no ads.`,
  },
  {
    q: "How much does YouTube pay per 1,000 views in 2026?",
    a: `In the United States, long-form videos earn about ${money(RPM_FULL, 2)} RPM at a ${money(US_BLENDED_CPM)} blended CPM with every view monetized, or ${money(RPM_TYPICAL, 2)} at a realistic 70% ad-fill rate. Tier-1 markets such as the UK, Canada, Australia and Germany typically land 15–45% below that, while India, Brazil and Bangladesh usually land under $2 per 1,000 views.`,
  },
  {
    q: "How much is 1 million views worth?",
    a: `Multiply the RPM by 1,000. At ${money(RPM_FULL, 2)} RPM, a million views is about ${money(RPM_FULL * 1000)}; at ${money(RPM_TYPICAL, 2)} it is about ${money(RPM_TYPICAL * 1000)}. A US finance channel and a gaming channel with identical view counts can still differ ${NICHE_RATIO}× on the same million.`,
  },
  {
    q: "Why is my Studio RPM lower than the CPM shown here?",
    a: "CPM only counts ad impressions that actually served; RPM divides revenue across every view, including ad-blocked, non-monetized and Shorts-feed plays. Studio also nets out invalid traffic and revenue-share adjustments. If your Studio number is 20–40% under this estimate, nothing is wrong — the funnel simply has more leaks than a pure CPM figure implies.",
  },
  {
    q: "Do Shorts earn the same as long-form videos?",
    a: "No. Shorts use a pooled revenue share rather than a per-view CPM: expect roughly $0.02–$0.10 per 1,000 views in Tier-1 markets, with far higher volume. Long-form content with mid-rolls remains the only reliable way to reach $10+ RPM.",
  },
  {
    q: "Which niche and country pay the most?",
    a: `Finance & Investing leads at ${money(TOP_NICHE.cpmLow, 0)}–${money(TOP_NICHE.cpmHigh, 0)} CPM, followed by Insurance & Legal and Business & Marketing. The United States pays the most of the ${COUNTRIES_BY_CPM.length} markets tracked (${money(TOP_CPM.cpmLow, 0)}–${money(TOP_CPM.cpmHigh, 0)}), roughly ${GEO_RATIO}× ${LOW_COUNTRY.name}'s blended rate.`,
  },
  {
    q: "How accurate are these benchmarks?",
    a: `They are directional ranges compiled from public creator earnings disclosures, advertiser reports and platform documentation, refreshed on ${DATA_UPDATED_AT}. They are not a guarantee: your own RPM depends on watch time, audience geography, ad fill and seasonality. Always compare against YouTube Studio, which is the ground truth for your channel.`,
  },
  {
    q: "How can I raise my CPM?",
    a: "Four levers that actually move the number: (1) attract US, UK, CA or AU viewers — geography alone can multiply revenue; (2) publish in high-intent niches such as finance, software and B2B; (3) pass 8 minutes to unlock mid-roll ads; (4) ship your best work in Q4, when ad budgets peak and CPMs run roughly 1.6× the annual average.",
  },
];

export default function Home() {
  const webAppLd = { "@context": "https://schema.org", "@type": "WebApplication", name: "YouTube CPM Calculator — ytcpm.online", url: "https://ytcpm.online", applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  const STATS = [
    { value: COUNTRIES_BY_CPM.length, label: "Countries tracked", note: "Tier 1 premium markets through Tier 4 volume markets" },
    { value: NICHES_BY_CPM.length, label: "Niches benchmarked", note: "From finance at $15–$50 to kids content at $1.50–$5" },
    { value: `${Math.round(CREATOR_SHARE * 100)}%`, label: "Creator share", note: "What is left of long-form CPM after YouTube's cut" },
    { value: SEASONS.length, label: "Quarters modelled", note: "Q1 budget hangover to the Q4 December auction peak" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* ══════ HERO ══════ */}
      <section className="w-full border-b border-border bg-gradient-to-b from-yt-red-light via-white to-white pt-24 sm:pt-28">
        <div className="section-full mx-auto max-w-[1180px] py-12 sm:py-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Reveal>
                <p className="eyebrow">{DATA_YEAR} benchmarks · {COUNTRIES_BY_CPM.length} countries · {NICHES_BY_CPM.length} niches</p>
              </Reveal>

              <Reveal delay={0.06}>
                <h1 className="display-1 mt-5">
                  YouTube CPM<br />
                  <span className="accent-serif text-yt-red">calculator</span>
                </h1>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="lede mt-6">
                  Find out what 1,000 views are actually worth. Choose a niche, an audience country and a
                  content type — this calculator shows the <strong className="font-semibold text-heading">CPM range</strong>,
                  the creator share after YouTube&apos;s cut, and a monthly estimate in your own currency.
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-fog">
                  <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-yt-red" /> No signup, no paywall</li>
                  <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-yt-red" /> Updated {DATA_UPDATED_AT}</li>
                  <li className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-yt-red" /> {CURRENCY_COUNT} local currencies</li>
                </ul>
              </Reveal>

              <Reveal delay={0.24}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#calculator" className="group inline-flex items-center gap-2 rounded-full bg-yt-red px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(217,0,0,0.28)] transition-all duration-300 hover:bg-yt-red-hover hover:shadow-[0_6px_28px_rgba(217,0,0,0.36)] hover:scale-[1.03]">
                    Estimate my earnings <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                  <Link href="/cpm-by-country" className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 text-sm font-semibold text-heading transition-all duration-300 hover:border-yt-red/40 hover:text-yt-red">
                    <Globe2 className="h-4 w-4" /> Compare countries
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Snapshot card — every number comes from the dataset. */}
            <Reveal delay={0.1}>
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="panel !rounded-2xl p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <p className="meta">{DATA_YEAR} snapshot</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-mint-bg px-2.5 py-1 text-[11px] font-bold text-mint">
                      <ShieldCheck className="h-3 w-3" /> {COUNTRIES_BY_CPM.length} markets
                    </span>
                  </div>

                  <div className="mt-5 flex items-baseline justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <p className="text-[13px] text-fog">Highest blended CPM</p>
                      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-heading">
                        {TOP_CPM.name}
                      </p>
                    </div>
                    <p className="num-mono text-3xl font-bold text-yt-red">{money(avg(TOP_CPM))}</p>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {TOP6.slice(1, 5).map((c) => {
                      const pct = Math.round((avg(c) / avg(TOP_CPM)) * 100);
                      return (
                        <div key={c.slug} className="flex items-center gap-3">
                          <span className="num-mono w-7 text-[11px] font-bold text-fog">{c.code}</span>
                          <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-yt-red-bg">
                            <span className="absolute inset-y-0 left-0 rounded-full bg-yt-red/80" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="num-mono w-12 text-right text-[11px] font-semibold text-heading">{money(avg(c))}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-fog">Top niche</p>
                      <p className="mt-0.5 text-sm font-bold text-heading">{TOP_NICHE.name}</p>
                    </div>
                    <p className="num-mono text-sm font-bold text-yt-red">
                      {money(TOP_NICHE.cpmLow, 0)}–{money(TOP_NICHE.cpmHigh, 0)} CPM
                    </p>
                  </div>

                  {/* 100K views strip — the old hero printed $990,000 for 100K views. */}
                  <div className="mt-3 rounded-xl border border-yt-red/15 bg-yt-red-light px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium text-fog">100,000 views · US long-form</p>
                        <p className="num-mono mt-0.5 font-display text-2xl font-bold leading-none text-heading">
                          {money(SAMPLE_EARNINGS)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-mint">
                        <TrendingUp className="h-2.5 w-2.5" /> {money(RPM_FULL, 2)} RPM
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10.5px] leading-snug text-fog">
                      At full ad fill. A typical 70% fill rate returns ≈{money(Math.round(RPM_TYPICAL * 100))}.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ STAT BAND ══════ */}
      <section className="w-full border-b border-border bg-white">
        <div className="section-full mx-auto max-w-[1180px] py-8">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.04}>
                <div className="flex flex-col gap-1 border-l-2 border-yt-red/25 pl-4">
                  <p className="num-mono text-3xl font-bold leading-none text-heading">{s.value}</p>
                  <p className="mt-1 text-[13px] font-semibold text-heading">{s.label}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-fog">{s.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CALCULATOR ══════ */}
      <section className="w-full bg-surface section-y">
        <div className="section-full mx-auto max-w-[1180px]">
          <Reveal>
            <div id="calculator" className="scroll-mt-24">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">The calculator</p>
                  <h2 className="display-3 mt-2">Estimate your monthly YouTube earnings</h2>
                </div>
                <p className="max-w-sm text-[13px] leading-relaxed text-fog">
                  Results update as you type. The breakdown shows the CPM, the RPM and the yearly projection behind every estimate.
                </p>
              </div>
              <Calculator />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════ CPM STRIP ══════ */}
      <section className="w-full border-b border-border bg-white py-5">
        <div className="section-full mx-auto max-w-[1180px]">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-yt-red-bg"><Globe2 className="h-5 w-5 text-yt-red" /></span>
                <div>
                  <p className="text-sm font-bold text-heading">Blended CPM by country</p>
                  <p className="text-[11px] text-fog">USD, per 1,000 ad impressions</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                {TOP6.map((c) => (
                  <Link key={c.slug} href={`/cpm-by-country/${c.slug}`} className="group flex items-center gap-2.5 transition-transform hover:-translate-y-0.5">
                    <Image src={flagUrl(c.code, "w40")} alt={`${c.name} flag`} width={28} height={20} className="flag-img !h-5 !w-7" unoptimized />
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-fog">{c.code}</span>
                      <span className="num-mono block text-sm font-bold text-heading group-hover:text-yt-red">{money(avg(c))}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/cpm-by-country" className="flex items-center gap-1 text-xs font-bold text-yt-red transition-all hover:gap-2">
                All {COUNTRIES_BY_CPM.length} countries <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════ WHAT IS CPM ══════ */}
      <section className="w-full section-y">
        <div className="section-full mx-auto max-w-[1180px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
            <Reveal>
              <div>
                <p className="eyebrow">The 30-second version</p>
                <h2 className="display-2 mt-4">What is <span className="accent-serif text-yt-red">CPM</span>, in plain English?</h2>
                <p className="lede mt-5">
                  CPM is the price an advertiser pays to reach 1,000 people. It is set at auction, per impression,
                  and it varies wildly by audience country and video topic — which is why two channels with the
                  same views can earn very different amounts.
                </p>
                <p className="body-copy mt-4">
                  What reaches your AdSense account is <strong className="font-semibold text-heading">RPM</strong>: revenue
                  per 1,000 total views, after YouTube&apos;s 45% cut and after accounting for views that never
                  triggered an ad. Treat CPM as the ceiling and RPM as the number you actually bank.
                </p>
                <Link href="/methodology" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-yt-red hover:gap-2.5 transition-all">
                  Read how we build these ranges <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="panel overflow-hidden !rounded-2xl">
                <div className="border-b border-border bg-surface px-5 py-3">
                  <p className="meta">The two formulas that matter</p>
                </div>
                <div className="space-y-5 p-5 sm:p-6">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-yt-red">
                      <Sigma className="h-3.5 w-3.5" /> Advertiser side
                    </div>
                    <p className="num-mono mt-2 rounded-lg bg-surface px-4 py-3 text-[13px] text-heading">
                      CPM = (ad spend ÷ impressions) × 1,000
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-mint">
                      <Percent className="h-3.5 w-3.5" /> Creator side
                    </div>
                    <p className="num-mono mt-2 rounded-lg bg-mint-bg px-4 py-3 text-[13px] text-heading">
                      RPM = CPM × {Math.round(CREATOR_SHARE * 100)}% × ad-fill rate
                    </p>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-fog">
                    Example: a {money(US_BLENDED_CPM)} US CPM at full ad fill returns{" "}
                    <strong className="font-semibold text-heading">{money(RPM_FULL, 2)}</strong> per 1,000 views.
                    At a typical 70% fill rate, it returns <strong className="font-semibold text-heading">{money(RPM_TYPICAL, 2)}</strong>.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ NICHE ══════ */}
      <section className="w-full border-y border-border bg-surface section-y">
        <div className="section-full mx-auto max-w-[1180px]">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <Reveal>
              <div className="lg:sticky lg:top-24">
                <SectionHeading
                  eyebrow="Highest CPM niches"
                  title={<>Your niche sets the <span className="accent-serif text-yt-red">ceiling</span></>}
                  lede={
                    <>
                      A finance explainer and a kids’ channel can collect the same 100,000 views and still
                      differ <strong className="font-semibold text-heading">{NICHE_RATIO}×</strong> in revenue.
                      Advertisers bid on intent, not on watch time — and finance, insurance and B2B carry the
                      most expensive intent on YouTube.
                    </>
                  }
                />
                <dl className="mt-7 space-y-3">
                  <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-[13px] text-fog">Best paying</dt>
                    <dd className="num-mono text-sm font-bold text-heading">{TOP_NICHE.name} · {money(TOP_NICHE.cpmLow, 0)}–{money(TOP_NICHE.cpmHigh, 0)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-[13px] text-fog">Lowest paying</dt>
                    <dd className="num-mono text-sm font-bold text-heading">{LOW_NICHE.name} · {money(LOW_NICHE.cpmLow, 0)}–{money(LOW_NICHE.cpmHigh, 0)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[13px] text-fog">Difference</dt>
                    <dd className="num-mono text-sm font-bold text-yt-red">{NICHE_RATIO}× between best and worst</dd>
                  </div>
                </dl>
                <Link href="/cpm-by-niche" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-yt-red px-6 py-3 text-sm font-bold text-white shadow-[0_4px_18px_rgba(217,0,0,0.25)] transition-all hover:bg-yt-red-hover hover:gap-3">
                  Explore all {NICHES_BY_CPM.length} niches <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <NicheRangeChart niches={NICHES_BY_CPM.slice(0, 7)} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ GEOGRAPHY ══════ */}
      <section className="w-full section-y">
        <div className="section-full mx-auto max-w-[1180px]">
          <Reveal>
            <SectionHeading
              eyebrow="CPM by country"
              title={<>Geography is <span className="accent-serif text-yt-red">destiny</span></>}
              lede={
                <>
                  The same video, the same views, a different flag on the audience report. A US viewer is worth
                  roughly <strong className="font-semibold text-heading">{GEO_RATIO}×</strong> a {LOW_COUNTRY.name} viewer
                  ({money(US_BLENDED_CPM)} vs {money(LOW_CPM)} blended CPM) — which is why audience geography moves
                  revenue more than almost any editing decision.
                </>
              }
            />
          </Reveal>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
            <Reveal delay={0.05}>
              <div className="panel p-5 sm:p-6">
                <CountryBarChart countries={COUNTRIES_BY_CPM.slice(0, 8)} />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <CountryFlagCards countries={COUNTRIES_BY_CPM} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ CPM vs RPM ══════ */}
      <section className="w-full border-y border-border bg-surface section-y">
        <div className="section-full mx-auto max-w-[1180px]">
          <Reveal>
            <SectionHeading
              eyebrow="CPM vs RPM — the money pipeline"
              title={<>Advertisers pay CPM. <span className="accent-serif text-yt-red">You get RPM.</span></>}
              lede={
                <>
                  Follow one thousand views from the auction to your balance. Using the US blended CPM of{" "}
                  {money(US_BLENDED_CPM)} and a full ad-fill rate, this is the exact arithmetic behind every
                  estimate on the site.
                </>
              }
            />
          </Reveal>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              {
                step: "Step 01",
                value: money(US_BLENDED_CPM),
                label: "Advertiser CPM",
                copy: `Brands pay YouTube ${money(US_BLENDED_CPM)} for every 1,000 ad impressions on US long-form content. Finance and insurance bids push far higher; entertainment pulls it down.`,
                accent: "text-heading",
                border: "",
              },
              {
                step: "Step 02",
                value: `−${Math.round((1 - CREATOR_SHARE) * 100)}%`,
                label: "Platform cut",
                copy: `YouTube keeps ${Math.round((1 - CREATOR_SHARE) * 100)}% of long-form ad revenue — about ${money(US_BLENDED_CPM * (1 - CREATOR_SHARE), 2)} of that ${money(US_BLENDED_CPM)}. Shorts settle at a pooled rate instead, and are handled separately.`,
                accent: "text-yt-red",
                border: "",
              },
              {
                step: "Step 03",
                value: money(RPM_FULL, 2),
                label: "Your RPM",
                copy: `What is left per 1,000 views when every view serves an ad. At a realistic 70% fill rate it lands at ${money(RPM_TYPICAL, 2)} — the number to compare against YouTube Studio.`,
                accent: "text-mint",
                border: "!border-mint/30 bg-mint-bg",
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.06}>
                <div className={`panel h-full p-6 ${s.border}`}>
                  <p className="meta">{s.step}</p>
                  <p className={`num-mono mt-3 font-display text-4xl font-bold tracking-tight ${s.accent}`}>{s.value}</p>
                  <p className="mt-1 text-[13px] font-semibold text-heading">{s.label}</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-fog">{s.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className="mt-6 flex items-start gap-2 text-[12.5px] leading-relaxed text-fog">
              <Compass className="mt-0.5 h-4 w-4 shrink-0 text-yt-red" />
              Rule of thumb: your RPM is usually 40–60% of the CPM you see quoted online. If a source promises
              otherwise, it is quoting the advertiser price, not your payout.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════ SEASONALITY ══════ */}
      <section className="w-full section-y">
        <div className="section-full mx-auto max-w-[1180px]">
          <Reveal>
            <SectionHeading
              eyebrow={`CPM seasonality · ${DATA_YEAR}`}
              title={<>January dip, <span className="accent-serif text-yt-red">December gold rush</span></>}
              lede="Ad budgets are cyclical. The cards below apply each quarter's index to the annual US blended CPM, so you can see how far the same channel swings between March and December."
            />
          </Reveal>
          <Reveal delay={0.06}>
            <div className="mt-9">
              <SeasonChart seasons={SEASONS} />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-[13px] leading-relaxed text-fog">
              Publishing strategy follows the auction: evergreen tutorials bank their best months in Q4, while
              January is the right time to test formats cheaply — impressions are abundant and competition for
              them is weakest.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════ HOW TO READ ══════ */}
      <section className="w-full border-y border-border bg-surface section-y">
        <div className="section-full mx-auto max-w-[1180px]">
          <Reveal>
            <SectionHeading
              eyebrow="How to read your estimate"
              title={<>Three numbers, <span className="accent-serif text-yt-red">one decision</span></>}
              lede="The calculator returns a range, not a promise. Here is how to turn it into something useful."
            />
          </Reveal>
          <Reveal delay={0.06}>
            <ol className="mt-9 grid gap-4 sm:grid-cols-3">
              {[
                { n: "01", title: "Start with the range", copy: "The low end assumes soft ad demand and partial fill; the high end assumes a premium audience and Q4 budgets. Plan against the middle, not the top." },
                { n: "02", title: "Compare RPM, not CPM", copy: "Your Studio RPM is the only number that reflects your ad-block rate and traffic mix. If our RPM band brackets it, the model is working for your channel." },
                { n: "03", title: "Change one variable at a time", copy: "Switch the audience country, then the niche, then the season. The deltas tell you where the next 10% of revenue actually comes from." },
              ].map((s) => (
                <li key={s.n} className="panel h-full p-6">
                  <span className="num-mono text-xs font-bold text-yt-red">{s.n}</span>
                  <h3 className="mt-2 font-display text-base font-semibold text-heading">{s.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-fog">{s.copy}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ══════ FAQ ══════ */}
      <section className="w-full section-y">
        <div className="section-full mx-auto max-w-[1180px]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <Reveal>
              <div className="lg:sticky lg:top-24">
                <SectionHeading
                  eyebrow="People also ask"
                  title={<>YouTube CPM, <span className="accent-serif text-yt-red">answered</span></>}
                  lede="Short, specific answers to the questions creators actually search for — with the math shown."
                />
                <div className="mt-6 flex items-center gap-2 text-[13px] text-fog">
                  <BarChart3 className="h-4 w-4 text-yt-red" />
                  Benchmarks refreshed {DATA_UPDATED_AT}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <Faq items={FAQS} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ CLOSING LINKS ══════ */}
      <section className="w-full border-t border-border bg-white pb-14">
        <div className="section-full mx-auto max-w-[1180px] pt-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/cpm-by-country" className="panel panel-lift group flex items-center justify-between gap-4 p-6">
              <span>
                <span className="meta">By market</span>
                <span className="mt-1 block font-display text-lg font-semibold text-heading">CPM rates for {COUNTRIES_BY_CPM.length} countries</span>
                <span className="mt-1 block text-[13px] text-fog">Tier 1 premiums through emerging markets, with local-currency estimates.</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-yt-red transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/cpm-by-niche" className="panel panel-lift group flex items-center justify-between gap-4 p-6">
              <span>
                <span className="meta">By topic</span>
                <span className="mt-1 block font-display text-lg font-semibold text-heading">{NICHES_BY_CPM.length} niches, ranked by RPM</span>
                <span className="mt-1 block text-[13px] text-fog">Finance at the top, kids content at the bottom — and what to do about it.</span>
              </span>
              <Layers className="h-5 w-5 shrink-0 text-yt-red transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
