import MetricToolPage from "@/components/metric-tool-page";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("YouTube CPM Calculator — Ad Revenue & Impressions", "Calculate YouTube CPM from gross ad revenue and ad impressions. See the formula, a worked example and how CPM differs from playback-based CPM and RPM.", "/youtube-cpm-calculator");
export default function Page() { return <MetricToolPage metric="CPM" />; }
