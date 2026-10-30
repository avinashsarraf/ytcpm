/**
 * Site analytics, and every third-party origin the site loads.
 *
 * A Content Security Policy has to allow a script in two places: `script-src`
 * to download it, `connect-src` to let it report. Miss either and the only
 * visible symptom is silence — a blocked download leaves an empty dashboard
 * and, if the script came from the edge, a console error the owner never sees.
 * So this module is the single list, `next.config.ts` builds the policy from it,
 * and a test checks the header that is actually served.
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

/**
 * Cloudflare Web Analytics, injected by the edge rather than by this code.
 *
 * The deploy sits behind Cloudflare, and with Web Analytics enabled on the zone
 * Cloudflare appends `beacon.min.js` to the HTML as it leaves the edge. Nothing
 * in this repository can remove that script, so the choice is to allow the two
 * origins or to ship a page that logs a CSP violation on every single visit —
 * which is what Lighthouse scored 92 on Best Practices for.
 *
 * Two origins, not one: the script is served from `static.cloudflareinsights.com`
 * and the beacon it sends goes to `cloudflareinsights.com`. Allowing only the
 * first would still block the report.
 *
 * If Web Analytics is switched off in the Cloudflare dashboard, this entry is
 * simply unused. Both are listed in one place so the policy stays auditable.
 */
export const CLOUDFLARE_INSIGHTS = {
  scriptOrigin: "https://static.cloudflareinsights.com",
  beaconOrigin: "https://cloudflareinsights.com",
} as const;

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
/**
 * Every third-party origin the policy has to allow, split by the directive that
 * needs it. `next.config.ts` builds the Content Security Policy from these
 * lists so a new integration cannot be added without its allowance, and the
 * analytics test asserts each entry is present in the header actually served.
 */
export const THIRD_PARTY_ORIGINS = {
  /** Scripts the browser must be allowed to download. */
  scripts: [AHREFS_ANALYTICS.origin, CLOUDFLARE_INSIGHTS.scriptOrigin],
  /** Endpoints those scripts report back to. */
  connect: [AHREFS_ANALYTICS.origin, CLOUDFLARE_INSIGHTS.beaconOrigin],
} as const;

export function analyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AHREFS_ANALYTICS !== "off";
}
