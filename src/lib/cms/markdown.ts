/**
 * A small, dependency-free Markdown renderer built for the CMS blog.
 *
 * Security model
 * ──────────────
 * 1. Raw HTML is **never** passed through. Every character the author does not
 *    explicitly write as Markdown is HTML-escaped, so a `<script>` tag in a
 *    post body renders as visible text, not as markup. That removes the whole
 *    class of "sanitiser bypass" bugs.
 * 2. URLs are checked against an allowlist. `javascript:`, `data:`, `vbscript:`
 *    and friends are rejected and the link is rendered as plain text.
 * 3. External links always get `rel="noopener noreferrer nofollow ugc"`.
 *
 * Feature set: ATX headings, paragraphs, fenced code blocks, blockquotes,
 * ordered/unordered lists (one level of nesting), GFM tables, horizontal rules,
 * bold/italic/strikethrough/inline-code, links, images and autolinks.
 */

export type MarkdownHeading = { level: number; text: string; id: string };

export type MarkdownResult = {
  html: string;
  headings: MarkdownHeading[];
  /** Visible words, excluding code blocks and markup. */
  wordCount: number;
  readingMinutes: number;
  /** Internal links (`/…` or `#…`). */
  internalLinks: string[];
  /** External links (absolute http/https). */
  externalLinks: string[];
  /** Images with their alt text, in document order. */
  images: { src: string; alt: string }[];
};

export type MarkdownOptions = {
  /**
   * Shift every heading down by this many levels. The default of 0 keeps a
   * `##` heading as an `<h2>`, which is what an article body needs — the post
   * title is already the page H1.
   */
  headingOffset?: number;
  /** Adds `id` attributes to headings and returns them for a table of contents. */
  collectHeadings?: boolean;
  /** Resolve relative link targets against this absolute origin. */
  baseUrl?: string;
};

const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

/**
 * Returns a safe href, or null when the URL must not be linked.
 * Relative URLs (`/guides`, `#section`, `./x`) are allowed.
 */
export function safeUrl(raw: string, baseUrl?: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  // Control characters are used to smuggle "java\0script:" past naive checks.
  if (/[\u0000-\u001F\u007F]/.test(url)) return null;

  if (url.startsWith("//")) return null;

  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    try {
      const parsed = new URL(url);
      if (!SAFE_SCHEMES.has(parsed.protocol.toLowerCase())) return null;
      return url;
    } catch {
      return null;
    }
  }

  if (url.startsWith("#") || url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
    if (baseUrl) {
      try {
        return new URL(url, baseUrl).toString();
      } catch {
        return null;
      }
    }
    return url;
  }

  // A bare word like "guides/x" is a relative path.
  if (/^[\w.~%-]/.test(url)) return baseUrl ? new URL(url, baseUrl).toString() : url;

  return null;
}

export function slugify(value: string, fallback = "post"): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug.length ? slug.slice(0, 80).replace(/-+$/g, "") : fallback;
}

/* ── inline ─────────────────────────────────────────────────────────────── */

type Inline = { html: string; external: string[]; internal: string[]; images: { src: string; alt: string }[] };

function renderInline(text: string, options: MarkdownOptions): Inline {
  const external: string[] = [];
  const internal: string[] = [];
  const images: { src: string; alt: string }[] = [];

  // Generated HTML is parked behind a sentinel while the surrounding text is
  // escaped, then restored afterwards. Without this the escape pass would turn
  // every anchor and image into visible markup.
  const fragments: string[] = [];

  // Code spans are extracted first so their content is never re-interpreted.
  const codeSpans: string[] = [];
  let working = text.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    codeSpans.push(code);
    return `\uE000CODE${codeSpans.length - 1}\uE000`;
  });

  // Images before links, because the syntax overlaps.
  working = working.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (match, alt: string, src: string, title?: string) => {
    const url = safeUrl(src, options.baseUrl);
    // An unsafe target is left as literal text — it is escaped with the rest.
    if (!url) return match;
    const cleanAlt = alt.trim();
    images.push({ src: url, alt: cleanAlt });
    const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
    fragments.push(`<img src="${escapeAttribute(url)}" alt="${escapeAttribute(cleanAlt)}"${titleAttr} loading="lazy" decoding="async">`);
    return `\uE000FRAG${fragments.length - 1}\uE000`;
  });

  working = working.replace(/\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (match, label: string, href: string, title?: string) => {
    const url = safeUrl(href, options.baseUrl);
    if (!url) return match;
    const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
    if (/^https?:/i.test(url)) {
      external.push(url);
      fragments.push(`<a href="${escapeAttribute(url)}"${titleAttr} rel="noopener noreferrer nofollow ugc" target="_blank">${escapeHtml(label)}</a>`);
    } else {
      internal.push(url);
      fragments.push(`<a href="${escapeAttribute(url)}"${titleAttr}>${escapeHtml(label)}</a>`);
    }
    return `\uE000FRAG${fragments.length - 1}\uE000`;
  });

  // Bare autolinks: https://example.com
  working = working.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_match, lead: string, url: string) => {
    const safe = safeUrl(url, options.baseUrl);
    if (!safe) return `${lead}${url}`;
    external.push(safe);
    fragments.push(`<a href="${escapeAttribute(safe)}" rel="noopener noreferrer nofollow ugc" target="_blank">${escapeHtml(url)}</a>`);
    return `${lead}\uE000FRAG${fragments.length - 1}\uE000`;
  });

  working = escapeHtml(working);

  // Inline formatting — order matters so `**` wins over `*`.
  working = working.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  working = working.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  working = working.replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, "$1<em>$2</em>");
  working = working.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  working = working.replace(/\uE000FRAG(\d+)\uE000/g, (_match, index: string) => fragments[Number(index)] ?? "");
  working = working.replace(/\uE000CODE(\d+)\uE000/g, (_match, index: string) => `<code>${escapeHtml(codeSpans[Number(index)])}</code>`);

  return { html: working, external, internal, images };
}

/* ── blocks ─────────────────────────────────────────────────────────────── */

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/**
 * Renders Markdown to safe HTML.
 */
export function renderMarkdown(source: string, options: MarkdownOptions = {}): MarkdownResult {
  const offset = options.headingOffset ?? 0;
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  const headings: MarkdownHeading[] = [];
  const external: string[] = [];
  const internal: string[] = [];
  const images: { src: string; alt: string }[] = [];
  const usedIds = new Set<string>();
  let wordCount = 0;
  let inCode = false;
  let codeLang = "";
  let codeBuffer: string[] = [];

  const countWords = (value: string) => {
    const plain = value
      .replace(/`[^`]*`/g, " ")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_~#>|-]/g, " ")
      .trim();
    if (!plain) return;
    wordCount += plain.split(/\s+/).filter(Boolean).length;
  };

  const flushCode = () => {
    if (!inCode) return;
    inCode = false;
    const lang = escapeAttribute(codeLang);
    const cls = lang ? ` class="language-${lang}"` : "";
    out.push(`<pre><code${cls}>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
    codeBuffer = [];
    codeLang = "";
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    /* fenced code */
    const fence = line.match(/^```([A-Za-z0-9_+-]*)\s*$/);
    if (fence) {
      if (inCode) {
        flushCode();
      } else {
        inCode = true;
        codeLang = fence[1] ?? "";
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    /* blank */
    if (!line.trim()) continue;

    /* horizontal rule */
    if (/^\s{0,3}([-*_])\s*(\1\s*){2,}$/.test(line)) {
      out.push("<hr>");
      continue;
    }

    /* heading */
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      const level = Math.min(6, heading[1].length + offset);
      const rawText = heading[2];
      const inline = renderInline(rawText, options);
      external.push(...inline.external);
      internal.push(...inline.internal);
      images.push(...inline.images);
      countWords(rawText);
      let id = slugify(rawText.replace(/[*_`]/g, ""), `section-${headings.length + 1}`);
      if (usedIds.has(id)) {
        let n = 2;
        while (usedIds.has(`${id}-${n}`)) n += 1;
        id = `${id}-${n}`;
      }
      usedIds.add(id);
      const text = inline.html;
      headings.push({ level, text: rawText.replace(/[*_`]/g, ""), id });
      out.push(`<h${level} id="${escapeAttribute(id)}">${text}</h${level}>`);
      continue;
    }

    /* blockquote */
    if (/^\s{0,3}>/.test(line)) {
      const buffer: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
        buffer.push(lines[i].replace(/^\s{0,3}>\s?/, ""));
        i += 1;
      }
      i -= 1;
      const nested = renderMarkdown(buffer.join("\n"), { ...options, headingOffset: offset + 1 });
      external.push(...nested.externalLinks);
      internal.push(...nested.internalLinks);
      images.push(...nested.images);
      out.push(`<blockquote>${nested.html}</blockquote>`);
      continue;
    }

    /* table */
    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      i -= 1;
      const align = splitTableRow(lines[i + 1] ?? "").map((cell) => {
        const left = cell.startsWith(":");
        const right = cell.endsWith(":");
        if (left && right) return "center";
        if (right) return "right";
        return "";
      });
      const head = header
        .map((cell, index) => {
          const inline = renderInline(cell, options);
          external.push(...inline.external);
          internal.push(...inline.internal);
          countWords(cell);
          const style = align[index] ? ` style="text-align:${align[index]}"` : "";
          return `<th scope="col"${style}>${inline.html}</th>`;
        })
        .join("");
      const body = rows
        .map((row) => {
          const cells = header
            .map((_, index) => {
              const cell = row[index] ?? "";
              const inline = renderInline(cell, options);
              external.push(...inline.external);
              internal.push(...inline.internal);
              countWords(cell);
              const style = align[index] ? ` style="text-align:${align[index]}"` : "";
              return `<td${style}>${inline.html}</td>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      out.push(`<div class="table-scroll" role="region" aria-label="Table" tabindex="0"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
      continue;
    }

    /* lists */
    const bullet = line.match(/^(\s*)([-*+])\s+(.*)$/);
    const ordered = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (bullet || ordered) {
      const isOrdered = Boolean(ordered);
      const items: { indent: number; text: string }[] = [];
      while (i < lines.length) {
        const m = isOrdered
          ? lines[i].match(/^(\s*)(\d+)[.)]\s+(.*)$/)
          : lines[i].match(/^(\s*)([-*+])\s+(.*)$/);
        if (!m) {
          // A continuation line (indented, not a new item) belongs to the item.
          if (items.length && /^\s{2,}\S/.test(lines[i]) && lines[i].trim()) {
            items[items.length - 1].text += `\n${lines[i].trim()}`;
            i += 1;
            continue;
          }
          break;
        }
        const marker = isOrdered ? ordered! : bullet!;
        void marker;
        items.push({ indent: m[1].length, text: m[3] });
        i += 1;
      }
      i -= 1;
      const baseIndent = Math.min(...items.map((item) => item.indent));
      const tag = isOrdered ? "ol" : "ul";
      let html = `<${tag}>`;
      let openSub = false;
      for (const item of items) {
        const nested = item.indent > baseIndent;
        if (nested && !openSub) {
          html += `<${tag}>`;
          openSub = true;
        } else if (!nested && openSub) {
          html += `</${tag}>`;
          openSub = false;
        }
        const inline = renderInline(item.text, options);
        external.push(...inline.external);
        internal.push(...inline.internal);
        images.push(...inline.images);
        countWords(item.text);
        html += `<li>${inline.html}</li>`;
      }
      if (openSub) html += `</${tag}>`;
      html += `</${tag}>`;
      out.push(html);
      continue;
    }

    /* paragraph */
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^\s{0,3}#{1,6}\s+/.test(lines[i]) &&
      !/^\s{0,3}>/.test(lines[i]) &&
      !/^\s{0,3}([-*+])\s+/.test(lines[i]) &&
      !/^\s{0,3}\d+[.)]\s+/.test(lines[i]) &&
      !/^\s{0,3}([-*_])\s*(\1\s*){2,}$/.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    i -= 1;
    const text = paragraph.join("\n");
    const inline = renderInline(text, options);
    external.push(...inline.external);
    internal.push(...inline.internal);
    images.push(...inline.images);
    countWords(text);
    out.push(`<p>${inline.html.replace(/\n/g, "<br>")}</p>`);
  }

  flushCode();

  return {
    html: out.join("\n"),
    headings,
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / 225)),
    internalLinks: [...new Set(internal)],
    externalLinks: [...new Set(external)],
    images,
  };
}

/** Plain-text summary of a Markdown body, used for excerpts and meta descriptions. */
export function markdownExcerpt(source: string, maxLength = 180): string {
  const plain = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*([-*+]|\d+[.)])\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  const cut = plain.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
