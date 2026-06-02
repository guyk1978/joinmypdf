import { extractPageFragments, loadPdfDocument, setupPdfJs, type TextFragment } from "./pdf-text-extract";
import { classifyPdfError } from "./pdf-errors";

export type NormRect = { nx: number; ny: number; nw: number; nh: number };

export type CompareHighlight = NormRect & { kind: "removed" | "added" | "moved" };

export type PageCompareResult = {
  pageIndex: number;
  leftHighlights: CompareHighlight[];
  rightHighlights: CompareHighlight[];
  removedCount: number;
  addedCount: number;
  movedCount: number;
};

export type PdfCompareResult = {
  pageCount: number;
  leftPageCount: number;
  rightPageCount: number;
  pages: PageCompareResult[];
  totalRemoved: number;
  totalAdded: number;
  totalMoved: number;
};

const LINE_TOLERANCE = 4;
const MOVE_THRESHOLD = 12;

type LineBox = {
  text: string;
  y: number;
  rects: NormRect[];
};

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
};

function textItemNormRect(
  item: PdfTextItem,
  viewport: { width: number; height: number; convertToViewportPoint: (x: number, y: number) => number[] },
): NormRect {
  const fontHeight = Math.hypot(item.transform[2] ?? 0, item.transform[3] ?? 0) || 12;
  const w = item.width || item.str.length * fontHeight * 0.45;
  const h = item.height || fontHeight;
  const px = item.transform[4] ?? 0;
  const py = item.transform[5] ?? 0;
  const corners: [number, number][] = [
    [px, py],
    [px + w, py],
    [px, py + h],
    [px + w, py + h],
  ];
  const mapped = corners.map(([x, y]) => viewport.convertToViewportPoint(x, y));
  const xs = mapped.map((p) => p[0] ?? 0);
  const ys = mapped.map((p) => p[1] ?? 0);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const pad = 2;
  return {
    nx: Math.max(0, (left - pad) / viewport.width),
    ny: Math.max(0, (top - pad) / viewport.height),
    nw: Math.min(1, (right - left + pad * 2) / viewport.width),
    nh: Math.min(1, (bottom - top + pad * 2) / viewport.height),
  };
}

function mergeRects(rects: NormRect[]): NormRect[] {
  if (!rects.length) return [];
  const sorted = [...rects].sort((a, b) => a.ny - b.ny || a.nx - b.nx);
  const merged: NormRect[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (
      last &&
      Math.abs(last.ny - r.ny) < 0.012 &&
      r.nx <= last.nx + last.nw + 0.02
    ) {
      const right = Math.max(last.nx + last.nw, r.nx + r.nw);
      last.nx = Math.min(last.nx, r.nx);
      last.nw = right - last.nx;
      last.nh = Math.max(last.nh, r.nh);
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
}

async function extractPageLineBoxes(pageNumber: number, doc: Awaited<ReturnType<typeof loadPdfDocument>>): Promise<LineBox[]> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const lineGroups: { y: number; items: { text: string; rect: NormRect }[] }[] = [];

  for (const raw of content.items) {
    if (!("str" in raw) || typeof raw.str !== "string") continue;
    const item = raw as PdfTextItem;
    const text = item.str.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const rect = textItemNormRect(item, viewport);
    const y = item.transform[5] ?? 0;
    const group = lineGroups.find((g) => Math.abs(g.y - y) <= LINE_TOLERANCE);
    if (group) {
      group.items.push({ text, rect });
      group.y = (group.y + y) / 2;
    } else {
      lineGroups.push({ y, items: [{ text, rect }] });
    }
  }

  return lineGroups
    .sort((a, b) => b.y - a.y)
    .map((group) => {
      const sorted = [...group.items].sort((a, b) => a.rect.nx - b.rect.nx);
      return {
        text: sorted.map((i) => i.text).join(" ").replace(/\s+/g, " ").trim(),
        y: group.y,
        rects: mergeRects(sorted.map((i) => i.rect)),
      };
    })
    .filter((line) => line.text.length > 0);
}

function lcsDiff(a: string[], b: string[]): { type: "equal" | "delete" | "insert"; value: string; ai?: number; bi?: number }[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: { type: "equal" | "delete" | "insert"; value: string; ai?: number; bi?: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", value: a[i], ai: i, bi: j });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "delete", value: a[i], ai: i });
      i++;
    } else {
      ops.push({ type: "insert", value: b[j], bi: j });
      j++;
    }
  }
  while (i < m) {
    ops.push({ type: "delete", value: a[i], ai: i });
    i++;
  }
  while (j < n) {
    ops.push({ type: "insert", value: b[j], bi: j });
    j++;
  }
  return ops;
}

function normalizeLine(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function compareLinePair(left: LineBox | undefined, right: LineBox | undefined): {
  left: CompareHighlight[];
  right: CompareHighlight[];
  moved: number;
} {
  if (!left && right) {
    return {
      left: [],
      right: right.rects.map((r) => ({ ...r, kind: "added" as const })),
      moved: 0,
    };
  }
  if (left && !right) {
    return {
      left: left.rects.map((r) => ({ ...r, kind: "removed" as const })),
      right: [],
      moved: 0,
    };
  }
  if (!left || !right) return { left: [], right: [], moved: 0 };

  if (normalizeLine(left.text) === normalizeLine(right.text)) {
    const yDelta = Math.abs(left.y - right.y);
    if (yDelta > MOVE_THRESHOLD) {
      return {
        left: left.rects.map((r) => ({ ...r, kind: "moved" as const })),
        right: right.rects.map((r) => ({ ...r, kind: "moved" as const })),
        moved: 1,
      };
    }
    return { left: [], right: [], moved: 0 };
  }

  const leftWords = left.text.split(/\s+/).filter(Boolean);
  const rightWords = right.text.split(/\s+/).filter(Boolean);
  const wordOps = lcsDiff(leftWords, rightWords);
  const leftChanged = wordOps.some((o) => o.type === "delete");
  const rightChanged = wordOps.some((o) => o.type === "insert");

  return {
    left: leftChanged ? left.rects.map((r) => ({ ...r, kind: "removed" as const })) : [],
    right: rightChanged ? right.rects.map((r) => ({ ...r, kind: "added" as const })) : [],
    moved: 0,
  };
}

function comparePageLines(leftLines: LineBox[], rightLines: LineBox[]): PageCompareResult {
  const leftTexts = leftLines.map((l) => normalizeLine(l.text));
  const rightTexts = rightLines.map((l) => normalizeLine(l.text));
  const ops = lcsDiff(leftTexts, rightTexts);

  const leftHighlights: CompareHighlight[] = [];
  const rightHighlights: CompareHighlight[] = [];
  let removedCount = 0;
  let addedCount = 0;
  let movedCount = 0;

  let li = 0;
  let ri = 0;
  for (const op of ops) {
    if (op.type === "equal") {
      const pair = compareLinePair(leftLines[li], rightLines[ri]);
      leftHighlights.push(...pair.left);
      rightHighlights.push(...pair.right);
      movedCount += pair.moved;
      li++;
      ri++;
    } else if (op.type === "delete") {
      const line = leftLines[li];
      if (line) {
        leftHighlights.push(...line.rects.map((r) => ({ ...r, kind: "removed" as const })));
        removedCount += 1;
      }
      li++;
    } else {
      const line = rightLines[ri];
      if (line) {
        rightHighlights.push(...line.rects.map((r) => ({ ...r, kind: "added" as const })));
        addedCount += 1;
      }
      ri++;
    }
  }

  while (li < leftLines.length) {
    const line = leftLines[li++];
    leftHighlights.push(...line.rects.map((r) => ({ ...r, kind: "removed" as const })));
    removedCount += 1;
  }
  while (ri < rightLines.length) {
    const line = rightLines[ri++];
    rightHighlights.push(...line.rects.map((r) => ({ ...r, kind: "added" as const })));
    addedCount += 1;
  }

  return {
    pageIndex: 0,
    leftHighlights,
    rightHighlights,
    removedCount,
    addedCount,
    movedCount,
  };
}

export type CompareProgress = {
  phase: "loading" | "comparing";
  currentPage: number;
  totalPages: number;
};

export async function comparePdfFiles(
  leftFile: File,
  rightFile: File,
  onProgress?: (p: CompareProgress) => void,
): Promise<PdfCompareResult> {
  try {
    onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });
    const [leftDoc, rightDoc] = await Promise.all([loadPdfDocument(leftFile), loadPdfDocument(rightFile)]);
    const leftPageCount = leftDoc.numPages;
    const rightPageCount = rightDoc.numPages;
    const pageCount = Math.max(leftPageCount, rightPageCount);
    const pages: PageCompareResult[] = [];

    let totalRemoved = 0;
    let totalAdded = 0;
    let totalMoved = 0;

    for (let i = 0; i < pageCount; i++) {
      onProgress?.({ phase: "comparing", currentPage: i + 1, totalPages: pageCount });
      const leftLines = i < leftPageCount ? await extractPageLineBoxes(i + 1, leftDoc) : [];
      const rightLines = i < rightPageCount ? await extractPageLineBoxes(i + 1, rightDoc) : [];
      const pageResult = comparePageLines(leftLines, rightLines);
      pageResult.pageIndex = i;
      pages.push(pageResult);
      totalRemoved += pageResult.removedCount;
      totalAdded += pageResult.addedCount;
      totalMoved += pageResult.movedCount;
    }

    await leftDoc.destroy();
    await rightDoc.destroy();

    return {
      pageCount,
      leftPageCount,
      rightPageCount,
      pages,
      totalRemoved,
      totalAdded,
      totalMoved,
    };
  } catch (e) {
    throw classifyPdfError(e);
  }
}

/** Re-export for tests or summaries without full compare UI. */
export async function extractPageTextSummary(file: File, pageNumber: number): Promise<string> {
  const doc = await loadPdfDocument(file);
  const page = await doc.getPage(pageNumber);
  const frags = await extractPageFragments(page);
  await doc.destroy();
  return frags.map((f: TextFragment) => f.str).join(" ");
}

export { setupPdfJs };
