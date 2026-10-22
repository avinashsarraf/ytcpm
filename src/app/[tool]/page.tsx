import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CREATOR_TOOLS, getCreatorTool } from "@/lib/creator-tools";
import { breadcrumbs, pageMetadata, serializeJsonLd, webPageSchema } from "@/lib/seo";
import { toolSeo } from "@/lib/seo-keywords";
import { CREATOR_TOOLS_UPDATED } from "@/lib/creator-tools";
import { SITE_URL } from "@/lib/editorial";
import CreatorToolCalculator from "@/components/creator-tool-calculator";
import CreatorToolCards from "@/components/creator-tool-cards";
import Faq from "@/components/faq";

export const dynamicParams = false;
export function generateStaticParams() { return CREATOR_TOOLS.map(t => ({ tool: t.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const { tool: slug } = await params; const tool = getCreatorTool(slug);
  if (!tool) return {};
  const seo = toolSeo(tool);
  const image = { url: `/images/tools/${tool.slug}.png`, width: 1200, height: 630, alt: `${tool.title}: transparent formula and editable scenario inputs` };
  return pageMetadata(tool.title, tool.description, `/${tool.slug}`, {
    focus: seo.focus, keywords: seo.keywords, image,
    category: tool.unit === "USD" || tool.unit === "views" ? "finance" : "utilities",
    modifiedTime: CREATOR_TOOLS_UPDATED,
  });
}
export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: slug } = await params; const tool = getCreatorTool(slug);
  if (!tool) notFound();
  const path = `/${tool.slug}`;
  const schema = [breadcrumbs([{ name: "Home", path: "/" }, { name: "Creator tools", path: "/tools" }, { name: tool.shortTitle, path }]),
    webPageSchema({ path, name: tool.title, description: tool.description, image: `/images/tools/${tool.slug}.png`, dateModified: CREATOR_TOOLS_UPDATED, section: "Creator tools", about: [tool.keyword, tool.category] }), { "@context": "https://schema.org", "@type": "WebApplication", "@id": SITE_URL + path + "#app", name: tool.title, description: tool.description, url: SITE_URL + path, applicationCategory: tool.unit === "USD" || tool.unit === "views" ? "FinanceApplication" : "UtilitiesApplication", operatingSystem: "Any", inLanguage: "en", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, publisher: { "@id": SITE_URL + "/#organization" }, image: SITE_URL + `/images/tools/${tool.slug}.png` }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: tool.faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }];
  return <article className="overflow-hidden">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
    <header className="border-b border-border bg-gradient-to-br from-[#fff0f4] via-white to-[#f4f9fb] py-8 sm:py-12 lg:py-16"><div className="shell">
      <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap gap-2 text-xs text-fog"><Link href="/" className="hover:text-yt-red">Home</Link><span aria-hidden>/</span><Link href="/tools" className="hover:text-yt-red">Creator tools</Link><span aria-hidden>/</span><span aria-current="page">{tool.shortTitle}</span></nav>
      <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14"><div><p className="tag-red w-fit text-[11px]">{tool.category} · Free creator tool</p><h1 className="display-2 mt-5 max-w-[22ch]">{tool.title}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-fog">{tool.description}</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-fog">{["No signup", "Instant results", "Clear assumptions"].map(t => <span key={t} className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden className="h-3.5 w-3.5 text-mint" />{t}</span>)}</div><a href="#tool-calculator" className="hot-gradient mt-7 inline-flex min-h-12 items-center gap-3 rounded-xl px-5 text-sm font-bold text-white">Build your scenario<ArrowRight aria-hidden className="h-4 w-4" /></a></div><Image src={`/images/tools/${tool.slug}.png`} width={1200} height={630} sizes="(min-width: 1024px) 40vw, 100vw" alt={`${tool.title} diagram: ${tool.formula}`} priority className="h-auto w-full rounded-2xl border border-white shadow-[0_16px_45px_-25px_rgba(30,40,60,0.4)]" /></div>
    </div></header>
    <div className="shell py-8 sm:py-12"><CreatorToolCalculator key={tool.slug} tool={tool} />
      <div className="mt-10 grid items-start gap-8 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="min-w-0 space-y-9"><section id="worked-example" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5 sm:p-7"><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-yt-red">Worked example</p><h2 className="mt-3 text-xl font-bold text-heading">How the {tool.shortTitle.toLowerCase()} calculation works</h2><p className="mt-4 text-sm leading-8 text-fog">{tool.example}</p></section>
          {tool.slug === "youtube-views-to-money-calculator" && <section><h2 className="text-xl font-bold text-heading">1K, 10K, 100K and 1 million views: example scenarios</h2><p className="mt-3 text-sm leading-7 text-fog">Illustrations at three assumed RPMs—not verified country averages or guaranteed payouts. USD, before expenses and taxes.</p><div className="mt-4 overflow-x-auto rounded-xl border border-border" role="region" aria-label="Revenue scenario table" tabIndex={0}><table className="w-full text-left text-sm"><caption className="sr-only">Hypothetical YouTube revenue by views and assumed creator RPM</caption><thead className="bg-surface text-heading"><tr>{["Views", "$1 RPM", "$3 RPM", "$5 RPM"].map(h => <th key={h} scope="col" className="whitespace-nowrap p-3">{h}</th>)}</tr></thead><tbody>{[1000,10000,100000,1000000].map(v => <tr key={v} className="border-t border-border"><th scope="row" className="p-3 font-medium text-heading">{v.toLocaleString("en-US")}</th>{[1,3,5].map(r => <td key={r} className="p-3">${(v / 1000 * r).toLocaleString("en-US")}</td>)}</tr>)}</tbody></table></div></section>}
          {tool.sections.map(s => <section key={s.title}><h2 className="text-xl font-bold leading-snug text-heading">{s.title}</h2><p className="mt-3 max-w-[78ch] text-sm leading-8 text-fog">{s.text}</p></section>)}
          <section id="tool-faq" className="scroll-mt-24"><h2 className="mb-5 text-2xl font-bold text-heading">Frequently asked questions</h2><Faq items={tool.faqs} idPrefix="tool-faq" /></section>
        </div>
        <aside className="rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-24"><h2 className="text-sm font-bold text-heading">Use the right inputs</h2><p className="mt-3 text-sm leading-7 text-fog">{tool.takeaway}</p><h3 className="mt-6 border-t border-border pt-5 text-xs font-bold uppercase tracking-wider text-heading">Sources & methodology</h3><ul className="mt-3 space-y-3 text-sm leading-6"><li><a href={tool.source.url} className="text-yt-red underline underline-offset-4">{tool.source.label}</a></li><li><Link href="/methodology" className="text-yt-red underline underline-offset-4">Model assumptions and limitations</Link></li><li><Link href="/sources" className="text-yt-red underline underline-offset-4">Sources & editorial policy</Link></li></ul><p className="mt-5 text-xs leading-6 text-fog">Independent of YouTube and Google. No private channel access. USD outputs are not local-currency or live-rate conversions.</p></aside>
      </div>
      <section className="mt-12 border-t border-border pt-10"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold text-heading">Continue your creator plan</h2><Link href="/tools" className="min-h-11 py-3 text-sm font-bold text-yt-red">Explore all tools →</Link></div><CreatorToolCards slugs={tool.related} /><nav aria-label="Related benchmarks" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-yt-red">{[["/cpm-by-country", "Compare audience countries"], ["/cpm-by-niche", "Explore niche scenarios"], ["/youtube-rpm-calculator", "Calculate actual RPM"], ["/guides", "Read creator guides"], ["/channel-auditor", "Audit a public channel"]].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center underline underline-offset-4">{label}</Link>)}</nav>
        <h3 className="mt-10 text-lg font-bold text-heading">Every free YouTube tool</h3>
        <p className="mt-2 max-w-[70ch] text-sm leading-7 text-fog">Each tool states its formula, its assumptions and its limits. Pick the one that matches the number you need.</p>
        <nav aria-label="All creator tools" className="mt-4 flex flex-wrap gap-2">{CREATOR_TOOLS.filter(t => t.slug !== tool.slug).map(t => <Link key={t.slug} href={`/${t.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 text-sm font-medium text-heading transition-colors hover:border-yt-red/40 hover:text-yt-red">{t.shortTitle}</Link>)}</nav>
      </section>
    </div>
  </article>;
}
