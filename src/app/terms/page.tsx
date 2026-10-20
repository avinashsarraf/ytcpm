import type { Metadata } from "next";
import Link from "next/link";
import { DATA_UPDATED_AT } from "@/lib/data";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for the ytcpm.online YouTube CPM calculator and its estimates.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="pt-28 sm:pt-32">
      <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <p className="tag-red w-fit text-[10px]">Last updated {DATA_UPDATED_AT}</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl">Terms of Use</h1>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-fog">
          <section>
            <h2 className="font-display text-lg font-bold text-heading">1. Estimates, not guarantees</h2>
            <p className="mt-2">
              ytcpm.online provides <strong className="text-heading">directional benchmarks</strong>. CPM, RPM and
              earnings figures are modelled estimates, not statements of what YouTube or any advertiser will pay.
              Actual revenue depends on advertiser demand, ad fill, audience mix, policy status and other factors we
              cannot observe. Do not make financial decisions on these numbers alone.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">2. No financial advice</h2>
            <p className="mt-2">
              Nothing on this site is financial, legal, tax or business advice. Consult a qualified professional for
              decisions about your channel or business.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">3. Acceptable use</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Do not scrape, automate or bulk-query the site or its API beyond reasonable personal use.</li>
              <li>Do not attempt to overload, probe or bypass rate limits.</li>
              <li>Do not misrepresent our estimates as official YouTube data.</li>
            </ul>
            <p className="mt-2">
              The public <code className="rounded bg-surface px-1.5 py-0.5 text-[12px]">POST /api/calculate</code>{" "}
              endpoint is rate limited to 60 requests per minute per IP address.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">4. Intellectual property</h2>
            <p className="mt-2">
              The site design, copy, and compiled dataset are the property of ytcpm.online. You may quote figures with
              attribution and a link. Bulk reproduction of the dataset requires written permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">5. Availability</h2>
            <p className="mt-2">
              The service is provided &quot;as is&quot; without warranties. We may change, suspend or discontinue any
              part of it, including the API, at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">6. Limitation of liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, ytcpm.online is not liable for any indirect, incidental or
              consequential loss arising from use of the site or reliance on its estimates.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">7. Changes</h2>
            <p className="mt-2">
              Continued use after a change to these terms constitutes acceptance. The date at the top of this page
              always reflects the current version.
            </p>
          </section>

          <p className="text-xs">
            See also the <Link href="/privacy" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">Privacy Policy</Link>{" "}
            and <Link href="/methodology" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">Methodology</Link>.
          </p>
        </div>
      </div>
    </article>
  );
}
