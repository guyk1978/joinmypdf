"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { formatFontSubsetError, subsetFontFile } from "@/lib/font-subset";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { Link } from "@/i18n/navigation";

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
  const faqItems = [
    {
      q: "What is font subsetting?",
      a: "Font subsetting is the process of removing unused characters (glyphs) from a font file. This significantly reduces file size while keeping only the characters needed for your website's language and content.",
    },
    {
      q: "Why should I subset my fonts?",
      a: "Large font files are a common cause of slow website performance. Subsetting helps eliminate 'Flash of Unstyled Text' (FOUT) and improves your Google PageSpeed scores.",
    },
    {
      q: "Is this tool safe to use?",
      a: "Yes. All processing happens 100% locally in your browser. Your font files are never uploaded to a server, ensuring complete privacy and security.",
    },
    {
      q: "Which font formats are supported?",
      a: "We currently support TTF, OTF, and WOFF2 formats.",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Technical spike</p>
          <h1 className="text-2xl font-semibold text-neutral-100">Font Subsetter</h1>
          <p className="text-sm leading-relaxed text-neutral-300">
            Reduce your website&apos;s load time and improve Core Web Vitals by subsetting your web fonts.
            Our tool removes unused glyphs from TTF, OTF, and WOFF2 files, delivering a lightweight,
            production-ready font file without compromising your design.
          </p>
        </header>
      </section>

      <section className="font-subsetter rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">

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

      <section className="rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-100">How to Generate a Font Subset</h2>
        <div className="space-y-3 text-sm leading-relaxed text-neutral-400">
          <p>
            Generate compact webfont files directly in your browser by uploading a font, entering the
            exact characters your pages need, and exporting a subset file in seconds. No server upload,
            no account, and no desktop software required.
          </p>
          <p>
            Privacy is a product decision here: your font files are handled fully on your device. The
            source file and generated output never leave your browser session, so your brand assets stay
            private while you optimize performance.
          </p>
          <p>
            For best real-world results, create language-specific subsets (for example English, Hebrew,
            or numbers-only variants) and load only what each page needs. This reduces payload size and
            improves rendering speed for first-time visitors.
          </p>
          <p>
            Typical use cases include landing pages, SaaS dashboards, blog templates, and ecommerce
            storefronts where Core Web Vitals matter and every kilobyte saved helps conversion.
          </p>
        </div>
      </section>

      <section className="rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-100">Why Use Our Font Subsetter?</h2>
        <p className="mb-4 text-sm leading-relaxed text-neutral-400">
          Subset only the glyphs you actually use, reduce transfer size, and keep complete control over
          your files with local-first browser processing.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <article className="border border-neutral-800 bg-neutral-950 p-4">
            <h3 className="text-sm font-semibold text-neutral-100">Local-only processing</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              Font parsing and subsetting run in your browser session. No uploads, no remote processing,
              and no dependency on external servers.
            </p>
          </article>
          <article className="border border-neutral-800 bg-neutral-950 p-4">
            <h3 className="text-sm font-semibold text-neutral-100">Performance-focused output</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              Smaller font files reduce render-blocking cost, improve text paint speed, and help Core Web
              Vitals on real devices and real networks.
            </p>
          </article>
          <article className="border border-neutral-800 bg-neutral-950 p-4">
            <h3 className="text-sm font-semibold text-neutral-100">Simple production workflow</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              Upload, pick characters, download subset, and ship. The flow is designed for quick iteration
              during implementation and QA.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-100">Related tools</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tools/svg-to-favicon"
            className="inline-flex border border-neutral-700 bg-neutral-950 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-100 hover:border-neutral-500"
          >
            SVG to Favicon
          </Link>
          <Link
            href="/tools/compress-image"
            className="inline-flex border border-neutral-700 bg-neutral-950 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-100 hover:border-neutral-500"
          >
            Compress Image
          </Link>
          <Link
            href="/tools/favicon-compressor"
            className="inline-flex border border-neutral-700 bg-neutral-950 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-100 hover:border-neutral-500"
          >
            Favicon Compressor
          </Link>
        </div>
      </section>

      <section className="rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
        <FaqAccordion items={faqItems} />
      </section>

      <section className="rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">
        <ToolSuccessEngagement pageTitle="Font Subsetter Spike" />
      </section>
    </div>
  );
}
