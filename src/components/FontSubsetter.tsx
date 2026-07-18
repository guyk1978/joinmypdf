"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { formatFontSubsetError, subsetFontFile } from "@/lib/font-subset";

type SubsetStatus = "idle" | "loading" | "success" | "error";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function outputName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "font";
  return `${base}-subset.ttf`;
}

/** Interaction-only font subsetter — documentation lives in `src/lib/registry/subset-font-spike.ts`. */
export function FontSubsetter() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("ABCabc");
  const [status, setStatus] = useState<SubsetStatus>("idle");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [stats, setStats] = useState<{
    originalSize: number;
    subsetSize: number;
  } | null>(null);

  const resetOutput = useCallback(() => {
    setDownloadUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setStats(null);
    setDownloadName("");
    setStatus("idle");
  }, []);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
    setError("");
    resetOutput();
  };

  const onSubset = async () => {
    if (!file) {
      setStatus("error");
      setError("Choose a TTF or OTF font file to continue.");
      return;
    }

    if (!text.trim()) {
      setStatus("error");
      setError("Enter at least one character to keep in the subset.");
      return;
    }

    setError("");
    resetOutput();
    setStatus("loading");

    try {
      const result = await subsetFontFile(file, text);
      const blob = new Blob([Uint8Array.from(result.data)], { type: "font/ttf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(outputName(file.name));
      setStats({
        originalSize: result.originalSize,
        subsetSize: result.subsetSize,
      });
      setStatus("success");
    } catch (cause) {
      setStatus("error");
      setError(formatFontSubsetError(cause));
    }
  };

  const busy = status === "loading";

  return (
    <section className="font-subsetter mx-auto max-w-3xl space-y-6 rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-300" htmlFor="font-file">
          Font file (.ttf / .otf)
        </label>
        <input
          id="font-file"
          type="file"
          accept=".ttf,.otf,font/ttf,font/otf,application/x-font-ttf,application/x-font-opentype"
          onChange={onFileChange}
          className="block w-full text-sm text-neutral-300 file:mr-3 file:rounded-none file:border file:border-neutral-700 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:text-neutral-200"
        />
        {file ? (
          <p className="text-xs text-neutral-500">
            {file.name} · {formatBytes(file.size)}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-300" htmlFor="subset-text">
          Characters to keep
        </label>
        <input
          id="subset-text"
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          placeholder="ABCabc"
        />
      </div>

      <button
        type="button"
        onClick={() => void onSubset()}
        disabled={busy || !file}
        className="rounded-none border border-neutral-600 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Subsetting…" : "Subset font to TTF"}
      </button>

      {status === "success" && stats ? (
        <p className="text-sm text-emerald-400" role="status">
          Subset complete — download your TTF below.
        </p>
      ) : null}

      {stats ? (
        <dl className="grid grid-cols-2 gap-3 text-center text-xs">
          <div className="border border-neutral-800 p-3">
            <dt className="text-neutral-500">Original</dt>
            <dd className="mt-1 font-medium text-neutral-200">{formatBytes(stats.originalSize)}</dd>
          </div>
          <div className="border border-neutral-800 p-3">
            <dt className="text-neutral-500">Subset TTF</dt>
            <dd className="mt-1 font-medium text-emerald-400">{formatBytes(stats.subsetSize)}</dd>
          </div>
        </dl>
      ) : null}

      {downloadUrl ? (
        <a
          href={downloadUrl}
          download={downloadName}
          className="inline-flex text-sm font-medium text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
        >
          Download {downloadName}
        </a>
      ) : null}

      {status === "error" && error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
