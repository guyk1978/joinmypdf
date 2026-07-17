"use client";

import { useMemo, type CSSProperties } from "react";
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
import { getCategoryAccentCssVar } from "@/lib/category-accent-colors";
import {
  getInventoryToolsByCategory,
  listDedicatedInventoryHubLinks,
} from "@/lib/tools-inventory-query";

type CategoryHubsSectionProps = {
  /** Extra classes on the outer section (e.g. shell padding). */
  className?: string;
  /** Hide eyebrow/title/subtitle — used on the homepage dashboard. */
  hideHead?: boolean;
  /** Tighter equal-cell action-dashboard grid. */
  dense?: boolean;
  /** Override nav aria-label when head is hidden. */
  navLabel?: string;
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
  blurb,
}: {
  href: string;
  title: string;
  categoryId: InventoryCategoryId;
  toolCount: number;
  toolCountLabel: string;
  blurb?: string;
}) {
  const Icon = CATEGORY_ICONS[categoryId] ?? FileText;
  const showMeta = toolCount > 0 || Boolean(blurb);

  return (
    <Link
      href={href}
      className="category-hub-card"
      prefetch={false}
      data-category={categoryId}
      style={{ "--category-accent": getCategoryAccentCssVar(categoryId) } as CSSProperties}
    >
      <span className="category-hub-card__icon" aria-hidden>
        <Icon size={28} strokeWidth={1.75} />
      </span>
      <span className="category-hub-card__text">
        <span className="category-hub-card__title">{title}</span>
        {showMeta ? (
          <span className="category-hub-card__meta">
            {toolCount > 0 ? (
              <span className="category-hub-card__count">{toolCountLabel}</span>
            ) : null}
            {toolCount > 0 && blurb ? (
              <span className="category-hub-card__sep" aria-hidden>
                ·
              </span>
            ) : null}
            {blurb ? <span className="category-hub-card__blurb">{blurb}</span> : null}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/**
 * Category dashboard grid — Industrial Matte hub cards with icon + tool count.
 * Homepage primary dashboard; also used sitewide via FooterToolsPanel.
 */
export function CategoryHubsSection({
  className,
  hideHead = false,
  dense = false,
  navLabel,
}: CategoryHubsSectionProps) {
  const t = useTranslations("Home");
  const tDir = useTranslations("ToolsDirectory");
  const categories = useMemo(() => {
    return listDedicatedInventoryHubLinks().map((category) => ({
      ...category,
      toolCount: getInventoryToolsByCategory(category.id).length,
    }));
  }, []);

  if (!categories.length) return null;

  const resolvedNavLabel = navLabel ?? t("landing.heroCategoriesLabel");
  const Root = hideHead ? "div" : "section";

  const resolveBlurb = (id: InventoryCategoryId, fallback: string) => {
    const key = `landing.categoryBlurbs.${id}`;
    return t.has(key) ? t(key) : fallback;
  };

  return (
    <Root
      className={clsx(
        "category-hubs",
        dense && "category-hubs--dense",
        className,
      )}
      {...(hideHead
        ? {}
        : { "aria-labelledby": "category-hubs-title" })}
    >
      {hideHead ? null : (
        <div className="category-hubs__head">
          <p className="category-hubs__eyebrow">{t("landing.categoriesEyebrow")}</p>
          <h2 id="category-hubs-title" className="category-hubs__title">
            {t("landing.categoriesTitle")}
          </h2>
          {t.has("landing.categoriesSubtitle") ? (
            <p className="category-hubs__subtitle">{t("landing.categoriesSubtitle")}</p>
          ) : null}
        </div>
      )}

      <nav aria-label={resolvedNavLabel}>
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
                blurb={resolveBlurb(
                  category.id as InventoryCategoryId,
                  category.blurb,
                )}
              />
            </li>
          ))}
        </ul>
      </nav>
    </Root>
  );
}
