"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { clsx } from "clsx";
import { usePendingFiles } from "@/context/PendingFilesContext";
import { capture, EVENTS } from "@/components/AnalyticsClient";

export function HeroDropzone() {
  const router = useRouter();
  const { setPendingFiles } = usePendingFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const goMerge = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter(
        (f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)
      );
      if (!arr.length) return;
      setPendingFiles(arr);
      capture(EVENTS.home_drop_files, { count: arr.length });
      router.push("/tools/pdf-merge/");
    },
    [router, setPendingFiles]
  );

  return (
    <div
      role="region"
      aria-label="Quick merge upload"
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        goMerge(e.dataTransfer.files);
      }}
      className={clsx(
        "rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.03] p-6 text-center shadow-inner shadow-black/20 md:p-10",
        drag && "border-brand bg-brand/10"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) goMerge(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-lg font-semibold text-ink md:text-xl">Drop PDFs here to merge</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-ink-muted md:text-base">
        We open the merge tool with your files ready. Everything stays in your browser during processing—no
        watermark on standard output.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            capture(EVENTS.cta_primary_click, { where: "hero_dropzone", action: "choose_pdfs" });
            inputRef.current?.click();
          }}
          className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/30 hover:bg-brand-deep"
        >
          Choose PDFs
        </button>
        <Link
          href="/tools/pdf-merge/"
          onClick={() => capture(EVENTS.cta_secondary_click, { where: "hero_dropzone" })}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-white/5"
        >
          Open merge tool
        </Link>
      </div>
    </div>
  );
}
