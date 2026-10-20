import Link from "next/link";
import ProsePage from "@/components/prose-page";
import { LEGAL_POLICIES, LEGAL_UPDATED, type LegalPolicy } from "@/lib/legal";

export default function LegalPage({ policy }: { policy: LegalPolicy }) {
  return <ProsePage eyebrow={<>Legal · Updated <time dateTime={LEGAL_UPDATED}>{LEGAL_UPDATED}</time></>} title={policy.title} lede={policy.description}>
    <nav aria-label="Legal policies" className="flex flex-wrap gap-2 border-b border-border pb-5">
      <Link href="/legal" className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">All legal pages</Link>
      {LEGAL_POLICIES.map(p => <Link key={p.path} href={p.path} aria-current={p.path === policy.path ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${p.path === policy.path ? "border-yt-red bg-yt-red-light text-heading" : "border-border hover:text-yt-red"}`}>{p.title}</Link>)}
    </nav>
    <nav aria-label="On this policy page" className="my-7 rounded-xl border border-border p-5">
      <h2 className="font-bold text-heading">On this page</h2>
      <ul className="mt-3 space-y-2 text-sm">{policy.sections.map(s => <li key={s.id}><a href={`#${s.id}`} className="underline underline-offset-4 hover:text-yt-red">{s.title}</a></li>)}</ul>
    </nav>
    <div className="space-y-8 text-sm leading-relaxed text-fog">
      {policy.sections.map(s => <section id={s.id} key={s.id} className="scroll-mt-28"><h2 className="font-display text-lg font-bold text-heading">{s.title}</h2>{s.paragraphs.map(p => <p key={p} className="mt-3">{p}</p>)}</section>)}
    </div>
    <aside className="mt-9 rounded-xl border border-border p-5 text-sm leading-relaxed">
      Questions? <a href="mailto:hello@ytcpm.online" className="font-semibold underline">hello@ytcpm.online</a>. You can also <Link href="/contact" className="underline">contact us</Link>, review the <Link href="/methodology" className="underline">methodology</Link> or read our <Link href="/sources" className="underline">sources and editorial policy</Link>.
    </aside>
  </ProsePage>;
}
