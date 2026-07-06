"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { POST_SUCCESS_UPSELL } from "@/lib/post-success-upsell-config";

type Props = {
  operation: string;
  fileContext?: string;
  sourceFile?: File | null;
};

export function PostSuccessUpsell({ operation, fileContext, sourceFile }: Props) {
  const t = useTranslations("PostSuccessUpsell");
  const { headline, slug } = useToolPageShell();
  const { fileContext: contextFile, registerFile } = useToolFeedback();
  const config = POST_SUCCESS_UPSELL[operation] ?? [];

  useEffect(() => {
    if (sourceFile && slug) {
      registerFile(sourceFile, slug);
    }
    return () => registerFile(null);
  }, [sourceFile, slug, registerFile]);

  return (
    <div className="post-success-panel mt-6 space-y-4">
      <ToolSuccessEngagement pageTitle={headline} fileContext={fileContext ?? contextFile} />

      {config.length ? (
        <aside className="post-success-upsell rounded-none border border-neutral-300/80 bg-transparent p-4 dark:border-white/10">
          <p className="text-sm font-semibold text-ink">{t("heading")}</p>
          <ul className="mt-3 space-y-3">
            {config.map((row) => (
              <li key={`${row.href}-${row.card}`}>
                <Link
                  href={row.href}
                  onClick={() => capture(EVENTS.upsell_click, { target: row.href, from: operation })}
                  className="block rounded-none border border-neutral-300/80 bg-transparent p-3 transition hover:border-neutral-400 dark:border-white/10 dark:hover:border-white/20"
                >
                  <span className="font-medium text-black dark:text-neutral-200">{t(`cards.${row.card}.title`)}</span>
                  <p className="mt-1 text-sm text-ink-muted">{t(`cards.${row.card}.body`)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <WattQuickCrossLink />
    </div>
  );
}
