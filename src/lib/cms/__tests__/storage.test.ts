import { describe, expect, it } from "vitest";
import {
  buildStorageKey,
  extensionFor,
  isAllowedImageType,
  mimeForStorageKey,
  publicUrlFor,
  readImageDimensions,
  resolveStoragePath,
  safeFilename,
  STORAGE_DIR,
} from "@/lib/cms/storage";
import { sniffImageType } from "@/lib/cms/media";

/**
 * Storage is the one place a user-supplied name becomes a filesystem path, so
 * the traversal guard is pinned here.
 */
describe("resolveStoragePath", () => {
  it("resolves a normal key inside the storage directory", () => {
    const target = resolveStoragePath("2026/10/abc.png");
    expect(target).not.toBeNull();
    expect(target?.startsWith(STORAGE_DIR)).toBe(true);
  });

  it("refuses to escape the storage directory", () => {
    expect(resolveStoragePath("../secret.txt")).toBeNull();
    expect(resolveStoragePath("2026/../../secret.txt")).toBeNull();
    expect(resolveStoragePath("..")).toBeNull();
  });

  it("refuses an absolute path", () => {
    expect(resolveStoragePath("/etc/passwd")).toBeNull();
  });

  it("refuses a NUL byte and an empty key", () => {
    expect(resolveStoragePath("a\u0000b.png")).toBeNull();
    expect(resolveStoragePath("")).toBeNull();
  });
});

describe("safeFilename", () => {
  it("strips directory components", () => {
    expect(safeFilename("../../etc/passwd")).toBe("passwd");
    expect(safeFilename("/absolute/name.png")).toBe("name.png");
  });

  it("keeps a usable name", () => {
    expect(safeFilename("My Photo (1).png")).toBe("My-Photo-1-.png");
    expect(safeFilename("")).toBe("upload");
  });
});

describe("storage keys and URLs", () => {
  it("builds a dated random key", () => {
    const key = buildStorageKey("png");
    expect(key).toMatch(/^\d{4}\/\d{2}\/[a-f0-9]{24}\.png$/);
    expect(buildStorageKey("png")).not.toBe(key);
  });

  it("builds a public URL under /media", () => {
    expect(publicUrlFor("2026/10/abc.png")).toBe("/media/2026/10/abc.png");
  });

  it("maps the MIME type from the extension", () => {
    expect(mimeForStorageKey("a/b.png")).toBe("image/png");
    expect(mimeForStorageKey("a/b.jpg")).toBe("image/jpeg");
    expect(mimeForStorageKey("a/b.webp")).toBe("image/webp");
    expect(mimeForStorageKey("a/b.bin")).toBe("application/octet-stream");
  });

  it("allows only image types", () => {
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("image/svg+xml")).toBe(false);
    expect(isAllowedImageType("text/html")).toBe(false);
    expect(extensionFor("image/jpeg")).toBe("jpg");
    expect(extensionFor("image/gif")).toBe("gif");
  });
});

describe("image sniffing and dimensions", () => {
  it("detects a PNG by its magic bytes", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
    expect(sniffImageType(png)).toBe("image/png");
  });

  it("detects a JPEG by its magic bytes", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffImageType(jpeg)).toBe("image/jpeg");
  });

  it("detects a GIF by its magic bytes", () => {
    const gif = Buffer.from("GIF89a........", "ascii");
    expect(sniffImageType(gif)).toBe("image/gif");
  });

  it("rejects a file that only claims to be an image", () => {
    const html = Buffer.from("<!doctype html><html><body>not an image</body></html>", "ascii");
    expect(sniffImageType(html)).toBeNull();
  });

  it("reads PNG dimensions from the header", () => {
    const png = Buffer.alloc(30);
    png.write("PNG", 1, "ascii");
    png.writeUInt32BE(1200, 16);
    png.writeUInt32BE(630, 20);
    expect(readImageDimensions(png)).toMatchObject({ width: 1200, height: 630, type: "png" });
  });

  it("returns null for an unknown format", () => {
    expect(readImageDimensions(Buffer.from("nothing to see here", "ascii"))).toBeNull();
  });
});
