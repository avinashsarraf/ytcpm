import { serializeJsonLd } from "@/lib/seo";
import Calculator from "@/components/calculator";
import type { Metadata } from "next";
import { BenchmarkNotice } from "@/components/source-notice";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import Faq from "@/components/faq";
import { Reveal } from "@/components/motion";
import { NICHE_ICONS } from "@/lib/niche-icons";
import { NICHES, getNiche, countryMultiplier, CREATOR_SHARE, DATA_YEAR, DATA_UPDATED_AT, money, viewsLabel, VIEW_PRESETS, COUNTRIES_BY_CPM, NICHES_BY_CPM } from "@/lib/data";

export function generateStaticParams() { return NICHES.map((n) => ({ slug: n.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const n = getNiche(slug);
  if (!n) return {};
  return {
    title: `${n.name} YouTube CPM Model`,
    description: `Explore a directional ${n.name} CPM model of $${n.cpmLow}–$${n.cpmHigh} for US audiences, with full-fill ad RPM assumptions and limitations.`,
    alternates: { canonical: `/cpm-by-niche/${n.slug}` },
    openGraph: {
      images: [{ url: `/cpm-by-niche/${n.slug}/opengraph-image`, width: 1200, height: 630, alt: `${n.name} YouTube CPM model scenarios` }],
      type: "article",
      title: `${n.name} CPM ${DATA_YEAR}: $${n.cpmLow}–$${n.cpmHigh}`,
      description: `${n.name} niche benchmarks: CPM, RPM and per-1M-view earnings.`,
      url: `https://ytcpm.online/cpm-by-niche/${n.slug}`,
      siteName: "ytcpm.online",
    },
    twitter: {
      images: [`/cpm-by-niche/${n.slug}/opengraph-image`],
      card: "summary_large_image",
      title: `${n.name} CPM ${DATA_YEAR}`,
      description: `CPM $${n.cpmLow}–$${n.cpmHigh} · RPM $${(n.cpmLow * CREATOR_SHARE).toFixed(2)}–$${(n.cpmHigh * CREATOR_SHARE).toFixed(2)}.`,
    },
  };
}

const TD: Record<string, string> = { S: "S-tier — highest model CPM", A: "A-tier — higher model CPM", B: "B-tier — mid-range model CPM", C: "C-tier — lower model CPM" };

export default async function NichePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const niche = getNiche(slug);
  if (!niche) notFound();
  const Icon = NICHE_ICONS[niche.icon];
  const rpmLow = niche.cpmLow * CREATOR_SHARE;
  const rpmHigh = niche.cpmHigh * CREATOR_SHARE;
  const rank = NICHES_BY_CPM.findIndex((n) => n.slug === niche.slug) + 1;
  const india = COUNTRIES_BY_CPM.find((c) => c.slug === "india")!;
  const topCountries = COUNTRIES_BY_CPM.slice(0, 5).map((c) => ({ ...c, mult: countryMultiplier(c) }));
  const countryRows = [...topCountries, { ...india, mult: countryMultiplier(india) }];
  const faqs = [
    { q: `What is the average CPM for ${niche.name} channels?`, a: `Our directional US-audience model uses CPM $${niche.cpmLow}–$${niche.cpmHigh}. Modeled ad RPM $${rpmLow.toFixed(2)}–$${rpmHigh.toFixed(2)} assumes full ad fill, one impression per view and a 55% creator share. These are not verified averages.` },
    { q: `How can I increase my ${niche.name} CPM?`, a: "Inspect your own Studio reports for changes in audience, ad suitability and format. Compare the same metric and period. A different topic, video length or upload quarter does not guarantee a higher CPM." },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Calculator", item: "https://ytcpm.online/" },
      { "@type": "ListItem", position: 2, name: "CPM by Niche", item: "https://ytcpm.online/cpm-by-niche" },
      { "@type": "ListItem", position: 3, name: niche.name, item: `https://ytcpm.online/cpm-by-niche/${niche.slug}` },
    ],
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const related = NICHES_BY_CPM.filter((n) => n.slug !== slug).slice(0, 6);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      <article className="relative overflow-hidden pt-10 sm:pt-14 lg:pt-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
        <div className="relative shell">
          <Reveal><nav className="flex items-center gap-2 text-xs text-fog"><Link href="/" className="hover:text-heading"><ArrowLeft className="inline h-3 w-3" /> Calculator</Link><span className="text-border">/</span><Link href="/cpm-by-niche" className="hover:text-heading">Niches</Link><span className="text-border">/</span><span className="text-heading font-medium">{niche.name}</span></nav></Reveal>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal delay={0.05}>
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-yt-red-bg"><Icon className="h-5 w-5 text-yt-red" /></span><span className="tag-red text-[11px]">{TD[niche.tier]} · #{rank}</span></div>
              <h1 className="mt-4 display-2">{niche.name} <span className="text-yt-gradient">YouTube CPM</span></h1>
              <p className="body-copy mt-4 max-w-xl">{niche.desc}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="panel p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[11px] font-bold uppercase tracking-wider text-fog">US CPM</p><p className="num-mono mt-1 text-2xl font-bold text-heading">${niche.cpmLow}–${niche.cpmHigh}</p></div>
                  <div><p className="text-[11px] font-bold uppercase tracking-wider text-fog">Modeled ad RPM</p><p className="num-mono mt-1 text-2xl font-bold text-mint">${rpmLow.toFixed(2)}–${rpmHigh.toFixed(2)}</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs"><span className="text-fog">per 1M views</span><span className="num-mono font-bold text-heading">{money(rpmLow * 1000)} – {money(rpmHigh * 1000)}</span></div>
                <p className="mt-2 text-center text-[11px] text-fog">Benchmark snapshot {DATA_UPDATED_AT}</p>
              </div>
            </Reveal>
          </div>

          <BenchmarkNotice />
          <section id="calculator" className="mt-10 scroll-mt-24"><h2 className="display-sub mb-4">{niche.name} earnings calculator</h2><p className="mb-5 text-sm leading-7 text-fog">Adjust views, audience country and niche to compare directional scenarios. Defaults are model assumptions, not verified payouts. <Link href="/tools" className="font-semibold text-yt-red underline">Explore more creator tools</Link>.</p><Calculator key={slug} initialNicheSlug={ niche.slug } /></section>

          <Reveal delay={0.08}><h2 className="mt-14 display-sub">Full-fill Ad Earnings Scenarios</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:gap-4">
              {VIEW_PRESETS.map((v) => (<div key={v} className="panel p-5"><p className="num-mono text-[11px] font-bold uppercase tracking-widest text-fog">{viewsLabel(v)} views</p><p className="num-mono mt-2 text-xl font-bold text-gradient-green">{money((v / 1000) * rpmLow)}–{money((v / 1000) * rpmHigh)}</p><p className="mt-1 text-[11px] text-fog">US audience</p></div>))}
            </div>
          </Reveal>

          <section className="mt-14"><Reveal><h2 className="display-sub">{niche.name} CPM <span className="text-yt-gradient">by Country</span></h2></Reveal>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              <div className="hidden grid-cols-[2fr_1fr_1fr_0.7fr] gap-3 border-b border-border bg-surface px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-fog sm:grid"><span>Country</span><span className="text-right">CPM</span><span className="text-right">RPM</span><span className="text-right">vs US</span></div>
              <div className="divide-y divide-border">{countryRows.map((c) => { const m = c.mult; const lo = niche.cpmLow * m; const hi = niche.cpmHigh * m; return (<Link key={c.slug} href={`/cpm-by-country/${c.slug}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-yt-red-bg sm:grid-cols-[2fr_1fr_1fr_0.7fr] sm:gap-3 sm:px-5"><span className="flex min-w-0 items-center gap-2 text-sm font-medium text-heading"><span className="num-mono grid h-6 w-7 shrink-0 place-items-center rounded bg-surface text-[11px] font-bold group-hover:bg-yt-red group-hover:text-white">{c.code}</span><span className="truncate">{c.name}</span></span><span className="num-mono hidden text-right text-sm text-fog sm:block">${lo.toFixed(2)}–${hi.toFixed(2)}</span><span className="num-mono hidden text-right text-sm font-semibold text-mint sm:block">${(lo * CREATOR_SHARE).toFixed(2)}–${(hi * CREATOR_SHARE).toFixed(2)}</span><span className="hidden text-right sm:block num-mono text-xs text-fog">{Math.round(m * 100)}%</span><span className="text-right sm:hidden"><span className="num-mono block text-[13px] font-bold leading-tight text-heading">${lo.toFixed(2)}–${hi.toFixed(2)}</span><span className="num-mono block text-[11px] leading-tight text-mint">RPM ${(lo * CREATOR_SHARE).toFixed(2)}–${(hi * CREATOR_SHARE).toFixed(2)}</span></span></Link>); })}</div>
            </div>
          </section>

          <Reveal><div className="mt-8 rounded-xl border border-gold/30 bg-gradient-to-r from-amber-50 to-transparent p-4"><p className="text-sm"><Lightbulb className="mr-2 inline h-4 w-4 text-gold" /><strong className="text-heading">Pro tip:</strong> <span className="text-fog">{niche.tip}</span></p></div></Reveal>

          <section className="mt-14"><Reveal><h2 className="display-sub">FAQs — {niche.name}</h2></Reveal><Reveal delay={0.06} className="mt-5"><Faq items={faqs} /></Reveal></section>

          <section className="mt-14 grid gap-8 pb-4 lg:grid-cols-2">
            <div><h2 className="display-3">Related Niches</h2><div className="mt-4 flex flex-wrap gap-2">{related.map((n) => { const RIcon = NICHE_ICONS[n.icon]; return (<Link key={n.slug} href={`/cpm-by-niche/${n.slug}`} className="group flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-fog hover:border-yt-red/40 hover:text-heading"><RIcon className="h-3 w-3 group-hover:text-yt-red" />{n.name}</Link>); })}</div></div>
            <div className="panel p-6"><h2 className="display-3">Run your numbers</h2><p className="mt-2 text-sm text-fog">Your views × {niche.name.toLowerCase()} rates — modeled with explicit assumptions.</p><Link href="#calculator" className="group mt-4 inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-yt-red-hover">Open Calculator<ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link></div>
          </section>
        </div>
      </article>
    </>
  );
}
