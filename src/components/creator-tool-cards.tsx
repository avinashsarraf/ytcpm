import Link from "next/link";
import { ArrowUpRight, Calculator } from "lucide-react";
import { CREATOR_TOOLS } from "@/lib/creator-tools";
export default function CreatorToolCards({ slugs }: { slugs?: string[] }) {
  const tools = slugs ? slugs.map(s => CREATOR_TOOLS.find(t => t.slug === s)).filter(t => t !== undefined) : CREATOR_TOOLS;
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map(t => <Link key={t.slug} href={`/${t.slug}`} className="group min-w-0 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-yt-red/40 hover:bg-yt-red-light/20 sm:p-6"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-yt-red-light text-yt-red"><Calculator aria-hidden className="h-5 w-5" /></span><ArrowUpRight aria-hidden className="h-4 w-4 text-fog group-hover:text-yt-red" /></div><p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-widest text-yt-red">{t.category}</p><h3 className="mt-2 text-lg font-bold text-heading">{t.shortTitle}</h3><p className="mt-3 text-sm leading-6 text-fog">{t.description}</p><span className="mt-5 inline-block text-xs font-bold text-yt-red">Open free calculator →</span></Link>)}</div>;
}
