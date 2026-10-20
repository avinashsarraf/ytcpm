import type { Metadata } from "next";
import ProsePage from "@/components/prose-page";
import { Mail, MessageSquare, Database } from "lucide-react";
import { DATA_UPDATED_AT } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact ytcpm.online — data corrections, feedback, partnerships and privacy requests.",
  alternates: { canonical: "/contact" },
};

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
      title={<>Get in <span className="text-yt-gradient">touch</span></>}
      lede={<>One inbox handles everything: <a href="mailto:hello@ytcpm.online" className="font-semibold text-heading underline decoration-yt-red/30 hover:decoration-yt-red">hello@ytcpm.online</a>.
          Include the page URL and, for data issues, the number you expected.</>}
    >

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
