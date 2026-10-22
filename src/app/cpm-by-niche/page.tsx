import { breadcrumbs, pageMetadata, serializeJsonLd, webPageSchema } from "@/lib/seo";
import type { Metadata } from "next";
import { BenchmarkNotice } from "@/components/source-notice";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Reveal } from "@/components/motion";
import { NicheRangeChart } from "@/components/charts";
import { NICHE_ICONS } from "@/lib/niche-icons";
import { NICHES_BY_CPM, CREATOR_SHARE, DATA_YEAR, DATA_UPDATED_AT, money, perMillionViews } from "@/lib/data";

import { STATIC_PAGE_SEO } from "@/lib/seo-keywords";
const seo = STATIC_PAGE_SEO["/cpm-by-niche"];
export const metadata: Metadata = pageMetadata(
  `YouTube CPM by Niche — ${DATA_YEAR} Scenarios`,
  "Compare indicative YouTube CPM scenarios across 18 niches. See model assumptions, ad-only RPM projections and why actual channel earnings differ.",
  "/cpm-by-niche",
  { focus: seo.focus, keywords: seo.keywords, category: "finance", modifiedTime: DATA_UPDATED_AT },
);

export default function NicheIndex() {
  return (
    <section className="relative overflow-hidden pt-10 sm:pt-14 lg:pt-16">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
      <div className="relative shell">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPageSchema({ path: "/cpm-by-niche", name: `YouTube CPM by Niche ${DATA_YEAR} — Compare Scenarios`, description: "Compare indicative YouTube CPM scenarios across 18 niches. See model assumptions, ad-only RPM projections and why actual channel earnings differ.", dateModified: DATA_UPDATED_AT, section: "Niche benchmarks", about: ["YouTube CPM by niche", "YouTube RPM by niche", "Niche ad-rate benchmarks"] })) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs([{ name: "Home", path: "/" }, { name: "YouTube CPM by niche", path: "/cpm-by-niche" }])) }} />
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

        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-yt-red-light/70 via-white to-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="max-w-[62ch]">
              <h2 className="text-xl font-bold text-heading">Know the channel before you model the niche</h2>
              <p className="mt-2 text-sm leading-7 text-fog">Audit any public YouTube channel to see its real catalogue, tags, keywords, top performers and upload cadence — then compare those signals against the niche benchmark on this page.</p>
            </div>
            <Link href="/channel-auditor" className="hot-gradient inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white">Open the Channel Auditor<ArrowRight aria-hidden className="h-4 w-4" /></Link>
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
