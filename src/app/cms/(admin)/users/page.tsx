import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsUsers } from "@/db/schema";
import { getCurrentUser } from "@/lib/cms/session";
import { logOnce } from "@/lib/log";
import CmsPageHeader from "../../page-header";
import UserManager, { type UserRow } from "./user-manager";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

async function listUsers(): Promise<UserRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await db.select().from(cmsUsers).orderBy(asc(cmsUsers.name)).limit(100);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    logOnce("cms", "user list failed", error);
    return [];
  }
}

export default async function CmsUsersPage() {
  const [users, user] = await Promise.all([listUsers(), getCurrentUser()]);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title="Users"
        description="Who can publish, and who can change the site settings."
      />
      <UserManager users={users} currentUserId={user?.id ?? 0} />
    </div>
  );
}
