CREATE TYPE "public"."cms_comment_status" AS ENUM('pending', 'approved', 'spam');--> statement-breakpoint
CREATE TYPE "public"."cms_post_status" AS ENUM('draft', 'published', 'scheduled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."cms_user_role" AS ENUM('admin', 'editor');--> statement-breakpoint
CREATE TABLE "cms_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"summary" text DEFAULT '' NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"author_email" text NOT NULL,
	"body" text NOT NULL,
	"status" "cms_comment_status" DEFAULT 'pending' NOT NULL,
	"moderated_at" timestamp with time zone,
	"moderated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"alt_text" text DEFAULT '' NOT NULL,
	"title" text,
	"uploaded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"excerpt" text DEFAULT '' NOT NULL,
	"content_md" text DEFAULT '' NOT NULL,
	"content_html" text DEFAULT '' NOT NULL,
	"status" "cms_post_status" DEFAULT 'draft' NOT NULL,
	"author_id" integer NOT NULL,
	"category" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"focus_keyword" text,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"og_image_url" text,
	"og_image_alt" text,
	"canonical_url" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"allow_index" boolean DEFAULT true NOT NULL,
	"template" text DEFAULT 'article' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"hits" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"title" text NOT NULL,
	"content_md" text NOT NULL,
	"reason" text DEFAULT 'edit' NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "cms_user_role" DEFAULT 'editor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"token_version" integer DEFAULT 1 NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cms_activity" ADD CONSTRAINT "cms_activity_user_id_cms_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cms_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_comments" ADD CONSTRAINT "cms_comments_post_id_cms_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."cms_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_comments" ADD CONSTRAINT "cms_comments_moderated_by_id_cms_users_id_fk" FOREIGN KEY ("moderated_by_id") REFERENCES "public"."cms_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_media" ADD CONSTRAINT "cms_media_uploaded_by_id_cms_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."cms_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_posts" ADD CONSTRAINT "cms_posts_author_id_cms_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."cms_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_revisions_post_id_cms_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."cms_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_revisions_created_by_id_cms_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."cms_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_sessions" ADD CONSTRAINT "cms_sessions_user_id_cms_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cms_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cms_activity_created_idx" ON "cms_activity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cms_activity_user_idx" ON "cms_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cms_comments_post_idx" ON "cms_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "cms_comments_status_idx" ON "cms_comments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_media_storage_idx" ON "cms_media" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "cms_media_created_idx" ON "cms_media" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_posts_slug_idx" ON "cms_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cms_posts_status_idx" ON "cms_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cms_posts_published_idx" ON "cms_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "cms_posts_category_idx" ON "cms_posts" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_redirects_from_idx" ON "cms_redirects" USING btree ("from_path");--> statement-breakpoint
CREATE INDEX "cms_revisions_post_idx" ON "cms_revisions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "cms_sessions_user_idx" ON "cms_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cms_sessions_expiry_idx" ON "cms_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_users_email_idx" ON "cms_users" USING btree (lower("email"));