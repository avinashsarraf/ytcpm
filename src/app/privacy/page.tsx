import type { Metadata } from "next";
import { DATA_UPDATED_AT } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What ytcpm.online stores, what it does not store, and how calculator data is handled.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="pt-28 sm:pt-32">
      <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <p className="tag-red w-fit text-[10px]">Last updated {DATA_UPDATED_AT}</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl">Privacy Policy</h1>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-fog">
          <section>
            <h2 className="font-display text-lg font-bold text-heading">Summary</h2>
            <p className="mt-2">
              We store <strong className="text-heading">anonymous calculation inputs and results</strong> and nothing
              else. No accounts, no email addresses, no advertising cookies, and no third-party analytics.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">What we collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Monthly views, selected niche, selected country, content type, season and ad-impression rate.</li>
              <li>The resulting CPM/RPM ranges and monthly estimate.</li>
              <li>A server-side timestamp.</li>
            </ul>
            <p className="mt-2">
              These rows are aggregated on the <strong className="text-heading">Live Monitor</strong> page. They contain
              no IP address, user-agent, cookie, referrer or other identifier, so they cannot be tied back to a person.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">Rate limiting</h2>
            <p className="mt-2">
              To keep the public API usable, requests are counted per IP address in short-lived memory (60 requests per
              minute). Counters expire automatically and are never written to the database.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">Third parties</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-heading">flagcdn.com</strong> serves country flag images. Your browser connects
                directly, so their servers see your IP address.
              </li>
              <li>
                <strong className="text-heading">Fonts</strong> are self-hosted at build time via next/font — no Google
                Fonts request is made from your browser.
              </li>
              <li>No advertising networks, analytics scripts or social pixels are loaded.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">Cookies</h2>
            <p className="mt-2">
              We do not set cookies. If analytics or advertising are added later, this policy and a consent banner
              will be updated before that change ships.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">Retention</h2>
            <p className="mt-2">
              Calculation rows are retained in aggregate so the monitor can show trends. They are not linked to
              individuals, so there is no personal record to export or delete. If you believe a record is personal,
              email hello@ytcpm.online.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">Your rights</h2>
            <p className="mt-2">
              Because we do not process personal data, most GDPR/CCPA subject-request rights have no data to act on.
              You may still contact us with questions or objections at{" "}
              <a href="mailto:hello@ytcpm.online" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">hello@ytcpm.online</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-heading">Changes</h2>
            <p className="mt-2">
              Material changes to this policy will be reflected in the date at the top of this page.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
