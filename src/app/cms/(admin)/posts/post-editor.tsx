"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { analyzePost, type SeoReport } from "@/lib/cms/seo";
import { renderMarkdown, safeUrl } from "@/lib/cms/markdown";
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
  /** Changes whenever the post changes, so the editor can reset its state. */
  updatedAt: string;
};

/**
 * The post editor.
 *
 * The SEO panel is computed in the browser from the same analyzer the server
 * uses to block a publish, so what the author sees is exactly what will be
 * checked. The panel is a live aid, not the gate — the gate is on the server.
 */
export type LinkTarget = { title: string; slug: string };

export default function PostEditor({
  post,
  mode,
  linkTargets = [],
}: {
  post: EditorPost | null;
  mode: "create" | "edit";
  /** Published posts this article could link to. */
  linkTargets?: LinkTarget[];
}) {
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

  /*
    Every field is controlled. An uncontrolled input is reset to the value it
    was first rendered with whenever a form submission completes, so a save
    that the server rejected (a blocking SEO issue, a taken slug) used to wipe
    whatever the author had typed into the fields that were not controlled.
  */
  const [subtitle, setSubtitle] = useState(post?.subtitle ?? "");
  const [seoKeywords, setSeoKeywords] = useState(post?.seoKeywords?.join(", ") ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(post?.ogImageUrl ?? "");
  const [ogImageAlt, setOgImageAlt] = useState(post?.ogImageAlt ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");
  const [noindex, setNoindex] = useState(post?.noindex ?? false);
  const [allowIndex, setAllowIndex] = useState(post?.allowIndex ?? true);
  const [category, setCategory] = useState(post?.category ?? "");
  const [tags, setTags] = useState(post?.tags?.join(", ") ?? "");
  const [template, setTemplate] = useState(post?.template ?? "article");
  const [scheduledFor, setScheduledFor] = useState(
    post?.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : "",
  );

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
        seoKeywords: seoKeywords
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        ogImageUrl: ogImageUrl || null,
        ogImageAlt: ogImageAlt || null,
        canonicalUrl: canonicalUrl || null,
        noindex,
      }),
    [title, slug, excerpt, contentMd, focusKeyword, seoTitle, seoDescription, seoKeywords, ogImageUrl, ogImageAlt, canonicalUrl, noindex],
  );

  /*
    The same renderer the public page uses, so the preview cannot drift from
    what a reader will actually see.
  */
  const rendered = useMemo(() => renderMarkdown(contentMd), [contentMd]);

  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  /*
    Internal links are a blocking SEO check, so the editor offers the ones it
    already knows about. A suggestion that is already in the body is not
    offered again, and insertion happens at the cursor so the link lands where
    the author is writing.
  */
  const suggestions = linkTargets.filter((target) => !contentMd.includes(`/blog/${target.slug}`));

  const insertLink = (target: LinkTarget) => {
    const snippet = `[${target.title}](/blog/${target.slug})`;
    const element = contentRef.current;
    const start = element?.selectionStart ?? contentMd.length;
    const end = element?.selectionEnd ?? start;
    const next = `${contentMd.slice(0, start)}${snippet}${contentMd.slice(end)}`;
    setContentMd(next);
    requestAnimationFrame(() => {
      element?.focus();
      const caret = start + snippet.length;
      element?.setSelectionRange(caret, caret);
    });
  };

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

          {/*
            The panels stay mounted and are hidden instead of unmounted: a
            field that is not in the DOM is not submitted, so saving from the
            SEO tab would silently drop the title, the slug and the body.
          */}
          <div id="panel-content" role="tabpanel" aria-labelledby="tab-content" hidden={tab !== "content"} className="space-y-4">
            <div className="rounded-xl border border-border bg-white p-5">
              <div>
                <label htmlFor="title" className={labelClass}>Title</label>
                <input
                  id="title"
                  name="title"
                  required={tab === "content"}
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
                <input id="subtitle" name="subtitle" maxLength={200} value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className={inputClass} placeholder="One sentence that expands on the title" />
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
                ref={contentRef}
                required={tab === "content"}
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

          <div id="panel-seo" role="tabpanel" aria-labelledby="tab-seo" hidden={tab !== "seo"} className="space-y-4">
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
                <input id="seoKeywords" name="seoKeywords" value={seoKeywords} onChange={(event) => setSeoKeywords(event.target.value)} className={inputClass} placeholder="youtube cpm vs rpm, cpm or rpm, youtube monetization metrics" />
                <p className="mt-1.5 text-xs text-fog">Comma separated. These are the phrases the page should also match.</p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ogImageUrl" className={labelClass}>Social image URL</label>
                  <input id="ogImageUrl" name="ogImageUrl" value={ogImageUrl} onChange={(event) => setOgImageUrl(event.target.value)} className={inputClass} placeholder="/media/2026/10/abc.png" />
                </div>
                <div>
                  <label htmlFor="ogImageAlt" className={labelClass}>Social image alt text</label>
                  <input id="ogImageAlt" name="ogImageAlt" value={ogImageAlt} onChange={(event) => setOgImageAlt(event.target.value)} className={inputClass} placeholder="What the image shows" />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="canonicalUrl" className={labelClass}>Canonical URL <span className="font-normal text-fog">(optional)</span></label>
                <input id="canonicalUrl" name="canonicalUrl" value={canonicalUrl} onChange={(event) => setCanonicalUrl(event.target.value)} className={inputClass} placeholder="Leave empty — this page owns its URL" />
              </div>

              <div className="mt-5 flex flex-wrap gap-5 border-t border-border pt-4">
                <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-heading">
                  <input type="checkbox" name="noindex" checked={noindex} onChange={(event) => setNoindex(event.target.checked)} className="h-4 w-4 rounded border-border" />
                  noindex this page
                </label>
                <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-heading">
                  <input type="checkbox" name="allowIndex" checked={allowIndex} onChange={(event) => setAllowIndex(event.target.checked)} className="h-4 w-4 rounded border-border" />
                  list in sitemap.xml
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5">
              <h2 className="text-base font-bold text-heading">Classification</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className={labelClass}>Category</label>
                  <input id="category" name="category" value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass} placeholder="CPM & RPM" />
                </div>
                <div>
                  <label htmlFor="tags" className={labelClass}>Tags</label>
                  <input id="tags" name="tags" value={tags} onChange={(event) => setTags(event.target.value)} className={inputClass} placeholder="cpm, rpm, monetization" />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="template" className={labelClass}>Template</label>
                <select id="template" name="template" value={template} onChange={(event) => setTemplate(event.target.value)} className={inputClass}>
                  <option value="article">Article</option>
                  <option value="landing">Landing page</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-bold text-heading">Internal links</h2>
                <span className="text-xs font-semibold text-fog">{report.internalLinks} in the article</span>
              </div>
              <p className="mt-1 text-sm text-fog">
                One internal link is required before publishing. Insert one at the cursor — it lands wherever you were writing.
              </p>
              {report.internalLinks === 0 ? (
                <p className="mt-3 rounded-lg bg-yt-red-bg px-3 py-2 text-xs font-semibold text-yt-red">
                  No internal link yet, so publishing is blocked.
                </p>
              ) : null}
              {suggestions.length === 0 ? (
                <p className="mt-3 text-xs text-fog">
                  {linkTargets.length === 0
                    ? "Publish another post first, and it will appear here as a link suggestion."
                    : "Every published post is already linked from this article."}
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {suggestions.slice(0, 6).map((target) => (
                    <li key={target.slug} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-heading">{target.title}</span>
                        <span className="block truncate font-mono text-[11px] text-fog">/blog/{target.slug}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => insertLink(target)}
                        className="inline-flex min-h-8 shrink-0 items-center rounded-md border border-border px-2.5 text-[11px] font-bold text-heading hover:bg-surface"
                      >
                        Insert
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div id="panel-preview" role="tabpanel" aria-labelledby="tab-preview" hidden={tab !== "preview"} className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-base font-bold text-heading">Search result preview</h2>
            <div className="mt-4 rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-fog">ytcpm.online › blog › {slug || "your-post"}</p>
              <p className="mt-1.5 text-lg font-medium leading-snug text-[#1a0dab]">{seoTitle || title || "Your title appears here"}</p>
              <p className="mt-1.5 text-sm leading-6 text-fog">{seoDescription || excerpt || "Your meta description appears here. Write one that makes the click worth it."}</p>
            </div>

            <h3 className="mt-6 text-base font-bold text-heading">The article as it will appear</h3>
            <p className="mt-1 text-xs text-fog">
              {rendered.wordCount} words · about {rendered.readingMinutes} min read · rendered with the same rules as the live page.
            </p>
            <div className="mt-3 max-h-[560px] overflow-y-auto rounded-lg border border-border bg-white px-5 py-4">
              {contentMd.trim() ? (
                <article
                  className="prose-post text-[15px]"
                  // The renderer escapes all author input, so this is inert markup.
                  dangerouslySetInnerHTML={{ __html: rendered.html }}
                />
              ) : (
                <p className="text-sm text-fog">Nothing to preview yet. Write the article on the Content tab.</p>
              )}
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
              <input id="scheduledFor" name="scheduledFor" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} className={inputClass} />
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
