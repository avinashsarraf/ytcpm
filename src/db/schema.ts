import { pgTable, serial, integer, text, numeric, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Every calculator run is logged here — this powers the /monitor dashboard
 * (usage analytics, popular niches/countries, daily volume).
 */
export const calculations = pgTable(
  "calculations",
  {
    id: serial("id").primaryKey(),
    views: integer("views").notNull(),
    nicheSlug: text("niche_slug").notNull(),
    nicheName: text("niche_name").notNull(),
    countrySlug: text("country_slug").notNull(),
    countryName: text("country_name").notNull(),
    contentType: text("content_type").notNull().default("long"),
    rpmLow: numeric("rpm_low", { precision: 10, scale: 4 }).notNull(),
    rpmHigh: numeric("rpm_high", { precision: 10, scale: 4 }).notNull(),
    estLow: numeric("est_low", { precision: 12, scale: 2 }).notNull(),
    estHigh: numeric("est_high", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("calculations_created_idx").on(t.createdAt),
    index("calculations_niche_idx").on(t.nicheSlug),
    index("calculations_country_idx").on(t.countrySlug),
  ]
);

export type Calculation = typeof calculations.$inferSelect;
export type NewCalculation = typeof calculations.$inferInsert;
