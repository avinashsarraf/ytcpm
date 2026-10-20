import type { Metadata } from "next";
import Link from "next/link";
import { Layers } from "lucide-react";
import { Reveal } from "@/components/motion";
import { NicheRangeChart } from "@/components/charts";
import { NICHE_ICONS } from "@/lib/niche-icons";
import { NICHES_BY_CPM, CREATOR_SHARE, DATA_YEAR, money, perMillionViews } from "@/lib/data";

export const metadata: Metadata = {
  title: `Highest CPM YouTube Niches ${DATA_YEAR} — All 18 Categories Ranked`,
  description: `The highest-paying YouTube niches by CPM in ${DATA_YEAR}: finance ($15–$50), insurance, business, tech and 14 more.`,
  alternates: { canonical: "/cpm-by-niche" },
};

export default function NicheIndex() {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-36">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-yt-red-bg"><Layers className="h-4 w-4 text-yt-red" /></span>
            <span className="tag-red text-[10px]">Niche benchmarks · {DATA_YEAR}</span>
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            Highest CPM YouTube <span className="text-yt-gradient">Niches</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-fog">
            Advertisers don&apos;t pay for views — they pay for what viewers are likely to buy. Here&apos;s every major YouTube niche in {DATA_YEAR}.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8">
            <NicheRangeChart niches={NICHES_BY_CPM} />
          </div>
        </Reveal>

        <div className="mt-12 grid gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${n.tier === "S" ? "bg-amber-50 text-gold" : n.tier === "A" ? "bg-mint-bg text-mint" : "bg-surface text-fog"}`}>{n.tier}-tier</span>
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
