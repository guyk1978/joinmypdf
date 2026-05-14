"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { clsx } from "clsx";
import { usePendingFiles } from "@/context/PendingFilesContext";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ctaPrimary, ctaSecondary } from "@/lib/cta-styles";

export function HeroDropzone() {
  const router = useRouter();
  const { setPendingFiles } = usePendingFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const goMerge = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
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
        "rounded-2xl border-2 border-dashed p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors md:p-8",
        drag
          ? "border-brand bg-brand/10"
          : "border-white/20 bg-gradient-to-b from-white/[0.07] to-white/[0.02]"
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
      <p className="text-base font-semibold text-ink md:text-lg">Drop PDFs here to merge</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        Files open in the merge tool, ready to run. Same privacy as everywhere else on JoinMyPDF.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            capture(EVENTS.cta_primary_click, { where: "hero_dropzone", action: "merge_pdf" });
            inputRef.current?.click();
          }}
          className={ctaPrimary}
        >
          Merge PDF
        </button>
        <Link
          href="/tools/pdf-merge/"
          onClick={() => capture(EVENTS.cta_secondary_click, { where: "hero_dropzone" })}
          className={ctaSecondary}
        >
          Open merge tool
        </Link>
      </div>
    </div>
  );
}
