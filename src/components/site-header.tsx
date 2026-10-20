"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Play } from "lucide-react";

/**
 * White sticky bar with a centred link row and a red underline on the active
 * item — the reference's navigation pattern. "Home" uses an exact match so it
 * is not underlined on every sub-page.
 */
const LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/youtube-cpm-calculator", label: "CPM Calculator", exact: false },
  { href: "/youtube-rpm-calculator", label: "RPM Calculator" },
  { href: "/cpm-by-country", label: "Country CPM" },
  { href: "/cpm-by-niche", label: "Niche CPM" },
  { href: "/guides", label: "Guides" },
  { href: "/tools", label: "Creator Tools" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); menuButton.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string, exact?: boolean) =>
    href === "/tools" && pathname.startsWith("/youtube-") && !["/youtube-cpm-calculator", "/youtube-rpm-calculator"].includes(pathname) ? true : href.startsWith("/#") ? false : exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 inset-x-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-4 xl:h-[72px] xl:gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="ytcpm.online — home">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-yt-red shadow-[0_2px_8px_rgba(238,18,73,0.35)]">
            <Play className="h-4 w-4 fill-white text-white" />
          </span>
          <span className="text-[18px] font-extrabold tracking-tight text-heading sm:text-[19px]">
            ytcpm<span className="text-yt-red">.online</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-5 lg:flex xl:gap-8 2xl:gap-10" aria-label="Primary">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.exact);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative whitespace-nowrap py-5 text-[14px] font-semibold transition-colors xl:text-[14px] ${
                  active ? "text-yt-red" : "text-fog hover:text-heading"
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

        <div className="flex items-center gap-2 lg:hidden">
          <button
            ref={menuButton}
            className="grid h-11 w-11 place-items-center rounded-lg border border-border text-heading lg:hidden"
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
        <nav id="mobile-nav" className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-border bg-white p-3 lg:hidden" aria-label="Mobile">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(l.href, l.exact) ? "page" : undefined}
              className={`block rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors ${
                isActive(l.href, l.exact) ? "bg-yt-red-light text-yt-red" : "text-fog hover:bg-surface"
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
