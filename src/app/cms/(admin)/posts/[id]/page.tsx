import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostById, listRevisions } from "@/lib/cms/posts";
import { previewPath } from "@/lib/cms/preview";
import CmsPageHeader from "../../../page-header";
import PostEditor from "../post-editor";
import PostActions from "../post-actions";

export const metadata: Metadata = { title: "Edit post" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditPostPage({ params }: { params: Params }) {
  const { id } = await params;
  const postId = Number.parseInt(id, 10);
  if (!Number.isFinite(postId) || postId <= 0) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  const revisions = await listRevisions(postId);
  // A draft has no public URL; a signed link lets the author see the real page.
  const preview = post.status === "published" ? null : previewPath(post.slug);

  const editorPost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    subtitle: post.subtitle,
    excerpt: post.excerpt,
    contentMd: post.contentMd,
    status: post.status,
    category: post.category,
    tags: post.tags ?? [],
    focusKeyword: post.focusKeyword,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    seoKeywords: post.seoKeywords ?? [],
    ogImageUrl: post.ogImageUrl,
    ogImageAlt: post.ogImageAlt,
    canonicalUrl: post.canonicalUrl,
    noindex: post.noindex,
    allowIndex: post.allowIndex,
    template: post.template,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    scheduledFor: post.scheduledFor ? post.scheduledFor.toISOString() : null,
    updatedAt: post.updatedAt.toISOString(),
  };

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title={post.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">/blog/{post.slug}</code>
            <span>· {post.status}</span>
            {post.status === "published" ? (
              <Link href={`/blog/${post.slug}`} className="font-semibold text-yt-red underline underline-offset-4">
                View the live page
              </Link>
            ) : null}
            {preview ? (
              <a href={preview} target="_blank" rel="noreferrer" className="font-semibold text-yt-red underline underline-offset-4">
                Preview the real page
              </a>
            ) : null}
          </span>
        }
        actions={
          <Link href="/cms/posts" className="inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-heading hover:bg-surface">
            Back to posts
          </Link>
        }
      />

      {/* The key changes with the post, so the editor picks up a restored or
          reloaded version instead of keeping the state it started with. */}
      <PostEditor key={editorPost.updatedAt} post={editorPost} mode="edit" />

      <section className="mt-8 max-w-[680px] rounded-xl border border-border bg-white p-5">
        <h2 className="text-base font-bold text-heading">Publishing controls</h2>
        <p className="mt-1 text-sm text-fog">
          Changing the state here runs the same checks as the editor. A post with a blocking SEO issue cannot be published.
        </p>
        <div className="mt-4">
          <PostActions
            postId={post.id}
            status={post.status}
            revisions={revisions.map((revision) => ({
              id: revision.id,
              title: revision.title,
              reason: revision.reason,
              createdAt: revision.createdAt.toISOString(),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
