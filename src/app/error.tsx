"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] unhandled error", error.message, error.digest ?? "");
  }, [error]);

  return (
    <section className="relative overflow-hidden pt-32 sm:pt-40">
      <div className="relative mx-auto max-w-2xl px-4 pb-16 text-center sm:px-6">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-yt-red-bg">
          <AlertTriangle className="h-5 w-5 text-yt-red" />
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-fog">
          The page failed to render. The calculator itself usually keeps working — try again, or head back to the home page.
        </p>
        {error.digest && <p className="num-mono mt-3 text-[11px] text-fog/70">Reference: {error.digest}</p>}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-yt-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-yt-red-hover"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link href="/" className="group inline-flex items-center gap-2 rounded-full border-2 border-border bg-white px-6 py-2.5 text-sm font-semibold text-heading transition-colors hover:border-yt-red hover:text-yt-red">
            Go home <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
