import Link from "next/link";
import ProsePage from "@/components/prose-page";
import { GUIDES } from "@/lib/editorial";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("YouTube CPM, RPM & Earnings Guides", "Learn how to check YouTube CPM in Studio, compare CPM vs RPM and estimate revenue per 1,000 views with sourced, worked examples.", "/guides");
export default function GuidesPage() {
  return <ProsePage eyebrow="YTCPM learning center" title="Understand your YouTube CPM and earnings" lede="Practical guides for checking your own metrics, comparing the right numbers and avoiding misleading earnings estimates."><div className="grid gap-5">{GUIDES.map(g => <article key={g.slug} className="card p-5"><h2 className="text-xl font-bold text-heading"><Link href={`/guides/${g.slug}`} className="hover:text-yt-red">{g.title}</Link></h2><p className="mt-3 leading-relaxed">{g.description}</p><Link href={`/guides/${g.slug}`} className="mt-3 inline-block py-2 font-semibold text-yt-red underline">Read the guide</Link></article>)}</div></ProsePage>;
}
