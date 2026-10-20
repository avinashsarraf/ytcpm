CREATE TABLE "calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"views" integer NOT NULL,
	"niche_slug" text NOT NULL,
	"niche_name" text NOT NULL,
	"country_slug" text NOT NULL,
	"country_name" text NOT NULL,
	"content_type" text DEFAULT 'long' NOT NULL,
	"season" text DEFAULT 'annual' NOT NULL,
	"monetized_share" numeric(4, 3) DEFAULT '1.000' NOT NULL,
	"rpm_low" numeric(10, 4) NOT NULL,
	"rpm_high" numeric(10, 4) NOT NULL,
	"est_low" numeric(12, 2) NOT NULL,
	"est_high" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "calculations_created_idx" ON "calculations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "calculations_niche_idx" ON "calculations" USING btree ("niche_slug");--> statement-breakpoint
CREATE INDEX "calculations_country_idx" ON "calculations" USING btree ("country_slug");--> statement-breakpoint
CREATE INDEX "calculations_type_idx" ON "calculations" USING btree ("content_type");