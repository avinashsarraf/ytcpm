import MetricToolPage from "@/components/metric-tool-page";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("YouTube RPM Calculator — Revenue per 1,000 Views", "Calculate YouTube RPM from creator revenue and matching views. Understand long-form versus Shorts denominators and avoid deducting YouTube's share twice.", "/youtube-rpm-calculator");
export default function Page() { return <MetricToolPage metric="RPM" />; }
