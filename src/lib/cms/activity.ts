import { desc, eq, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsActivity, type CmsActivity } from "@/db/schema";
import { logOnce } from "@/lib/log";

/**
 * The activity log.
 *
 * Every administrative mutation writes one row: who did what, to which
 * entity, and when. It is the audit trail that makes a CMS safe to hand to
 * more than one person.
 */

export type ActivityInput = {
  userId: number | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  summary?: string;
  meta?: Record<string, unknown>;
};

export async function recordActivity(input: ActivityInput): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await db.insert(cmsActivity).values({
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId === null || input.entityId === undefined ? null : String(input.entityId),
      summary: input.summary ?? "",
      meta: input.meta ?? null,
    });
  } catch (error) {
    // A failed audit write must never fail the operation it describes.
    logOnce("cms", "activity write failed", error);
  }
}

export async function listActivity(limit = 50): Promise<(CmsActivity & { userName: string | null; userEmail: string | null })[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return await db
      .select({
        id: cmsActivity.id,
        userId: cmsActivity.userId,
        action: cmsActivity.action,
        entity: cmsActivity.entity,
        entityId: cmsActivity.entityId,
        summary: cmsActivity.summary,
        meta: cmsActivity.meta,
        createdAt: cmsActivity.createdAt,
        userName: sql<string | null>`(select name from cms_users where id = ${cmsActivity.userId})`,
        userEmail: sql<string | null>`(select email from cms_users where id = ${cmsActivity.userId})`,
      })
      .from(cmsActivity)
      .orderBy(desc(cmsActivity.createdAt))
      .limit(limit);
  } catch (error) {
    logOnce("cms", "activity read failed", error);
    return [];
  }
}

export async function activityForEntity(entity: string, entityId: string | number, limit = 20) {
  if (!isDatabaseConfigured()) return [];
  try {
    return await db
      .select()
      .from(cmsActivity)
      .where(eq(cmsActivity.entity, entity))
      .orderBy(desc(cmsActivity.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}
