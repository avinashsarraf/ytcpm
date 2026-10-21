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
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 bg-[#0b1626] px-6 text-center text-slate-300">
        <h1 className="text-2xl font-bold text-white">The database is not connected</h1>
        <p className="leading-relaxed">
          The content manager stores everything in PostgreSQL. Set{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">DATABASE_URL</code> and run the migrations, then reload this page.
        </p>
        <p className="text-sm text-slate-400">The public site keeps working without it — only the CMS and the usage monitor are unavailable.</p>
      </div>
    );
  }

  return <>{children}</>;
}
