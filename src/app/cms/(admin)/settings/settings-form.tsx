"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction, saveSettingsAction, type ActionState } from "../../actions";
import { SETTING_LABELS, type CmsSettingKey } from "@/lib/cms/settings-schema";

const INITIAL: ActionState = { ok: false, message: "" };

const SETTING_KEYS = Object.keys(SETTING_LABELS) as CmsSettingKey[];

export type SettingsValues = Record<string, string>;

/** The site settings form plus the password change form. */
export default function SettingsForm({ values }: { values: SettingsValues }) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await saveSettingsAction(previous, formData);
    if (result.ok) router.refresh();
    return result;
  }, INITIAL);

  const [passwordState, passwordAction, passwordPending] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await changePasswordAction(previous, formData);
    if (result.ok) router.refresh();
    return result;
  }, INITIAL);

  const passwordErrors = passwordState.fieldErrors ?? {};

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-base font-bold text-heading">Site settings</h2>
        <p className="mt-1 text-sm text-fog">These values feed the blog index, the article pages and the structured data.</p>

        <form action={formAction} className="mt-5 space-y-5">
          {SETTING_KEYS.map((key) => {
            const meta = SETTING_LABELS[key];
            const value = values[key] ?? "";
            return (
              <div key={key}>
                <label htmlFor={key} className="text-sm font-semibold text-heading">{meta.label}</label>
                <p className="mt-0.5 text-xs text-fog">{meta.help}</p>
                {meta.type === "textarea" ? (
                  <textarea
                    id={key}
                    name={key}
                    rows={4}
                    defaultValue={value}
                    className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
                  />
                ) : meta.type === "boolean" ? (
                  <label className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-heading">
                    <input type="checkbox" name={key} defaultChecked={value === "true"} className="h-4 w-4 rounded border-border" />
                    Enabled
                  </label>
                ) : meta.type === "secret" ? (
                  <input
                    id={key}
                    name={key}
                    type="password"
                    defaultValue={value}
                    placeholder="Unchanged — type a new value to replace it"
                    className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
                  />
                ) : (
                  <input
                    id={key}
                    name={key}
                    defaultValue={value}
                    className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
                  />
                )}
              </div>
            );
          })}

          {state.message ? (
            <p role="status" className={`rounded-lg px-3.5 py-2.5 text-sm ${state.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
              {state.message}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-lg bg-yt-red px-5 text-sm font-bold text-white hover:bg-yt-red-hover disabled:opacity-60">
            {pending ? "Saving…" : "Save settings"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-base font-bold text-heading">Your password</h2>
        <p className="mt-1 text-sm text-fog">Changing your password signs out every other device, including this one.</p>

        <form action={passwordAction} className="mt-4 space-y-3">
          <div>
            <label htmlFor="currentPassword" className="text-sm font-semibold text-heading">Current password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
            />
            {passwordErrors.currentPassword ? <p className="mt-1 text-xs font-semibold text-yt-red">{passwordErrors.currentPassword}</p> : null}
          </div>
          <div>
            <label htmlFor="newPassword" className="text-sm font-semibold text-heading">New password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="At least 10 characters, mixed"
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
            />
            {passwordErrors.newPassword ? <p className="mt-1 text-xs font-semibold text-yt-red">{passwordErrors.newPassword}</p> : null}
          </div>

          {passwordState.message ? (
            <p role="status" className={`rounded-lg px-3.5 py-2.5 text-sm ${passwordState.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
              {passwordState.message}
            </p>
          ) : null}

          <button type="submit" disabled={passwordPending} className="inline-flex min-h-11 items-center rounded-lg bg-navy px-5 text-sm font-bold text-white hover:bg-yt-dark disabled:opacity-60">
            {passwordPending ? "Changing…" : "Change password"}
          </button>
        </form>
      </section>
    </div>
  );
}
