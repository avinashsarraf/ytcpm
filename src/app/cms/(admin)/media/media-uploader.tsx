"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadMediaAction, type ActionState } from "../../actions";

const INITIAL: ActionState = { ok: false, message: "" };

/** Uploads one image and asks the server to validate it. */
export default function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await uploadMediaAction(previous, formData);
    if (result.ok) {
      setFileName("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
    return result;
  }, INITIAL);

  return (
    <form action={formAction} className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-base font-bold text-heading">Upload an image</h2>
      <p className="mt-1 text-sm text-fog">
        PNG, JPEG, GIF or WebP up to 5 MB. The file type is checked from its contents, not from the name.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="file" className="text-sm font-semibold text-heading">Image file</label>
          <input
            ref={inputRef}
            id="file"
            name="file"
            type="file"
            required
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            className="mt-1.5 block w-full text-sm text-fog file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-yt-dark"
          />
          {fileName ? <p className="mt-1.5 text-xs text-fog">{fileName}</p> : null}
        </div>
        <div>
          <label htmlFor="altText" className="text-sm font-semibold text-heading">Alt text</label>
          <input
            id="altText"
            name="altText"
            maxLength={300}
            placeholder="What the image shows, in one sentence"
            className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
          />
          <p className="mt-1.5 text-xs text-fog">Describe the image for screen readers and for image search.</p>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="title" className="text-sm font-semibold text-heading">Title <span className="font-normal text-fog">(optional)</span></label>
        <input
          id="title"
          name="title"
          maxLength={200}
          placeholder="A short internal name for this file"
          className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
        />
      </div>

      {state.message ? (
        <p role="status" className={`mt-4 rounded-lg px-3.5 py-2.5 text-sm ${state.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-yt-red px-5 text-sm font-bold text-white hover:bg-yt-red-hover disabled:opacity-60">
        {pending ? "Uploading…" : "Upload image"}
      </button>
    </form>
  );
}
