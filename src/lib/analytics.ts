/**
 * Site analytics.
 *
 * One tag, one key, one origin — because the Content Security Policy has to
 * allow the same origin in two places. Without `script-src` the browser never
 * downloads the file; without `connect-src` it downloads it and then throws
 * away every measurement. Either way the only visible symptom is an empty
 * dashboard, so `next.config.ts` imports this module instead of repeating the
 * hostname, and a test asserts both directives carry it.
 *
 * The key is public by design: it ships in page HTML on every request, the same
 * way a Google Analytics measurement ID does. It identifies the site, not the
 * visitor, and is not a credential.
 *
 * Detection of a missing script is a deployment check, not a code check: after
 * the first deploy, open / in an incognito window with DevTools, confirm the
 * request to analytics.ahrefs.com returns 200, and use "Recheck installation"
 * in the Ahrefs dashboard.
 */

export const AHREFS_ANALYTICS = {
  /** Public site key from the Ahrefs project settings. */
  key: "tBXJgyQQ8HCIgU0SEGJXMA",
  /** The script URL Ahrefs ships for direct installation. */
  scriptSrc: "https://analytics.ahrefs.com/analytics.js",
  /** The origin allowed in `script-src` and `connect-src`. */
  origin: "https://analytics.ahrefs.com",
} as const;

/**
 * Whether the tag is emitted at all.
 *
 * On by default: the site owner asked for it, and a script that only loads in
 * an environment somebody remembered to configure is the failure mode that
 * produces three months of empty reports. Set `NEXT_PUBLIC_AHREFS_ANALYTICS=off`
 * to build without it — useful for a fork that wants no third-party calls.
 *
 * Note that this is read at build time, because the layout is statically
 * rendered. Changing it requires a rebuild, which is the correct behaviour for
 * something that must appear in the served HTML.
 */
export function analyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AHREFS_ANALYTICS !== "off";
}
