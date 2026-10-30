import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/cms/session";
import { isDatabaseConfigured } from "@/db";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (isDatabaseConfigured()) {
    const user = await getCurrentUser();
    if (user) redirect("/cms");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1626] px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-white p-7 shadow-[0_24px_60px_-24px_rgba(11,22,38,0.45)] sm:p-8">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-yt-red text-base font-black text-white">C</span>
          <h1 className="mt-5 text-2xl font-bold text-heading">Content manager</h1>
          <p className="mt-2 text-sm leading-6 text-fog">Sign in to publish posts, manage media and edit the site settings.</p>

          {isDatabaseConfigured() ? (
            <LoginForm />
          ) : (
            <p className="mt-8 rounded-lg bg-amber-bg px-4 py-3 text-sm text-amber">
              The database is not configured, so sign-in is disabled. Set <code className="font-mono">DATABASE_URL</code> and run the migrations.
            </p>
          )}

          <p className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-xs leading-6 text-fog">
            <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
            Sessions are stored server-side as a hash. Repeated failed attempts are rate limited.
          </p>
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">
          <Link href="/" className="underline underline-offset-4 hover:text-white">← Back to ytcpm.online</Link>
        </p>
      </div>
    </div>
  );
}
