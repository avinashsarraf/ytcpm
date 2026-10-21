import type { Metadata } from "next";
import { isDatabaseConfigured } from "@/db";

export const metadata: Metadata = {
  title: { default: "Content manager", template: "%s | ytcpm.online CMS" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const dynamic = "force-dynamic";

/**
 * The CMS root layout.
 *
 * It only carries the metadata and the "no database" state. The session guard
 * lives in the `(admin)` group layout, so the sign-in page can be rendered
 * for a visitor who is not signed in.
 */
export default function CmsLayout({ children }: { children: React.ReactNode }) {
  if (!isDatabaseConfigured()) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0b1626] px-5 py-14 text-slate-300">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] sm:p-8">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-yt-red text-base font-black text-white">C</span>
          <h1 className="mt-5 text-2xl font-bold text-white">The database is not connected</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The content manager stores every post, image and setting in PostgreSQL. The public site keeps working without it — only the
            CMS and the usage monitor are unavailable.
          </p>
          <ol className="mt-6 space-y-3 text-sm leading-6">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">1</span>
              <span>
                Set <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white">DATABASE_URL</code> to your PostgreSQL
                connection string.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">2</span>
              <span>
                Apply the migrations with <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white">npm run db:migrate</code>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">3</span>
              <span>
                Create the first administrator with{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white">npm run db:seed-admin</code>.
              </span>
            </li>
          </ol>
          <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-slate-400">
            Full setup instructions are in <code className="font-mono text-slate-300">docs/cms.md</code> and{" "}
            <code className="font-mono text-slate-300">deployment.md</code>.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
