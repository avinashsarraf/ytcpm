import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsRedirects } from "@/db/schema";
import { logOnce } from "@/lib/log";
import CmsPageHeader from "../../page-header";
import RedirectManager, { type RedirectRow } from "./redirect-manager";

export const metadata: Metadata = { title: "Redirects" };
export const dynamic = "force-dynamic";

async function listRedirects(): Promise<RedirectRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await db.select().from(cmsRedirects).orderBy(desc(cmsRedirects.updatedAt)).limit(200);
    return rows.map((row) => ({
      id: row.id,
      fromPath: row.fromPath,
      toPath: row.toPath,
      statusCode: row.statusCode,
      isActive: row.isActive,
      hits: Number(row.hits),
    }));
  } catch (error) {
    logOnce("cms", "redirect list failed", error);
    return [];
  }
}

export default async function CmsRedirectsPage() {
  const redirects = await listRedirects();

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title="Redirects"
        description="Move an old URL to a new one without losing the link. Use 301 for a permanent move."
      />
      <RedirectManager redirects={redirects} />
    </div>
  );
}
