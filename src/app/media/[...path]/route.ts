import { mimeForStorageKey, readFileFromStorage, resolveStoragePath } from "@/lib/cms/storage";

export const dynamic = "force-dynamic";

/**
 * GET /media/<year>/<month>/<file>
 *
 * Serves an uploaded image. The files live outside `public/` so the storage
 * directory can be a mounted volume that survives a container replacement.
 *
 * The path is resolved through `resolveStoragePath`, which refuses anything
 * that would escape the storage directory.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const storageKey = (segments ?? []).join("/");

  const resolved = resolveStoragePath(storageKey);
  if (!resolved) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const buffer = await readFileFromStorage(storageKey);
  if (!buffer) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": mimeForStorageKey(storageKey),
      "Content-Length": String(buffer.byteLength),
      // Uploaded images never change under the same name, so they can be
      // cached hard by the browser and the CDN.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
