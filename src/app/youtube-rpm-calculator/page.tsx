import MetricToolPage from "@/components/metric-tool-page";
import { pageMetadata } from "@/lib/seo";
import { STATIC_PAGE_SEO } from "@/lib/seo-keywords";
const seo = STATIC_PAGE_SEO["/youtube-rpm-calculator"];
export const metadata = pageMetadata(
  "YouTube RPM Calculator — Revenue per 1K Views",
  "Calculate YouTube RPM from creator revenue and matching views. Understand long-form versus Shorts denominators and avoid deducting YouTube's share twice.",
  "/youtube-rpm-calculator",
  { focus: seo.focus, keywords: seo.keywords, category: "finance" },
);
export default function Page() { return <MetricToolPage metric="RPM" />; }
