import Link from "next/link";
import { CONTENT_UPDATED, SOURCES } from "@/lib/editorial";
export function SourceLinks({ ids }: { ids: readonly string[] }) {
  return <section className="mt-8 rounded-xl border border-border bg-surface p-5" aria-label="Sources and scope">
    <h2 className="text-lg font-bold text-heading">Sources and scope</h2>
    <p className="mt-2 text-sm leading-relaxed">Content updated <time dateTime={CONTENT_UPDATED}>{CONTENT_UPDATED}</time>. Official documentation supports metric definitions and access rules, not our country or niche benchmark values.</p>
    <ul className="mt-3 space-y-3 text-sm">{SOURCES.filter(s => ids.includes(s.id)).map(s => <li key={s.id}><a href={s.url} className="font-semibold text-yt-red underline underline-offset-4">{s.title}</a><p className="mt-1 leading-relaxed">{s.supports}</p></li>)}</ul>
    <Link href="/sources" className="mt-4 inline-block font-semibold text-yt-red underline">Editorial policy and benchmark limitations</Link>
  </section>;
}
export function BenchmarkNotice() {
  return <aside className="my-6 rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed" aria-label="Benchmark limitations"><strong className="text-heading">Directional model, not a verified average.</strong> Country means audience location. Displayed RPM and earnings projections assume one ad impression per view, 100% ad fill and a 55% creator share for long-form advertising. They exclude other income and taxes; actual Studio RPM can differ. FX is indicative, not live. <Link href="/sources" className="font-semibold text-yt-red underline">Sources and limitations</Link> · <Link href="/guides/how-to-check-youtube-cpm" className="font-semibold text-yt-red underline">Check your actual CPM</Link></aside>;
}
