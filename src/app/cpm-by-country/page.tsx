import { breadcrumbs, pageMetadata, serializeJsonLd, webPageSchema } from "@/lib/seo";
import type { Metadata } from "next";
import { BenchmarkNotice } from "@/components/source-notice";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Globe2 } from "lucide-react";
import { Reveal } from "@/components/motion";
import { COUNTRIES_BY_CPM, TIER_LABEL, DATA_YEAR, DATA_UPDATED_AT, perMillionViews, CREATOR_SHARE, localMoney } from "@/lib/data";
import { flagUrl } from "@/lib/flags";

import { STATIC_PAGE_SEO } from "@/lib/seo-keywords";
const seo = STATIC_PAGE_SEO["/cpm-by-country"];
export const metadata: Metadata = pageMetadata(
  `YouTube CPM by Country — ${DATA_YEAR} Benchmarks`,
  "Compare directional YouTube CPM scenarios by audience country, with local-currency conversions, full-fill assumptions and links to check your actual Studio CPM.",
  "/cpm-by-country",
  { focus: seo.focus, keywords: seo.keywords, category: "finance", modifiedTime: DATA_UPDATED_AT },
);

export default function CountryIndex() {
  return (
    <section className="w-full">
      <div className="w-full border-b border-border bg-gradient-to-b from-yt-red-light to-white py-12">
        <div className="shell">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPageSchema({ path: "/cpm-by-country", name: `YouTube CPM by Country ${DATA_YEAR} — Model Benchmarks`, description: "Compare directional YouTube CPM scenarios by audience country, with local-currency conversions, full-fill assumptions and links to check your actual Studio CPM.", dateModified: DATA_UPDATED_AT, section: "Country benchmarks", about: ["YouTube CPM by country", "YouTube RPM by country", "Country ad-rate benchmarks"] })) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs([{ name: "Home", path: "/" }, { name: "YouTube CPM by country", path: "/cpm-by-country" }])) }} />
          <Reveal>
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-yt-red-bg"><Globe2 className="h-5 w-5 text-yt-red" /></span><span className="tag-red text-[11px]">{DATA_YEAR} Benchmarks</span></div>
            <h1 className="mt-5 display-2">YouTube CPM Rates <span className="text-yt-gradient">by Country</span></h1>
            <p className="lede mt-4">Where your viewers live helps shape advertiser demand. Compare all {COUNTRIES_BY_CPM.length} markets, ranked within our model by blended CPM and converted to local currency.</p>
          </Reveal>
        </div>
      </div>
      <div className="shell py-8 sm:py-10">
        <BenchmarkNotice />
        <Reveal delay={0.1}>
          <div className="panel overflow-hidden !rounded-xl">
            <div className="hidden grid-cols-[2.2fr_0.5fr_1fr_1fr_1.2fr_0.6fr_28px] gap-2 border-b border-border bg-surface px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-fog md:grid">
              <span>Country</span><span>Flag</span><span className="text-right">CPM (USD)</span><span className="text-right">RPM (USD)</span><span className="text-right">Per 1M (Local)</span><span className="text-right">Tier</span><span />
            </div>
            <div className="divide-y divide-border">
              {COUNTRIES_BY_CPM.map((c, i) => {
                const rpmLow = c.cpmLow * CREATOR_SHARE, rpmHigh = c.cpmHigh * CREATOR_SHARE;
                const per1m = perMillionViews(rpmLow, rpmHigh);
                return (
                  <Link key={c.slug} href={`/cpm-by-country/${c.slug}`}
                    className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-yt-red-light md:grid-cols-[2.2fr_0.5fr_1fr_1fr_1.2fr_0.6fr_28px] md:gap-2 md:px-5 md:py-3.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="num-mono w-5 shrink-0 text-xs text-fog">{String(i + 1).padStart(2, "0")}</span>
                      <Image src={flagUrl(c.code)} alt={`${c.name} flag`} width={24} height={16} className="flag-img !h-4 !w-6 shrink-0 md:hidden" unoptimized />
                      <span className="truncate text-sm font-semibold text-heading">{c.name}</span>
                    </span>
                    <span className="hidden md:block"><Image src={flagUrl(c.code)} alt={`${c.name} flag`} width={24} height={16} className="flag-img !h-4 !w-6" unoptimized /></span>
                    <span className="num-mono hidden text-right text-sm text-fog md:block">${c.cpmLow}–${c.cpmHigh}</span>
                    <span className="num-mono hidden text-right text-sm font-semibold text-mint md:block">${rpmLow.toFixed(2)}–${rpmHigh.toFixed(2)}</span>
                    <span className="num-mono hidden text-right text-sm text-heading md:block">{localMoney(per1m.low, c)}–{localMoney(per1m.high, c)}</span>
                    <span className="hidden text-right md:block"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.tier === 1 ? "bg-mint-bg text-mint" : "bg-surface text-fog"}`}>T{c.tier}</span></span>
                    <span className="hidden md:block"><ArrowUpRight className="h-3.5 w-3.5 text-fog/30 transition-all group-hover:text-yt-red group-hover:translate-x-0.5" /></span>
                    {/* Compact readout for phones: one stacked CPM/RPM column */}
                    <span className="text-right md:hidden">
                      <span className="num-mono block text-[13px] font-bold leading-tight text-heading">${c.cpmLow}–${c.cpmHigh}</span>
                      <span className="num-mono block text-[11px] leading-tight text-mint">RPM ${rpmLow.toFixed(2)}–${rpmHigh.toFixed(2)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-yt-red-light/70 via-white to-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="max-w-[62ch]">
              <h2 className="text-xl font-bold text-heading">Audit a channel, then model its market</h2>
              <p className="mt-2 text-sm leading-7 text-fog">Run a public channel audit to see a channel&apos;s catalogue, tags, keywords and top performers, then use these audience-market benchmarks to frame a realistic CPM scenario.</p>
            </div>
            <Link href="/channel-auditor" className="hot-gradient inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white">Open the Channel Auditor<ArrowRight aria-hidden className="h-4 w-4" /></Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-4">
          {([1,2,3,4] as const).map((t,i) => (
            <Reveal key={t} delay={i * 0.05}>
              <div className="panel panel-lift p-5">
                <p className={`font-display text-lg font-bold ${t === 1 ? "text-mint" : "text-heading"}`}>{TIER_LABEL[t]}</p>
                <p className="mt-2 text-xs leading-relaxed text-fog">{["US, UK, Australia & Western Europe.","Singapore, Japan, France, Ireland.","India, Brazil, Indonesia.","Pakistan, Bangladesh."][t-1]}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
