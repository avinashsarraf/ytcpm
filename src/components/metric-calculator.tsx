"use client";
import { useState } from "react";
import { parseMetricInput } from "@/lib/metrics";
import { money } from "@/lib/data";

export default function MetricCalculator({ metric }: { metric: "CPM" | "RPM" }) {
  const [revenue, setRevenue] = useState(metric === "CPM" ? "100" : "55");
  const [count, setCount] = useState(metric === "CPM" ? "10000" : "20000");
  const value = parseMetricInput(revenue, count);
  const countLabel = metric === "CPM" ? "Ad impressions" : "Corresponding views";
  const revenueLabel = metric === "CPM" ? "Gross ad revenue / advertiser spend (USD)" : "Creator revenue after revenue sharing (USD)";
  return <section className="card my-6 p-4 sm:p-6" aria-label={`${metric} calculation tool`}>
    <h2 className="text-xl font-bold text-heading">Calculate your {metric}</h2>
    <p className="mt-2 text-sm leading-relaxed">Example inputs are prefilled. Replace them with matching figures from your own report. Results update instantly; inputs stay in your browser.</p>
    <noscript><p className="mt-3 font-semibold text-heading">Enable JavaScript to change the calculation. The formula and worked example below remain available without JavaScript.</p></noscript>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold text-heading">{revenueLabel}<input type="number" inputMode="decimal" min="0" max="1000000000000" step="any" value={revenue} onChange={e => setRevenue(e.target.value)} className="field mt-2" /></label>
      <label className="block text-sm font-semibold text-heading">{countLabel}<input type="number" inputMode="numeric" min="1" max="1000000000000" step="1" value={count} onChange={e => setCount(e.target.value)} className="field mt-2" /></label>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true" className="mt-5 rounded-xl bg-yt-red-light p-4">
      <p className="text-sm font-semibold text-heading">{metric === "CPM" ? "Advertiser cost" : "Creator revenue"} per 1,000 {metric === "CPM" ? "ad impressions" : "corresponding views"}</p>
      <p className="mt-1 break-all text-3xl font-extrabold text-heading">{value === null ? "—" : money(value, 2)}</p>
      {value === null && <p className="mt-2 text-sm text-yt-red">Enter non-negative revenue and a positive whole-number count, each no greater than 1 trillion. A zero count is undefined, not a zero {metric}.</p>}
    </div>
    <p className="mt-3 text-sm leading-relaxed">{metric === "CPM" ? "Do not enter net creator revenue or total video views here. Impression CPM uses gross ad revenue and ad impressions; it is not playback-based CPM." : "Revenue and views must cover the same period, currency and format. Use total long-form video views or the matching engaged-view basis for Shorts. Do not deduct the platform share again."}</p>
  </section>;
}
