import { NextResponse } from "next/server";
import { db } from "@/db";
import { calculations } from "@/db/schema";
import {
  estimateEarnings,
} from "@/lib/data";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { logOnce } from "@/lib/log";

export const runtime = "nodejs";

import { readLimitedJson, validateCalculation } from "@/lib/calculate-input";

const MAX_BODY_BYTES = 4_096;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req), RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const parsed = await readLimitedJson(req, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.status === 413 ? "Payload too large" : "Invalid JSON" }, { status: parsed.status });
  }
  const input = validateCalculation(parsed.value);
  if (!input) return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 422 });
  const { views, niche, country, type, season, monetizedShare } = input;

  const est = estimateEarnings({
    views,
    niche,
    country,
    type,
    season: season?.mult ?? 1,
    monetizedShare,
  });

  const payload = { ok: true, logged: false, estimate: est };

  try {
    await db.insert(calculations).values({
      views: Math.round(views),
      nicheSlug: niche.slug,
      nicheName: niche.name,
      countrySlug: country.slug,
      countryName: country.name,
      contentType: type,
      season: season?.q ?? "annual",
      monetizedShare: monetizedShare.toFixed(3),
      rpmLow: est.rpmLow.toFixed(4),
      rpmHigh: est.rpmHigh.toFixed(4),
      estLow: est.monthlyLow.toFixed(2),
      estHigh: est.monthlyHigh.toFixed(2),
    });
  } catch (error) {
    // Logging must never break the tool — return the estimate anyway.
    logOnce("calculate", "db insert failed", error);
    return NextResponse.json(payload, { headers: { "X-RateLimit-Remaining": String(limit.remaining) } });
  }

  return NextResponse.json(
    { ...payload, logged: true },
    { headers: { "X-RateLimit-Remaining": String(limit.remaining) } }
  );
}
