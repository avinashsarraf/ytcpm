import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Zap, CheckCircle2, ShieldCheck, Calculator as CalcIcon, Database,
  PieChart, ArrowRight, ArrowUpRight, Lightbulb, Sparkles,
} from "lucide-react";
import Calculator from "@/components/calculator";
import ChannelCheck from "@/components/channel-check";
import Faq from "@/components/faq";
import WorldMap from "@/components/world-map";
import { Reveal } from "@/components/motion";
import {
  COUNTRIES, NICHES, COUNTRIES_BY_CPM, NICHES_BY_CPM, CREATOR_SHARE,
  DATA_YEAR, DATA_UPDATED_AT, money,
} from "@/lib/data";
import { flagUrl } from "@/lib/flags";

export const metadata: Metadata = {
  title: `YouTube CPM Calculator ${DATA_YEAR} — Calculate Your YouTube Earnings`,
  description:
    "Calculate how much your YouTube videos earn. Enter views, CPM and country for an instant earnings estimate with the creator share already applied. Free, no signup.",
  alternates: { canonical: "/" },
};

import { DEFAULT_CPM } from "@/lib/calculator";

/* The reference orders its tables for readability, not strictly by CPM. */
const COUNTRY_ORDER = ["united-states", "canada", "united-kingdom", "australia", "germany", "india"]
  .map((slug) => COUNTRIES_BY_CPM.find((c) => c.slug === slug))
  .filter((c): c is (typeof COUNTRIES_BY_CPM)[number] => Boolean(c));

const NICHE_ROWS = [
  { slug: "finance-investing", icon: "🏦", tint: "bg-[#fdf1d8] text-[#c2810a]" },
  { slug: "technology-software", icon: "💻", tint: "bg-[#eef2f7] text-[#475569]" },
  { slug: "business-marketing", icon: "🏢", tint: "bg-[#fbe9f2] text-[#c026a3]" },
  { slug: "health-fitness", icon: "❤️", tint: "bg-[#fde8ee] text-[#e11d48]" },
  { slug: "education-science", icon: "🎓", tint: "bg-[#e8f6ec] text-[#15803d]" },
  { slug: "entertainment-comedy", icon: "🎮", tint: "bg-[#f0eafd] text-[#7c3aed]" },
]
  .map((row) => ({ ...row, niche: NICHES.find((n) => n.slug === row.slug) }))
  .filter((row) => row.niche);

const WHY = [
  { icon: CalcIcon, tint: "bg-[#fde4ea] text-yt-red", title: "Easy to Use", copy: "Simple and clean interface with instant results." },
  { icon: Database, tint: "bg-[#e8f0fb] text-blue", title: "Country Benchmarks", copy: "Compare indicative CPM ranges across tracked markets." },
  { icon: PieChart, tint: "bg-[#f0eafd] text-[#7c3aed]", title: "Multiple Tools", copy: "CPM calculator, earnings tables & monthly channel projections." },
  { icon: ShieldCheck, tint: "bg-[#e7f9ef] text-mint", title: "100% Free", copy: "No signup, no hidden charges, completely free to use." },
];

const HERO_POINTS = [
  { icon: CheckCircle2, tint: "bg-[#e7f9ef] text-mint", title: "100% Free", sub: "No Registration" },
  { icon: Zap, tint: "bg-[#e8f0fb] text-blue", title: "Instant Results", sub: "Real-time Estimate" },
  { icon: ShieldCheck, tint: "bg-[#f0eafd] text-[#7c3aed]", title: "Clear Assumptions", sub: "Reference CPM Ranges" },
];

const FAQS = [
  {
    q: "What is YouTube CPM?",
    a: `CPM — cost per mille — is what advertisers pay for 1,000 ad impressions on your videos. It is set at auction and varies with audience country, topic and season. The ${DATA_YEAR} benchmark for US long-form content is ${money(18)} blended, while finance and insurance topics routinely clear ${money(30)}.`,
  },
  {
    q: "How is YouTube earnings calculated?",
    a: `Advertisers pay CPM; you receive RPM. Long-form revenue is shared ${Math.round(CREATOR_SHARE * 100)}% to the creator, so RPM ≈ CPM × ${Math.round(CREATOR_SHARE * 100)}% × the share of views that actually served an ad. At ${money(18)} CPM and full ad fill that is ${money(18 * CREATOR_SHARE, 2)} per 1,000 views.`,
  },
  {
    q: "Why does CPM vary by country?",
    a: `Advertisers bid more for audiences with higher purchasing power. The United States pays roughly 26× what Bangladesh pays for the same 1,000 views, and Tier-1 markets such as the UK, Canada and Australia sit 15–45% below the US. It is the single biggest lever on your revenue.`,
  },
  {
    q: "Do I need to sign up to use this tool?",
    a: "No. The calculator runs entirely in your browser, requires no account and stores nothing personal. Browser calculations are not logged. Direct requests to our calculation API may be stored anonymously for the Usage Monitor.",
  },
  {
    q: "How much does YouTube pay for 1,000 views?",
    a: `Long-form views in the US earn about ${money(18 * CREATOR_SHARE, 2)} at full ad fill and ${money(18 * CREATOR_SHARE * 0.7, 2)} at a realistic 70% fill rate. Shorts pay far less — roughly $0.02–$0.10 per 1,000 views — because they use a pooled revenue share rather than a per-view CPM.`,
  },
  {
    q: "Which niche has the highest CPM?",
    a: `Finance & Investing leads at ${money(NICHES_BY_CPM[0].cpmLow, 0)}–${money(NICHES_BY_CPM[0].cpmHigh, 0)} CPM, followed by Insurance & Legal and Business & Marketing. Kids & Family sits at the bottom (${money(NICHES_BY_CPM.at(-1)!.cpmLow, 0)}–${money(NICHES_BY_CPM.at(-1)!.cpmHigh, 0)}) because personalised ads are restricted on made-for-kids content.`,
  },
];

export default function Home() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "YouTube CPM Calculator — ytcpm.online",
    url: "https://ytcpm.online",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* ══════ HERO ══════ */}
      <section className="hero-shell relative overflow-hidden">
        <div className="shell relative">
          <div className="grid items-center gap-2 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4 xl:gap-8">
            <div className="relative z-10 pt-9 sm:pt-12 lg:pb-14 xl:pb-16">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 py-1 pl-1 pr-4 text-[12.5px] font-semibold text-heading shadow-[0_2px_10px_-4px_rgba(11,22,38,0.18)] backdrop-blur">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#fdf1d8]">
                    <Zap className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                  </span>
                  Free YouTube CPM Calculator
                </span>
              </Reveal>

              <Reveal delay={0.06}>
                <h1 className="display-hero mt-4">
                  Calculate Your<br />
                  <span className="text-hot-gradient">YouTube</span> Earnings
                </h1>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mt-4 max-w-[26rem] text-[15px] leading-relaxed text-[#5b6b80] sm:text-[16px]">
                  Estimate how much you can earn from your YouTube videos based on views, CPM and country.
                  Free, fast and transparent.
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                  {HERO_POINTS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <li key={p.title} className="flex items-center gap-2">
                        <span className={`grid h-8 w-8 place-items-center rounded-full ${p.tint}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-[12.5px] font-bold leading-tight text-heading">{p.title}</span>
                          <span className="block text-[11.5px] leading-tight text-[#7c8a9c]">{p.sub}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="relative">
              {/* contain, never cover: cropping this render decapitates the
                  character at some breakpoints. Letterboxing is invisible
                  because the art is masked into the hero gradient. */}
              <div className="relative mx-auto mb-2 h-[280px] w-full max-w-[400px] sm:h-[340px] sm:max-w-[480px] lg:mx-0 lg:mb-0 lg:h-[400px] lg:max-w-none xl:h-[440px]">
                <Image
                  src="/hero-illustration.webp"
                  alt="3D illustration of a creator beside a laptop showing estimated YouTube earnings and CPM"
                  fill
                  priority
                  sizes="(max-width: 640px) 400px, (max-width: 1024px) 480px, (max-width: 1600px) 48vw, 740px"
                  className="hero-art object-contain object-center"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ CALCULATOR ══════ */}
      <section id="calculator" className="relative scroll-mt-24 bg-white pb-8 sm:pb-10">
        <div className="shell">
          <div className="relative -mt-4 sm:-mt-6">
            <Calculator />
          </div>
        </div>
      </section>

      {/* ══════ WHY USE ══════ */}
      <section className="section-y bg-white">
        <div className="shell">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="display-2">
                Why Use Our <span className="text-yt-red">YouTube CPM Calculator</span>?
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-[#5b6b80]">
                Get indicative YouTube earnings estimates and insights to plan your content strategy better.
              </p>
            </div>
          </Reveal>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-5">
            {WHY.map((w, i) => {
              const Icon = w.icon;
              return (
                <Reveal key={w.title} delay={i * 0.05}>
                  <div className="card card-hover h-full p-5 xl:p-6">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl ${w.tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-[15px] font-extrabold text-heading">{w.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#5b6b80]">{w.copy}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ CPM BY COUNTRY + NICHE ══════ */}
      <section className="bg-surface py-7 sm:py-9">
        <div className="shell">
          <div className="grid gap-4 lg:grid-cols-2 xl:gap-5 2xl:grid-cols-[1.08fr_0.92fr]">
            {/* Country */}
            <Reveal>
              <div className="card h-full overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                  <h2 className="text-[15px] font-extrabold text-heading">YouTube CPM by Country</h2>
                  <Link href="/cpm-by-country" className="inline-flex items-center gap-1 text-[12px] font-bold text-blue hover:gap-2 transition-all">
                    View All Countries <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1.05fr_0.95fr] lg:grid-cols-1 2xl:grid-cols-[1.1fr_0.9fr]">
                  <ul className="divide-y divide-border/70 px-3 py-2">
                    {COUNTRY_ORDER.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/cpm-by-country/${c.slug}`} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-yt-red-light">
                          <Image src={flagUrl(c.code)} alt={`${c.name} flag`} width={24} height={17} className="!h-[17px] !w-6 rounded-[3px] object-cover" unoptimized />
                          <span className="flex-1 truncate text-[12.5px] font-semibold text-[#4a5a6e] group-hover:text-heading">{c.name}</span>
                          <span className="num-mono text-[12.5px] font-extrabold text-heading">
                            {money(c.cpmLow, 2)} - {money(c.cpmHigh, 2)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden items-center justify-center px-2 py-3 sm:flex lg:hidden 2xl:flex">
                    <WorldMap className="h-auto w-full opacity-95" />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Niche */}
            <Reveal delay={0.06}>
              <div className="card h-full overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                  <h2 className="text-[15px] font-extrabold text-heading">YouTube CPM by Niche</h2>
                  <Link href="/cpm-by-niche" className="inline-flex items-center gap-1 text-[12px] font-bold text-blue hover:gap-2 transition-all">
                    View All Niches <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <ul className="divide-y divide-border/70 px-3 py-2">
                  {NICHE_ROWS.map((row) => (
                    <li key={row.slug}>
                      <Link href={`/cpm-by-niche/${row.slug}`} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-yt-red-light">
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-[13px] ${row.tint}`} aria-hidden>
                          {row.icon}
                        </span>
                        <span className="flex-1 truncate text-[12.5px] font-semibold text-[#4a5a6e] group-hover:text-heading">{row.niche!.name}</span>
                        <span className="num-mono text-[12.5px] font-extrabold text-heading">
                          {money(row.niche!.cpmLow, 2)} - {money(row.niche!.cpmHigh, 2)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ CHANNEL CHECK ══════ */}
      <ChannelCheck cpm={DEFAULT_CPM} />

      {/* ══════ FAQ ══════ */}
      <section className="bg-white py-10 sm:py-12">
        <div className="shell">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start xl:gap-8 2xl:grid-cols-[1.3fr_0.7fr]">
            <div>
              <h2 className="display-sub mb-4">
                Frequently Asked <span className="text-yt-red">Questions</span>
              </h2>
              <Faq items={FAQS} />
            </div>

            <aside className="rounded-2xl bg-[#fdf0f3] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fde3c7]">
                  <Lightbulb className="h-5 w-5 fill-[#f59e0b] text-[#f59e0b]" />
                </span>
                <h2 className="text-[15px] font-extrabold text-yt-red">Important Note</h2>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#5b6b80]">
                This tool provides estimated earnings based on average CPM rates. Actual YouTube earnings
                may vary depending on factors like audience location, content type, ad formats, and seasonal demand.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-yt-red" />
                <p className="text-[11.5px] leading-snug text-[#5b6b80]">
                  Benchmarks reviewed <strong className="font-bold text-heading">{DATA_UPDATED_AT}</strong> · {COUNTRIES.length} countries · {NICHES.length} niches
                </p>
              </div>
              <Link href="/methodology" className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-yt-red hover:gap-2 transition-all">
                Read the methodology <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
