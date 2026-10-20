import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { BenchmarkNotice } from "@/components/source-notice";
import Link from "next/link";
import { Layers } from "lucide-react";
import { Reveal } from "@/components/motion";
import { NicheRangeChart } from "@/components/charts";
import { NICHE_ICONS } from "@/lib/niche-icons";
import { NICHES_BY_CPM, CREATOR_SHARE, DATA_YEAR, money, perMillionViews } from "@/lib/data";

export const metadata: Metadata = pageMetadata(`YouTube CPM by Niche ${DATA_YEAR} — Compare Scenarios`, "Compare indicative YouTube CPM scenarios across 18 niches. See model assumptions, ad-only RPM projections and why actual channel earnings differ.", "/cpm-by-niche");

export default function NicheIndex() {
  return (
    <section className="relative overflow-hidden pt-24 sm:pt-28 lg:pt-32">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
      <div className="relative shell">
        <BenchmarkNotice />
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-yt-red-bg"><Layers className="h-4 w-4 text-yt-red" /></span>
            <span className="tag-red text-[11px]">Niche benchmarks · {DATA_YEAR}</span>
          </div>
          <h1 className="mt-5 display-2">
            YouTube CPM by <span className="text-yt-gradient">Niches</span>
          </h1>
          <p className="lede mt-4">
            Advertisers don&apos;t pay for views — they pay for what viewers are likely to buy. Compare the niches tracked in our model in {DATA_YEAR}.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 xl:mt-10">
            <NicheRangeChart niches={NICHES_BY_CPM} />
          </div>
        </Reveal>

        <div className="mt-10 grid gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-4">
          {NICHES_BY_CPM.map((n, i) => {
            const Icon = NICHE_ICONS[n.icon];
            const rpmLow = n.cpmLow * CREATOR_SHARE;
            const rpmHigh = n.cpmHigh * CREATOR_SHARE;
            const per1m = perMillionViews(rpmLow, rpmHigh);
            return (
              <Reveal key={n.slug} delay={Math.min(i * 0.03, 0.3)}>
                <Link href={`/cpm-by-niche/${n.slug}`} className="panel group block h-full p-5 transition-all hover:border-yt-red/40 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface group-hover:bg-yt-red-bg"><Icon className="h-4 w-4 text-fog group-hover:text-yt-red" /></span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${n.tier === "S" ? "bg-amber-50 text-gold" : n.tier === "A" ? "bg-mint-bg text-mint" : "bg-surface text-fog"}`}>{n.tier}-tier</span>
                  </div>
                  <h2 className="mt-3 text-[15px] font-bold text-heading">{n.name}</h2>
                  <p className="num-mono mt-1 text-sm"><span className="text-heading">CPM ${n.cpmLow}–${n.cpmHigh}</span> <span className="text-fog">·</span> <span className="text-mint">RPM ${rpmLow.toFixed(0)}–${rpmHigh.toFixed(0)}</span></p>
                  <p className="mt-2 line-clamp-2 text-xs text-fog">{n.desc}</p>
                  <p className="num-mono mt-3 border-t border-border pt-2.5 text-[11px] text-fog">per 1M ≈ {money(per1m.low)} – {money(per1m.high)}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
