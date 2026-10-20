export interface FaqItem { q: string; a: string; }

/** Native disclosure: every answer is in the initial HTML, also usable without JS. */
export default function Faq({ items, idPrefix = "faq" }: { items: FaqItem[]; idPrefix?: string }) {
  return <div className="space-y-2.5">{items.map((item, i) => <details key={item.q} id={`${idPrefix}-${i}`} open={i === 0} className="group rounded-xl border border-border bg-white open:border-yt-red/25">
    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-[15px] font-bold text-heading sm:px-5">
      {item.q}<span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-yt-red transition-transform group-open:rotate-45">+</span>
    </summary>
    <p className="max-w-[74ch] px-4 pb-4 text-[14px] leading-relaxed text-[#5b6b80] sm:px-5">{item.a}</p>
  </details>)}</div>;
}
