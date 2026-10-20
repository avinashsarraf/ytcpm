import Link from "next/link";
import { notFound } from "next/navigation";
import MetricComparison from "@/components/metric-comparison";
import ProsePage from "@/components/prose-page";
import { SourceLinks } from "@/components/source-notice";
import { CONTENT_UPDATED, GUIDES, SITE_URL, SOURCES } from "@/lib/editorial";
import { breadcrumbs, pageMetadata, serializeJsonLd } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() { return GUIDES.map(g => ({ slug: g.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES.find(g => g.slug === slug);
  return guide ? pageMetadata(guide.title, guide.description, `/guides/${guide.slug}`) : {};
}
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES.find(g => g.slug === slug);
  if (!guide) notFound();
  const path = `/guides/${slug}`;
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description, dateModified: CONTENT_UPDATED, mainEntityOfPage: SITE_URL + path, author: { "@type": "Organization", name: "YTCPM", url: SITE_URL + "/about" }, publisher: { "@id": SITE_URL + "/#organization" }, citation: SOURCES.filter(s => guide.sourceIds.includes(s.id)).map(s => s.url) };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([schema, breadcrumbs([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: guide.title, path }])]) }} />
    <ProsePage eyebrow={<>YTCPM guide · Updated <time dateTime={CONTENT_UPDATED}>{CONTENT_UPDATED}</time></>} title={guide.title} lede={guide.description}>
      <nav aria-label="Breadcrumb" className="mb-5 text-sm"><Link href="/" className="underline">Home</Link> / <Link href="/guides" className="underline">Guides</Link></nav>
      <section className="rounded-xl border border-border bg-surface p-5"><h2 className="font-bold text-heading">Quick answer</h2><p className="mt-2 leading-relaxed">{guide.answer}</p></section>
      <nav aria-label="On this page" className="my-6"><p className="font-bold text-heading">On this page</p><ul className="mt-2 space-y-2 text-sm">{guide.sections.map(s => <li key={s.id}><a className="text-yt-red underline" href={`#${s.id}`}>{s.title}</a></li>)}</ul></nav>
      {slug === "youtube-cpm-vs-rpm" && <MetricComparison />}
      {guide.sections.map(s => <section key={s.id} id={s.id} className="mt-8 scroll-mt-24"><h2 className="text-xl font-bold text-heading">{s.title}</h2>{s.paragraphs.map(p => <p key={p} className="mt-3 leading-relaxed">{p}</p>)}{s.steps && <ol className="mt-3 list-decimal space-y-3 pl-6 leading-relaxed">{s.steps.map(step => <li key={step}>{step}</li>)}</ol>}</section>)}
      <SourceLinks ids={guide.sourceIds} />
      <nav aria-label="Related tools and guides" className="mt-8 space-y-3"><h2 className="text-lg font-bold text-heading">Put the explanation into practice</h2><ul className="space-y-3 text-yt-red underline"><li><Link href="/youtube-cpm-calculator">Calculate CPM from ad revenue and impressions</Link></li><li><Link href="/youtube-rpm-calculator">Calculate RPM from creator revenue and views</Link></li><li><Link href="/#calculator">Estimate earnings from views and CPM</Link></li><li><Link href="/youtube-views-to-money-calculator">Convert matching views and creator RPM to a revenue scenario</Link></li><li><Link href="/youtube-revenue-goal-calculator">Plan views needed for a revenue goal</Link></li><li><Link href="/tools">Explore Shorts, engagement, watch-time and sponsorship tools</Link></li>{GUIDES.filter(g => g.slug !== slug).map(g => <li key={g.slug}><Link href={`/guides/${g.slug}`}>{g.title}</Link></li>)}</ul></nav>
    </ProsePage>
  </>;
}
