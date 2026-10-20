import Link from "next/link";
import { ArrowRight, Globe2, Layers, Calculator } from "lucide-react";
import CreatorToolCards from "@/components/creator-tool-cards";
import ProsePage from "@/components/prose-page";
import { CREATOR_TOOLS } from "@/lib/creator-tools";
import { SITE_URL } from "@/lib/editorial";
import { breadcrumbs, pageMetadata, serializeJsonLd } from "@/lib/seo";

export const metadata = pageMetadata("Free YouTube Creator Tools & Calculators", "Explore free YouTube calculators for Shorts earnings, views to money, revenue goals, sponsorships, engagement and watch time. Clear formulas, no signup.", "/tools");
const benchmarks = [
  { href: "/cpm-by-country", title: "Country earnings scenarios", description: "Compare audience markets and model earnings in their local currencies. Audience location is not creator residence.", icon: Globe2 },
  { href: "/cpm-by-niche", title: "Niche earnings library", description: "Explore finance, gaming, technology and other modeled niche scenarios with transparent assumptions.", icon: Layers },
  { href: "/youtube-rpm-calculator", title: "Report-based CPM & RPM", description: "Have your own revenue report? Calculate actual RPM or advertiser CPM from matching inputs.", icon: Calculator },
];
export default function ToolsPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([breadcrumbs([{ name: "Home", path: "/" }, { name: "Creator tools", path: "/tools" }]), { "@context": "https://schema.org", "@type": "ItemList", name: "Free YouTube creator calculators", itemListElement: CREATOR_TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.title, url: SITE_URL + "/" + t.slug })) }]) }} />
    <ProsePage wide eyebrow="The creator planning studio · Free, no signup" title={<>YouTube creator tools.<br /><span className="text-yt-gradient">Clearer decisions.</span></>} lede="Free YouTube creator tools for earnings, sponsorship proposals and audience planning. Start with your own figures, explore a scenario, and understand the formula behind every result.">
      <nav aria-label="Breadcrumb" className="mb-7 text-xs text-fog"><Link href="/" className="underline">Home</Link> / <span aria-current="page">Creator tools</span></nav>
      <section><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-yt-red">Your next decision starts here</p><h2 className="mt-2 text-2xl font-bold text-heading">Find your calculator</h2></div><span className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-fog">7 focused tools · Browser-only inputs</span></div><CreatorToolCards /></section>
      <section className="mt-12"><h2 className="mb-6 text-2xl font-bold text-heading">Add context to your numbers</h2><div className="grid gap-4 lg:grid-cols-3">{benchmarks.map(({ href, title, description, icon: Icon }) => <Link key={href} href={href} className="group rounded-2xl border border-border bg-surface p-6"><Icon aria-hidden className="h-5 w-5 text-mint" /><h3 className="mt-4 text-lg font-bold text-heading">{title}</h3><p className="mt-3 text-sm leading-7 text-fog">{description}</p><ArrowRight aria-hidden className="mt-5 h-4 w-4 text-yt-red" /></Link>)}</div></section>
      <section className="mt-12 grid gap-6 rounded-3xl border border-border bg-gradient-to-br from-yt-red-light/60 to-white p-6 sm:p-8 lg:grid-cols-2"><div><h2 className="text-xl font-bold text-heading">Estimate, measure, then compare</h2><p className="mt-3 text-sm leading-8 text-fog">Use the earnings tools for scenarios and the report-based calculators for your own measured metrics. Shorts and long-form use different revenue mechanics; sponsorship quotes are negotiated separately. None of these tools reveal a public channel&apos;s private earnings.</p></div><div><h3 className="text-lg font-bold text-heading">Made for creators worldwide</h3><p className="mt-3 text-sm leading-8 text-fog">The country library supports local-currency model scenarios. The focused calculators on this page use USD where a currency is needed. Country benchmarks and prefilled figures are not live rates or guaranteed payouts.</p><Link href="/methodology" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-yt-red underline">Read the calculation methodology →</Link></div></section>
    </ProsePage></>;
}
