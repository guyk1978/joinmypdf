"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { ArrowUpRight, GitBranch } from "lucide-react";
import { PromoSurface } from "@/components/PromoSurface";

type Props = {
  className?: string;
};

/** Related-tool matte card shown below tool workspaces. */
export function MapDiagramCrossLink({ className }: Props) {
  const t = useTranslations("Partners");

  return (
    <PromoSurface
      ariaLabel={t("mapDiagramAria")}
      className={clsx("tool-related-card partner-mapdiagram w-full p-5 md:p-6", className)}
    >
      <p className="tool-related-card__eyebrow mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
        {t("relatedToolEyebrow")}
      </p>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/10 bg-white/[0.04]">
          <GitBranch className="h-6 w-6 text-neutral-300" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-neutral-400 md:text-base">
            {t.rich("mapDiagramBody", {
              brand: (chunks) => <span className="font-semibold text-white">{chunks}</span>,
            })}
          </p>
          <a
            href="https://mapdiagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-none border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-neutral-100 transition-colors hover:border-white/25 hover:bg-white/[0.1]"
          >
            {t("mapDiagramCta")}
            <ArrowUpRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          </a>
        </div>
      </div>
    </PromoSurface>
  );
}