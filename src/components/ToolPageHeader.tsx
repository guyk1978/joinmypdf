"use client";

import type { ReactNode } from "react";
import { ToolFavoriteButton } from "@/components/ToolFavoriteButton";

type ToolPageHeaderProps = {
  title: string;
  description?: string;
  tagline?: string;
  slug?: string;
  trailing?: ReactNode;
};

export function ToolPageHeader({ title, description, tagline, slug, trailing }: ToolPageHeaderProps) {
  return (
    <header className="tool-page-layout__header">
      <div className="tool-page-layout__title-row">
        <h1 className="tool-page-layout__title">{title}</h1>
        {slug ? <ToolFavoriteButton slug={slug} className="tool-page-layout__favorite" /> : trailing}
      </div>
      {tagline ? <p className="tool-page-layout__tagline">{tagline}</p> : null}
      {description ? <p className="tool-page-layout__description">{description}</p> : null}
    </header>
  );
}
