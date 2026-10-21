import LegalPage from "@/components/legal-page";
import { LEGAL_POLICIES, LEGAL_UPDATED } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";
import { LEGAL_PAGE_SEO } from "@/lib/seo-keywords";

const policy = LEGAL_POLICIES[0];
const seo = LEGAL_PAGE_SEO[policy.path];
export const metadata = pageMetadata(policy.seoTitle, policy.description, policy.path, { focus: seo.focus, keywords: seo.keywords, modifiedTime: LEGAL_UPDATED });
export default function Page() { return <LegalPage policy={policy} />; }