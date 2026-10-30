"use client";
import { useState } from "react";
import { RotateCcw, ShieldCheck, SlidersHorizontal, TrendingUp } from "lucide-react";
import { calculateCreatorTool, type CreatorTool } from "@/lib/creator-tools";

const number = (n: number, digits = 2) => n.toLocaleString("en-US", { maximumFractionDigits: digits });
export default function CreatorToolCalculator({ tool }: { tool: CreatorTool }) {
  const defaults = Object.fromEntries(tool.fields.map(f => [f.key, f.value]));
  const [raw, setRaw] = useState<Record<string, string>>(defaults);
  const result = calculateCreatorTool(tool, raw);
  const invalid = tool.fields.filter(f => {
    const value = raw[f.key]; const n = Number(value);
    return !value?.trim() || !Number.isFinite(n) || n < f.min || n > f.max || (f.step === "1" && !Number.isSafeInteger(n));
  });
  const formatted = result === null ? "—" : tool.unit === "USD" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(result.value) : `${number(result.value, tool.unit === "views" ? 0 : 2)}${tool.unit === "percent" ? "%" : ""}`;
  return <section id="tool-calculator" aria-label={tool.title} className="scroll-mt-24 overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_70px_-30px_rgba(20,30,50,0.22)]">
    <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="min-w-0 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-bold text-heading"><SlidersHorizontal aria-hidden className="h-4 w-4 text-yt-red" />Your scenario</h2><button type="button" onClick={() => setRaw(defaults)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-fog hover:bg-surface"><RotateCcw aria-hidden className="h-3.5 w-3.5" />Reset example</button></div>
        <p className="mt-2 text-sm leading-6 text-fog">Prefilled values are hypothetical. Replace them with your own figures.</p>
        <div className="mt-6 space-y-5">{tool.fields.map(f => {
          const id = `tool-${f.key}`; const bad = invalid.some(i => i.key === f.key);
          return <div key={f.key}><label htmlFor={id} className="text-sm font-bold text-heading">{f.label}</label><input id={id} type="number" inputMode={f.step === "1" ? "numeric" : "decimal"} min={f.min} max={f.max} step={f.step ?? "any"} value={raw[f.key]} onChange={e => setRaw(prev => ({ ...prev, [f.key]: e.target.value }))} aria-invalid={bad} aria-describedby={`${id}-help${bad ? ` ${id}-error` : ""}`} className="field mt-2 min-h-12 font-mono" /><p id={`${id}-help`} className="mt-2 text-xs leading-5 text-fog">{f.help}</p>{bad && <p id={`${id}-error`} className="mt-1 text-xs font-semibold text-yt-red">Enter {f.step === "1" ? "a whole number" : "a number"} from {number(f.min)} to {number(f.max, 0)}.</p>}</div>;
        })}</div>
        <p className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-fog"><ShieldCheck aria-hidden className="h-4 w-4 shrink-0 text-mint" />No login. These inputs stay in your browser.</p>
      </div>
      <div className="min-w-0 border-t border-border bg-gradient-to-br from-[#fff1f5] via-white to-[#f0f9f7] p-5 sm:p-8 lg:border-l lg:border-t-0">
        <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-mint"><TrendingUp aria-hidden className="h-4 w-4" />Transparent calculation</p>
        <div role="status" aria-live="polite" aria-atomic="true" className="mt-8"><h3 className="text-sm font-semibold text-fog">{tool.resultLabel}</h3><p data-tool-result className="mt-3 break-words font-mono text-4xl font-extrabold tracking-tight text-heading sm:text-5xl" style={{ overflowWrap: "anywhere" }}>{formatted}</p>{tool.unit === "views" || tool.unit === "hours" ? <p className="mt-2 text-sm font-semibold text-fog">{tool.unit === "views" ? "matching views, rounded up" : "hours of modeled viewing"}</p> : null}
          {result === null && <p className="mt-4 text-sm text-yt-red">Complete the highlighted inputs with valid values to calculate a result.</p>}
          {result?.secondary !== undefined && <div className="mt-6 rounded-2xl border border-white bg-white/80 p-4"><p className="text-xs font-semibold text-fog">{tool.unit === "views" ? "Per day over a hypothetical 30-day period" : "Total views needed for your watch-hour target"}</p><p className="mt-2 break-words font-mono text-xl font-bold text-heading">{number(result.secondary, 0)} views</p></div>}
        </div>
        <div className="mt-8 rounded-2xl border border-border/70 bg-white/70 p-5"><h3 className="text-xs font-bold uppercase tracking-wider text-heading">The formula</h3><p className="mt-3 text-sm leading-7 text-fog">{tool.formula}</p></div>
        <p className="mt-5 text-xs leading-6 text-fog">{tool.takeaway} {tool.unit === "USD" && "Amounts are USD, before taxes and costs."}</p>
      </div>
    </div>
    <noscript><p className="border-t border-border p-5 text-sm">Enable JavaScript to edit this calculator. The worked example, formula and FAQs below work without JavaScript.</p></noscript>
  </section>;
}
