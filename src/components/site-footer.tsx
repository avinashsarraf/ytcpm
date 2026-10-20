import Link from "next/link";
import { Activity, BookOpen, Calculator, Globe2, Layers, Play } from "lucide-react";
import { COUNTRIES, NICHES, DATA_YEAR } from "@/lib/data";
import { LEGAL_POLICIES } from "@/lib/legal";

const TOOLS = [
  { label: "All Creator Tools", href: "/tools", icon: Calculator },
  { label: "YouTube CPM Calculator", href: "/youtube-cpm-calculator", icon: Calculator },
  { label: "YouTube RPM Calculator", href: "/youtube-rpm-calculator", icon: Calculator },
  { label: `CPM by Country (${COUNTRIES.length})`, href: "/cpm-by-country", icon: Globe2 },
  { label: `CPM by Niche (${NICHES.length})`, href: "/cpm-by-niche", icon: Layers },
  { label: "API Usage Monitor", href: "/monitor", icon: Activity },
  { label: "Guides & Learning", href: "/guides", icon: BookOpen },
  { label: "Methodology", href: "/methodology", icon: BookOpen },
  { label: "Sources & Editorial Policy", href: "/sources", icon: BookOpen },
];
const markets = ["united-states", "australia", "united-kingdom", "switzerland", "norway", "canada", "new-zealand", "germany"].map(slug => COUNTRIES.find(c => c.slug === slug)!);
const niches = ["finance-investing", "insurance-legal", "business-marketing", "real-estate", "make-money-online", "technology-software", "health-fitness", "education-science"].map(slug => NICHES.find(n => n.slug === slug)!);
const heading = "font-mono text-[10px] font-semibold uppercase tracking-[0.2em]";
const link = "inline-flex min-h-11 items-center py-2 text-[13px] leading-relaxed text-fog transition-colors hover:text-yt-red";

/** Reference-inspired light footer; preserve policy access and honest data provenance. */
export default function SiteFooter() {
  return <footer className="reference-footer overflow-hidden border-t border-border bg-[#fafafb]">
    <div className="shell pb-0 pt-12 sm:pt-16 lg:pt-20">
      <div className="grid grid-cols-1 gap-8 min-[480px]:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:gap-9 xl:gap-12">
        <div className="min-[480px]:col-span-2 lg:col-span-1">
          <Link href="/" aria-label="ytcpm.online — home" className="inline-flex min-h-11 items-center gap-2.5"><span className="hot-gradient grid h-9 w-9 place-items-center rounded-xl shadow-[0_4px_15px_-4px_rgba(238,18,73,0.45)]"><Play aria-hidden="true" className="h-4 w-4 fill-white text-white" /></span><span className="text-lg font-bold tracking-tight text-heading">ytcpm<span className="font-medium text-fog">.online</span></span></Link>
          <p className="mt-4 max-w-[36ch] text-[13px] leading-7 text-fog">Free YouTube CPM and RPM tools, an earnings estimator and a {DATA_YEAR} reference-model library. Explore niche and audience-country scenarios in your local currency, with no signup or paywall.</p>
          <p className="mt-4 max-w-[42ch] text-xs leading-6 text-fog">Benchmarks are directional assumptions, not verified averages or live market data. Independent of YouTube and Google. Use your own Studio reports for actual channel metrics.</p>
        </div>
        <nav aria-label="Footer tools"><h2 className={`${heading} flex min-h-11 items-center gap-2 text-yt-red`}><BookOpen aria-hidden="true" className="h-3.5 w-3.5" />Tools &amp; resources</h2><ul className="mt-2">{TOOLS.map(({ href, label, icon: Icon }) => <li key={href}><Link href={href} className={`${link} gap-2`}><Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-yt-red/80" />{label}</Link></li>)}</ul></nav>
        <nav aria-label="Footer country benchmarks"><h2 className={`${heading} flex min-h-11 items-center text-mint`}>Country benchmarks</h2><ul className="mt-2">{markets.map(c => <li key={c.slug}><Link href={`/cpm-by-country/${c.slug}`} className={link}>YouTube CPM in {c.name}</Link></li>)}</ul></nav>
        <nav aria-label="Footer niche benchmarks"><h2 className={`${heading} flex min-h-11 items-center text-mint`}>Niche benchmarks</h2><ul className="mt-2">{niches.map(n => <li key={n.slug}><Link href={`/cpm-by-niche/${n.slug}`} className={link}>{n.name} CPM</Link></li>)}</ul></nav>
      </div>
      <nav aria-label="Legal and company" className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border py-3"><Link href="/legal" className="inline-flex min-h-11 items-center font-mono text-[10px] font-semibold uppercase tracking-widest text-yt-red">Legal center</Link>{[...LEGAL_POLICIES, { path: "/about", title: "About" }, { path: "/contact", title: "Contact" }].map(p => <Link key={p.path} href={p.path} className="inline-flex min-h-11 items-center py-2 text-xs text-fog hover:text-yt-red">{p.title}</Link>)}</nav>
      <div className="flex flex-col justify-between gap-3 border-t border-border py-6 text-[11px] leading-relaxed text-fog lg:flex-row lg:gap-8"><p>© {DATA_YEAR} ytcpm.online — YouTube CPM, RPM &amp; earnings tools. Model assumptions, not payout promises.</p><p className="shrink-0 font-mono text-[10px] tracking-wide">CPM = cost per mille · RPM = revenue per mille</p></div>
      <div aria-hidden="true" className="footer-watermark select-none pt-6 text-center sm:pt-9">ytcpm.online</div>
    </div>
  </footer>;
}
