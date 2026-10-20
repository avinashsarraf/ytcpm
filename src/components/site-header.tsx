"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Play, Menu, X, ArrowRight } from "lucide-react";

const LINKS = [
  { href: "/#calculator", label: "Calculator" },
  { href: "/cpm-by-country", label: "CPM by Country" },
  { href: "/cpm-by-niche", label: "CPM by Niche" },
  { href: "/monitor", label: "Live Monitor" },
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

  return (
    <header className="fixed top-0 inset-x-0 z-40 border-b border-border/60 bg-white/90 backdrop-blur-xl">
      <div className="section-full mx-auto flex h-14 max-w-[1400px] items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="ytcpm.online — home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-yt-red shadow-[0_2px_12px_rgba(0,0,0,0.18)] transition-transform group-hover:scale-110">
            <Play className="h-4 w-4 fill-white text-white" />
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight text-heading">
            ytcpm<span className="font-medium text-fog">.online</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((l) => {
            const active = l.href === "/#calculator" ? false : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                  active ? "bg-yt-red-light text-yt-red font-semibold" : "text-fog hover:bg-surface-2 hover:text-heading"
                }`}
              >{l.label}</Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <Link href="/#calculator"
            className="group inline-flex items-center gap-1.5 rounded-full bg-yt-red px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.18)] transition-all duration-300 hover:bg-yt-red-hover hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:scale-[1.03]"
          >
            Check my CPM
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-border text-fog md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-border bg-white p-3 md:hidden" aria-label="Mobile">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-fog transition-colors hover:bg-surface-2 hover:text-heading"
            >{l.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
