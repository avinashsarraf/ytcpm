import { NextResponse } from "next/server";
import { db } from "@/db";
import { calculations } from "@/db/schema";
import {
  getCountry, getNiche, getSeason, estimateEarnings, type ContentType,
} from "@/lib/data";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { logOnce } from "@/lib/log";

export const runtime = "nodejs";

interface CalcBody {
  views: number;
  niche: string;
  country: string;
  type: ContentType;
  /** "annual" | "Q1" | "Q2" | "Q3" | "Q4" */
  season?: string;
  /** 0–1 share of views that served an ad */
  monetizedShare?: number;
}

const MAX_BODY_BYTES = 4_096;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const MAX_VIEWS = 1_000_000_000;

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req), RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  let body: CalcBody;
  try {
    body = JSON.parse(raw) as CalcBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const views = Number(body.views);
  const niche = getNiche(String(body.niche ?? ""));
  const country = getCountry(String(body.country ?? ""));
  const type: ContentType = body.type === "shorts" ? "shorts" : "long";
  const seasonKey = typeof body.season === "string" ? body.season : "annual";
  const season = seasonKey === "annual" ? undefined : getSeason(seasonKey);
  const requestedShare = Number(body.monetizedShare ?? 1);
  const monetizedShare = Number.isFinite(requestedShare) ? Math.min(Math.max(requestedShare, 0.05), 1) : 1;

  if (!niche || !country || !Number.isFinite(views) || views < 1000 || views > MAX_VIEWS) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 422 });
  }
  if (seasonKey !== "annual" && !season) {
    return NextResponse.json({ ok: false, error: "Unknown season" }, { status: 422 });
  }

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
