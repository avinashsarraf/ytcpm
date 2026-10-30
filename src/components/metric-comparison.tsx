/** Visible semantic HTML: no client fetch or chart is needed to read the definitions. */
export default function MetricComparison() {
  return <section className="my-7" aria-labelledby="metric-comparison-heading">
    <h2 id="metric-comparison-heading" className="text-xl font-bold text-heading">CPM, playback-based CPM and RPM at a glance</h2>
    <div className="table-scroll mt-4 rounded-xl border border-border" role="region" aria-label="Metric comparison table" tabIndex={0}>
      <table className="w-full text-left text-sm leading-relaxed">
        <caption className="sr-only">Metric numerator, denominator and revenue-share basis. Match the report period and currency for every calculation.</caption>
        <thead className="bg-surface text-heading"><tr><th scope="col" className="p-3">Metric</th><th scope="col" className="p-3">Numerator</th><th scope="col" className="p-3">Denominator</th><th scope="col" className="p-3">Revenue-share basis</th></tr></thead>
        <tbody className="divide-y divide-border">
          <tr><th scope="row" className="p-3 text-heading">CPM</th><td className="p-3">Gross ad revenue / advertiser spend</td><td className="p-3">Ad impressions</td><td className="p-3">Before sharing</td></tr>
          <tr><th scope="row" className="p-3 text-heading">Playback-based CPM</th><td className="p-3">Gross ad revenue / advertiser spend</td><td className="p-3">Monetized playbacks</td><td className="p-3">Before sharing</td></tr>
          <tr><th scope="row" className="p-3 text-heading">RPM</th><td className="p-3">Creator revenue in the report</td><td className="p-3">All video views; engaged views for Shorts RPM</td><td className="p-3">After sharing</td></tr>
        </tbody>
      </table>
    </div>
    <p className="mt-2 text-sm">Each ratio is multiplied by 1,000. <a href="https://support.google.com/youtube/answer/9314357?hl=en" className="font-semibold text-yt-red underline">Source: YouTube ad revenue analytics</a>.</p>
  </section>;
}
