"use client";

import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

/** Floating privacy seal — subtle security badge at the bottom of the tool workspace. */
export function ToolLocalProcessingBar() {
  const t = useTranslations("Workspace.common");

  return (
    <div className="tool-privacy-seal pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-5 md:pb-6" role="note">
      <div className="tool-privacy-seal__pill pointer-events-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-neutral-950/70 px-4 py-2 text-[11px] font-semibold tracking-wide text-emerald-200/90 shadow-[0_0_24px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md dark:border-emerald-400/30 dark:bg-black/50 dark:text-emerald-100/90">
        <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
        <span>{t.has("privacyBadge") ? t("privacyBadge") : t("privacyStatement")}</span>
      </div>
    </div>
  );
}
