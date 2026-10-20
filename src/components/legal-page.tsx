import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Globe2, List, Mail, ShieldCheck } from "lucide-react";
import ProsePage from "@/components/prose-page";
import { LEGAL_POLICIES, LEGAL_REFERENCES, LEGAL_UPDATED, type LegalPolicy } from "@/lib/legal";
import { SITE_URL } from "@/lib/editorial";
import { breadcrumbs, serializeJsonLd } from "@/lib/seo";

function Contents({ policy }: { policy: LegalPolicy }) {
  return <ul className="mt-3 space-y-1">{policy.sections.map((s, i) => <li key={s.id}><a href={`#${s.id}`} className="flex gap-2 rounded-lg px-2 py-3 text-sm leading-snug text-fog transition-colors hover:bg-surface hover:text-yt-red"><span className="shrink-0 text-fog/60">{String(i + 1).padStart(2, "0")}</span>{s.title}</a></li>)}<li><a href="#policy-faqs" className="block rounded-lg px-2 py-3 text-sm font-semibold hover:text-yt-red">Common questions</a></li></ul>;
}

export default function LegalPage({ policy }: { policy: LegalPolicy }) {
  const words = [...policy.sections.flatMap(s => s.paragraphs), ...policy.faqs.map(f => f.answer)].join(" ").split(/\s+/).length;
  const structuredData = { "@context": "https://schema.org", "@type": "WebPage", "@id": SITE_URL + policy.path + "#webpage", url: SITE_URL + policy.path, name: policy.seoTitle, description: policy.description, dateModified: LEGAL_UPDATED, inLanguage: "en", isPartOf: { "@id": SITE_URL + "/#website" }, publisher: { "@id": SITE_URL + "/#organization" }, about: policy.topics.map(name => ({ "@type": "Thing", name })) };
  return <ProsePage wide eyebrow={<>Legal · Updated <time dateTime={LEGAL_UPDATED}>{LEGAL_UPDATED}</time></>} title={policy.title} lede={policy.description}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs([{ name: "Home", path: "/" }, { name: "Legal", path: "/legal" }, { name: policy.title, path: policy.path }])) }} />
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-fog"><Link href="/" className="py-2 hover:text-yt-red">Home</Link><span aria-hidden="true">/</span><Link href="/legal" className="py-2 hover:text-yt-red">Legal</Link><span aria-hidden="true">/</span><span aria-current="page" className="font-semibold text-heading">{policy.title}</span></nav>
    <nav aria-label="Legal policies" className="flex flex-wrap gap-2 border-b border-border pb-6 print:hidden">
      {LEGAL_POLICIES.map(p => <Link key={p.path} href={p.path} aria-current={p.path === policy.path ? "page" : undefined} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${p.path === policy.path ? "border-yt-red bg-yt-red-light text-heading" : "border-border hover:border-yt-red hover:text-yt-red"}`}>{p.title}</Link>)}
    </nav>
    <div className="mx-auto mt-8 grid max-w-[70rem] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10">
      <div className="min-w-0 max-w-[80ch]">
        <section aria-labelledby="policy-summary" className="rounded-2xl border border-yt-red/15 bg-gradient-to-br from-yt-red-light/70 to-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3"><h2 id="policy-summary" className="flex items-center gap-2 text-lg font-bold text-heading"><ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-yt-red" />At a glance</h2><span className="shrink-0 text-xs text-fog">{Math.max(1, Math.ceil(words / 220))} min read</span></div>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-fog">{policy.summary.map(s => <li key={s}>{s}</li>)}</ul>
          <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-fog">A reading aid, not a replacement for the full policy below.</p>
        </section>
        <div aria-label="Policy topics" className="my-5 flex flex-wrap gap-2">{policy.topics.map(t => <span key={t} className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-fog">{t}</span>)}</div>
        <details className="mb-7 rounded-xl border border-border p-4 lg:hidden print:hidden"><summary className="cursor-pointer py-2 text-sm font-bold text-heading"><List aria-hidden="true" className="mr-2 inline h-4 w-4" />Jump to a section</summary><nav aria-label="Mobile policy contents"><Contents policy={policy} /></nav></details>
        <div className="divide-y divide-border text-base leading-7 text-fog">
          {policy.sections.map((s, i) => <section id={s.id} key={s.id} className="scroll-mt-28 py-7 first:pt-2"><h2 className="flex items-start gap-3 font-display text-xl font-bold leading-snug text-heading"><span className="mt-0.5 text-sm font-medium text-yt-red">{String(i + 1).padStart(2, "0")}</span>{s.title}</h2>{s.paragraphs.map(p => <p key={p} className="mt-4">{p}</p>)}</section>)}
        </div>
        <section id="policy-faqs" className="scroll-mt-28 border-t border-border pt-7"><h2 className="text-xl font-bold text-heading">Common questions about {policy.title.toLowerCase()}</h2><div className="mt-5 space-y-3">{policy.faqs.map(f => <details key={f.question} className="group rounded-xl border border-border bg-white p-5"><summary className="cursor-pointer font-semibold leading-relaxed text-heading">{f.question}</summary><p className="mt-3 text-sm leading-7 text-fog">{f.answer}</p></details>)}</div></section>
        <section aria-labelledby="regional-resources" className="mt-8 rounded-2xl border border-border p-5 sm:p-7"><h2 id="regional-resources" className="flex items-center gap-2 text-lg font-bold text-heading"><Globe2 aria-hidden="true" className="h-5 w-5 shrink-0 text-yt-red" />Official regional resources</h2><p className="mt-3 text-sm leading-relaxed text-fog">Start with these public authorities for regional information. These links do not establish which laws apply to this service or certify compliance. This page is not legal advice.</p><ul className="mt-3 space-y-1">{LEGAL_REFERENCES.map(r => <li key={r.url}><a href={r.url} className="inline-flex items-center gap-2 py-3 text-sm font-semibold text-heading underline underline-offset-4 hover:text-yt-red">{r.name}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></a></li>)}</ul></section>
        <aside className="mt-8 rounded-2xl bg-navy p-6 text-white sm:p-8"><h2 className="flex items-center gap-2 text-xl font-bold"><Mail aria-hidden="true" className="h-5 w-5" />Need help with this policy?</h2><p className="mt-3 text-sm leading-relaxed text-white/75">Include the page URL and a short description. Do not send passwords, tokens or private financial reports.</p><a href="mailto:hello@ytcpm.online" className="mt-3 inline-block break-all py-3 font-semibold underline underline-offset-4">hello@ytcpm.online</a><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm"><Link href="/contact" className="py-2 underline">Contact us</Link><Link href="/methodology" className="py-2 underline">Methodology</Link><Link href="/sources" className="py-2 underline">Sources &amp; policy</Link></div></aside>
        <Link href="/legal" className="mt-5 inline-flex items-center gap-2 py-3 text-sm font-semibold hover:text-yt-red"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to all legal pages</Link>
      </div>
      <aside className="sticky top-28 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl border border-border p-5 lg:block print:hidden"><nav aria-label="Desktop policy contents"><h2 className="flex items-center gap-2 font-bold text-heading"><List aria-hidden="true" className="h-4 w-4" />On this page</h2><Contents policy={policy} /></nav></aside>
    </div>
  </ProsePage>;
}
