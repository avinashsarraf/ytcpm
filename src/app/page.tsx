import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Zap, CheckCircle2, ShieldCheck, Calculator as CalcIcon, Database,
  PieChart, ArrowRight, ArrowUpRight, Lightbulb, Sparkles,
} from "lucide-react";
import LearningSection from "@/components/learning-section";
import { pageMetadata } from "@/lib/seo";
import Calculator from "@/components/calculator";
import Faq from "@/components/faq";
import { Reveal } from "@/components/motion";
import {
  COUNTRIES, NICHES, COUNTRIES_BY_CPM,
  DATA_UPDATED_AT, money,
} from "@/lib/data";
import { flagUrl } from "@/lib/flags";

export const metadata: Metadata = pageMetadata(
  "YouTube Earnings Calculator — CPM & RPM Estimates",
  "Estimate YouTube ad earnings from views and CPM. Calculate CPM or RPM from your own reports, compare audience-country benchmarks, and learn how to check CPM in Studio.",
  "/"
);


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
  { icon: PieChart, tint: "bg-[#f0eafd] text-[#7c3aed]", title: "Multiple Tools", copy: "CPM and RPM tools, earnings tables and monthly projections." },
  { icon: ShieldCheck, tint: "bg-[#e7f9ef] text-mint", title: "100% Free", copy: "No signup, no hidden charges, completely free to use." },
];

const HERO_POINTS = [
  { icon: CheckCircle2, tint: "bg-[#e7f9ef] text-mint", title: "100% Free", sub: "No Registration" },
  { icon: Zap, tint: "bg-[#e8f0fb] text-blue", title: "Instant Results", sub: "Real-time Estimate" },
  { icon: ShieldCheck, tint: "bg-[#f0eafd] text-[#7c3aed]", title: "Clear Assumptions", sub: "Reference CPM Ranges" },
];

const FAQS = [
  { q: "How do I check my YouTube CPM?", a: "Sign in to YouTube Studio, select Analytics and Revenue, and inspect the available ad-performance metrics for your date range. Use Advanced mode where needed. Record whether you are reading impression CPM or playback-based CPM; they use different denominators. Our public tools do not access your private channel reports." },
  { q: "What is the YouTube CPM formula?", a: "CPM = gross ad revenue or advertiser spend divided by ad impressions, multiplied by 1,000. For example, $100 across 10,000 ad impressions is a $10 CPM. Net creator revenue and total video views cannot replace those inputs." },
  { q: "How is YouTube RPM different from CPM?", a: "CPM describes advertiser cost before revenue sharing. RPM describes creator revenue per 1,000 corresponding views after revenue sharing. Studio RPM can include more than advertising, while this homepage offers ad-only long-form and separate unverified Shorts scenarios. For Shorts RPM, use the engaged-view basis described by YouTube." },
  { q: "How much does YouTube pay for 1,000 views?", a: "There is no fixed payout. A hypothetical $3 RPM implies $3 per 1,000 comparable views and $3,000 per million. Audience, format, ad eligibility, revenue sources and the reporting period affect the result. These examples are calculations, not market averages." },
  { q: "Can I check any channel's actual CPM without permission?", a: "Not with these public tools. Views and subscriber counts do not reveal private gross ad revenue or ad impressions. YouTube Analytics monetary reports require appropriate owner authorization. Estimates and actual channel reports must be labeled separately." },
  { q: "Do I need to sign up, and are my calculations monitored?", a: "No signup is needed. Browser calculator inputs stay in your browser. Direct calculation API requests may be stored anonymously. The Usage Monitor shows that API activity, not live YouTube channel analytics. We do not provide a connected-channel monitoring service." },
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
    name: "YouTube Earnings Calculator — YTCPM",
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
          <div className="grid items-center gap-1 md:grid-cols-[1.1fr_0.9fr] md:gap-4 xl:gap-8">
            <div className="relative z-10 pt-7 sm:pt-8 md:py-10 lg:py-14 xl:py-16">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 py-1 pl-1 pr-4 text-[14px] font-semibold text-heading shadow-[0_2px_10px_-4px_rgba(11,22,38,0.18)] backdrop-blur">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#fdf1d8]">
                    <Zap className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                  </span>
                  Free YouTube earnings estimator
                </span>
              </Reveal>

              <Reveal delay={0.06}>
                <h1 className="display-hero mt-4">
                  <span className="text-hot-gradient">YouTube</span> Earnings<br />
                  Calculator
                </h1>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mt-4 max-w-[26rem] text-[15px] leading-relaxed text-[#5b6b80] sm:text-[16px]">
                  Estimate long-form ad earnings from views and CPM. Compare audience-country and niche scenarios—or calculate your actual CPM and RPM from matching report inputs.
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 lg:gap-x-6">
                  {HERO_POINTS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <li key={p.title} className="flex items-center gap-2">
                        <span className={`grid h-8 w-8 place-items-center rounded-full ${p.tint}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-[14px] font-bold leading-tight text-heading">{p.title}</span>
                          <span className="block text-[13px] leading-tight text-[#5b6b80]">{p.sub}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="relative">
              {/* Natural image aspect ratio keeps the edge mask aligned to the artwork. */}
              <div className="relative mx-auto mb-2 w-full max-w-[280px] min-[480px]:max-w-[340px] sm:max-w-[380px] md:mb-0 md:max-w-none lg:max-w-[620px]">
                <Image
                  src="/hero-illustration.webp"
                  alt="3D illustration of a creator beside a laptop showing estimated YouTube earnings and CPM"
                  width={1200}
                  height={900}
                  priority
                  sizes="(max-width: 479px) 280px, (max-width: 639px) 340px, (max-width: 767px) 380px, (max-width: 1600px) 44vw, 620px"
                  className="hero-art h-auto w-full object-contain"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ CALCULATOR ══════ */}
      <section id="calculator" className="relative scroll-mt-24 bg-white pb-5 sm:pb-6">
        <div className="shell">
          <div className="relative -mt-4 sm:-mt-6">
            <Calculator />
          </div>
        </div>
      </section>

      {/* ══════ WHY USE ══════ */}
      <section className="bg-white pb-9 pt-6 sm:pb-12 sm:pt-8">
        <div className="shell">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="display-2 mx-auto max-w-[26ch]">
                Why Use Our <span className="text-yt-red">YouTube CPM Calculator</span>?
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-[#5b6b80]">
                Get indicative YouTube earnings estimates and insights to plan your content strategy better.
              </p>
            </div>
          </Reveal>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:gap-5">
            {WHY.map((w, i) => {
              const Icon = w.icon;
              return (
                <Reveal key={w.title} delay={i * 0.05}>
                  <div className="card card-hover flex h-full items-start gap-3 p-4 sm:block sm:p-5" data-benefit-card="">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${w.tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-extrabold text-heading sm:mt-4">{w.title}</h3>
                      <p className="mt-1 text-[14px] leading-relaxed text-[#5b6b80]">{w.copy}</p>
                    </div>
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
          <div className="grid gap-4 lg:grid-cols-2 xl:gap-5 ">
            {/* Country */}
            <Reveal>
              <div className="card h-full overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                  <h2 className="text-[15px] font-extrabold text-heading">YouTube CPM by Country</h2>
                  <Link href="/cpm-by-country" className="inline-flex items-center gap-1 text-[13px] font-bold text-[#1d4ed8] hover:gap-2 transition-all">
                    View All Countries <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div>
                  <ul className="divide-y divide-border/70 px-3 py-2">
                    {COUNTRY_ORDER.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/cpm-by-country/${c.slug}`} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-yt-red-light">
                          <Image src={flagUrl(c.code)} alt={`${c.name} flag`} width={24} height={17} className="!h-[17px] !w-6 rounded-[3px] object-cover" unoptimized />
                          <span className="min-w-0 flex-1 text-[14px] font-semibold text-[#4a5a6e] group-hover:text-heading">{c.name}</span>
                          <span className="num-mono text-[14px] font-extrabold text-heading">
                            {money(c.cpmLow, 2)} - {money(c.cpmHigh, 2)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                </div>
              </div>
            </Reveal>

            {/* Niche */}
            <Reveal delay={0.06}>
              <div className="card h-full overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                  <h2 className="text-[15px] font-extrabold text-heading">YouTube CPM by Niche</h2>
                  <Link href="/cpm-by-niche" className="inline-flex items-center gap-1 text-[13px] font-bold text-[#1d4ed8] hover:gap-2 transition-all">
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
                        <span className="min-w-0 flex-1 text-[14px] font-semibold text-[#4a5a6e] group-hover:text-heading">{row.niche!.name}</span>
                        <span className="num-mono text-[14px] font-extrabold text-heading">
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

      <LearningSection />

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
              <p className="mt-3 text-[14px] leading-relaxed text-[#5b6b80]">
                This tool provides estimated earnings based on average CPM rates. Actual YouTube earnings
                may vary depending on factors like audience location, content type, ad formats, and seasonal demand.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-yt-red" />
                <p className="text-[13px] leading-snug text-[#5b6b80]">
                  Benchmark snapshot <strong className="font-bold text-heading">{DATA_UPDATED_AT}</strong> · {COUNTRIES.length} countries · {NICHES.length} niches
                </p>
              </div>
              <Link href="/methodology" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-yt-red hover:gap-2 transition-all">
                Read the methodology <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
