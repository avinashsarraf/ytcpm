import { NextResponse } from "next/server";
import { db } from "@/db";
import { calculations } from "@/db/schema";
import {
  getCountry, getNiche, estimateEarnings, type ContentType,
} from "@/lib/data";

export const runtime = "nodejs";

interface CalcBody {
  views: number;
  niche: string;
  country: string;
  type: ContentType;
}

export async function POST(req: Request) {
  let body: CalcBody;
  try {
    body = (await req.json()) as CalcBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const views = Number(body.views);
  const niche = getNiche(String(body.niche ?? ""));
  const country = getCountry(String(body.country ?? ""));
  const type: ContentType = body.type === "shorts" ? "shorts" : "long";

  if (!niche || !country || !Number.isFinite(views) || views < 1000 || views > 1_000_000_000) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 422 });
  }

  const est = estimateEarnings({ views, niche, country, type });

  try {
    await db.insert(calculations).values({
      views: Math.round(views),
      nicheSlug: niche.slug,
      nicheName: niche.name,
      countrySlug: country.slug,
      countryName: country.name,
      contentType: type,
      rpmLow: est.rpmLow.toFixed(4),
      rpmHigh: est.rpmHigh.toFixed(4),
      estLow: est.monthlyLow.toFixed(2),
      estHigh: est.monthlyHigh.toFixed(2),
    });
  } catch (e) {
    // Logging must never break the tool — return the estimate anyway.
    console.error("[calculate] db insert failed:", e);
    return NextResponse.json({ ok: true, logged: false, estimate: est });
  }

  return NextResponse.json({ ok: true, logged: true, estimate: est });
}
