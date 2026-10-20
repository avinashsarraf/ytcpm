/** Report-based metric: never infer advertiser CPM from creator net revenue. */
export function metricPerThousand(revenue: number, count: number): number | null {
  if (!Number.isFinite(revenue) || revenue < 0 || revenue > 1e12 || !Number.isSafeInteger(count) || count <= 0 || count > 1e12) return null;
  const result = revenue / count * 1000;
  return Number.isFinite(result) ? result : null;
}
export function parseMetricInput(revenue: string, count: string) {
  if (!revenue.trim() || !count.trim()) return null;
  return metricPerThousand(Number(revenue), Number(count));
}
