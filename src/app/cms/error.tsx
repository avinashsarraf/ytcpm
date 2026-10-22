"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * The error boundary for the admin.
 *
 * Without this, anything that throws inside `/cms` lands on the public error
 * page, complete with the marketing header — which reads as though the whole
 * site is down. This keeps the reader inside the admin and offers the two
 * things that actually help: try again, or go back to the dashboard.
 */
export default function CmsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[cms] page error", error.message, error.digest ?? "");
  }, [error]);

  return (
    <div className="px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-yt-red-bg">
          <AlertTriangle className="h-5 w-5 text-yt-red" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-heading">This screen could not load</h1>
        <p className="mt-2 text-sm leading-6 text-fog">
          The CMS hit an unexpected problem. Nothing was saved or deleted by this request. Try
          again, and if it keeps happening check that the database is reachable.
        </p>
        {error.digest ? <p className="mt-3 font-mono text-[11px] text-fog/70">Reference: {error.digest}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-yt-red px-5 text-sm font-bold text-white hover:bg-yt-red-hover"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </button>
          <Link
            href="/cms"
            className="inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-5 text-sm font-semibold text-heading hover:bg-surface"
          >
            Back to the dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
