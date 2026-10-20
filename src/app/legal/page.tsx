import Link from "next/link";
import ProsePage from "@/components/prose-page";
import { LEGAL_POLICIES, LEGAL_UPDATED } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Legal Information", "Read the separate privacy policy, terms of use, disclaimer and cookie policy for ytcpm.online calculators and guides.", "/legal");
export default function Page() {
  return <ProsePage eyebrow={<>Legal · Updated <time dateTime={LEGAL_UPDATED}>{LEGAL_UPDATED}</time></>} title="Legal Information" lede="Each policy has its own page. Choose the document you need below.">
    <div className="grid gap-4 sm:grid-cols-2">{LEGAL_POLICIES.map(p => <section key={p.path} className="card p-5"><h2 className="text-xl font-bold text-heading"><Link href={p.path} className="underline underline-offset-4 hover:text-yt-red">{p.title}</Link></h2><p className="mt-3 text-sm leading-relaxed text-fog">{p.description}</p></section>)}</div>
    <p className="mt-7 text-sm leading-relaxed">For questions about these policies, <Link href="/contact" className="font-semibold underline">contact us</Link>. For calculation assumptions and editorial sourcing, see our <Link href="/methodology" className="underline">Methodology</Link> and <Link href="/sources" className="underline">Sources &amp; Policy</Link>.</p>
  </ProsePage>;
}
