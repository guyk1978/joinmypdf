"use client";

import { Link } from "@/i18n/navigation";
import { LayoutGrid, Lightbulb, Pin, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { EmptyState } from "@/components/EmptyState";
import { MinimalToolCard } from "@/components/MinimalToolCard";
import { ToolCardGrid } from "@/components/ToolCardGrid";
import { usePinnedTools } from "@/hooks/usePinnedTools";
import { imBtnCta } from "@/lib/design-system";
import type { ToolGridItem } from "@/lib/tool-grid";

type PinnedToolsGridProps = {
  items: ToolGridItem[];
};

export function PinnedToolsGrid({ items }: PinnedToolsGridProps) {
  const t = useTranslations("PinnedTools");
  const { pinnedIds, hydrated } = usePinnedTools();
  const pinnedItems = items.filter((item) => pinnedIds.includes(item.slugHint));

  if (!hydrated) {
    return <p className="product-page-meta text-center">{t("loading")}</p>;
  }

  return (
    <div className="product-page-dashboard pinned-tools-page w-full pb-32">
      <section className="pinned-tools-guide" aria-labelledby="pinned-tools-guide-heading">
        <h2 id="pinned-tools-guide-heading" className="pinned-tools-guide__title">
          {t("guideTitle")}
        </h2>
        <p className="pinned-tools-guide__lead">{t("guideLead")}</p>

        <ul className="pinned-tools-guide__list">
          <li className="pinned-tools-guide__item">
            <Pin className="pinned-tools-guide__icon" size={18} strokeWidth={2} aria-hidden />
            <div>
              <h3 className="pinned-tools-guide__item-title">{t("howTitle")}</h3>
              <p className="pinned-tools-guide__item-text">{t("howText")}</p>
            </div>
          </li>
          <li className="pinned-tools-guide__item">
            <Lightbulb className="pinned-tools-guide__icon" size={18} strokeWidth={2} aria-hidden />
            <div>
              <h3 className="pinned-tools-guide__item-title">{t("tipsTitle")}</h3>
              <p className="pinned-tools-guide__item-text">{t("tipsText")}</p>
            </div>
          </li>
          <li className="pinned-tools-guide__item">
            <ShieldCheck className="pinned-tools-guide__icon" size={18} strokeWidth={2} aria-hidden />
            <div>
              <h3 className="pinned-tools-guide__item-title">{t("privacyTitle")}</h3>
              <p className="pinned-tools-guide__item-text">{t("privacyText")}</p>
            </div>
          </li>
        </ul>
      </section>

      <section className="pinned-tools-library" aria-labelledby="pinned-tools-library-heading">
        <div className="pinned-tools-library__header">
          <h2 id="pinned-tools-library-heading" className="pinned-tools-library__title">
            {t("libraryTitle")}
          </h2>
          {pinnedItems.length > 0 ? (
            <p className="product-page-meta" aria-live="polite">
              {t("savedCount", { count: pinnedItems.length })}
            </p>
          ) : null}
        </div>

        {pinnedItems.length === 0 ? (
          <EmptyState
            icon={<Pin className="h-9 w-9" strokeWidth={1.75} aria-hidden />}
            title={t("emptyTitle")}
            description={t("emptyState")}
          >
            <Link
              href="/tools/"
              className={clsx(imBtnCta, "im-btn-cta--rounded inline-flex gap-2")}
              prefetch={false}
            >
              <LayoutGrid className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {t("exploreAllTools")}
            </Link>
          </EmptyState>
        ) : (
          <ToolCardGrid className="pinned-tools-grid">
            {pinnedItems.map((item) => (
              <MinimalToolCard
                key={item.href}
                href={item.href}
                label={item.label}
                description={item.description}
                slug={item.slugHint}
              />
            ))}
          </ToolCardGrid>
        )}
      </section>
    </div>
  );
}
