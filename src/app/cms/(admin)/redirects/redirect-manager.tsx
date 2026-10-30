"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRedirectAction, saveRedirectAction, type ActionState } from "../../actions";

const INITIAL: ActionState = { ok: false, message: "" };

export type RedirectRow = {
  id: number;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  hits: number;
};

/** The redirect editor — one row per rule, plus the add form. */
export default function RedirectManager({ redirects }: { redirects: RedirectRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<RedirectRow | null>(null);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await saveRedirectAction(previous, formData);
    if (result.ok) {
      setEditing(null);
      router.refresh();
    }
    return result;
  }, INITIAL);

  const [deleteState, deleteAction, deleting] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await deleteRedirectAction(formData);
    if (result.ok) router.refresh();
    return result;
  }, INITIAL);

  const errors = state.fieldErrors ?? {};

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-base font-bold text-heading">Existing rules</h2>
        {redirects.length === 0 ? (
          <p className="mt-3 text-sm text-fog">No redirects yet. Add one on the right.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {redirects.map((rule) => (
              <li key={rule.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-heading">{rule.fromPath}</p>
                  <p className="truncate font-mono text-xs text-fog">
                    → {rule.toPath} · {rule.statusCode} · {rule.hits} hit{rule.hits === 1 ? "" : "s"}
                    {!rule.isActive ? <span className="ml-2 font-sans font-bold text-amber">inactive</span> : null}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(rule)}
                    className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-bold text-heading hover:bg-surface"
                  >
                    Edit
                  </button>
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={rule.id} />
                    <button type="submit" disabled={deleting} className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-bold text-yt-red underline underline-offset-4 hover:bg-yt-red-bg disabled:opacity-60">
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        {deleteState.message ? (
          <p role="status" className={`mt-3 rounded-lg px-3.5 py-2.5 text-sm ${deleteState.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
            {deleteState.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-base font-bold text-heading">{editing ? "Edit redirect" : "Add a redirect"}</h2>
        <p className="mt-1 text-sm text-fog">
          Redirects are applied by the request proxy. A rule that is inactive is stored but not used.
        </p>

        <form action={formAction} className="mt-4 space-y-3">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

          <div>
            <label htmlFor="fromPath" className="text-sm font-semibold text-heading">From</label>
            <input
              id="fromPath"
              name="fromPath"
              required
              defaultValue={editing?.fromPath ?? ""}
              placeholder="/old-page"
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 font-mono text-sm text-heading outline-none focus:border-yt-red"
            />
            {errors.fromPath ? <p className="mt-1 text-xs font-semibold text-yt-red">{errors.fromPath}</p> : null}
          </div>

          <div>
            <label htmlFor="toPath" className="text-sm font-semibold text-heading">To</label>
            <input
              id="toPath"
              name="toPath"
              required
              defaultValue={editing?.toPath ?? ""}
              placeholder="/new-page"
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 font-mono text-sm text-heading outline-none focus:border-yt-red"
            />
            {errors.toPath ? <p className="mt-1 text-xs font-semibold text-yt-red">{errors.toPath}</p> : null}
          </div>

          <div>
            <label htmlFor="statusCode" className="text-sm font-semibold text-heading">Status code</label>
            <select
              id="statusCode"
              name="statusCode"
              defaultValue={String(editing?.statusCode ?? 301)}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
            >
              <option value="301">301 — permanent</option>
              <option value="302">302 — temporary</option>
              <option value="307">307 — temporary (method preserving)</option>
              <option value="308">308 — permanent (method preserving)</option>
            </select>
          </div>

          <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-heading">
            <input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} className="h-4 w-4 rounded border-border" />
            Use this rule
          </label>

          {state.message ? (
            <p role="status" className={`rounded-lg px-3.5 py-2.5 text-sm ${state.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-lg bg-yt-red px-5 text-sm font-bold text-white hover:bg-yt-red-hover disabled:opacity-60">
              {pending ? "Saving…" : editing ? "Save changes" : "Add redirect"}
            </button>
            {editing ? (
              <button type="button" onClick={() => setEditing(null)} className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-bold text-heading hover:bg-surface">
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
