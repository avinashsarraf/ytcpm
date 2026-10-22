"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUserAction, saveUserAction, type ActionState } from "../../actions";

const INITIAL: ActionState = { ok: false, message: "" };

export type UserRow = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

/** Creates accounts, changes roles and removes access. */
export default function UserManager({ users, currentUserId }: { users: UserRow[]; currentUserId: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState<UserRow | null>(null);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await saveUserAction(previous, formData);
    if (result.ok) {
      setEditing(null);
      router.refresh();
    }
    return result;
  }, INITIAL);

  const [deleteState, deleteAction, deleting] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await deleteUserAction(formData);
    if (result.ok) router.refresh();
    return result;
  }, INITIAL);

  const errors = state.fieldErrors ?? {};

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-base font-bold text-heading">Accounts</h2>
        {users.length === 0 ? (
          <p className="mt-3 text-sm text-fog">No accounts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-heading">
                    {user.name}
                    {user.id === currentUserId ? <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-fog">you</span> : null}
                    {!user.isActive ? <span className="ml-2 rounded-full bg-amber-bg px-2 py-0.5 text-[11px] font-bold text-amber">disabled</span> : null}
                  </p>
                  <p className="truncate text-xs text-fog">
                    {user.email} · {user.role}
                    {user.lastLoginAt ? ` · last seen ${new Date(user.lastLoginAt).toLocaleString("en-GB")}` : " · never signed in"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(user)}
                    className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-bold text-heading hover:bg-surface"
                  >
                    Edit
                  </button>
                  {user.id !== currentUserId ? (
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={user.id} />
                      <button type="submit" disabled={deleting} className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-bold text-yt-red underline underline-offset-4 hover:bg-yt-red-bg disabled:opacity-60">
                        Delete
                      </button>
                    </form>
                  ) : null}
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
        <h2 className="text-base font-bold text-heading">{editing ? "Edit account" : "New account"}</h2>
        <p className="mt-1 text-sm text-fog">
          Administrators can manage accounts and settings. Editors can write and publish posts.
        </p>

        <form action={formAction} className="mt-4 space-y-3">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

          <div>
            <label htmlFor="name" className="text-sm font-semibold text-heading">Name</label>
            <input
              id="name"
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
            />
            {errors.name ? <p className="mt-1 text-xs font-semibold text-yt-red">{errors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-semibold text-heading">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={editing?.email ?? ""}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
            />
            {errors.email ? <p className="mt-1 text-xs font-semibold text-yt-red">{errors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="role" className="text-sm font-semibold text-heading">Role</label>
            <select
              id="role"
              name="role"
              defaultValue={editing?.role ?? "editor"}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
            >
              <option value="editor">Editor</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-semibold text-heading">
              Password {editing ? <span className="font-normal text-fog">(leave empty to keep the current one)</span> : null}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required={!editing}
              placeholder="At least 10 characters, mixed"
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
            />
            {errors.password ? <p className="mt-1 text-xs font-semibold text-yt-red">{errors.password}</p> : null}
          </div>

          <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-heading">
            <input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} className="h-4 w-4 rounded border-border" />
            Can sign in
          </label>

          {state.message ? (
            <p role="status" className={`rounded-lg px-3.5 py-2.5 text-sm ${state.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-lg bg-yt-red px-5 text-sm font-bold text-white hover:bg-yt-red-hover disabled:opacity-60">
              {pending ? "Saving…" : editing ? "Save account" : "Create account"}
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
