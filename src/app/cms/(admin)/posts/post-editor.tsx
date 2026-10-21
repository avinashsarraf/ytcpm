"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { analyzePost, type SeoReport } from "@/lib/cms/seo";
import { safeUrl } from "@/lib/cms/markdown";
import { savePostAction, type ActionState } from "../../actions";

export type EditorPost = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  contentMd: string;
  status: string;
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
  template: string;
  publishedAt: string | null;
  scheduledFor: string | null;
};

/**
 * The post editor.
 *
 * The SEO panel is computed in the browser from the same analyzer the server
 * uses to block a publish, so what the author sees is exactly what will be
 * checked. The panel is a live aid, not the gate — the gate is on the server.
 */
export default function PostEditor({ post, mode }: { post: EditorPost | null; mode: "create" | "edit" }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [contentMd, setContentMd] = useState(post?.contentMd ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [focusKeyword, setFocusKeyword] = useState(post?.focusKeyword ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [tab, setTab] = useState<"content" | "seo" | "preview">("content");

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const result = await savePostAction(previous, formData);
      if (result.ok && result.redirectTo && mode === "create") {
        router.replace(result.redirectTo);
        router.refresh();
      }
      return result;
    },
    { ok: false, message: "" },
  );

  const report: SeoReport = useMemo(
    () =>
      analyzePost({
        title,
        slug: slug || "new-post",
        excerpt,
        contentMd,
        focusKeyword,
        seoTitle,
        seoDescription,
        seoKeywords: [],
        ogImageUrl: post?.ogImageUrl ?? null,
        ogImageAlt: post?.ogImageAlt ?? null,
        canonicalUrl: post?.canonicalUrl ?? null,
        noindex: post?.noindex ?? false,
      }),
    [title, slug, excerpt, contentMd, focusKeyword, seoTitle, seoDescription, post],
  );

  const errors = state.fieldErrors ?? {};
  const autoSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red";
  const labelClass = "text-sm font-semibold text-heading";

  return (
    <form action={formAction} className="mt-6">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {/* Tabs */}
          <div role="tablist" aria-label="Editor sections" className="flex gap-1 rounded-lg border border-border bg-white p-1">
            {(["content", "seo", "preview"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                id={`tab-${value}`}
                aria-selected={tab === value}
                aria-controls={`panel-${value}`}
                onClick={() => setTab(value)}
                className={`min-h-10 flex-1 rounded-md px-3 text-sm font-semibold capitalize transition-colors ${tab === value ? "bg-yt-red text-white" : "text-fog hover:bg-surface"}`}
              >
                {value}
              </button>
            ))}
          </div>

          {tab === "content" ? (
            <div id="panel-content" role="tabpanel" aria-labelledby="tab-content" className="space-y-4">
              <div className="rounded-xl border border-border bg-white p-5">
                <div>
                  <label htmlFor="title" className={labelClass}>Title</label>
                  <input
                    id="title"
                    name="title"
                    required
                    maxLength={140}
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      if (mode === "create") setSlug(autoSlug(event.target.value));
                    }}
                    className={inputClass}
                    placeholder="YouTube CPM vs RPM: what the numbers mean"
                  />
                  <p className="mt-1.5 text-xs text-fog">{title.length} characters. The page title adds “ | ytcpm.online”.</p>
                  {errors.title ? <p className="mt-1.5 text-xs font-semibold text-yt-red">{errors.title}</p> : null}
                </div>

                <div className="mt-4">
                  <label htmlFor="subtitle" className={labelClass}>Subtitle <span className="font-normal text-fog">(optional)</span></label>
                  <input id="subtitle" name="subtitle" maxLength={200} defaultValue={post?.subtitle ?? ""} className={inputClass} placeholder="One sentence that expands on the title" />
                </div>

                <div className="mt-4">
                  <label htmlFor="slug" className={labelClass}>URL slug</label>
                  <div className="flex items-center gap-2">
                    <span className="mt-1.5 shrink-0 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-fog">/blog/</span>
                    <input
                      id="slug"
                      name="slug"
                      value={slug}
                      onChange={(event) => setSlug(event.target.value)}
                      className={inputClass}
                      placeholder="youtube-cpm-vs-rpm"
                    />
                  </div>
                  {errors.slug ? <p className="mt-1.5 text-xs font-semibold text-yt-red">{errors.slug}</p> : null}
                </div>

                <div className="mt-4">
                  <label htmlFor="excerpt" className={labelClass}>Short description</label>
                  <textarea id="excerpt" name="excerpt" rows={3} maxLength={320} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} className={inputClass} placeholder="The summary shown on the blog index and used as the meta description when none is set." />
                  <p className="mt-1.5 text-xs text-fog">{excerpt.length} characters. Aim for 90–160.</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-white p-5">
                <label htmlFor="contentMd" className={labelClass}>Article body (Markdown)</label>
                <p className="mt-1 text-xs text-fog">
                  Headings (<code className="font-mono">##</code>), lists, tables, links, images, bold and code are supported. Raw HTML is escaped, so it is shown as text.
                </p>
                <textarea
                  id="contentMd"
                  name="contentMd"
                  required
                  rows={22}
                  value={contentMd}
                  onChange={(event) => setContentMd(event.target.value)}
                  className={`${inputClass} font-mono text-[13px] leading-6`}
                  placeholder={"## Why the two numbers differ\n\nStart with a short answer, then explain.\n\n- First point\n- Second point"}
                />
                {errors.contentMd ? <p className="mt-1.5 text-xs font-semibold text-yt-red">{errors.contentMd}</p> : null}
                <p className="mt-1.5 text-xs text-fog">{report.wordCount} words · about {report.readingMinutes} min read</p>
              </div>
            </div>
          ) : null}

          {tab === "seo" ? (
            <div id="panel-seo" role="tabpanel" aria-labelledby="tab-seo" className="space-y-4">
              <div className="rounded-xl border border-border bg-white p-5">
                <h2 className="text-base font-bold text-heading">Search appearance</h2>
                <p className="mt-1 text-sm text-fog">These fields override what is generated from the article body.</p>

                <div className="mt-4">
                  <label htmlFor="focusKeyword" className={labelClass}>Focus keyword</label>
                  <input id="focusKeyword" name="focusKeyword" value={focusKeyword} onChange={(event) => setFocusKeyword(event.target.value)} className={inputClass} placeholder="youtube cpm vs rpm" />
                  <p className="mt-1.5 text-xs text-fog">The one query this post should win. It must appear in the title, description, slug, opening paragraph and a sub-heading.</p>
                </div>

                <div className="mt-4">
                  <label htmlFor="seoTitle" className={labelClass}>SEO title <span className="font-normal text-fog">(optional)</span></label>
                  <input id="seoTitle" name="seoTitle" maxLength={70} value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} className={inputClass} placeholder="Defaults to the article title" />
                  <p className="mt-1.5 text-xs text-fog">{(seoTitle || title).length} characters including the site suffix.</p>
                </div>

                <div className="mt-4">
                  <label htmlFor="seoDescription" className={labelClass}>Meta description <span className="font-normal text-fog">(optional)</span></label>
                  <textarea id="seoDescription" name="seoDescription" rows={3} maxLength={180} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} className={inputClass} placeholder="Defaults to the short description" />
                  <p className="mt-1.5 text-xs text-fog">{(seoDescription || excerpt).length} characters. Aim for 90–160.</p>
                </div>

                <div className="mt-4">
                  <label htmlFor="seoKeywords" className={labelClass}>Keyword variants</label>
                  <input id="seoKeywords" name="seoKeywords" defaultValue={post?.seoKeywords?.join(", ") ?? ""} className={inputClass} placeholder="youtube cpm vs rpm, cpm or rpm, youtube monetization metrics" />
                  <p className="mt-1.5 text-xs text-fog">Comma separated. These are the phrases the page should also match.</p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ogImageUrl" className={labelClass}>Social image URL</label>
                    <input id="ogImageUrl" name="ogImageUrl" defaultValue={post?.ogImageUrl ?? ""} className={inputClass} placeholder="/media/2026/10/abc.png" />
                  </div>
                  <div>
                    <label htmlFor="ogImageAlt" className={labelClass}>Social image alt text</label>
                    <input id="ogImageAlt" name="ogImageAlt" defaultValue={post?.ogImageAlt ?? ""} className={inputClass} placeholder="What the image shows" />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="canonicalUrl" className={labelClass}>Canonical URL <span className="font-normal text-fog">(optional)</span></label>
                  <input id="canonicalUrl" name="canonicalUrl" defaultValue={post?.canonicalUrl ?? ""} className={inputClass} placeholder="Leave empty — this page owns its URL" />
                </div>

                <div className="mt-5 flex flex-wrap gap-5 border-t border-border pt-4">
                  <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-heading">
                    <input type="checkbox" name="noindex" defaultChecked={post?.noindex ?? false} className="h-4 w-4 rounded border-border" />
                    noindex this page
                  </label>
                  <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-heading">
                    <input type="checkbox" name="allowIndex" defaultChecked={post?.allowIndex ?? true} className="h-4 w-4 rounded border-border" />
                    list in sitemap.xml
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-white p-5">
                <h2 className="text-base font-bold text-heading">Classification</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="category" className={labelClass}>Category</label>
                    <input id="category" name="category" defaultValue={post?.category ?? ""} className={inputClass} placeholder="CPM & RPM" />
                  </div>
                  <div>
                    <label htmlFor="tags" className={labelClass}>Tags</label>
                    <input id="tags" name="tags" defaultValue={post?.tags?.join(", ") ?? ""} className={inputClass} placeholder="cpm, rpm, monetization" />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="template" className={labelClass}>Template</label>
                  <select id="template" name="template" defaultValue={post?.template ?? "article"} className={inputClass}>
                    <option value="article">Article</option>
                    <option value="landing">Landing page</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "preview" ? (
            <div id="panel-preview" role="tabpanel" aria-labelledby="tab-preview" className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-base font-bold text-heading">Search result preview</h2>
              <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                <p className="text-xs text-fog">ytcpm.online › blog › {slug || "your-post"}</p>
                <p className="mt-1.5 text-lg font-medium leading-snug text-[#1a0dab]">{seoTitle || title || "Your title appears here"}</p>
                <p className="mt-1.5 text-sm leading-6 text-fog">{seoDescription || excerpt || "Your meta description appears here. Write one that makes the click worth it."}</p>
              </div>

              <h3 className="mt-6 text-base font-bold text-heading">Article outline</h3>
              {report.headings.length === 0 ? (
                <p className="mt-2 text-sm text-fog">No headings yet. Add <code className="font-mono">##</code> sections so the post is skimmable and the table of contents works.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {report.headings.map((heading) => (
                    <li key={heading.id} style={{ paddingLeft: `${(heading.level - 2) * 16}px` }} className="text-fog">
                      <span className="mr-2 font-mono text-[10px] text-fog">H{heading.level}</span>
                      {heading.text}
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mt-6 text-base font-bold text-heading">Links found</h3>
              <p className="mt-1.5 text-sm text-fog">{report.internalLinks} internal · {report.externalLinks} external</p>
              {report.internalLinks > 0 ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {report.internalLinkList.slice(0, 12).map((href) => (
                    <li key={href} className="truncate text-fog">
                      <span className="mr-2 rounded bg-mint-bg px-1.5 py-0.5 text-[10px] font-bold text-mint">internal</span>
                      {href}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="text-base font-bold text-heading">Publish</h2>
            <div className="mt-3">
              <label htmlFor="status" className="text-sm font-semibold text-heading">Status</label>
              <select id="status" name="status" value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="mt-3">
              <label htmlFor="scheduledFor" className="text-sm font-semibold text-heading">Publish date <span className="font-normal text-fog">(for scheduled posts)</span></label>
              <input id="scheduledFor" name="scheduledFor" type="datetime-local" defaultValue={post?.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : ""} className={inputClass} />
              {errors.scheduledFor ? <p className="mt-1.5 text-xs font-semibold text-yt-red">{errors.scheduledFor}</p> : null}
            </div>
            {post?.publishedAt ? <input type="hidden" name="publishedAt" value={post.publishedAt} /> : null}

            {state.message ? (
              <p role="status" className={`mt-4 rounded-lg px-3.5 py-2.5 text-sm ${state.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
                {state.message}
              </p>
            ) : null}

            <button type="submit" disabled={pending} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-yt-red px-5 text-sm font-bold text-white transition-colors hover:bg-yt-red-hover disabled:opacity-60">
              {pending ? "Saving…" : mode === "create" ? "Create post" : "Save changes"}
            </button>
            {report.blocking.length ? (
              <p className="mt-2 text-xs leading-5 text-yt-red">Publishing is blocked until: {report.blocking.map((check) => check.label).join(", ")}.</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-bold text-heading">SEO check</h2>
              <span className={`text-2xl font-bold ${report.score >= 90 ? "text-mint" : report.score >= 70 ? "text-blue" : report.score >= 45 ? "text-amber" : "text-yt-red"}`}>
                {report.score}
                <span className="text-sm font-semibold text-fog">/100</span>
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {report.checks.map((check) => (
                <li key={check.id} className="flex gap-2 text-xs leading-5">
                  <span
                    aria-hidden
                    className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${
                      check.status === "pass" ? "bg-mint" : check.status === "warn" ? "bg-amber" : "bg-yt-red"
                    }`}
                  >
                    {check.status === "pass" ? "✓" : check.status === "warn" ? "!" : "×"}
                  </span>
                  <span>
                    <span className="font-semibold text-heading">{check.label}</span>{" "}
                    <span className="text-fog">{check.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </form>
  );
}
