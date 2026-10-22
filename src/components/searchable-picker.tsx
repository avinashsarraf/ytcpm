"use client";

import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, SearchX, X } from "lucide-react";

export type PickerOption = {
  value: string; label: string; keywords?: string; icon: ReactNode;
  group: string; groupLabel: string; secondary?: string; badge?: string;
};

/** Shared, anchored selector. DOM focus stays in search; active-descendant handles navigation. */
export default function SearchablePicker({ label, icon, options, value, onChange, searchLabel, listLabel, dialogLabel, closeLabel, placeholder, emptyMessage, hint, labelBadge }: {
  label: string; icon: ReactNode; options: PickerOption[]; value: string; onChange: (value: string) => void;
  searchLabel: string; listLabel: string; dialogLabel: string; closeLabel: string;
  placeholder: string; emptyMessage: string; hint: string; labelBadge?: string;
}) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const selected = options.find(option => option.value === value) ?? options[0];
  const matches = options.filter(option => `${option.label} ${option.keywords ?? ""} ${option.secondary ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) trigger.current?.focus(); };
  const show = () => { const bounds = trigger.current?.getBoundingClientRect(); setAbove(Boolean(bounds && window.innerHeight - bounds.bottom < 300 && bounds.top > 520)); setQuery(""); setActive(Math.max(0, options.findIndex(option => option.value === value))); setOpen(true); };
  const select = (option: PickerOption) => { onChange(option.value); close(true); };
  const reveal = (index: number) => {
    const container = list.current; const option = container?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!container || !option) return;
    const bounds = container.getBoundingClientRect(); const item = option.getBoundingClientRect();
    // Scroll only the menu, never the document; leave room for its sticky tier label.
    if (item.top < bounds.top + 38) container.scrollTop -= bounds.top + 38 - item.top;
    else if (item.bottom > bounds.bottom) container.scrollTop += item.bottom - bounds.bottom;
  };
  useEffect(() => {
    if (!open) return;
    input.current?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => reveal(Math.max(0, options.findIndex(option => option.value === value))));
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("pointerdown", outside); };
  }, [open, options, value]);

  return <div ref={root} className="calculator-picker" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(true); }
  }}>
    <label htmlFor={`${id}-trigger`} className="mb-2.5 flex items-center justify-between gap-2 text-sm font-semibold text-heading"><span className="flex items-center gap-2.5"><span className="text-yt-red">{icon}</span>{label}</span>{labelBadge && <span className="rounded-md bg-surface px-2 py-1 font-mono text-[10px] font-semibold text-fog">{labelBadge}</span>}</label>
    <button ref={trigger} id={`${id}-trigger`} data-picker-trigger={listLabel} data-picker-value={value} type="button" aria-label={label} aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? `${id}-panel` : undefined} onClick={() => open ? close() : show()} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(); } }} className={`picker-trigger ${open ? "picker-trigger-open" : ""}`}>
      <span aria-hidden className="picker-option-icon">{selected.icon}</span><span className="min-w-0 flex-1 text-left font-semibold">{selected.label}</span>{selected.secondary && <span className="picker-currency hidden min-[360px]:inline-flex">{selected.secondary}</span>}{selected.badge && <span className="picker-currency">{selected.badge}</span>}<ChevronDown aria-hidden className={`h-4 w-4 shrink-0 text-fog transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div id={`${id}-panel`} role="dialog" aria-label={dialogLabel} className={`picker-panel ${above ? "picker-panel-above" : ""}`}>
      <div className="p-3 pb-0"><div className="picker-search"><Search aria-hidden className="h-4 w-4 shrink-0 text-yt-red" /><input ref={input} role="combobox" aria-label={searchLabel} aria-expanded="true" aria-autocomplete="list" aria-controls={`${id}-list`} aria-activedescendant={matches[active] ? `${id}-${matches[active].value}` : undefined} value={query} placeholder={placeholder} onChange={event => { setQuery(event.target.value); setActive(0); if (list.current) list.current.scrollTop = 0; }} onKeyDown={event => {
        let next: number | undefined;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") next = matches.length ? (active + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length : 0;
        if ((event.key === "Home" || event.key === "End") && !event.shiftKey) next = event.key === "Home" ? 0 : Math.max(0, matches.length - 1);
        if (next !== undefined) { event.preventDefault(); setActive(next); requestAnimationFrame(() => reveal(next)); }
        if (event.key === "Enter") { event.preventDefault(); if (matches[active]) select(matches[active]); }
      }} /><button type="button" aria-label={closeLabel} onClick={() => close(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-fog hover:bg-white hover:text-heading"><X aria-hidden className="h-4 w-4" /></button></div>
        <div className="flex items-center justify-between gap-3 px-1 py-3"><p role="status" className="text-[11px] leading-5 text-fog">{matches.length ? `${matches.length} ${listLabel.toLowerCase()}` : emptyMessage}</p><span className="shrink-0 text-[10px] font-semibold text-mint">{query ? "Search results" : "Grouped by model tier"}</span></div>
      </div>
      <ul ref={list} tabIndex={-1} role="listbox" id={`${id}-list`} aria-label={listLabel} className="picker-options">{matches.map((option, index) => <Fragment key={option.value}>
        {(index === 0 || matches[index - 1].group !== option.group) && <li role="presentation" id={`${id}-group-${option.group}`} className="picker-group"><span>{option.groupLabel}</span><span aria-hidden className="h-px flex-1 bg-border/80" /></li>}
        <li role="option" tabIndex={-1} aria-describedby={`${id}-group-${option.group}`} aria-selected={option.value === value} id={`${id}-${option.value}`} data-index={index} onPointerMove={event => { if (event.pointerType === "mouse") setActive(index); }} onClick={() => select(option)} className={`picker-option ${index === active ? "picker-option-active" : ""} ${option.value === value ? "picker-option-selected" : ""}`}>
          <span aria-hidden className="picker-option-icon">{option.icon}</span><span className="min-w-0 flex-1 font-medium">{option.label}</span>{option.secondary && <span className="shrink-0 font-mono text-[10px] text-fog sm:text-[11px]">{option.secondary}</span>}{option.badge && <span className="rounded-md bg-surface px-2 py-1 font-mono text-[10px] text-fog">{option.badge}</span>}<span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${option.value === value ? "bg-mint text-white" : ""}`}>{option.value === value && <Check className="h-3 w-3" />}</span>
        </li>
      </Fragment>)}</ul>
      {!matches.length && <div className="flex flex-col items-center px-5 pb-7 pt-3 text-center"><SearchX aria-hidden className="mb-3 h-7 w-7 text-fog" /><p className="text-sm font-semibold text-heading">Try a different search</p><button type="button" onClick={() => { setQuery(""); setActive(0); input.current?.focus(); }} className="mt-2 min-h-11 text-xs font-bold text-yt-red">Clear search</button></div>}
      <div className="picker-footer"><span>{hint}</span><span aria-hidden className="hidden shrink-0 sm:inline">↑ ↓ navigate · ↵ select</span></div>
    </div>}
  </div>;
}
