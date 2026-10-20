"use client";

import Image from "next/image";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe, Search, X } from "lucide-react";
import { currencySymbol, type Country } from "@/lib/data";
import { flagUrl } from "@/lib/flags";

function Flag({ country }: { country: Country }) {
  return country.code === "WW" ? <Globe aria-hidden="true" className="h-5 w-6 text-fog" /> : <Image src={flagUrl(country.code)} alt="" width={24} height={18} className="h-[18px] w-6 shrink-0 rounded-sm object-cover" />;
}

export default function CountrySelector({ countries, value, onChange }: { countries: Country[]; value: Country; onChange: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const matches = countries.filter(c => `${c.name} ${c.code} ${c.currency} ${currencySymbol(c)}`.toLowerCase().includes(query.trim().toLowerCase()));
  const groupName = (c: Country) => c.code === "WW" ? "Worldwide" : ["", "Tier 1 — Premium rates", "Tier 2 — Strong", "Tier 3 — Emerging", "Tier 4 — Volume"][c.tier];
  const groupId = (c: Country) => `${id}-tier-${c.code === "WW" ? "worldwide" : c.tier}`;
  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) trigger.current?.focus(); };
  const select = (country: Country) => { onChange(country.slug); close(true); };
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, query]);

  return <div ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(true); } }}>
    <label htmlFor={`${id}-trigger`} className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-fog"><span className="flex items-center gap-2"><Globe aria-hidden="true" className="h-4 w-4 text-yt-red" />Audience country</span><span className="rounded border border-mint/25 px-2 py-0.5 font-mono text-[10px] text-mint">{value.currency}</span></label>
    <button ref={trigger} id={`${id}-trigger`} type="button" aria-label="Audience country" aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? `${id}-panel` : undefined} onClick={() => { setQuery(""); setActive(Math.max(0, countries.findIndex(c => c.slug === value.slug))); setOpen(!open); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left text-sm text-heading shadow-sm hover:border-yt-red/40">
      <Flag country={value} /><span className="min-w-0 flex-1 break-words font-semibold">{value.name}</span><span className="shrink-0 font-mono text-xs text-fog">{value.currency} · {currencySymbol(value)}</span><ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-fog ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div id={`${id}-panel`} role="dialog" aria-label="Choose audience country" className="mt-2 rounded-xl border border-border bg-white p-2 shadow-lg">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3"><Search aria-hidden="true" className="h-4 w-4 shrink-0 text-fog" /><input ref={input} role="combobox" aria-label="Search countries" aria-expanded="true" aria-autocomplete="list" aria-controls={`${id}-list`} aria-activedescendant={matches[active] ? `${id}-${matches[active].slug}` : undefined} value={query} placeholder="Search name, code or currency…" onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setActive(i => matches.length ? (i + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length : 0); }
        if (event.key === "Home" || event.key === "End") { event.preventDefault(); setActive(event.key === "Home" ? 0 : Math.max(0, matches.length - 1)); }
        if (event.key === "Enter") { event.preventDefault(); if (matches[active]) select(matches[active]); }
      }} className="min-h-12 w-full min-w-0 bg-transparent text-sm text-heading outline-none" /><button type="button" aria-label="Close country search" onClick={() => close(true)} className="grid h-11 w-8 shrink-0 place-items-center rounded-md text-fog hover:text-yt-red"><X aria-hidden="true" className="h-4 w-4" /></button></div>
      <p role="status" className="px-2 py-2 text-xs text-fog">{matches.length ? `${matches.length} ${matches.length === 1 ? "country" : "countries"} · Results use the selected currency` : "No countries found. Try another name or currency code."}</p>
      <ul ref={list} role="listbox" id={`${id}-list`} aria-label="Countries" className="max-h-60 overflow-y-auto overscroll-contain">{matches.map((c, i) => <Fragment key={c.slug}>{(i === 0 || groupId(matches[i - 1]) !== groupId(c)) && <li role="presentation" id={groupId(c)} className="sticky top-0 z-10 border-y border-border bg-surface px-3 py-2.5 text-xs font-bold text-heading">{groupName(c)}</li>}<li aria-describedby={groupId(c)} role="option" tabIndex={-1} aria-selected={c.slug === value.slug} id={`${id}-${c.slug}`} key={c.slug} data-index={i} onMouseMove={() => setActive(i)} onClick={() => select(c)} className={`scroll-mt-10 flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm ${i === active ? "bg-yt-red-light text-heading" : "text-fog hover:bg-surface"}`}><Flag country={c} /><span className="min-w-0 flex-1 break-words">{c.name}</span><span className="shrink-0 font-mono text-xs">{c.currency} · {currencySymbol(c)}</span>{c.slug === value.slug ? <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-mint" /> : <span aria-hidden="true" className="w-4 shrink-0" />}</li></Fragment>)}</ul>
    </div>}
  </div>;
}
