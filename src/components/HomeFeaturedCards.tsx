"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { Braces, Binary, Clock, CodeXml, Crop, Database, Dices, Expand, FileCode, FileImage, FileJson, Fingerprint, GitCompare, Globe, Hash, ImageDown, KeyRound, Layers, LetterText, Link as LinkIcon, Minimize2, PanelTop, Pipette, QrCode, RotateCw, Scale, Smartphone, Sparkles, Split, Combine, Table, ArrowLeftRight, type LucideIcon } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { ToolCardGrid } from "@/components/ToolCardGrid";
import { getToolIcon } from "@/lib/tool-icons";
import type { HomeImageToolIconKey } from "@/lib/image-tools";
import type { HomeFaviconToolIconKey } from "@/lib/favicon-tools";
import type { HomeTextJsonToolIconKey } from "@/lib/text-json-tools";
import type { HomeDeveloperToolIconKey } from "@/lib/developer-tools";
import type { HomeDataConversionToolIconKey } from "@/lib/data-conversion-tools";
import type { HomeSecurityToolIconKey } from "@/lib/security-tools";
import type { HomeProductivityToolIconKey } from "@/lib/productivity-tools";

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

const DEVELOPER_TOOL_ICONS = {
  globe: Globe,
  "qr-code": QrCode,
  "key-round": KeyRound,
} satisfies Record<HomeDeveloperToolIconKey, LucideIcon>;

const DATA_CONVERSION_TOOL_ICONS = {
  "arrow-left-right": ArrowLeftRight,
  table: Table,
  database: Database,
} satisfies Record<HomeDataConversionToolIconKey, LucideIcon>;

const SECURITY_TOOL_ICONS = {
  "key-round": KeyRound,
  hash: Hash,
  fingerprint: Fingerprint,
} satisfies Record<HomeSecurityToolIconKey, LucideIcon>;

const PRODUCTIVITY_TOOL_ICONS = {
  scale: Scale,
  clock: Clock,
  "letter-text": LetterText,
} satisfies Record<HomeProductivityToolIconKey, LucideIcon>;

type HomeFeaturedToolCardProps = {
  href: string;
  label: string;
  slugHint: string;
  imageIconKey?: HomeImageToolIconKey;
  faviconIconKey?: HomeFaviconToolIconKey;
  textJsonIconKey?: HomeTextJsonToolIconKey;
  developerIconKey?: HomeDeveloperToolIconKey;
  dataConversionIconKey?: HomeDataConversionToolIconKey;
  securityIconKey?: HomeSecurityToolIconKey;
  productivityIconKey?: HomeProductivityToolIconKey;
};

export function HomeFeaturedToolCard({
  href,
  label,
  slugHint,
  imageIconKey,
  faviconIconKey,
  textJsonIconKey,
  developerIconKey,
  dataConversionIconKey,
  securityIconKey,
  productivityIconKey,
}: HomeFeaturedToolCardProps) {
  const ImageIcon = imageIconKey ? IMAGE_TOOL_ICONS[imageIconKey] : null;
  const FaviconIcon = faviconIconKey ? FAVICON_TOOL_ICONS[faviconIconKey] : null;
  const TextJsonIcon = textJsonIconKey ? TEXT_JSON_TOOL_ICONS[textJsonIconKey] : null;
  const DeveloperIcon = developerIconKey ? DEVELOPER_TOOL_ICONS[developerIconKey] : null;
  const DataConversionIcon = dataConversionIconKey ? DATA_CONVERSION_TOOL_ICONS[dataConversionIconKey] : null;
  const SecurityIcon = securityIconKey ? SECURITY_TOOL_ICONS[securityIconKey] : null;
  const ProductivityIcon = productivityIconKey ? PRODUCTIVITY_TOOL_ICONS[productivityIconKey] : null;
  const PdfIcon =
    !ImageIcon &&
    !FaviconIcon &&
    !TextJsonIcon &&
    !DeveloperIcon &&
    !DataConversionIcon &&
    !SecurityIcon &&
    !ProductivityIcon
      ? PDF_FEATURED_ICONS[slugHint]
      : null;
  const pdfVisual =
    !ImageIcon &&
    !FaviconIcon &&
    !TextJsonIcon &&
    !DeveloperIcon &&
    !DataConversionIcon &&
    !SecurityIcon &&
    !ProductivityIcon &&
    !PdfIcon
      ? getToolIcon(slugHint, label)
      : null;
  const MonochromeIcon =
    ImageIcon ||
    FaviconIcon ||
    TextJsonIcon ||
    DeveloperIcon ||
    DataConversionIcon ||
    SecurityIcon ||
    ProductivityIcon ||
    PdfIcon;

  return (
    <ToolCard
      href={href}
      label={label}
      icon={MonochromeIcon ? <MonochromeIcon strokeWidth={1.5} /> : pdfVisual?.icon}
    />
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
      <ToolCardGrid>{children}</ToolCardGrid>
      <p className="home-minimal-section__footer">
        <Link href={viewAllHref} className="home-minimal-section__link" prefetch={false}>
          {viewAllLabel}
        </Link>
      </p>
    </section>
  );
}
