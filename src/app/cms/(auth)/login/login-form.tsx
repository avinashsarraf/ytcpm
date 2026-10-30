"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, type ActionState } from "../../actions";

/**
 * The sign-in form.
 *
 * Errors are returned as data (not thrown), so a failed sign-in keeps the
 * email address and explains what went wrong.
 */
export default function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const result = await loginAction(previous, formData);
      if (result.ok && result.redirectTo) {
        router.replace(result.redirectTo);
        router.refresh();
      }
      return result;
    },
    { ok: false, message: "" },
  );

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-heading">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-yt-red"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold text-heading">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-yt-red"
        />
      </div>

      {state.message ? (
        <p role="alert" className="rounded-lg bg-yt-red-bg px-4 py-3 text-sm font-medium text-yt-red">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-yt-red px-5 text-sm font-bold text-white transition-colors hover:bg-yt-red-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
