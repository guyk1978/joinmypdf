"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { Braces, Binary, CodeXml, Crop, Dices, Expand, FileCode, FileImage, FileJson, GitCompare, ImageDown, Layers, LetterText, Link as LinkIcon, Minimize2, PanelTop, Pipette, RotateCw, Smartphone, Sparkles, Split, Combine, Table, type LucideIcon } from "lucide-react";
import { getToolIcon } from "@/lib/tool-icons";
import type { HomeImageToolIconKey } from "@/lib/image-tools";
import type { HomeFaviconToolIconKey } from "@/lib/favicon-tools";
import type { HomeTextJsonToolIconKey } from "@/lib/text-json-tools";

const IMAGE_TOOL_ICONS = {
  expand: Expand,
  "file-image": FileImage,
  crop: Crop,
  "rotate-cw": RotateCw,
  "minimize-2": Minimize2,
  "image-down": ImageDown,
} satisfies Record<HomeImageToolIconKey, LucideIcon>;

const PDF_FEATURED_ICONS: Record<string, LucideIcon> = {
  "pdf-merge": Combine,
  "pdf-compress": Minimize2,
  "pdf-split": Split,
};

const FAVICON_TOOL_ICONS = {
  sparkles: Sparkles,
  "file-image": FileImage,
  "image-down": ImageDown,
  "file-code": FileCode,
  layers: Layers,
  smartphone: Smartphone,
  "minimize-2": Minimize2,
  crop: Crop,
  pipette: Pipette,
  braces: Braces,
  "panel-top": PanelTop,
} satisfies Record<HomeFaviconToolIconKey, LucideIcon>;

const TEXT_JSON_TOOL_ICONS = {
  braces: Braces,
  table: Table,
  "minimize-2": Minimize2,
  "file-json": FileJson,
  binary: Binary,
  link: LinkIcon,
  "git-compare": GitCompare,
  dices: Dices,
  "code-xml": CodeXml,
  "letter-text": LetterText,
} satisfies Record<HomeTextJsonToolIconKey, LucideIcon>;

type HomeFeaturedToolCardProps = {
  href: string;
  label: string;
  slugHint: string;
  imageIconKey?: HomeImageToolIconKey;
  faviconIconKey?: HomeFaviconToolIconKey;
  textJsonIconKey?: HomeTextJsonToolIconKey;
};

export function HomeFeaturedToolCard({
  href,
  label,
  slugHint,
  imageIconKey,
  faviconIconKey,
  textJsonIconKey,
}: HomeFeaturedToolCardProps) {
  const ImageIcon = imageIconKey ? IMAGE_TOOL_ICONS[imageIconKey] : null;
  const FaviconIcon = faviconIconKey ? FAVICON_TOOL_ICONS[faviconIconKey] : null;
  const TextJsonIcon = textJsonIconKey ? TEXT_JSON_TOOL_ICONS[textJsonIconKey] : null;
  const PdfIcon = !ImageIcon && !FaviconIcon && !TextJsonIcon ? PDF_FEATURED_ICONS[slugHint] : null;
  const pdfVisual = !ImageIcon && !FaviconIcon && !TextJsonIcon && !PdfIcon ? getToolIcon(slugHint, label) : null;
  const MonochromeIcon = ImageIcon || FaviconIcon || TextJsonIcon || PdfIcon;

  return (
    <Link href={href} className="home-feature-card" prefetch={false}>
      <span className="home-feature-card__icon" aria-hidden>
        {MonochromeIcon ? <MonochromeIcon strokeWidth={1.5} /> : pdfVisual?.icon}
      </span>
      <span className="home-feature-card__label">{label}</span>
    </Link>
  );
}

type HomeFeaturedSectionProps = {
  id: string;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  children: ReactNode;
  className?: string;
  hideTitle?: boolean;
};

export function HomeFeaturedSection({
  id,
  title,
  viewAllHref,
  viewAllLabel,
  children,
  className,
  hideTitle = false,
}: HomeFeaturedSectionProps) {
  return (
    <section className={clsx("home-minimal-section", className)} aria-labelledby={id}>
      <h2 id={id} className={hideTitle ? "sr-only" : "home-minimal-section__title"}>
        {title}
      </h2>
      <div className="home-feature-grid">{children}</div>
      <p className="home-minimal-section__footer">
        <Link href={viewAllHref} className="home-minimal-section__link" prefetch={false}>
          {viewAllLabel}
        </Link>
      </p>
    </section>
  );
}
