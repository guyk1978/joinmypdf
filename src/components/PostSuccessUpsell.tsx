"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { POST_SUCCESS_UPSELL } from "@/lib/post-success-upsell-config";

type Props = {
  operation: string;
};

export function PostSuccessUpsell({ operation }: Props) {
  const t = useTranslations("PostSuccessUpsell");
  const config = POST_SUCCESS_UPSELL[operation] ?? [];

  if (!config.length) return null;

  return (
    <div className="post-success-upsell mt-6 space-y-2">
      <aside className="rounded-none border border-neutral-300/80 bg-transparent p-4 dark:border-white/10">
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
      <WattQuickCrossLink />
    </div>
  );
}
