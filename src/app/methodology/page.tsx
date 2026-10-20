import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, Database, Globe2, Layers, Percent, TrendingUp } from "lucide-react";
import {
  COUNTRIES, NICHES, CREATOR_SHARE, DATA_YEAR, DATA_UPDATED_AT, FX_UPDATED_AT,
  US_BLENDED_CPM, SEASONS, money,
} from "@/lib/data";

export const metadata: Metadata = {
  title: `Methodology — How we estimate ${DATA_YEAR} CPM & RPM`,
  description:
    `How ytcpm.online builds its ${DATA_YEAR} YouTube CPM/RPM benchmarks: sources, formulas, seasonality, FX handling and limitations.`,
  alternates: { canonical: "/methodology" },
};

const Section = ({ icon: Icon, title, children }: { icon: typeof Globe2; title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-heading">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-yt-red-bg"><Icon className="h-4 w-4 text-yt-red" /></span>
      {title}
    </h2>
    <div className="mt-4 space-y-3 text-sm leading-relaxed text-fog">{children}</div>
  </section>
);

export default function MethodologyPage() {
  return (
    <article className="relative overflow-hidden pt-28 sm:pt-32">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <p className="tag-red w-fit text-[10px]">Transparency · reviewed {DATA_UPDATED_AT}</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl">
          How we calculate <span className="text-yt-gradient">CPM &amp; RPM</span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-fog">
          Every number on this site comes from a single published dataset and one formula module.
          This page documents both, so you can judge — and challenge — the estimates.
        </p>

        <Section icon={Database} title="Where the numbers come from">
          <p>
            The benchmark table covers <strong className="text-heading">{COUNTRIES.length} countries</strong> and{" "}
            <strong className="text-heading">{NICHES.length} niches</strong> for {DATA_YEAR}. Ranges are compiled from
            publicly disclosed creator earnings, creator-economy survey reports, third-party CPM trackers, and
            published ad-spend forecasts. We publish ranges instead of single points because real CPMs vary by
            advertiser demand, audience intent, device mix, and ad placement.
          </p>
          <p className="rounded-lg border border-border bg-white p-4 text-[13px]">
            <strong className="text-heading">Known gap:</strong> the current dataset is a manually reviewed snapshot,
            not a live feed. Each range is directional and should be treated as a starting hypothesis, not a payout
            guarantee. We publish the review date ({DATA_UPDATED_AT}) on every page.
          </p>
        </Section>

        <Section icon={Percent} title="Long-form formula">
          <pre className="overflow-x-auto rounded-lg bg-surface p-4 text-[12px] leading-relaxed text-heading"><code>{`countryMultiplier = (countryLow + countryHigh) / (USLow + USHigh)

cpmLow  = nicheCpmLow  × countryMultiplier × seasonMultiplier
cpmHigh = nicheCpmHigh × countryMultiplier × seasonMultiplier

rpmLow  = cpmLow  × ${CREATOR_SHARE}          × adImpressionRate
rpmHigh = cpmHigh × ${CREATOR_SHARE}          × adImpressionRate

monthly = (views / 1000) × rpm`}</code></pre>
          <p>
            <strong className="text-heading">{CREATOR_SHARE * 100}% creator share</strong> reflects YouTube&apos;s
            long-form revenue split. The <strong className="text-heading">ad-impression rate</strong> is the share of
            views that actually served an ad — the calculator defaults to 100% (an optimistic upper bound) and lets you
            lower it for ad-blocking, non-monetized views, and limited-ads status.
          </p>
        </Section>

        <Section icon={TrendingUp} title="Shorts formula">
          <p>
            Shorts revenue is pooled, so there is no classic CPM. We model a base range of{" "}
            <strong className="text-heading">$0.02–$0.08 RPM per 1,000 views</strong> for a Tier-1 audience,
            scaled by a country factor (floored at 25% of US rates) and a modest niche tier factor
            (S 1.25×, A 1.15×, B 1.00×, C 0.85×). Seasonality applies the same way as long-form.
          </p>
        </Section>

        <Section icon={Globe2} title="Country scaling & currency">
          <p>
            A country&apos;s multiplier is its blended CPM divided by the US blended CPM ({money(US_BLENDED_CPM)}).
            This assumes the country premium is similar across niches — a simplification. For example, the US premium
            is typically larger for finance and B2B than for gaming or vlogs.
          </p>
          <p>
            Local-currency values use indicative FX rates captured {FX_UPDATED_AT}. They are for display only;
            all benchmarks are stored in USD.
          </p>
        </Section>

        <Section icon={Calculator} title="Seasonality">
          <p>
            Ad auctions peak in Q4 and reset in January. Seasonality is expressed as a multiplier against the annual
            baseline and can be applied in the calculator:
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {SEASONS.map((s) => (
              <li key={s.q} className="rounded-lg border border-border bg-white px-4 py-3">
                <span className="num-mono text-xs font-bold text-yt-red">{s.mult.toFixed(2)}×</span>{" "}
                <span className="text-[13px] font-semibold text-heading">{s.q}</span>{" "}
                <span className="text-[12px] text-fog">({s.label})</span>
                <p className="mt-1 text-[12px] leading-relaxed text-fog">{s.note}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Layers} title="Limitations you should know">
          <ul className="list-disc space-y-2 pl-5">
            <li>Estimates assume a <strong className="text-heading">single-country audience</strong>; real audiences are mixed.</li>
            <li>Country scaling is <strong className="text-heading">linear and uniform</strong> across niches.</li>
            <li>Ranges are wide by nature (US CPM spans {money(COUNTRIES[0].cpmLow)}–{money(COUNTRIES[0].cpmHigh)}); the midpoint shown in the calculator is a convenience, not a forecast.</li>
            <li>Sponsorships, affiliate income, memberships and merchandise are <strong className="text-heading">not included</strong>.</li>
            <li>Ad rates change with advertiser demand, policy changes, and the viewer&apos;s device and geography mix.</li>
          </ul>
        </Section>

        <div className="mt-12 rounded-xl border border-border bg-white p-6">
          <h2 className="font-display text-lg font-bold text-heading">Run your own numbers</h2>
          <p className="mt-2 text-sm text-fog">Pick your niche, audience country, season and ad-impression rate.</p>
          <Link href="/#calculator" className="group mt-4 inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yt-red-hover">
            Open the calculator <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
