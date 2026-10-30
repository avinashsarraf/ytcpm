import { mkdir, writeFile, readFile, unlink, stat } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { logOnce } from "@/lib/log";

/**
 * Media storage.
 *
 * Uploads are written outside `public/` and served through a route handler, so
 * the storage directory can live on a mounted volume and survive a container
 * replacement. Files are stored under a random key with the original
 * extension; the original name is kept in the database.
 *
 * `CMS_STORAGE_DIR` controls where files land. In production, point it at a
 * persistent volume — otherwise uploads disappear on the next deploy.
 */

export const STORAGE_DIR = process.env.CMS_STORAGE_DIR ?? path.join(process.cwd(), "storage", "uploads");
export const PUBLIC_MEDIA_PREFIX = "/media";

export const MAX_UPLOAD_BYTES = Number(process.env.CMS_MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024);

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function extensionFor(mimeType: string): string | null {
  return ALLOWED_IMAGE_TYPES[mimeType.toLowerCase()] ?? null;
}

export function isAllowedImageType(mimeType: string): boolean {
  return Boolean(extensionFor(mimeType));
}

/** Strips directory components and anything unsafe from a client filename. */
export function safeFilename(name: string): string {
  return path
    .basename(name)
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(0, 120) || "upload";
}

/** A random storage key: `2026/10/<random>.<ext>`. */
export function buildStorageKey(extension: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const name = `${randomBytes(12).toString("hex")}.${extension}`;
  return `${year}/${month}/${name}`;
}

/** The public URL for a storage key. */
export function publicUrlFor(storageKey: string): string {
  return `${PUBLIC_MEDIA_PREFIX}/${storageKey}`;
}

/**
 * Resolves a storage key to an absolute path, refusing anything that escapes
 * the storage directory. This is the single guard against path traversal.
 */
export function resolveStoragePath(storageKey: string): string | null {
  if (!storageKey) return null;
  if (storageKey.includes("\0")) return null;
  if (path.isAbsolute(storageKey)) return null;
  const normalised = path.normalize(storageKey);
  if (normalised.startsWith("..") || normalised.includes(`..${path.sep}`)) return null;
  // The storage root comes from the environment so it can live on a mounted
  // volume; the ignore comment keeps the bundler from tracing the project.
  const root = path.resolve(/*turbopackIgnore: true*/ STORAGE_DIR);
  const target = path.resolve(root, normalised);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  return target;
}

export type StoredFile = { storageKey: string; url: string; size: number };

/** Writes a buffer to the storage directory. */
export async function storeFile(buffer: Buffer, extension: string): Promise<StoredFile> {
  const storageKey = buildStorageKey(extension);
  const target = resolveStoragePath(storageKey);
  if (!target) throw new Error("Invalid storage key.");
  // Both calls need the ignore comment: without it the bundler traces the
  // path into the build output and the file never reaches the storage
  // directory that the media route reads from.
  await mkdir(/*turbopackIgnore: true*/ path.dirname(target), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ target, buffer, { mode: 0o644 });
  return { storageKey, url: publicUrlFor(storageKey), size: buffer.byteLength };
}

/** Reads a stored file. Returns null when it does not exist. */
export async function readFileFromStorage(storageKey: string): Promise<Buffer | null> {
  const target = resolveStoragePath(storageKey);
  if (!target) return null;
  try {
    // The path is resolved at runtime from a database value, so the bundler
    // cannot scope it — the ignore comment keeps it from tracing the project.
    return await readFile(/*turbopackIgnore: true*/ target);
  } catch (error) {
    logOnce("cms", "media read failed", error);
    return null;
  }
}

/** Deletes a stored file. Missing files are not an error. */
export async function deleteFileFromStorage(storageKey: string): Promise<boolean> {
  const target = resolveStoragePath(storageKey);
  if (!target) return false;
  try {
    await unlink(/*turbopackIgnore: true*/ target);
    return true;
  } catch {
    return false;
  }
}

export async function fileSize(storageKey: string): Promise<number> {
  const target = resolveStoragePath(storageKey);
  if (!target) return 0;
  try {
    const info = await stat(/*turbopackIgnore: true*/ target);
    return info.size;
  } catch {
    return 0;
  }
}

/* ── image dimensions ───────────────────────────────────────────────────── */

/**
 * Reads the pixel dimensions of an image from its header.
 *
 * PNG, JPEG, GIF and WebP are supported — no image library needed. Returns
 * null for an unknown format.
 */
export function readImageDimensions(buffer: Buffer): { width: number; height: number; type: string } | null {
  // PNG
  if (buffer.length > 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), type: "png" };
  }

  // GIF
  if (buffer.length > 10 && buffer.toString("ascii", 0, 3) === "GIF") {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8), type: "gif" };
  }

  // WebP
  if (buffer.length > 30 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const format = buffer.toString("ascii", 12, 16);
    if (format === "VP8 ") {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff, type: "webp" };
    }
    if (format === "VP8L") {
      const bits = buffer.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1, type: "webp" };
    }
    if (format === "VP8X") {
      const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
      const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
      return { width, height, type: "webp" };
    }
    return null;
  }

  // JPEG
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      // SOF0..SOF15, excluding DHT (c4), JPG (c8) and DAC (cc)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7), type: "jpeg" };
      }
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) return null;
      offset += 2 + length;
    }
  }

  return null;
}

/** The MIME type to serve a stored file with. */
export function mimeForStorageKey(storageKey: string): string {
  const extension = path.extname(storageKey).toLowerCase();
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}
