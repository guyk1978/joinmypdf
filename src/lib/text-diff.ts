export type DiffLineKind = "unchanged" | "added" | "removed";

export type DiffLine = {
  kind: DiffLineKind;
  text: string;
};

export type SideBySideDiffRow = {
  left: DiffLine | null;
  right: DiffLine | null;
};

export type TextDiffResult = {
  rows: SideBySideDiffRow[];
  additions: number;
  deletions: number;
  unchanged: number;
};

function splitLines(text: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

type DiffOp =
  | { type: "equal"; value: string }
  | { type: "delete"; value: string }
  | { type: "insert"; value: string };

function diffLines(oldLines: string[], newLines: string[]): DiffOp[] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const ops: DiffOp[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.unshift({ type: "equal", value: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: "insert", value: newLines[j - 1] });
      j--;
    } else {
      ops.unshift({ type: "delete", value: oldLines[i - 1] });
      i--;
    }
  }

  return ops;
}

function toSideBySideRows(ops: DiffOp[]): SideBySideDiffRow[] {
  return ops.map((op) => {
    if (op.type === "equal") {
      const line: DiffLine = { kind: "unchanged", text: op.value };
      return { left: line, right: line };
    }

    if (op.type === "delete") {
      return { left: { kind: "removed", text: op.value }, right: null };
    }

    return { left: null, right: { kind: "added", text: op.value } };
  });
}

export function compareTextDiff(original: string, changed: string): TextDiffResult {
  const oldLines = splitLines(original);
  const newLines = splitLines(changed);
  const ops = diffLines(oldLines, newLines);
  const rows = toSideBySideRows(ops);

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const op of ops) {
    if (op.type === "equal") unchanged++;
    else if (op.type === "insert") additions++;
    else deletions++;
  }

  return { rows, additions, deletions, unchanged };
}
