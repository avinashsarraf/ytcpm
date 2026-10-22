import MetricToolPage from "@/components/metric-tool-page";
import { pageMetadata } from "@/lib/seo";
import { STATIC_PAGE_SEO } from "@/lib/seo-keywords";
const seo = STATIC_PAGE_SEO["/youtube-cpm-calculator"];
export const metadata = pageMetadata(
  "YouTube CPM Calculator — Ad Revenue",
  "Calculate YouTube CPM from gross ad revenue and ad impressions. See the formula, a worked example and how CPM differs from playback-based CPM and RPM.",
  "/youtube-cpm-calculator",
  { focus: seo.focus, keywords: seo.keywords, category: "finance" },
);
export default function Page() { return <MetricToolPage metric="CPM" />; }
