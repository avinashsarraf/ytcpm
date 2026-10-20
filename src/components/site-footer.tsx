import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { COUNTRIES_BY_CPM, NICHES_BY_CPM, DATA_YEAR, DATA_UPDATED_AT } from "@/lib/data";

const QUICK_LINKS = [
  { label: "Calculator", href: "/#calculator" },
  { label: "CPM by Country", href: "/cpm-by-country" },
  { label: "CPM by Niche", href: "/cpm-by-niche" },
  { label: "Methodology", href: "/methodology" },
  { label: "Live Monitor", href: "/monitor" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function SiteFooter() {
  return (
    <footer>
      {/* ── CTA Banner ── */}
      <section className="section-full mx-auto max-w-[1400px] py-10">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#171717] via-[#1d1d1d] to-[#0f0f0f] px-8 py-12 sm:px-14 sm:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-yt-red/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-yt-red" aria-hidden />
          <div className="relative flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-5 sm:items-center">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-yt-red shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-transform hover:scale-110">
                <Play className="h-6 w-6 fill-white text-white" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">Know your number before your next upload</h2>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/75">Run the {DATA_YEAR} CPM and RPM benchmarks for your niche and audience country — then drill into the market pages for the full breakdown.</p>
              </div>
            </div>
            <div className="shrink-0 text-center">
              <Link href="/#calculator" className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-heading shadow-lg transition-all duration-300 hover:bg-yt-red hover:text-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:scale-105">
                Open calculator <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="mt-2 text-[11px] text-white/75">Free · no signup · updated {DATA_UPDATED_AT}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Columns ── */}
      <div className="section-full mx-auto max-w-[1400px] pb-8 pt-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-yt-red shadow-[0_2px_12px_rgba(0,0,0,0.18)] transition-transform group-hover:scale-110"><Play className="h-4 w-4 fill-white text-white" /></span>
              <span className="font-display text-[15px] font-bold tracking-tight text-heading">ytcpm<span className="text-fog font-medium">.online</span></span>
            </Link>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-fog">
              A free, transparent YouTube CPM calculator: {DATA_YEAR} benchmarks for {COUNTRIES_BY_CPM.length} countries
              and {NICHES_BY_CPM.length} niches, with the formula behind every number published in full.
            </p>
            <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-fog/90">
              Independent project. Not affiliated with, endorsed by or sponsored by YouTube or Google.
            </p>
          </div>
          <nav aria-label="Quick links">
            <h3 className="text-xs font-bold uppercase tracking-widest text-heading">Quick Links</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {QUICK_LINKS.map((l) => <li key={l.href}><Link href={l.href} className="link-hover text-fog">{l.label}</Link></li>)}
            </ul>
          </nav>
          <nav aria-label="Top countries">
            <h3 className="text-xs font-bold uppercase tracking-widest text-heading">Top Countries</h3>
            <ul className="mt-4 space-y-2.5 text-sm">{COUNTRIES_BY_CPM.slice(0, 5).map((c) => <li key={c.slug}><Link href={`/cpm-by-country/${c.slug}`} className="link-hover text-fog">{c.name}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Top niches">
            <h3 className="text-xs font-bold uppercase tracking-widest text-heading">Top Niches</h3>
            <ul className="mt-4 space-y-2.5 text-sm">{NICHES_BY_CPM.slice(0, 5).map((n) => <li key={n.slug}><Link href={`/cpm-by-niche/${n.slug}`} className="link-hover text-fog">{n.name}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Company">
            <h3 className="text-xs font-bold uppercase tracking-widest text-heading">Company</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {COMPANY_LINKS.map((l) => <li key={l.href}><Link href={l.href} className="link-hover text-fog">{l.label}</Link></li>)}
            </ul>
          </nav>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-fog sm:flex-row sm:items-center">
          <p>© {DATA_YEAR} ytcpm.online. All rights reserved.</p>
          <p className="num-mono">Data reviewed {DATA_UPDATED_AT} · CPM = cost per mille · RPM = revenue per mille</p>
        </div>
      </div>
    </footer>
  );
}
