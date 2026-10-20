import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import ProsePage from "@/components/prose-page";
import Link from "next/link";
import { ArrowRight, Database, Globe2, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { COUNTRIES, NICHES, DATA_YEAR, DATA_UPDATED_AT, VIEW_PRESETS, viewsLabel } from "@/lib/data";

export const metadata: Metadata = pageMetadata("About ytcpm.online — free YouTube CPM & RPM calculator", "Why ytcpm.online exists, what it covers, and how it stays free. An independent YouTube CPM calculator with 2026 benchmarks for 23 countries and 18 niches.", "/about");

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow={<>About · model snapshot {DATA_UPDATED_AT}</>}
      title={<>Built for creators who want <span className="text-yt-gradient">clearer numbers</span></>}
      lede={<>ytcpm.online is a free YouTube CPM and RPM calculator. Most &quot;earnings&quot; tools show a single global
          average; ad rates actually depend on <strong className="text-heading">where your viewers are</strong> and{" "}
          <strong className="text-heading">what your content is about</strong>. This tool models both, then converts
          reference-page values into indicative local currencies. See our <Link href="/sources" className="text-yt-red underline">sources and limitations</Link>; benchmarks are not measured averages or a live data feed.</>}
    >

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Globe2, value: `${COUNTRIES.length}`, label: "country benchmarks" },
            { icon: Layers, value: `${NICHES.length}`, label: "niche benchmarks" },
            { icon: Sparkles, value: `${VIEW_PRESETS.map(viewsLabel).join(" · ")}`, label: "view presets" },
          ].map((c) => (
            <div key={c.label} className="panel p-5">
              <c.icon className="h-4 w-4 text-yt-red" />
              <p className="num-mono mt-2 font-display text-lg font-bold text-heading">{c.value}</p>
              <p className="text-xs text-fog">{c.label}</p>
            </div>
          ))}
        </div>

        <section className="mt-10 space-y-3 text-sm leading-relaxed text-fog">
          <h2 className="font-display text-xl font-bold text-heading">What you get</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Separate CPM and RPM calculators using report inputs, plus a long-form earnings estimator with audience-country, niche, season and ad-fill assumptions.</li>
            <li>Benchmark reference pages with indicative local-currency conversions and a USD cross-check.</li>
            <li>Reference pages for every country and niche, each with rank, earnings presets and FAQs.</li>
            <li>An anonymous calculation API usage monitor, not a connected YouTube channel monitor.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 text-sm leading-relaxed text-fog">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-heading">
            <ShieldCheck className="h-4 w-4 text-yt-red" /> What we do not do
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>We do not store accounts, emails, or IP addresses with your calculations.</li>
            <li>We do not claim these estimates are your actual AdSense payout.</li>
            <li>We do not hide the method — the full formula lives on the{" "}
              <Link href="/methodology" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">methodology page</Link>.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 text-sm leading-relaxed text-fog">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-heading">
            <Database className="h-4 w-4 text-yt-red" /> Keep us honest
          </h2>
          <p>
            If you have first-party earnings data that contradicts a range,{" "}
            <Link href="/contact" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">tell us</Link>.
            Include a source, date and the exact statement. Our sources page explains what is documented and what remains a directional model.
          </p>
        </section>

        <div className="mt-12 rounded-xl border border-border bg-white p-6">
          <h2 className="font-display text-lg font-bold text-heading">Estimate your channel</h2>
          <p className="mt-2 text-sm text-fog">Free, no signup — {DATA_YEAR} benchmarks, updated {DATA_UPDATED_AT}.</p>
          <Link href="/#calculator" className="group mt-4 inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yt-red-hover">
            Open the calculator <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </ProsePage>
  );
}
