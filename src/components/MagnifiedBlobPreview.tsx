"use client";

import { useEffect, useState } from "react";
import { Magnifier } from "@/components/Magnifier";

type MagnifiedBlobPreviewProps = {
  blob: Blob;
  alt: string;
  className?: string;
  /** Optional list of additional outputs shown as a small strip. */
  extras?: Array<{ blob: Blob; alt: string }>;
};

function SinglePreview({
  blob,
  alt,
  className,
}: {
  blob: Blob;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  if (!url) return null;

  return (
    <Magnifier zoom={2} size={160} shape="rounded">
      <img src={url} alt={alt} className={className ?? "max-h-56 max-w-full object-contain"} />
    </Magnifier>
  );
}

/**
 * Client-side blob image preview with loupe support for conversion tools
 * that previously only showed filenames.
 */
export function MagnifiedBlobPreview({ blob, alt, className, extras }: MagnifiedBlobPreviewProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-none border border-white/10 bg-black/30 p-3">
      <SinglePreview blob={blob} alt={alt} className={className} />
      {(extras ?? []).slice(0, 3).map((item, index) => (
        <SinglePreview
          key={`${item.alt}-${index}`}
          blob={item.blob}
          alt={item.alt}
          className={className}
        />
      ))}
    </div>
  );
}
