import type { Metadata } from "next";
import Link from "next/link";
import CmsPageHeader from "../../../page-header";
import { listPosts } from "@/lib/cms/posts";
import PostEditor from "../post-editor";

export const metadata: Metadata = { title: "New post" };
export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  // Suggestions for internal links: every published post is a legitimate
  // destination, and a missing internal link blocks publishing.
  const published = await listPosts({ status: "published", limit: 12, order: "updated" });
  const linkTargets = published.map((post) => ({ title: post.title, slug: post.slug }));

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title="New post"
        description="Write the article, then set the search appearance before it goes live."
        actions={
          <Link href="/cms/posts" className="inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-heading hover:bg-surface">
            Back to posts
          </Link>
        }
      />
      <PostEditor post={null} mode="create" linkTargets={linkTargets} />
    </div>
  );
}
