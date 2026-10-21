import { asc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsSettings } from "@/db/schema";
import { logOnce } from "@/lib/log";
import { SETTING_DEFAULTS, type CmsSettingKey, type CmsSettings } from "./settings-schema";

/**
 * Site settings edited from /cms/settings.
 *
 * Stored as key/value rows so a new setting never needs a migration. Defaults
 * live here, so a missing row is never a failure.
 */

export { SETTING_DEFAULTS, SETTING_LABELS, type CmsSettingKey, type CmsSettings } from "./settings-schema";

export async function getSettings(): Promise<CmsSettings> {
  const values = { ...SETTING_DEFAULTS } as CmsSettings;
  if (!isDatabaseConfigured()) return values;
  try {
    const rows = await db.select().from(cmsSettings).orderBy(asc(cmsSettings.key));
    for (const row of rows) {
      if (row.key in SETTING_DEFAULTS) {
        values[row.key as CmsSettingKey] = row.value;
      }
    }
  } catch (error) {
    logOnce("cms", "settings read failed", error);
  }
  return values;
}

/** Reads a single setting. */
export async function getSetting(key: CmsSettingKey): Promise<string> {
  if (!isDatabaseConfigured()) return SETTING_DEFAULTS[key];
  try {
    const rows = await db.select().from(cmsSettings).where(eq(cmsSettings.key, key)).limit(1);
    return rows[0]?.value ?? SETTING_DEFAULTS[key];
  } catch {
    return SETTING_DEFAULTS[key];
  }
}

/** Writes a setting (upsert). */
export async function setSetting(key: CmsSettingKey, value: string): Promise<void> {
  if (!isDatabaseConfigured()) throw new Error("The database is not configured.");
  await db
    .insert(cmsSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: cmsSettings.key, set: { value, updatedAt: new Date() } });
}

/** Writes many settings in one transaction. */
export async function setSettings(values: Partial<Record<CmsSettingKey, string>>): Promise<void> {
  if (!isDatabaseConfigured()) throw new Error("The database is not configured.");
  const entries = Object.entries(values) as [CmsSettingKey, string][];
  for (const [key, value] of entries) {
    await setSetting(key, value);
  }
}
