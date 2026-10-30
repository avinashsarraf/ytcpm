import { serializeJsonLd, webPageSchema, breadcrumbs, pageMetadata } from "@/lib/seo";
import { countrySeo, countrySerpDescription, countrySerpTitle } from "@/lib/seo-keywords";
import Calculator from "@/components/calculator";
import type { Metadata } from "next";
import { BenchmarkNotice } from "@/components/source-notice";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Lightbulb } from "lucide-react";
import Faq from "@/components/faq";
import { countryNote } from "@/lib/country-notes";
import { Reveal } from "@/components/motion";
import { usdRange, COUNTRIES, getCountry, countryMultiplier, CREATOR_SHARE, DATA_YEAR, DATA_UPDATED_AT, FX_UPDATED_AT, money, localMoney, fxNote, viewsLabel, VIEW_PRESETS, NICHES_BY_CPM, COUNTRIES_BY_CPM, TIER_LABEL } from "@/lib/data";

export function generateStaticParams() { return COUNTRIES.map((c) => ({ slug: c.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCountry(slug);
  if (!c) return {};
  const seo = countrySeo(c);
  const path = `/cpm-by-country/${c.slug}`;
  const localRange = `${localMoney(c.cpmLow, c, 0)}–${localMoney(c.cpmHigh, c, 0)}`;
  // The number leads the title, because that is what the query asks for.
  return pageMetadata(
    countrySerpTitle(c, DATA_YEAR),
    countrySerpDescription(c, localRange, DATA_YEAR),
    path,
    {
      focus: seo.focus, keywords: seo.keywords, type: "article", category: "finance",
      image: { url: `${path}/opengraph-image`, width: 1200, height: 630, alt: `${c.name} YouTube CPM: ${usdRange(c.cpmLow, c.cpmHigh)} per 1,000 views in ${DATA_YEAR}` },
      modifiedTime: DATA_UPDATED_AT,
    },
  );
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
  /*
    A country with a written local-market note gets its own questions merged
    into the same FAQ list that feeds the FAQPage schema, so the visible answer
    and the structured data never drift apart.
  */
  const note = countryNote(country.slug);
  const baseFaqs = [
    { q: `What is the average YouTube CPM in ${country.name}?`, a: `Our directional CPM model uses ${usdRange(country.cpmLow, country.cpmHigh)} (≈ ${cur(country.cpmLow)}–${cur(country.cpmHigh)}). Ad-only RPM at full fill and 55% creator share: ${usdRange(rpmLow, rpmHigh)}.` },
    { q: `How much does YouTube pay for 1M views in ${country.name}?`, a: `Our full-fill model implies ${cur(rpmLow * 1000)}–${cur(rpmHigh * 1000)} for long-form advertising. This assumes one ad impression per view and a 55% creator share, not a guaranteed AdSense payout.` },
    { q: `How should ${country.name} audience benchmarks be used?`, a: "Compare your own Studio reports for matching periods and formats. Audience country is not creator residence. Public country ranges cannot establish your actual CPM; see our sources policy for the model's limitations." },
  ];
  const faqs = note ? [...baseFaqs, ...note.faqs] : baseFaqs;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Calculator", item: "https://ytcpm.online/" },
      { "@type": "ListItem", position: 2, name: "CPM by Country", item: "https://ytcpm.online/cpm-by-country" },
      { "@type": "ListItem", position: 3, name: country.name, item: `https://ytcpm.online/cpm-by-country/${country.slug}` },
    ],
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const related = COUNTRIES_BY_CPM.filter((c) => c.slug !== slug).sort((a, b) => Math.abs(countryMultiplier(a) - mult) - Math.abs(countryMultiplier(b) - mult)).slice(0, 6);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPageSchema({ path: `/cpm-by-country/${country.slug}`, name: `YouTube CPM in ${country.name}: ${usdRange(country.cpmLow, country.cpmHigh)}`, description: `YouTube CPM in ${country.name} is ${usdRange(country.cpmLow, country.cpmHigh)} per 1,000 ad views in ${DATA_YEAR}, with creator RPM and local-currency scenarios.`, image: `/cpm-by-country/${country.slug}/opengraph-image`, dateModified: DATA_UPDATED_AT, section: "Country benchmarks", about: [`YouTube CPM in ${country.name}`, `YouTube RPM in ${country.name}`, `${country.name} ad rates`] })) }} />
      <article className="relative overflow-hidden pt-10 sm:pt-14 lg:pt-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
        <div className="relative shell">
          <Reveal>
            <nav className="flex items-center gap-2 text-xs text-fog"><Link href="/" className="hover:text-heading"><ArrowLeft className="inline h-3 w-3" /> Calculator</Link><span className="text-border">/</span><Link href="/cpm-by-country" className="hover:text-heading">Countries</Link><span className="text-border">/</span><span className="text-heading font-medium">{country.name}</span></nav>
          </Reveal>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal delay={0.05}>
              <p className="tag-red text-[11px] w-fit">{TIER_LABEL[country.tier]} · #{rank} of {COUNTRIES.length}</p>
              <h1 className="mt-3 display-2">YouTube CPM in <span className="text-yt-gradient">{country.name}</span></h1>
              <p className="body-copy mt-4 max-w-xl">Compare CPM scenarios for viewers in {country.name}, not simply creators who live there. The figures below are model defaults; use your own YouTube Studio reports to check actual advertiser demand.</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="panel p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[11px] font-bold uppercase tracking-wider text-fog">CPM</p><p className="num-mono mt-1 text-2xl font-bold text-heading">{usdRange(country.cpmLow, country.cpmHigh)}</p><p className="num-mono text-xs font-semibold text-yt-red">≈ {cur(country.cpmLow, 0)}–{cur(country.cpmHigh, 0)}</p></div>
                  <div><p className="text-[11px] font-bold uppercase tracking-wider text-fog">Modeled ad RPM</p><p className="num-mono mt-1 text-2xl font-bold text-mint">${rpmLow.toFixed(2)}–${rpmHigh.toFixed(2)}</p><p className="num-mono text-xs text-fog">≈ {cur(rpmLow)}–{cur(rpmHigh)}</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs"><span className="text-fog">vs US</span><span className="num-mono font-bold text-heading">{mult >= 1 ? `${mult.toFixed(2)}×` : `${Math.round(mult * 100)}%`}</span></div>
                <p className="num-mono mt-2 text-center text-[11px] text-fog">{fxNote(country)}</p>
                <p className="mt-1 text-center text-[11px] text-fog">Benchmark snapshot {DATA_UPDATED_AT} · FX {FX_UPDATED_AT}</p>
              </div>
            </Reveal>
          </div>

          <BenchmarkNotice />
          <section id="calculator" className="mt-10 scroll-mt-24"><h2 className="display-sub mb-4">{country.name} earnings calculator</h2><p className="mb-5 text-sm leading-7 text-fog">Adjust views, audience country and niche to compare directional scenarios. Defaults are model assumptions, not verified payouts. <Link href="/tools" className="font-semibold text-yt-red underline">Explore more creator tools</Link>.</p><Calculator key={slug} initialCountrySlug={ country.slug } /></section>

          <Reveal delay={0.08}><h2 className="mt-12 display-sub sm:mt-14">Full-fill Ad Earnings Scenarios</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:gap-4">
              {VIEW_PRESETS.map((v) => (<div key={v} className="panel p-5 hover:border-mint/40 transition-colors"><p className="num-mono text-[11px] font-bold uppercase tracking-widest text-fog">{viewsLabel(v)} views</p><p className="num-mono mt-2 text-xl font-bold text-gradient-green">{cur((v / 1000) * rpmLow)}–{cur((v / 1000) * rpmHigh)}</p>{country.currency !== "USD" && <p className="num-mono mt-0.5 text-[11px] text-fog">≈ {money((v / 1000) * rpmLow)}–{money((v / 1000) * rpmHigh)}</p>}</div>))}
            </div>
          </Reveal>

          <section className="mt-14"><Reveal><h2 className="display-sub">{country.name} CPM <span className="text-yt-gradient">by Niche</span></h2></Reveal>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              <div className="hidden grid-cols-[2fr_1.2fr_1.2fr_0.7fr] gap-3 border-b border-border bg-surface px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-fog sm:grid"><span>Niche</span><span className="text-right">CPM ({country.currency})</span><span className="text-right">RPM ({country.currency})</span><span className="text-right">Tier</span></div>
              <div className="divide-y divide-border">{topNiches.map((n) => (<Link key={n.slug} href={`/cpm-by-niche/${n.slug}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-yt-red-bg sm:grid-cols-[2fr_1.2fr_1.2fr_0.7fr] sm:gap-3 sm:px-5"><span className="flex min-w-0 items-center gap-2 text-sm font-medium text-heading"><span className="truncate">{n.name}</span><ArrowUpRight className="h-3 w-3 shrink-0 text-fog/40 group-hover:text-yt-red" /></span><span className="num-mono hidden text-right text-sm text-fog sm:block">{cur(n.lCpmLow)}–{cur(n.lCpmHigh)}</span><span className="num-mono hidden text-right text-sm font-semibold text-mint sm:block">{cur(n.lCpmLow * CREATOR_SHARE)}–{cur(n.lCpmHigh * CREATOR_SHARE)}</span><span className="hidden text-right sm:block"><span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-fog">{n.tier}</span></span><span className="text-right sm:hidden"><span className="num-mono block text-[13px] font-bold leading-tight text-heading">{cur(n.lCpmLow)}–{cur(n.lCpmHigh)}</span><span className="num-mono block text-[11px] leading-tight text-mint">RPM {cur(n.lCpmLow * CREATOR_SHARE)}–{cur(n.lCpmHigh * CREATOR_SHARE)}</span></span></Link>))}</div>
            </div>
          </section>

          <Reveal><div className="mt-8 flex items-start gap-3 rounded-xl border border-border p-4"><Lightbulb className="h-4 w-4 shrink-0 text-gold" /><p className="text-sm leading-relaxed">Compare the same metric, period, audience and video format. Changing language, length or upload date does not guarantee higher CPM or revenue.</p></div></Reveal>

          {note && (
            <section id="local-market" className="mt-14 scroll-mt-24">
              <Reveal><h2 className="display-sub">{note.heading}</h2></Reveal>
              <Reveal delay={0.04}>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-fog">{note.intro}</p>
                <div className="mt-7 grid gap-6 lg:grid-cols-2">
                  {note.sections.map((sec) => (
                    <div key={sec.title} className="panel p-5 sm:p-6">
                      <h3 className="text-base font-bold text-heading">{sec.title}</h3>
                      {sec.body.map((para) => (
                        <p key={para.slice(0, 40)} className="mt-2.5 text-sm leading-7 text-fog">{para}</p>
                      ))}
                    </div>
                  ))}
                </div>
                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                  {note.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-yt-red hover:underline">
                        {l.label}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </section>
          )}

          <section className="mt-14"><Reveal><h2 className="display-sub">FAQs — {country.name}</h2></Reveal><Reveal delay={0.06} className="mt-5"><Faq items={faqs} /></Reveal></section>

          <section className="mt-14 grid gap-8 pb-4 lg:grid-cols-2">
            <div><h2 className="display-3">Similar Markets</h2><div className="mt-4 flex flex-wrap gap-2">{related.map((c) => (<Link key={c.slug} href={`/cpm-by-country/${c.slug}`} className="group rounded-full border border-border bg-white px-4 py-1.5 text-xs font-medium text-fog hover:border-yt-red/40 hover:text-heading">{c.code} {c.name}</Link>))}</div>
              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-heading">All {COUNTRIES.length} audience countries</h3>
              <nav aria-label="All country benchmarks" className="mt-3 flex flex-wrap gap-1.5">{COUNTRIES.filter(c => c.slug !== slug).map((c) => (<Link key={c.slug} href={`/cpm-by-country/${c.slug}`} className="inline-flex min-h-9 items-center rounded-full border border-border bg-white px-3 py-1 text-[11px] font-medium text-fog transition-colors hover:border-yt-red/40 hover:text-heading">{c.name}</Link>))}</nav>
            </div>
            <div className="panel relative overflow-hidden p-6"><h2 className="display-3">Calculate in {country.currency}</h2><p className="mt-2 text-sm text-fog">Explore a local-currency scenario with editable assumptions.</p><Link href="#calculator" className="group mt-4 inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-yt-red-hover">Open Calculator<ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link></div>
          </section>
        </div>
      </article>
    </>
  );
}
