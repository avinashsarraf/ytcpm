import { desc, eq, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsMedia, type CmsMedia } from "@/db/schema";
import { logOnce } from "@/lib/log";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  deleteFileFromStorage,
  extensionFor,
  readImageDimensions,
  storeFile,
} from "./storage";

/**
 * The media library.
 *
 * Uploads are validated by magic-byte sniffing, not by the browser-supplied
 * content type, so a renamed executable cannot enter the library.
 */

export type MediaListItem = CmsMedia & { uploadedByName: string | null };

export type UploadResult =
  | { ok: true; media: CmsMedia }
  | { ok: false; error: string };

/** Detects an image type from the file header. */
export function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (brand.startsWith("avif") || brand.startsWith("avis") || brand === "mif1") return "image/avif";
  }
  return null;
}

export async function uploadMedia(
  file: File,
  options: { altText?: string; title?: string | null; userId: number | null },
): Promise<UploadResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "The database is not configured." };
  if (!file || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `That image is larger than ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageType(buffer);
  if (!sniffed || !ALLOWED_IMAGE_TYPES[sniffed]) {
    return { ok: false, error: "Only JPEG, PNG, WebP, GIF and AVIF images are accepted." };
  }
  const extension = extensionFor(sniffed);
  if (!extension) return { ok: false, error: "That image type is not supported." };

  const dimensions = readImageDimensions(buffer);

  let stored;
  try {
    stored = await storeFile(buffer, extension);
  } catch (error) {
    logOnce("cms", "media write failed", error);
    return { ok: false, error: "The upload could not be saved. Check the storage directory." };
  }

  try {
    const rows = await db
      .insert(cmsMedia)
      .values({
        filename: file.name?.slice(0, 200) || `upload.${extension}`,
        storageKey: stored.storageKey,
        url: stored.url,
        mimeType: sniffed,
        size: stored.size,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        altText: options.altText ?? "",
        title: options.title ?? null,
        uploadedById: options.userId,
      })
      .returning();
    return { ok: true, media: rows[0] };
  } catch (error) {
    await deleteFileFromStorage(stored.storageKey);
    logOnce("cms", "media insert failed", error);
    return { ok: false, error: "The upload could not be recorded." };
  }
}

export async function listMedia(limit = 100, offset = 0): Promise<MediaListItem[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return await db
      .select({
        id: cmsMedia.id,
        filename: cmsMedia.filename,
        storageKey: cmsMedia.storageKey,
        url: cmsMedia.url,
        mimeType: cmsMedia.mimeType,
        size: cmsMedia.size,
        width: cmsMedia.width,
        height: cmsMedia.height,
        altText: cmsMedia.altText,
        title: cmsMedia.title,
        uploadedById: cmsMedia.uploadedById,
        createdAt: cmsMedia.createdAt,
        uploadedByName: sql<string | null>`(select name from cms_users where id = ${cmsMedia.uploadedById})`,
      })
      .from(cmsMedia)
      .orderBy(desc(cmsMedia.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    logOnce("cms", "media list failed", error);
    return [];
  }
}

export async function countMedia(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  try {
    const rows = await db.select({ id: cmsMedia.id }).from(cmsMedia);
    return rows.length;
  } catch {
    return 0;
  }
}

export async function getMedia(id: number): Promise<CmsMedia | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const rows = await db.select().from(cmsMedia).where(eq(cmsMedia.id, id)).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function updateMedia(
  id: number,
  values: { altText?: string; title?: string | null; filename?: string },
): Promise<CmsMedia | null> {
  if (!isDatabaseConfigured()) return null;
  const patch: Partial<CmsMedia> = {};
  if (values.altText !== undefined) patch.altText = values.altText;
  if (values.title !== undefined) patch.title = values.title;
  if (values.filename !== undefined) patch.filename = values.filename;
  if (!Object.keys(patch).length) return getMedia(id);
  try {
    const rows = await db.update(cmsMedia).set(patch).where(eq(cmsMedia.id, id)).returning();
    return rows[0] ?? null;
  } catch (error) {
    logOnce("cms", "media update failed", error);
    return null;
  }
}

export async function deleteMedia(id: number): Promise<boolean> {
  const media = await getMedia(id);
  if (!media) return false;
  try {
    await db.delete(cmsMedia).where(eq(cmsMedia.id, id));
  } catch (error) {
    logOnce("cms", "media delete failed", error);
    return false;
  }
  await deleteFileFromStorage(media.storageKey);
  return true;
}

/** Media items that are missing alt text — the editor's reminder list. */
export async function mediaWithoutAlt(limit = 50): Promise<MediaListItem[]> {
  const all = await listMedia(200);
  return all.filter((item) => !item.altText.trim()).slice(0, limit);
}
