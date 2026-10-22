import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/cms/session";
import CmsShell from "../cms-shell";

export const dynamic = "force-dynamic";

/**
 * The guarded admin layout.
 *
 * Every page inside `(admin)` requires a session. The guard is repeated inside
 * every server action, so a page being reachable is never the thing that
 * protects a write.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/cms/login");
  return <CmsShell user={user}>{children}</CmsShell>;
}
