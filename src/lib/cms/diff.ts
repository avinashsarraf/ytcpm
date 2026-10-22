/**
 * A line diff for the CMS.
 *
 * Editors can already restore an earlier version of a post; this is what lets
 * them see what they are restoring *to*. It is deliberately the simplest
 * correct thing rather than a full Myers implementation: trim the identical
 * head and tail, then run the classic longest-common-subsequence table over
 * what is left. Real edits to an article touch one or two sections, so the
 * trimmed region is tiny in practice.
 *
 * A very large pair of documents would make the table expensive, so the size
 * is capped. A capped diff is still useful — it says exactly that in the UI
 * rather than pretending it compared everything.
 */

export type DiffLine = {
  type: "same" | "add" | "remove";
  text: string;
};

export type DiffResult = {
  lines: DiffLine[];
  added: number;
  removed: number;
  /** True when the documents were too large to compare in full. */
  truncated: boolean;
};

/** The most lines considered on each side before the diff is capped. */
const DEFAULT_MAX_LINES = 800;

function splitLines(value: string): string[] {
  // A trailing newline should not create a phantom empty line at the end.
  const normalised = value.replace(/\r\n/g, "\n").replace(/\s+$/, "");
  return normalised ? normalised.split("\n") : [];
}

/**
 * Compares two documents line by line.
 *
 * `before` is the old version, `after` the new one. The result is a flat list
 * ready to render as a unified diff.
 */
export function diffLines(before: string, after: string, options: { maxLines?: number } = {}): DiffResult {
  const maxLines = Math.max(1, options.maxLines ?? DEFAULT_MAX_LINES);
  let oldLines = splitLines(before);
  let newLines = splitLines(after);

  let truncated = false;
  if (oldLines.length > maxLines || newLines.length > maxLines) {
    oldLines = oldLines.slice(0, maxLines);
    newLines = newLines.slice(0, maxLines);
    truncated = true;
  }

  // Identical documents are a common case and need no table.
  if (oldLines.length === 0 && newLines.length === 0) {
    return { lines: [], added: 0, removed: 0, truncated };
  }

  // 1. The identical head.
  let start = 0;
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) start += 1;

  // 2. The identical tail, without overlapping the head.
  let endOld = oldLines.length;
  let endNew = newLines.length;
  while (endOld > start && endNew > start && oldLines[endOld - 1] === newLines[endNew - 1]) {
    endOld -= 1;
    endNew -= 1;
  }

  const middleOld = oldLines.slice(start, endOld);
  const middleNew = newLines.slice(start, endNew);

  const lines: DiffLine[] = [];
  for (let index = 0; index < start; index += 1) lines.push({ type: "same", text: oldLines[index] });

  let added = 0;
  let removed = 0;

  // 3. The changed middle, aligned by LCS.
  const n = middleOld.length;
  const m = middleNew.length;
  if (n === 0) {
    for (const text of middleNew) {
      lines.push({ type: "add", text });
      added += 1;
    }
  } else if (m === 0) {
    for (const text of middleOld) {
      lines.push({ type: "remove", text });
      removed += 1;
    }
  } else {
    // table[i][j] = length of the LCS of middleOld[i:] and middleNew[j:].
    const width = m + 1;
    const table = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i -= 1) {
      for (let j = m - 1; j >= 0; j -= 1) {
        table[i * width + j] =
          middleOld[i] === middleNew[j]
            ? table[(i + 1) * width + (j + 1)] + 1
            : Math.max(table[(i + 1) * width + j], table[i * width + (j + 1)]);
      }
    }

    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (middleOld[i] === middleNew[j]) {
        lines.push({ type: "same", text: middleOld[i] });
        i += 1;
        j += 1;
      } else if (table[(i + 1) * width + j] >= table[i * width + (j + 1)]) {
        lines.push({ type: "remove", text: middleOld[i] });
        removed += 1;
        i += 1;
      } else {
        lines.push({ type: "add", text: middleNew[j] });
        added += 1;
        j += 1;
      }
    }
    while (i < n) {
      lines.push({ type: "remove", text: middleOld[i] });
      removed += 1;
      i += 1;
    }
    while (j < m) {
      lines.push({ type: "add", text: middleNew[j] });
      added += 1;
      j += 1;
    }
  }

  // 4. The identical tail.
  for (let index = endOld; index < oldLines.length; index += 1) {
    lines.push({ type: "same", text: oldLines[index] });
  }

  return { lines, added, removed, truncated };
}

/**
 * Hides long unchanged stretches so the changed lines stay on screen.
 *
 * `context` is how many unchanged lines to keep on each side of a change.
 * Collapsed runs become a single `same` line holding the omitted count, which
 * the UI renders as a marker rather than as text.
 */
export function collapseContext(lines: DiffLine[], context = 3): { lines: DiffLine[]; hidden: number } {
  if (context < 0) return { lines, hidden: 0 };
  // Nothing changed: collapsing would replace the document with one marker.
  if (!lines.some((line) => line.type !== "same")) return { lines, hidden: 0 };

  const keep = new Array<boolean>(lines.length).fill(false);
  lines.forEach((line, index) => {
    if (line.type === "same") return;
    for (let offset = Math.max(0, index - context); offset <= Math.min(lines.length - 1, index + context); offset += 1) {
      keep[offset] = true;
    }
  });

  const result: DiffLine[] = [];
  let hidden = 0;
  let runStart = -1;

  const flush = (endExclusive: number) => {
    if (runStart === -1) return;
    const count = endExclusive - runStart;
    if (count > 0) {
      hidden += count;
      result.push({ type: "same", text: `__omitted__${count}` });
    }
    runStart = -1;
  };

  for (let index = 0; index < lines.length; index += 1) {
    if (keep[index]) {
      flush(index);
      result.push(lines[index]);
    } else {
      if (runStart === -1) runStart = index;
    }
  }
  flush(lines.length);

  return { lines: result, hidden };
}

/** True when a rendered line is the marker left by `collapseContext`. */
export function omittedCount(text: string): number | null {
  const match = /^__omitted__(\d+)$/.exec(text);
  return match ? Number.parseInt(match[1], 10) : null;
}
