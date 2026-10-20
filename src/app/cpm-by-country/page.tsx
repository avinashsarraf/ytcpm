import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Globe2 } from "lucide-react";
import { Reveal } from "@/components/motion";
import { COUNTRIES_BY_CPM, TIER_LABEL, DATA_YEAR, perMillionViews, CREATOR_SHARE, localMoney } from "@/lib/data";
import { flagUrl } from "@/lib/flags";

export const metadata: Metadata = { title: `YouTube CPM Rates by Country ${DATA_YEAR}`, description: `Full ${DATA_YEAR} table of YouTube CPM rates by country with local currency conversions.`, alternates: { canonical: "/cpm-by-country" } };

export default function CountryIndex() {
  return (
    <section className="w-full pt-20 sm:pt-24">
      <div className="w-full border-b border-border bg-gradient-to-b from-yt-red-light to-white py-12">
        <div className="section-full mx-auto max-w-[1400px]">
          <Reveal>
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-yt-red-bg"><Globe2 className="h-5 w-5 text-yt-red" /></span><span className="tag-red text-[11px]">{DATA_YEAR} Benchmarks</span></div>
            <h1 className="mt-5 display-2">YouTube CPM Rates <span className="text-yt-gradient">by Country</span></h1>
            <p className="lede mt-4">Where your viewers live decides what advertisers pay. Compare all {COUNTRIES_BY_CPM.length} markets, ranked by blended CPM and converted to local currency.</p>
          </Reveal>
        </div>
      </div>
      <div className="section-full mx-auto max-w-[1400px] py-10">
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
                    className="group grid grid-cols-[1fr_auto] gap-2 px-4 py-3.5 transition-all duration-200 hover:bg-yt-red-light md:grid-cols-[2.2fr_0.5fr_1fr_1fr_1.2fr_0.6fr_28px] md:items-center md:gap-2 md:px-5">
                    <span className="flex items-center gap-2.5">
                      <span className="num-mono w-5 text-xs text-fog">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-sm font-semibold text-heading">{c.name}</span>
                    </span>
                    <span className="hidden md:block"><Image src={flagUrl(c.code, "w40")} alt={c.name} width={24} height={16} className="flag-img !w-6 !h-4" unoptimized /></span>
                    <span className="num-mono text-right text-sm text-fog">${c.cpmLow}–${c.cpmHigh}</span>
                    <span className="num-mono text-right text-sm font-semibold text-mint">${rpmLow.toFixed(2)}–${rpmHigh.toFixed(2)}</span>
                    <span className="num-mono hidden text-right text-sm text-heading md:block">{localMoney(per1m.low, c)}–{localMoney(per1m.high, c)}</span>
                    <span className="hidden text-right md:block"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.tier === 1 ? "bg-mint-bg text-mint" : "bg-surface text-fog"}`}>T{c.tier}</span></span>
                    <span className="hidden md:block"><ArrowUpRight className="h-3.5 w-3.5 text-fog/30 transition-all group-hover:text-yt-red group-hover:translate-x-0.5" /></span>
                  </Link>
                );
              })}
            </div>
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
