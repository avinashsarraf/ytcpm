import type { ReactNode } from "react";

/**
 * Shared shell for the editorial pages (about, methodology, privacy, terms,
 * contact).
 *
 * The masthead and its gradient run the full viewport width so the page reads
 * as full-bleed, while the body keeps a readable measure — at 1760px a 100%
 * text column would put ~170 characters on a line, which is unreadable. The
 * body is centred rather than boxed, so the surrounding space is deliberate
 * instead of looking like a narrow template.
 */
export default function ProsePage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 blob-pink" aria-hidden />

      <header className="relative border-b border-border bg-gradient-to-b from-yt-red-light/70 via-white to-white pb-9 pt-10 sm:pb-10 sm:pt-14 lg:pt-16">
        <div className="shell">
          <p className="tag-red w-fit text-[11px]">{eyebrow}</p>
          <h1 className="display-2 mt-4 max-w-[26ch]">{title}</h1>
          {lede ? <p className="lede mt-4 max-w-3xl">{lede}</p> : null}
        </div>
      </header>

      <div className="shell py-10 lg:py-12">
        <div className="mx-auto w-full max-w-[82ch]">{children}</div>
      </div>
    </article>
  );
}
