/**
 * Input validation for every CMS write path.
 *
 * Hand-rolled on purpose: the project ships no validation dependency, and a
 * small, explicit set of rules is easier to audit than a schema library.
 * Every validator returns a discriminated result so a form can show the exact
 * field that failed.
 */

export type FieldErrors = Record<string, string>;

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

export const LIMITS = {
  title: 140,
  subtitle: 200,
  excerpt: 320,
  seoTitle: 70,
  seoDescription: 180,
  focusKeyword: 90,
  slug: 80,
  content: 400_000,
  tags: 12,
  keywordList: 20,
  body: 5_000,
  name: 80,
  email: 200,
  passwordMin: 10,
  passwordMax: 200,
  category: 60,
  altText: 300,
  commentBody: 4_000,
  fromPath: 300,
  toPath: 500,
  settingValue: 20_000,
} as const;

export function asString(value: FormDataEntryValue | null | undefined): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : "";
}

export function asTrimmed(value: FormDataEntryValue | null | undefined): string {
  return asString(value).trim();
}

export function asOptionalString(value: FormDataEntryValue | null | undefined): string | null {
  const trimmed = asTrimmed(value);
  return trimmed ? trimmed : null;
}

export function asInt(value: FormDataEntryValue | null | undefined, fallback = 0): number {
  const parsed = Number.parseInt(asTrimmed(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function asBool(value: FormDataEntryValue | null | undefined): boolean {
  const raw = asTrimmed(value).toLowerCase();
  return raw === "on" || raw === "true" || raw === "1" || raw === "yes";
}

/** Splits a comma or newline separated list into a clean, de-duplicated array. */
export function asList(value: FormDataEntryValue | null | undefined, max: number = LIMITS.keywordList): string[] {
  const raw = asTrimmed(value);
  if (!raw) return [];
  const parts = raw
    .split(/[,\n]/)
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(part);
    if (out.length >= max) break;
  }
  return out;
}

export function isEmail(value: string): boolean {
  if (!value || value.length > LIMITS.email) return false;
  // Deliberately permissive: reject obvious mistakes, never reject a valid
  // address because a provider uses an unusual TLD.
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value);
}

export function isSafePath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;
  if (/\.\./.test(value)) return false;
  if (value.includes("\n") || value.includes("\r")) return false;
  return true;
}

/** Password strength: length plus a mix of character classes. */
export function validatePassword(value: string): string | null {
  if (value.length < LIMITS.passwordMin) return `Use at least ${LIMITS.passwordMin} characters.`;
  if (value.length > LIMITS.passwordMax) return `Use at most ${LIMITS.passwordMax} characters.`;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
  if (classes < 3) return "Mix upper case, lower case, numbers or symbols.";
  return null;
}

/** Normalises a tag to a lowercase, URL-safe token. */
export function normalizeTag(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export type PostInput = {
  title: string;
  subtitle: string | null;
  excerpt: string;
  contentMd: string;
  status: "draft" | "published" | "scheduled" | "archived";
  category: string | null;
  tags: string[];
  focusKeyword: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  ogImageUrl: string | null;
  ogImageAlt: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  allowIndex: boolean;
  template: "article" | "landing";
  slug: string;
  scheduledFor: string | null;
  publishedAt: string | null;
};

const STATUSES = new Set(["draft", "published", "scheduled", "archived"]);

/**
 * Validates the post editor form. The slug is checked here so a bad URL can
 * never reach the database.
 */
export function validatePostInput(form: FormData): ValidationResult<PostInput> {
  const errors: FieldErrors = {};
  const title = asTrimmed(form.get("title"));
  const contentMd = asString(form.get("contentMd"));
  const status = asTrimmed(form.get("status")) || "draft";
  const slug = asTrimmed(form.get("slug"));

  if (!title) errors.title = "A title is required.";
  else if (title.length > LIMITS.title) errors.title = `Keep the title under ${LIMITS.title} characters.`;

  if (!contentMd.trim()) errors.contentMd = "The article body cannot be empty.";
  else if (contentMd.length > LIMITS.content) errors.contentMd = "The article body is too long.";

  if (!STATUSES.has(status)) errors.status = "Unknown status.";

  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens only.";
  } else if (slug.length > LIMITS.slug) {
    errors.slug = `Keep the slug under ${LIMITS.slug} characters.`;
  }

  const canonicalUrl = asOptionalString(form.get("canonicalUrl"));
  if (canonicalUrl && !/^https?:\/\//i.test(canonicalUrl)) {
    errors.canonicalUrl = "The canonical URL must start with https://";
  }

  const ogImageUrl = asOptionalString(form.get("ogImageUrl"));
  if (ogImageUrl && !/^(https?:\/\/|\/)/.test(ogImageUrl)) {
    errors.ogImageUrl = "Use an absolute URL or a path starting with /.";
  }

  const seoTitle = asOptionalString(form.get("seoTitle"));
  if (seoTitle && seoTitle.length > LIMITS.seoTitle) errors.seoTitle = `Keep the SEO title under ${LIMITS.seoTitle} characters.`;

  const seoDescription = asOptionalString(form.get("seoDescription"));
  if (seoDescription && seoDescription.length > LIMITS.seoDescription) {
    errors.seoDescription = `Keep the meta description under ${LIMITS.seoDescription} characters.`;
  }

  const scheduledFor = asOptionalString(form.get("scheduledFor"));
  if (status === "scheduled" && !scheduledFor) {
    errors.scheduledFor = "Pick a publish date for a scheduled post.";
  } else if (scheduledFor && Number.isNaN(Date.parse(scheduledFor))) {
    errors.scheduledFor = "That publish date is not a valid date.";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      title,
      subtitle: asOptionalString(form.get("subtitle")),
      excerpt: asTrimmed(form.get("excerpt")),
      contentMd,
      status: status as PostInput["status"],
      category: asOptionalString(form.get("category")),
      tags: asList(form.get("tags"), LIMITS.tags).map(normalizeTag).filter(Boolean),
      focusKeyword: asOptionalString(form.get("focusKeyword")),
      seoTitle,
      seoDescription,
      seoKeywords: asList(form.get("seoKeywords")),
      ogImageUrl,
      ogImageAlt: asOptionalString(form.get("ogImageAlt")),
      canonicalUrl,
      noindex: asBool(form.get("noindex")),
      allowIndex: asBool(form.get("allowIndex")),
      template: asTrimmed(form.get("template")) === "landing" ? "landing" : "article",
      slug,
      scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      publishedAt: asOptionalString(form.get("publishedAt")),
    },
  };
}

export type UserInput = { name: string; email: string; role: "admin" | "editor"; password: string | null };

export function validateUserInput(form: FormData, { requirePassword }: { requirePassword: boolean }): ValidationResult<UserInput> {
  const errors: FieldErrors = {};
  const name = asTrimmed(form.get("name"));
  const email = asTrimmed(form.get("email")).toLowerCase();
  const role = asTrimmed(form.get("role")) === "admin" ? "admin" : "editor";
  const password = asOptionalString(form.get("password"));

  if (!name) errors.name = "A name is required.";
  else if (name.length > LIMITS.name) errors.name = `Keep the name under ${LIMITS.name} characters.`;

  if (!email) errors.email = "An email address is required.";
  else if (!isEmail(email)) errors.email = "That does not look like a valid email address.";

  if (requirePassword) {
    if (!password) errors.password = "A password is required.";
    else {
      const problem = validatePassword(password);
      if (problem) errors.password = problem;
    }
  } else if (password) {
    const problem = validatePassword(password);
    if (problem) errors.password = problem;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, email, role, password } };
}

export type RedirectInput = { fromPath: string; toPath: string; statusCode: number; isActive: boolean };

export function validateRedirectInput(form: FormData): ValidationResult<RedirectInput> {
  const errors: FieldErrors = {};
  const fromPath = asTrimmed(form.get("fromPath"));
  const toPath = asTrimmed(form.get("toPath"));
  const statusCode = asInt(form.get("statusCode"), 301);

  if (!fromPath) errors.fromPath = "A source path is required.";
  else if (!isSafePath(fromPath)) errors.fromPath = "The source must be a path that starts with /.";
  else if (fromPath.length > LIMITS.fromPath) errors.fromPath = "That source path is too long.";

  if (!toPath) errors.toPath = "A destination is required.";
  else if (!isSafePath(toPath) && !/^https?:\/\//i.test(toPath)) {
    errors.toPath = "Use a path that starts with / or an absolute https:// URL.";
  } else if (toPath.length > LIMITS.toPath) errors.toPath = "That destination is too long.";

  if (![301, 302, 307, 308].includes(statusCode)) errors.statusCode = "Use 301, 302, 307 or 308.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { fromPath, toPath, statusCode, isActive: asBool(form.get("isActive")) } };
}

export type CommentInput = { postId: number; authorName: string; authorEmail: string; body: string };

export function validateCommentInput(form: FormData): ValidationResult<CommentInput> {
  const errors: FieldErrors = {};
  const authorName = asTrimmed(form.get("authorName"));
  const authorEmail = asTrimmed(form.get("authorEmail")).toLowerCase();
  const body = asTrimmed(form.get("body"));
  const postId = asInt(form.get("postId"), 0);

  if (!authorName) errors.authorName = "Your name is required.";
  else if (authorName.length > LIMITS.name) errors.authorName = "That name is too long.";

  if (!authorEmail) errors.authorEmail = "An email address is required.";
  else if (!isEmail(authorEmail)) errors.authorEmail = "That does not look like a valid email address.";

  if (!body) errors.body = "A comment cannot be empty.";
  else if (body.length > LIMITS.commentBody) errors.body = "That comment is too long.";

  if (!postId) errors.postId = "Unknown post.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { postId, authorName, authorEmail, body } };
}
