import Link from "next/link";
import { Play } from "lucide-react";

/**
 * Navy footer with five link columns, brand social buttons and a bottom bar —
 * the reference layout. Social icons are inline paths because the installed
 * lucide build no longer ships brand glyphs.
 */
const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "CPM Calculator", href: "/#calculator" },
  { label: "YouTube Stats", href: "/monitor" },
];

const TOOLS = [
  { label: "Country CPM", href: "/cpm-by-country" },
  { label: "Niche CPM", href: "/cpm-by-niche" },
  { label: "Blog", href: "/methodology" },
];

const LEGAL = [
  { label: "About", href: "/about" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

const SOCIAL = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/",
    path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z",
  },
  {
    label: "X",
    href: "https://x.com/",
    path: "M18.9 1.2h3.7l-8.1 9.2L24 22.8h-7.4l-5.8-7.6-6.7 7.6H.4l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3H4.4l13.2 17.3Z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    path: "M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.4 0-1.9.9-1.9 1.9V12h3.2l-.5 3.5h-2.7v8.4A12 12 0 0 0 24 12Z",
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/",
    path: "M12 0a12 12 0 0 0-4.4 23.2c-.1-1-.2-2.5 0-3.6l1.4-6s-.4-.7-.4-1.8c0-1.7 1-3 2.2-3 1 0 1.6.8 1.6 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.7-2.3 3.7-5.5 0-2.9-2-4.9-4.8-4.9-3.2 0-5.2 2.4-5.2 5 0 1 .4 2 .9 2.6.1.1.1.2.1.3l-.3 1.3c0 .2-.2.3-.4.2-1.4-.7-2.3-2.7-2.3-4.4 0-3.5 2.6-6.8 7.4-6.8 3.9 0 6.9 2.8 6.9 6.5 0 3.9-2.4 7-5.8 7-1.2 0-2.2-.6-2.6-1.3l-.7 2.7c-.3 1-1 2.2-1.5 3A12 12 0 1 0 12 0Z",
  },
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
            <p className="mt-4 max-w-[22rem] text-[13px] leading-relaxed text-white/60">
              Free YouTube CPM Calculator, Earnings Estimator and Channel Analyzer.
            </p>
          </div>

          <nav aria-label="Quick links">
            <h3 className="text-[13px] font-bold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-white/60 transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="More tools">
            <h3 className="text-[13px] font-bold text-white">More Tools</h3>
            <ul className="mt-4 space-y-2.5">
              {TOOLS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-white/60 transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-[13px] font-bold text-white">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-white/60 transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-[13px] font-bold text-white">Follow Us</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-md bg-yt-red text-white transition-transform hover:scale-110 hover:bg-yt-red-hover"
                >
                  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
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
