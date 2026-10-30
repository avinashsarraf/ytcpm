"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, FileText, FolderOpen, LayoutDashboard, LogOut, Menu, MessageSquare,
  Settings, ShieldCheck, Users, X, ExternalLink,
} from "lucide-react";
import { logoutAction } from "./actions";

const NAV = [
  { href: "/cms", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/cms/posts", label: "Posts", icon: FileText },
  { href: "/cms/media", label: "Media", icon: FolderOpen },
  { href: "/cms/comments", label: "Comments", icon: MessageSquare },
  { href: "/cms/redirects", label: "Redirects", icon: Activity },
  { href: "/cms/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/cms/activity", label: "Activity", icon: ShieldCheck },
  { href: "/cms/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export type CmsShellUser = { id: number; email: string; name: string; role: "admin" | "editor" };

/**
 * The CMS chrome.
 *
 * A dark, dense sidebar that is clearly separate from the public site, with a
 * responsive top bar on small screens. The active item is marked with
 * `aria-current` so the state is announced, not only coloured.
 */
export default function CmsShell({ user, children }: { user: CmsShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((item) => !item.adminOnly || user.role === "admin");
  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-fog">
      <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden border-r border-white/10 bg-[#0b1626] text-slate-300 lg:flex lg:min-h-screen lg:flex-col">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-yt-red text-sm font-black text-white">C</span>
            <span className="text-[15px] font-bold text-white">
              ytcpm <span className="text-yt-red">CMS</span>
            </span>
          </div>
          <nav aria-label="CMS navigation" className="flex-1 px-3 pb-4">
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                        active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon aria-hidden className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="border-t border-white/10 px-4 py-4">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email} · {user.role}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/blog" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-semibold text-slate-200 hover:bg-white/10">
                <ExternalLink aria-hidden className="h-3.5 w-3.5" />View blog
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-semibold text-slate-200 hover:bg-white/10">
                  <LogOut aria-hidden className="h-3.5 w-3.5" />Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Mobile bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0b1626] px-4 py-3 text-white lg:hidden">
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-yt-red text-xs font-black">C</span>
            ytcpm CMS
          </span>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="cms-mobile-nav"
            className="grid h-11 w-11 place-items-center rounded-lg border border-white/15"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">{open ? "Close CMS menu" : "Open CMS menu"}</span>
          </button>
        </div>

        {open ? (
          <nav id="cms-mobile-nav" aria-label="CMS navigation" className="border-b border-white/10 bg-[#0b1626] px-3 py-3 text-slate-300 lg:hidden">
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${active ? "bg-white/10 text-white" : "hover:bg-white/5"}`}
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <form action={logoutAction} className="mt-3 border-t border-white/10 pt-3">
              <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/5">
                <LogOut aria-hidden className="h-4 w-4" />Sign out ({user.name})
              </button>
            </form>
          </nav>
        ) : null}

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
