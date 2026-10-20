import { getCountry, getNiche, getSeason, type ContentType } from "./data";
import { MAX_VIEWS } from "./calculator";

/** Validate untrusted JSON without coercing null, arrays, booleans or strings. */
export function validateCalculation(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.views !== "number" || !Number.isSafeInteger(body.views) || body.views < 0 || body.views > MAX_VIEWS) return null;
  const niche = typeof body.niche === "string" ? getNiche(body.niche) : undefined;
  const country = typeof body.country === "string" ? getCountry(body.country) : undefined;
  if (!niche || !country || (body.type !== "long" && body.type !== "shorts")) return null;
  const seasonKey = body.season ?? "annual";
  if (typeof seasonKey !== "string") return null;
  const season = seasonKey === "annual" ? undefined : getSeason(seasonKey);
  if (seasonKey !== "annual" && !season) return null;
  const monetizedShare = body.monetizedShare === undefined ? 1 : body.monetizedShare;
  if (typeof monetizedShare !== "number" || !Number.isFinite(monetizedShare) || monetizedShare < 0 || monetizedShare > 1) return null;
  return { views: body.views, niche, country, type: body.type as ContentType, season, monetizedShare };
}

/** Bound actual bytes read, including chunked requests without Content-Length. */
export async function readLimitedJson(req: Request, maxBytes: number): Promise<
  { ok: true; value: unknown } | { ok: false; status: 400 | 413 }
> {
  const reader = req.body?.getReader();
  if (!reader) return { ok: false, status: 400 };
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}
