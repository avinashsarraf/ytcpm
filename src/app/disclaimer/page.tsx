import LegalPage from "@/components/legal-page";
import { LEGAL_POLICIES } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

const policy = LEGAL_POLICIES[2];
export const metadata = pageMetadata(policy.seoTitle, policy.description, policy.path);
export default function Page() { return <LegalPage policy={policy} />; }
