"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { usePendingFiles } from "@/context/PendingFilesContext";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
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
    <FileUploadZone
      variant="hero"
      role="region"
      aria-label="Quick merge upload"
      drag={drag}
      title="Drop PDFs here to merge"
      description="Your files open in the merge tool, ready to run—reorder pages, then download."
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
      input={
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
      }
      footer={
        <div className="flex flex-wrap justify-center gap-3">
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
      }
    />
  );
}
