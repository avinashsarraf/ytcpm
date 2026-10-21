"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMediaAction, updateMediaAction, type ActionState } from "../../actions";

const INITIAL: ActionState = { ok: false, message: "" };

/**
 * One media card. The alt text is editable in place, because an image without
 * alt text is an accessibility and ranking problem the moment it is used.
 */
export default function MediaItem({
  item,
}: {
  item: {
    id: number;
    filename: string;
    url: string;
    altText: string;
    title: string | null;
    mimeType: string;
    size: number;
    width: number | null;
    height: number | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await updateMediaAction(previous, formData);
    if (result.ok) {
      setOpen(false);
      router.refresh();
    }
    return result;
  }, INITIAL);

  const [deleteState, deleteAction, deleting] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await deleteMediaAction(formData);
    if (result.ok) router.refresh();
    return result;
  }, INITIAL);

  const kb = item.size > 1024 * 1024 ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(item.size / 1024))} KB`;

  return (
    <li className="rounded-xl border border-border bg-white p-4">
      <div className="aspect-[3/2] w-full overflow-hidden rounded-lg bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.altText || item.filename} width={item.width ?? 600} height={item.height ?? 400} loading="lazy" className="h-full w-full object-cover" />
      </div>

      <p className="mt-3 truncate text-sm font-semibold text-heading" title={item.filename}>{item.filename}</p>
      <p className="mt-0.5 text-xs text-fog">
        {item.width && item.height ? `${item.width}×${item.height} · ` : ""}{kb} · {item.mimeType.replace("image/", "")}
      </p>

      {item.altText ? (
        <p className="mt-2 line-clamp-2 rounded-lg bg-surface px-2.5 py-2 text-xs text-fog">{item.altText}</p>
      ) : (
        <p className="mt-2 rounded-lg bg-amber-bg px-2.5 py-2 text-xs font-semibold text-amber">Alt text is missing — add it before using this image.</p>
      )}

      {open ? (
        <form action={formAction} className="mt-3 space-y-2 border-t border-border pt-3">
          <input type="hidden" name="id" value={item.id} />
          <div>
            <label htmlFor={`alt-${item.id}`} className="text-xs font-bold uppercase tracking-wider text-fog">Alt text</label>
            <textarea
              id={`alt-${item.id}`}
              name="altText"
              rows={2}
              maxLength={300}
              defaultValue={item.altText}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-heading outline-none focus:border-yt-red"
            />
          </div>
          <div>
            <label htmlFor={`title-${item.id}`} className="text-xs font-bold uppercase tracking-wider text-fog">Title</label>
            <input
              id={`title-${item.id}`}
              name="title"
              maxLength={200}
              defaultValue={item.title ?? ""}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-heading outline-none focus:border-yt-red"
            />
          </div>
          {state.message ? (
            <p role="status" className={`rounded-lg px-3 py-2 text-xs ${state.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>{state.message}</p>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="inline-flex min-h-10 items-center rounded-lg bg-navy px-4 text-sm font-bold text-white hover:bg-yt-dark disabled:opacity-60">
              {pending ? "Saving…" : "Save details"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-heading hover:bg-surface">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-xs font-bold text-heading hover:bg-surface">
            Edit details
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(item.url)}
            className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-xs font-bold text-heading hover:bg-surface"
          >
            Copy URL
          </button>
        </div>
      )}

      <form action={deleteAction} className="mt-2">
        <input type="hidden" name="id" value={item.id} />
        <button type="submit" disabled={deleting} className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-bold text-yt-red underline underline-offset-4 hover:bg-yt-red-bg disabled:opacity-60">
          {deleting ? "Deleting…" : "Delete file"}
        </button>
        {deleteState.message ? (
          <p role="status" className={`mt-2 rounded-lg px-3 py-2 text-xs ${deleteState.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>{deleteState.message}</p>
        ) : null}
      </form>
    </li>
  );
}
