import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Globe2, Percent, Lightbulb } from "lucide-react";
import Faq from "@/components/faq";
import { Reveal } from "@/components/motion";
import { COUNTRIES, getCountry, countryMultiplier, CREATOR_SHARE, DATA_YEAR, money, localMoney, fxNote, viewsLabel, VIEW_PRESETS, NICHES_BY_CPM, COUNTRIES_BY_CPM, TIER_LABEL } from "@/lib/data";

export function generateStaticParams() { return COUNTRIES.map((c) => ({ slug: c.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCountry(slug);
  if (!c) return {};
  return {
    title: `YouTube CPM in ${c.name} ${DATA_YEAR}: Rates, RPM & Pay per 1,000 Views`,
    description: `YouTube CPM in ${c.name} averages $${c.cpmLow}–$${c.cpmHigh} (≈ ${localMoney(c.cpmLow, c, 0)}–${localMoney(c.cpmHigh, c, 0)}) in ${DATA_YEAR}.`,
    alternates: { canonical: `/cpm-by-country/${c.slug}` },
  };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountry(slug);
  if (!country) notFound();
  const mult = countryMultiplier(country);
  const rpmLow = country.cpmLow * CREATOR_SHARE;
  const rpmHigh = country.cpmHigh * CREATOR_SHARE;
  const rank = COUNTRIES_BY_CPM.findIndex((c) => c.slug === country.slug) + 1;
  const cur = (usd: number, d?: number) => localMoney(usd, country, d);
  const topNiches = NICHES_BY_CPM.slice(0, 6).map((n) => ({ ...n, lCpmLow: n.cpmLow * mult, lCpmHigh: n.cpmHigh * mult }));
  const faqs = [
    { q: `What is the average YouTube CPM in ${country.name}?`, a: `Blended CPM is $${country.cpmLow}–$${country.cpmHigh} (≈ ${cur(country.cpmLow)}–${cur(country.cpmHigh)}). Creator RPM: $${rpmLow.toFixed(2)}–$${rpmHigh.toFixed(2)}.` },
    { q: `How much does YouTube pay for 1M views in ${country.name}?`, a: `Approximately ${cur(rpmLow * 1000)}–${cur(rpmHigh * 1000)} from AdSense for long-form content.` },
    { q: `How can ${country.name} creators increase RPM?`, a: mult < 0.5 ? `Target Tier-1 audiences with English content. Make 8+ min videos, publish in Q4.` : `Lean into finance/B2B niches, use mid-roll ads, time uploads for Q4.` },
  ];
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const related = COUNTRIES_BY_CPM.filter((c) => c.slug !== slug).sort((a, b) => Math.abs(countryMultiplier(a) - mult) - Math.abs(countryMultiplier(b) - mult)).slice(0, 6);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <article className="relative overflow-hidden pt-28 sm:pt-36">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <nav className="flex items-center gap-2 text-xs text-fog"><Link href="/" className="hover:text-heading"><ArrowLeft className="inline h-3 w-3" /> Calculator</Link><span className="text-border">/</span><Link href="/cpm-by-country" className="hover:text-heading">Countries</Link><span className="text-border">/</span><span className="text-heading font-medium">{country.name}</span></nav>
          </Reveal>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal delay={0.05}>
              <p className="tag-red text-[10px] w-fit">{TIER_LABEL[country.tier]} · #{rank} of {COUNTRIES.length}</p>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl">YouTube CPM in <span className="text-yt-gradient">{country.name}</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-fog">{country.note}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="panel p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-wider text-fog">CPM</p><p className="num-mono mt-1 text-2xl font-bold text-heading">${country.cpmLow}–${country.cpmHigh}</p><p className="num-mono text-xs font-semibold text-yt-red">≈ {cur(country.cpmLow, 0)}–{cur(country.cpmHigh, 0)}</p></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-wider text-fog">RPM</p><p className="num-mono mt-1 text-2xl font-bold text-mint">${rpmLow.toFixed(2)}–${rpmHigh.toFixed(2)}</p><p className="num-mono text-xs text-fog">≈ {cur(rpmLow)}–{cur(rpmHigh)}</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs"><span className="text-fog">vs US</span><span className="num-mono font-bold text-heading">{mult >= 1 ? `${mult.toFixed(2)}×` : `${Math.round(mult * 100)}%`}</span></div>
                <p className="num-mono mt-2 text-center text-[10px] text-fog/70">{fxNote(country)}</p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.08}><h2 className="mt-14 font-display text-2xl font-bold text-heading">Earnings by View Count</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {VIEW_PRESETS.map((v) => (<div key={v} className="panel p-5 hover:border-mint/40 transition-colors"><p className="num-mono text-[10px] font-bold uppercase tracking-widest text-fog">{viewsLabel(v)} views</p><p className="num-mono mt-2 text-xl font-bold text-gradient-green">{cur((v / 1000) * rpmLow)}–{cur((v / 1000) * rpmHigh)}</p>{country.currency !== "USD" && <p className="num-mono mt-0.5 text-[10px] text-fog">≈ {money((v / 1000) * rpmLow)}–{money((v / 1000) * rpmHigh)}</p>}</div>))}
            </div>
          </Reveal>

          <section className="mt-14"><Reveal><h2 className="font-display text-2xl font-bold text-heading">{country.name} CPM <span className="text-yt-gradient">by Niche</span></h2></Reveal>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              <div className="hidden grid-cols-[2fr_1.2fr_1.2fr_0.7fr] gap-3 border-b border-border bg-surface px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-fog sm:grid"><span>Niche</span><span className="text-right">CPM ({country.currency})</span><span className="text-right">RPM ({country.currency})</span><span className="text-right">Tier</span></div>
              <div className="divide-y divide-border">{topNiches.map((n) => (<Link key={n.slug} href={`/cpm-by-niche/${n.slug}`} className="group grid grid-cols-2 gap-2 px-4 py-3 hover:bg-yt-red-bg sm:grid-cols-[2fr_1.2fr_1.2fr_0.7fr] sm:items-center sm:gap-3 sm:px-5"><span className="flex items-center gap-2 text-sm font-medium text-heading">{n.name}<ArrowUpRight className="h-3 w-3 text-fog/40 group-hover:text-yt-red" /></span><span className="num-mono text-right text-sm text-fog">{cur(n.lCpmLow)}–{cur(n.lCpmHigh)}</span><span className="num-mono text-right text-sm font-semibold text-mint">{cur(n.lCpmLow * CREATOR_SHARE)}–{cur(n.lCpmHigh * CREATOR_SHARE)}</span><span className="hidden text-right sm:block"><span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-fog">{n.tier}</span></span></Link>))}</div>
            </div>
          </section>

          <Reveal><div className="mt-8 flex items-start gap-3 rounded-xl border border-gold/30 bg-gradient-to-r from-amber-50 to-transparent p-4"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><p className="text-sm text-fog"><strong className="text-heading">{mult < 0.5 ? "Audience-arbitrage:" : "Mid-roll tip:"}</strong> {mult < 0.5 ? `English content targeting US/UK audiences can earn 3–8× ${country.name} rates.` : "8+ minute videos unlock mid-rolls (+30–50% revenue), and Q4 doubles December RPM."}</p></div></Reveal>

          <section className="mt-14"><Reveal><h2 className="font-display text-2xl font-bold text-heading">FAQs — {country.name}</h2></Reveal><Reveal delay={0.06} className="mt-5"><Faq items={faqs} /></Reveal></section>

          <section className="mt-14 grid gap-8 pb-4 lg:grid-cols-2">
            <div><h2 className="font-display text-xl font-bold text-heading">Similar Markets</h2><div className="mt-4 flex flex-wrap gap-2">{related.map((c) => (<Link key={c.slug} href={`/cpm-by-country/${c.slug}`} className="group rounded-full border border-border bg-white px-4 py-1.5 text-xs font-medium text-fog hover:border-yt-red/40 hover:text-heading">{c.code} {c.name}</Link>))}</div></div>
            <div className="panel relative overflow-hidden p-6"><h2 className="font-display text-xl font-bold text-heading">Calculate in {country.currency}</h2><p className="mt-2 text-sm text-fog">Get your exact number with the calculator.</p><Link href="/#calculator" className="group mt-4 inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-yt-red-hover">Open Calculator<ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link></div>
          </section>
        </div>
      </article>
    </>
  );
}
