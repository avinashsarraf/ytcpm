"use client";

import Link from "next/link";
import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { usdRange, COUNTRIES_BY_CPM } from "@/lib/data";

const markets = COUNTRIES_BY_CPM.slice(0, 14);

/** Duplicate only the visual strip; keyboard/screen-reader users encounter each link once. */
export default function CpmRateTicker() {
  const [paused, setPaused] = useState(false);
  return <section aria-label="CPM rate ticker" className="cpm-ticker my-8 border-y border-border bg-white/70 sm:my-12">
    <div className="shell flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1">
      <p className="font-mono text-[10px] uppercase tracking-wider text-fog">Country CPM scenarios · USD per 1,000 ad impressions · not live rates</p>
      <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-fog hover:text-yt-red motion-reduce:hidden">{paused ? <Play aria-hidden="true" className="h-3 w-3" /> : <Pause aria-hidden="true" className="h-3 w-3" />}{paused ? "Resume ticker" : "Pause ticker"}</button>
    </div>
    <div className="marquee-mask overflow-hidden pb-3.5">
      <div className="cpm-ticker-track flex w-max" data-paused={paused}>
        {[false, true].map(duplicate => <ul key={String(duplicate)} aria-hidden={duplicate || undefined} inert={duplicate || undefined} className={`cpm-ticker-group flex shrink-0 items-center gap-8 pr-8 ${duplicate ? "pointer-events-none" : ""}`}>
          {markets.map(c => <li key={c.slug} className="shrink-0"><Link href={`/cpm-by-country/${c.slug}`} tabIndex={duplicate ? -1 : undefined} className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md px-1 font-mono text-xs tracking-wide text-fog hover:text-heading"><span className="grid h-5 w-7 place-items-center rounded bg-black/5 text-[9px] font-bold text-heading">{c.code}</span>{c.name}<span className="font-semibold text-mint">{usdRange(c.cpmLow, c.cpmHigh)}</span><span aria-hidden="true" className="text-black/20">/</span></Link></li>)}
        </ul>)}
      </div>
    </div>
  </section>;
}
