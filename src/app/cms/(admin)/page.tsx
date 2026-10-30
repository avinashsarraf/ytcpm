import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsPosts, cmsUsers } from "@/db/schema";
import { listPosts, countPosts } from "@/lib/cms/posts";
import { countComments } from "@/lib/cms/comments";
import { countMedia } from "@/lib/cms/media";
import { listActivity } from "@/lib/cms/activity";
import { pruneExpiredSessions } from "@/lib/cms/session";
import { getCurrentUser } from "@/lib/cms/session";
import { analyzePost } from "@/lib/cms/seo";
import CmsPageHeader from "../page-header";
import CmsStat from "../stat";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}

export default async function CmsDashboardPage() {
  const user = await getCurrentUser();
  await pruneExpiredSessions();

  const [published, drafts, scheduled, pendingComments, mediaCount, activity, recent] = await Promise.all([
    countPosts({ status: "published" }),
    countPosts({ status: "draft" }),
    countPosts({ status: "scheduled" }),
    countComments("pending"),
    countMedia(),
    listActivity(8),
    listPosts({ limit: 6, order: "updated" }),
  ]);

  // Posts that are published but would fail a blocking SEO check.
  const candidates = await listPosts({ status: "published", limit: 100 });
  const needsAttention = candidates
    .map((post) => ({
      post,
      report: analyzePost({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentMd: post.contentMd,
        focusKeyword: post.focusKeyword,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        seoKeywords: post.seoKeywords,
        ogImageUrl: post.ogImageUrl,
        ogImageAlt: post.ogImageAlt,
        canonicalUrl: post.canonicalUrl,
        noindex: post.noindex,
      }),
    }))
    .filter((entry) => entry.report.blocking.length > 0)
    .slice(0, 5);

  const totalPosts = published + drafts + scheduled;

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title="Dashboard"
        description={`Signed in as ${user?.name ?? "editor"}.`}
        actions={
          <Link href="/cms/posts/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-yt-red px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-yt-red-hover">
            New post
          </Link>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CmsStat label="Published posts" value={published} href="/cms/posts?status=published" />
        <CmsStat label="Drafts" value={drafts} href="/cms/posts?status=draft" />
        <CmsStat label="Scheduled" value={scheduled} href="/cms/posts?status=scheduled" />
        <CmsStat label="Pending comments" value={pendingComments} href="/cms/comments" tone={pendingComments > 0 ? "warn" : "default"} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-heading">Recent posts</h2>
            <Link href="/cms/posts" className="text-sm font-semibold text-yt-red underline underline-offset-4">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-fog">
              No posts yet. <Link href="/cms/posts/new" className="font-semibold text-yt-red underline underline-offset-4">Write the first one</Link>.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {recent.map((post) => (
                <li key={post.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/cms/posts/${post.id}`} className="block truncate text-sm font-semibold text-heading hover:text-yt-red">{post.title}</Link>
                    <p className="mt-0.5 text-xs text-fog">/{post.slug} · {post.status} · updated {formatDate(post.updatedAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${post.status === "published" ? "bg-mint-bg text-mint" : post.status === "scheduled" ? "bg-blue-bg text-blue" : "bg-surface text-fog"}`}>
                    {post.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-base font-bold text-heading">Site at a glance</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fog">Total posts</dt>
              <dd className="font-semibold text-heading">{totalPosts}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fog">Media files</dt>
              <dd className="font-semibold text-heading">{mediaCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fog">Comments awaiting review</dt>
              <dd className="font-semibold text-heading">{pendingComments}</dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fog">Quick actions</h3>
            <ul className="mt-2 space-y-1">
              {[
                { href: "/cms/posts/new", label: "Write a new post" },
                { href: "/cms/media", label: "Upload an image" },
                { href: "/cms/comments", label: "Review comments" },
                { href: "/cms/redirects", label: "Manage redirects" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-10 items-center text-sm font-semibold text-yt-red underline underline-offset-4">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {needsAttention.length ? (
        <section className="mt-5 rounded-xl border border-amber/30 bg-amber-bg/40 p-5">
          <h2 className="text-base font-bold text-heading">Published posts with blocking SEO issues</h2>
          <p className="mt-1 text-sm text-fog">These pages are live but would fail a publish check. Fix them so the post matches the quality bar.</p>
          <ul className="mt-4 space-y-2">
            {needsAttention.map(({ post, report }) => (
              <li key={post.id} className="rounded-lg border border-border bg-white p-4">
                <Link href={`/cms/posts/${post.id}`} className="text-sm font-semibold text-heading hover:text-yt-red">{post.title}</Link>
                <ul className="mt-2 space-y-1">
                  {report.blocking.map((check) => (
                    <li key={check.id} className="text-xs text-yt-red">• {check.label}: {check.detail}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-5 rounded-xl border border-border bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-heading">Recent activity</h2>
          <Link href="/cms/activity" className="text-sm font-semibold text-yt-red underline underline-offset-4">Full log</Link>
        </div>
        {activity.length === 0 ? (
          <p className="mt-4 text-sm text-fog">No activity recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {activity.map((entry) => (
              <li key={entry.id} className="py-2.5 text-sm">
                <span className="font-semibold text-heading">{entry.userName ?? "Someone"}</span>{" "}
                <span className="text-fog">{entry.summary || entry.action}</span>{" "}
                <span className="text-xs text-fog">· {formatDate(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
