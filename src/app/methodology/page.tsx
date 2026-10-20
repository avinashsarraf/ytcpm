import type { Metadata } from "next";
import { SourceLinks } from "@/components/source-notice";
import ProsePage from "@/components/prose-page";
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
    <ProsePage
      eyebrow={<>Transparency · snapshot {DATA_UPDATED_AT}</>}
      title={<>How we calculate <span className="text-yt-gradient">CPM &amp; RPM</span></>}
      lede={<>Every number on this site comes from a single published dataset and one formula module.
          This page documents both, so you can judge — and challenge — the estimates.</>}
    >

        <Section icon={Database} title="Where the numbers come from">
          <p>
            The benchmark table covers <strong className="text-heading">{COUNTRIES.length} countries</strong> and{" "}
            <strong className="text-heading">{NICHES.length} niches</strong> for {DATA_YEAR}. Ranges are manually maintained planning assumptions. A per-record first-party source ledger and independently verified national averages are not currently available. We publish ranges instead of single points because real CPMs vary by
            advertiser demand, audience intent, device mix, and ad placement.
          </p>
          <p className="rounded-lg border border-border bg-white p-4 text-[13px]">
            <strong className="text-heading">Known gap:</strong> the current dataset is a manually maintained model snapshot,
            not a live feed. Each range is directional and should be treated as a starting hypothesis, not a payout
            guarantee. We publish the dataset snapshot date ({DATA_UPDATED_AT}) on every page.
          </p>
        </Section>

        <Section icon={Percent} title="Simplified long-form ad forecast (not Studio RPM)">
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
            lower it for non-monetized views. This model assumes one ad impression per monetized view. Multiple ads per playback and non-ad revenue are not modeled, so the output is an ad-only RPM estimate, not a universal conversion from CPM to Studio RPM.
          </p>
        </Section>

        <Section icon={TrendingUp} title="Shorts formula">
          <p>
            The public homepage models long-form only. The API has a separate, unverified Shorts scenario with a base range of{" "}
            <strong className="text-heading">$0.02–$0.08 RPM per 1,000 views</strong> for the configured view-count input (not a guaranteed payout),
            scaled by a country factor (floored at 25% of US rates) and a modest niche tier factor
            (S 1.25×, A 1.15×, B 1.00×, C 0.85×). These parameters are model assumptions, not official benchmarks. YouTube describes Studio Shorts RPM using engaged views; use matching engaged views and creator revenue in the dedicated RPM tool for a report-based calculation.
          </p>
        </Section>

        <Section icon={Globe2} title="Country scaling & currency">
          <p>
            A country&apos;s multiplier is its blended CPM divided by the US blended CPM ({money(US_BLENDED_CPM)}).
            This assumes the country premium is similar across niches — an unverified simplification, not an empirical relationship for every channel. Worldwide is an unweighted average of the tracked model defaults.
          </p>
          <p>
            Local-currency values use indicative FX rates captured {FX_UPDATED_AT}. They are for display only;
            all benchmarks are stored in USD.
          </p>
        </Section>

        <Section icon={Calculator} title="Seasonality">
          <p>
            Seasonality is modeled as a selectable multiplier against an annual baseline. These are scenarios for sensitivity testing, not a promise that Q4 will pay more on your channel:
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

        <SourceLinks ids={["definitions", "metrics", "share", "access"]} />

        <div className="mt-12 rounded-xl border border-border bg-white p-6">
          <h2 className="font-display text-lg font-bold text-heading">Run your own numbers</h2>
          <p className="mt-2 text-sm text-fog">Pick your niche, audience country, season and ad-impression rate.</p>
          <Link href="/#calculator" className="group mt-4 inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yt-red-hover">
            Open the calculator <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </ProsePage>
  );
}
