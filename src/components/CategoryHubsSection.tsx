"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Braces,
  CodeXml,
  Crop,
  Database,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileType2,
  Globe,
  KeyRound,
  LetterText,
  Minimize2,
  Palette,
  RotateCw,
  Scale,
  Scissors,
  ShieldCheck,
  Sparkles,
  Table,
  Video,
  Wrench,
} from "lucide-react";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getInventoryToolsByCategory,
  listDedicatedInventoryHubLinks,
} from "@/lib/tools-inventory-query";

type CategoryHubsSectionProps = {
  /** Extra classes on the outer section (e.g. shell padding). */
  className?: string;
};

const CATEGORY_ICONS: Partial<Record<InventoryCategoryId, LucideIcon>> = {
  pdf: FileText,
  video: Video,
  mp4: Video,
  convert: ArrowLeftRight,
  compress: Minimize2,
  extract: Scissors,
  image: FileImage,
  jpg: FileImage,
  png: FileImage,
  mp3: FileAudio,
  audio: FileAudio,
  favicon: Sparkles,
  text: LetterText,
  json: Braces,
  yaml: FileCode,
  xml: CodeXml,
  developer: KeyRound,
  word: FileType2,
  excel: Table,
  crop: Crop,
  rotate: RotateCw,
  security: ShieldCheck,
  design: Palette,
  data: Database,
  productivity: Wrench,
  "unit-math": Scale,
  network: Globe,
};

function CategoryHubCard({
  href,
  title,
  categoryId,
  toolCount,
  toolCountLabel,
}: {
  href: string;
  title: string;
  categoryId: InventoryCategoryId;
  toolCount: number;
  toolCountLabel: string;
}) {
  const Icon = CATEGORY_ICONS[categoryId] ?? FileText;

  return (
    <Link href={href} className="category-hub-card" prefetch={false}>
      <span className="category-hub-card__icon" aria-hidden>
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <span className="category-hub-card__title">{title}</span>
      {toolCount > 0 ? (
        <span className="category-hub-card__count">{toolCountLabel}</span>
      ) : null}
    </Link>
  );
}

/**
 * Category dashboard grid — Industrial Matte hub cards with icon + tool count.
 * Homepage primary dashboard; also used sitewide via FooterToolsPanel.
 */
export function CategoryHubsSection({ className }: CategoryHubsSectionProps) {
  const t = useTranslations("Home");
  const tDir = useTranslations("ToolsDirectory");
  const categories = useMemo(() => {
    return listDedicatedInventoryHubLinks().map((category) => ({
      ...category,
      toolCount: getInventoryToolsByCategory(category.id).length,
    }));
  }, []);

  if (!categories.length) return null;

  return (
    <section
      className={clsx("category-hubs", className)}
      aria-labelledby="category-hubs-title"
    >
      <div className="category-hubs__head">
        <p className="category-hubs__eyebrow">{t("landing.categoriesEyebrow")}</p>
        <h2 id="category-hubs-title" className="category-hubs__title">
          {t("landing.categoriesTitle")}
        </h2>
        {t.has("landing.categoriesSubtitle") ? (
          <p className="category-hubs__subtitle">{t("landing.categoriesSubtitle")}</p>
        ) : null}
      </div>

      <nav aria-label={t("landing.heroCategoriesLabel")}>
        <ul className="category-hubs__grid">
          {categories.map((category) => (
            <li key={category.id} className="category-hubs__item">
              <CategoryHubCard
                href={category.href}
                title={category.title}
                categoryId={category.id as InventoryCategoryId}
                toolCount={category.toolCount}
                toolCountLabel={
                  category.toolCount === 1
                    ? tDir("toolCount", { count: category.toolCount })
                    : tDir("toolCountPlural", { count: category.toolCount })
                }
              />
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
