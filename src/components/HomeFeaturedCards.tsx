"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { ArrowRight, Braces, Binary, Clock, CodeXml, Crop, Database, Dices, Disc3, Expand, FileAudio, FileCode, FileImage, FileJson, FileMusic, FileText, FileType2, Fingerprint, GitCompare, Globe, Hash, ImageDown, KeyRound, Layers, LetterText, Link as LinkIcon, Minimize2, Music, PanelTop, PenLine, Pipette, QrCode, RotateCw, Scale, Scissors, ShieldCheck, Smartphone, Sparkles, Split, SquarePen, Combine, Table, ArrowLeftRight, Tags, Volume2, AudioLines, type LucideIcon } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { ToolCardGrid } from "@/components/ToolCardGrid";
import { PaginatedToolCardGrid } from "@/components/PaginatedToolCardGrid";
import { getToolIcon } from "@/lib/tool-icons";
import type { HomeImageToolIconKey } from "@/lib/image-tools";
import type { HomeFaviconToolIconKey } from "@/lib/favicon-tools";
import type { HomeTextJsonToolIconKey } from "@/lib/text-json-tools";
import type { HomeDeveloperToolIconKey } from "@/lib/developer-tools";
import type { HomeDataConversionToolIconKey } from "@/lib/data-conversion-tools";
import type { HomeSecurityToolIconKey } from "@/lib/security-tools";
import type { HomeProductivityToolIconKey } from "@/lib/productivity-tools";
import type { HomeAudioToolIconKey } from "@/lib/tool-module";

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
  "pdf-to-word": FileType2,
  "word-to-pdf": FileText,
  "jpg-to-pdf": FileImage,
  "protect-pdf": ShieldCheck,
  "sign-pdf": PenLine,
  "pdf-text-editor": SquarePen,
  "rotate-pdf": RotateCw,
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

const AUDIO_TOOL_ICONS = {
  music: Music,
  "minimize-2": Minimize2,
  "arrow-left-right": ArrowLeftRight,
  "file-audio": FileAudio,
  scissors: Scissors,
  "audio-waveform": AudioLines,
  disc: Disc3,
  "file-music": FileMusic,
  "volume-2": Volume2,
  tags: Tags,
} satisfies Record<HomeAudioToolIconKey, LucideIcon>;

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
  audioIconKey?: HomeAudioToolIconKey;
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
  audioIconKey,
}: HomeFeaturedToolCardProps) {
  const ImageIcon = imageIconKey ? IMAGE_TOOL_ICONS[imageIconKey] : null;
  const FaviconIcon = faviconIconKey ? FAVICON_TOOL_ICONS[faviconIconKey] : null;
  const TextJsonIcon = textJsonIconKey ? TEXT_JSON_TOOL_ICONS[textJsonIconKey] : null;
  const DeveloperIcon = developerIconKey ? DEVELOPER_TOOL_ICONS[developerIconKey] : null;
  const DataConversionIcon = dataConversionIconKey ? DATA_CONVERSION_TOOL_ICONS[dataConversionIconKey] : null;
  const SecurityIcon = securityIconKey ? SECURITY_TOOL_ICONS[securityIconKey] : null;
  const ProductivityIcon = productivityIconKey ? PRODUCTIVITY_TOOL_ICONS[productivityIconKey] : null;
  const AudioIcon = audioIconKey ? AUDIO_TOOL_ICONS[audioIconKey] : null;
  const PdfIcon =
    !ImageIcon &&
    !FaviconIcon &&
    !TextJsonIcon &&
    !DeveloperIcon &&
    !DataConversionIcon &&
    !SecurityIcon &&
    !ProductivityIcon &&
    !AudioIcon
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
    !AudioIcon &&
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
    AudioIcon ||
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
  /** Compact dashboard layout — visible section header + inline view-all link. */
  variant?: "default" | "dashboard";
  /** Limit visible cards with a "Show more" control (default: on). Pass false to show all at once. */
  paginate?: boolean;
};

export function HomeFeaturedSection({
  id,
  title,
  viewAllHref,
  viewAllLabel,
  children,
  className,
  hideTitle = false,
  variant = "default",
  paginate,
}: HomeFeaturedSectionProps) {
  const isDashboard = variant === "dashboard";
  const usePagination = paginate !== false;
  const gridClassName = isDashboard ? "tool-card-grid--dashboard" : undefined;
  const gridContent = usePagination ? (
    <PaginatedToolCardGrid className={gridClassName}>{children}</PaginatedToolCardGrid>
  ) : (
    <ToolCardGrid className={clsx("tool-card-grid--stretch", gridClassName)}>{children}</ToolCardGrid>
  );

  return (
    <section
      className={clsx("home-minimal-section", isDashboard && "home-minimal-section--dashboard", className)}
      aria-labelledby={id}
    >
      {isDashboard ? (
        <div className="home-minimal-section__header">
          <h2 id={id} className="home-minimal-section__title home-minimal-section__title--dashboard">
            {title}
          </h2>
          <Link
            href={viewAllHref}
            className="home-minimal-section__link home-minimal-section__link--header"
            prefetch={false}
          >
            {viewAllLabel}
            <ArrowRight className="home-minimal-section__link-icon" aria-hidden />
          </Link>
        </div>
      ) : (
        <h2 id={id} className={hideTitle ? "sr-only" : "home-minimal-section__title"}>
          {title}
        </h2>
      )}
      {gridContent}
      {!isDashboard ? (
        <p className="home-minimal-section__footer">
          <Link href={viewAllHref} className="home-minimal-section__link" prefetch={false}>
            {viewAllLabel}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
