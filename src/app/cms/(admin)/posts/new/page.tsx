import type { Metadata } from "next";
import Link from "next/link";
import CmsPageHeader from "../../../page-header";
import PostEditor from "../post-editor";

export const metadata: Metadata = { title: "New post" };
export const dynamic = "force-dynamic";

export default function NewPostPage() {
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
      <PostEditor post={null} mode="create" />
    </div>
  );
}
