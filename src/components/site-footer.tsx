import Link from "next/link";
import { Play } from "lucide-react";

/** Shared footer; only real internal destinations, no placeholder social profiles. */
const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "CPM Calculator", href: "/youtube-cpm-calculator" },
  { label: "RPM Calculator", href: "/youtube-rpm-calculator" },
  { label: "Guides", href: "/guides" },
  { label: "Usage Monitor", href: "/monitor" },
];

const TOOLS = [
  { label: "Country CPM", href: "/cpm-by-country" },
  { label: "Niche CPM", href: "/cpm-by-niche" },
  { label: "Methodology", href: "/methodology" },
  { label: "Sources & policy", href: "/sources" },
];

const LEGAL = [
  { label: "Legal Overview", href: "/legal" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "Cookie Policy", href: "/cookies" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className="shell py-12 xl:py-16">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-yt-red">
                <Play className="h-4 w-4 fill-white text-white" />
              </span>
              <span className="text-[19px] font-extrabold tracking-tight text-white">
                ytcpm<span className="text-yt-red">.online</span>
              </span>
            </Link>
            <p className="mt-4 max-w-[22rem] text-[14px] leading-relaxed text-white/60">
              Free YouTube CPM Calculator, Earnings Estimator and Channel Projections.
            </p>
          </div>

          <nav aria-label="Quick links">
            <h3 className="text-[14px] font-bold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-white/60 transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="More tools">
            <h3 className="text-[14px] font-bold text-white">More Tools</h3>
            <ul className="mt-4 space-y-2.5">
              {TOOLS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-white/60 transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-[14px] font-bold text-white">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-white/60 transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Help">
            <h3 className="text-[14px] font-bold text-white">Need Help?</h3>
            <div className="mt-4 flex flex-col items-start gap-3 text-[14px] text-white/60"><Link href="/about" className="hover:text-white">About Us</Link><Link href="/contact" className="hover:text-white">Contact Us</Link></div>
            <p className="mt-4 max-w-48 text-[14px] leading-relaxed text-white/60">Understand the assumptions behind your estimate.</p>
            <Link href="/methodology" className="mt-3 inline-block py-2 text-[14px] font-semibold text-white underline underline-offset-4">How it works</Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[12px] text-white/50 sm:flex-row sm:items-center">
          <p>© 2026 ytcpm.online. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <span className="text-yt-red">♥</span> for YouTube Creators
          </p>
        </div>
      </div>
    </footer>
  );
}
