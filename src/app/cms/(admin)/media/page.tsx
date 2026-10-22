import type { Metadata } from "next";
import { countMedia, listMedia, mediaUsage, mediaWithoutAlt } from "@/lib/cms/media";
import CmsPageHeader from "../../page-header";
import MediaUploader from "./media-uploader";
import MediaItem from "./media-item";

export const metadata: Metadata = { title: "Media" };
export const dynamic = "force-dynamic";

export default async function CmsMediaPage() {
  const [items, total, missingAlt, usage] = await Promise.all([
    listMedia(120),
    countMedia(),
    mediaWithoutAlt(20),
    mediaUsage(),
  ]);
  const inUse = [...usage.values()].filter((count) => count > 0).length;

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title="Media library"
        description={`${total} file${total === 1 ? "" : "s"} stored · ${inUse} in use. An image that a post references cannot be deleted until it is removed from that post.`}
      />

      <div className="mt-6">
        <MediaUploader />
      </div>

      {missingAlt.length ? (
        <section className="mt-5 rounded-xl border border-amber/30 bg-amber-bg/40 p-5">
          <h2 className="text-base font-bold text-heading">{missingAlt.length} image{missingAlt.length === 1 ? "" : "s"} still need alt text</h2>
          <p className="mt-1 text-sm text-fog">Alt text is read by screen readers and used by image search. Add it to the file details.</p>
          <ul className="mt-3 space-y-1 text-sm text-heading">
            {missingAlt.map((item) => (
              <li key={item.id} className="truncate">{item.filename}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-sm font-semibold text-heading">No media yet.</p>
          <p className="mt-1 text-sm text-fog">Upload an image above to use it in a post.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <MediaItem
              key={item.id}
              item={{
                id: item.id,
                filename: item.filename,
                url: item.url,
                altText: item.altText,
                title: item.title,
                mimeType: item.mimeType,
                size: item.size,
                width: item.width,
                height: item.height,
                usedIn: usage.get(item.url) ?? 0,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
