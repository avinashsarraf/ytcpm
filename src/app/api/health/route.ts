import { db } from "@/db";
import { isDatabaseConfigured } from "@/db";
import { sql } from "drizzle-orm";
import { logOnce } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };

  if (!isDatabaseConfigured()) {
    return Response.json(
      { ok: false, database: "not_configured" },
      { status: 503, headers }
    );
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: "up" }, { headers });
  } catch (error) {
    logOnce("health", "database unreachable", error);
    return Response.json({ ok: false, database: "down" }, { status: 503, headers });
  }
}
