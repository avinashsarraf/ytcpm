import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import ProsePage from "@/components/prose-page";
import Link from "next/link";
import { Mail, MessageSquare, Database } from "lucide-react";
import { DATA_UPDATED_AT } from "@/lib/data";
import { STATIC_PAGE_SEO } from "@/lib/seo-keywords";
import { breadcrumbs, serializeJsonLd, webPageSchema } from "@/lib/seo";

const seo = STATIC_PAGE_SEO["/contact"];
export const metadata: Metadata = pageMetadata(
  "Contact ytcpm.online — Feedback & Corrections",
  "Contact ytcpm.online to report a wrong YouTube CPM or RPM range, request a missing country or niche, or make a privacy request. No signup needed.",
  "/contact",
  { focus: seo.focus, keywords: seo.keywords, modifiedTime: DATA_UPDATED_AT },
);

const CHANNELS = [
  {
    icon: Database,
    title: "Data corrections",
    body: "Send a CPM/RPM range you believe is wrong, with a screenshot or source. Corrections with first-party data are prioritised and credited.",
    subject: "Data correction",
  },
  {
    icon: MessageSquare,
    title: "Product feedback",
    body: "Missing a country, niche or calculator feature? Tell us what you were trying to do and what got in the way.",
    subject: "Feedback",
  },
  {
    icon: Mail,
    title: "Privacy & legal",
    body: "Requests about stored calculation records, or anything else legal. We aim to respond within 30 days.",
    subject: "Privacy",
  },
];

export default function ContactPage() {
  return (
    <ProsePage
      eyebrow={<>Contact</>}
      title={<>Contact <span className="text-yt-gradient">ytcpm.online</span></>}
      lede={<>One inbox handles everything: <a href="mailto:hello@ytcpm.online" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">hello@ytcpm.online</a>.
          Include the page URL and, for data issues, the number you expected.</>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPageSchema({ path: "/contact", name: "Contact ytcpm.online — corrections, feedback and privacy requests", description: "Contact ytcpm.online to report a wrong YouTube CPM or RPM range, request a missing country or niche, send product feedback or make a privacy request.", dateModified: DATA_UPDATED_AT, section: "Contact", about: ["Data corrections", "Product feedback", "Privacy requests"] })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])) }} />

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-fog">
          <h2 className="font-display text-xl font-bold text-heading">What happens after you write</h2>
          <p>
            Every message reaches the same small inbox, so there is no ticketing system to learn and no account to create. A data
            correction is the most useful thing you can send, and the more context you include the faster it can be checked: the exact
            page URL, the number you believe is wrong, the number you expected, the country or niche it applies to, and where your
            figure came from. A Studio screenshot with the report range visible is ideal, but a plain description of the mismatch
            still helps.
          </p>
          <p>
            Corrections that are supported by first-party data are applied to the benchmark and noted on the sources page. If a value
            turns out to be right, we will say so rather than change it. Feature requests for a missing country or niche are read
            against the same data set, so a request that names the audience country and the format you are comparing usually gets
            implemented; a request without that context rarely can be.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-fog">
          <h2 className="font-display text-xl font-bold text-heading">What not to send</h2>
          <p>
            Please do not email passwords, two-factor codes, OAuth tokens, session cookies or unredacted financial statements. We
            cannot use them, they will not be retained, and sending them creates a security risk for you. If a privacy question involves
            data we hold, describe the request and the page it relates to instead of attaching the raw record.
          </p>
          <p>
            We also cannot recover a YouTube channel&apos;s private analytics, impressions, audience-country mix or revenue for you, and
            we do not need your login to help with a calculation question. If the number you are checking comes from the Channel
            Auditor, include the channel URL and what you expected to see, and the limitation that applies will usually be the answer.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-fog">
          <h2 className="font-display text-xl font-bold text-heading">Before you write</h2>
          <p>
            A large share of questions are already answered in the{" "}
            <Link href="/methodology" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">methodology page</Link>,{" "}
            the{" "}
            <Link href="/sources" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">sources and limitations page</Link>{" "}
            and the{" "}
            <Link href="/guides/how-to-check-youtube-cpm" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">guide to checking your own CPM in YouTube Studio</Link>.{" "}
            The{" "}
            <Link href="/channel-auditor" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">Channel Auditor</Link>{" "}
            page also states exactly which figures it can and cannot show for a public channel.
          </p>
        </section>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {CHANNELS.map((c) => (
            <div key={c.title} className="panel p-5">
              <c.icon className="h-4 w-4 text-yt-red" />
              <h2 className="mt-3 text-sm font-bold text-heading">{c.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-fog">{c.body}</p>
              <a
                href={`mailto:hello@ytcpm.online?subject=${encodeURIComponent(`[${c.subject}] ytcpm.online`)}`}
                className="mt-3 inline-block text-xs font-semibold text-yt-red underline decoration-yt-red/30 hover:decoration-yt-red"
              >
                Email about {c.subject.toLowerCase()}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-fog">
          Dataset snapshot {DATA_UPDATED_AT}. We do not run a support phone line or live chat.
        </p>
      </ProsePage>
  );
}
