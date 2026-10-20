"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Play } from "lucide-react";

/**
 * White sticky bar with a centred link row and a red underline on the active
 * item — the reference's navigation pattern. "Home" uses an exact match so it
 * is not underlined on every sub-page.
 */
const LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/#calculator", label: "CPM Calculator", exact: false },
  { href: "/monitor", label: "YouTube Stats" },
  { href: "/cpm-by-country", label: "Country CPM" },
  { href: "/cpm-by-niche", label: "Niche CPM" },
  { href: "/methodology", label: "Blog" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string, exact?: boolean) =>
    href.startsWith("/#") ? false : exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 inset-x-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur-xl">
      <div className="section-full mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="ytcpm.online — home">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-yt-red shadow-[0_2px_8px_rgba(238,18,73,0.35)]">
            <Play className="h-4 w-4 fill-white text-white" />
          </span>
          <span className="text-[19px] font-extrabold tracking-tight text-heading">
            ytcpm<span className="text-yt-red">.online</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.exact);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-5 text-[13.5px] font-semibold transition-colors ${
                  active ? "text-yt-red" : "text-[#4a5a6e] hover:text-heading"
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-yt-red" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="grid h-10 w-10 place-items-center rounded-lg border border-border text-heading lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-border bg-white p-3 lg:hidden" aria-label="Mobile">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isActive(l.href, l.exact) ? "bg-yt-red-light text-yt-red" : "text-[#4a5a6e] hover:bg-surface"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
