import Link from "next/link";

/**
 * Direct answers to the "how much does YouTube pay for N views" family.
 *
 * Search Console showed the views-to-money page carrying seventeen query
 * variants at an average position of 37. Two different intents were pulling on
 * it: people who want to *convert* a view count, and people asking *how much
 * does YouTube pay for 1,000 views*. The calculator answers the first; this
 * block answers the second in the exact words people search with.
 *
 * The numbers are arithmetic on an assumed RPM, not a payout rate, and the copy
 * says so on every row group — the site's standing rule is that no estimate
 * appears without the assumption that produced it.
 */

const RPMS = [0.5, 1, 2, 3, 5, 10];

function money(value: number): string {
  if (value >= 100) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(3)}`;
}

export default function ViewsToMoneyAnswers() {
  return (
    <section id="pay-per-1000-views" className="scroll-mt-24">
      <h2 className="text-xl font-bold leading-snug text-heading">How much does YouTube pay for 1,000 views?</h2>
      <p className="mt-3 max-w-[78ch] text-sm leading-8 text-fog">
        There is no single figure. 1,000 views pay whatever your creator RPM says they pay: divide the RPM by
        1,000 to get the payment for one view, then multiply back. At a hypothetical $3 RPM, 1,000 views is
        $3. At $10 RPM it is $10. The RPM is the variable that matters, and it comes from your own report — the
        rates below are arithmetic on an assumption, not a platform rate.
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border" role="region" aria-label="Earnings per 1,000 views at different creator RPMs" tabIndex={0}>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Hypothetical creator earnings for 1,000 views at six assumed creator RPM values
          </caption>
          <thead className="bg-surface text-heading">
            <tr>
              <th scope="col" className="whitespace-nowrap p-3">Assumed RPM</th>
              {RPMS.map((rpm) => (
                <th key={rpm} scope="col" className="whitespace-nowrap p-3">${rpm.toFixed(2).replace(/\.00$/, "")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <th scope="row" className="p-3 font-medium text-heading">1,000 views</th>
              {RPMS.map((rpm) => (
                <td key={rpm} className="whitespace-nowrap p-3 num-mono">{money(rpm)}</td>
              ))}
            </tr>
            <tr className="border-t border-border bg-[#fcfcfd]">
              <th scope="row" className="p-3 font-medium text-heading">Per single view</th>
              {RPMS.map((rpm) => (
                <td key={rpm} className="whitespace-nowrap p-3 num-mono text-fog">{money(rpm / 1000)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs leading-6 text-fog">
        Hypothetical scenarios for a matching long-form RPM. Shorts use a different pooled system, and memberships,
        Premium and sponsorships are not included unless your RPM already contains them.
      </p>

      <h3 className="mt-8 text-lg font-bold text-heading">What about 100,000 views or a million?</h3>
      <p className="mt-2 max-w-[78ch] text-sm leading-8 text-fog">
        It scales linearly with views, so the same RPM applies: 100,000 views at $3 RPM is $300, and 1,000,000
        views at $3 RPM is $3,000. Use the calculator above for any other count, and read the{" "}
        <Link href="/guides/youtube-earnings-per-1000-views" className="font-semibold text-yt-red underline underline-offset-4">
          per-1,000-views guide
        </Link>{" "}
        for why a channel&rsquo;s own RPM rarely matches a published benchmark. If you want to go the other way — from
        a revenue target to the views it needs — the{" "}
        <Link href="/youtube-revenue-goal-calculator" className="font-semibold text-yt-red underline underline-offset-4">
          revenue goal calculator
        </Link>{" "}
        does that.
      </p>
    </section>
  );
}
