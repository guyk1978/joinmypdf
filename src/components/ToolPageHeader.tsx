"use client";

import type { ReactNode } from "react";
import { ToolFavoriteButton } from "@/components/ToolFavoriteButton";
import { normalizeToolPageCopy } from "@/lib/tool-breadcrumb-hub";

type ToolPageHeaderProps = {
  title: string;
  description?: string;
  tagline?: string;
  slug?: string;
  trailing?: ReactNode;
};

/**
 * Page chrome: exactly one H1, optional unique tagline/description (no title echo).
 */
export function ToolPageHeader({ title, description, tagline, slug, trailing }: ToolPageHeaderProps) {
  const titleNorm = normalizeToolPageCopy(title);
  let resolvedTagline = tagline?.trim() || undefined;
  let resolvedDescription = description?.trim() || undefined;

  if (resolvedTagline && normalizeToolPageCopy(resolvedTagline) === titleNorm) {
    resolvedTagline = undefined;
  }
  if (resolvedDescription && normalizeToolPageCopy(resolvedDescription) === titleNorm) {
    resolvedDescription = undefined;
  }
  // Prefer one subline when tagline and description are the same sentence.
  if (
    resolvedTagline &&
    resolvedDescription &&
    normalizeToolPageCopy(resolvedTagline) === normalizeToolPageCopy(resolvedDescription)
  ) {
    resolvedTagline = undefined;
  }

  return (
    <header className="tool-page-layout__header">
      <div className="tool-page-layout__title-row">
        <h1 className="tool-page-layout__title">{title}</h1>
        {slug ? <ToolFavoriteButton slug={slug} className="tool-page-layout__favorite" /> : trailing}
      </div>
      {resolvedTagline ? <p className="tool-page-layout__tagline">{resolvedTagline}</p> : null}
      {resolvedDescription ? (
        <p className="tool-page-layout__description">{resolvedDescription}</p>
      ) : null}
    </header>
  );
}
