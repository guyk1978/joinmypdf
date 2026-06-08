import { getTranslations } from "next-intl/server";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { toolPageDashboardInset } from "@/lib/tool-ui";

type LocalProcessingInfographicProps = {
  className?: string;
  headline?: string;
  headingAs?: "h1" | "h2";
  layout?: "default" | "dashboard";
};

export async function LocalProcessingInfographic({
  className = "",
  headline,
  headingAs = "h2",
  layout = "default",
}: LocalProcessingInfographicProps) {
  const t = await getTranslations("Hero");
  const Heading = headingAs;
  const headlineText = headline ?? (headingAs === "h1" ? t("headline") : t("defaultHeadline"));
  const isDashboard = layout === "dashboard";

  const cardClass = isDashboard
    ? toolPageDashboardInset
    : "rounded-none border border-neutral-300 bg-neutral-100 p-3 dark:border-neutral-800 dark:bg-neutral-900";
  const iconClass = isDashboard
    ? "mb-2 flex h-10 w-10 items-center justify-center rounded-[10px] bg-black/[0.06] text-lg dark:bg-white/[0.06]"
    : "mb-3 flex h-12 w-12 items-center justify-center rounded-none bg-neutral-200 text-xl text-black dark:bg-neutral-800 dark:text-neutral-200";

  const body = (
    <>
      <Heading
        id="local-processing-heading"
        className={
          isDashboard
            ? "text-base font-semibold leading-snug tracking-tight text-ink dark:text-white md:text-lg"
            : "mx-auto mb-3 max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-black dark:text-neutral-200 md:text-4xl"
        }
      >
        {headlineText}
      </Heading>
      <p
        className={
          isDashboard
            ? "mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm"
            : "mx-auto mb-10 max-w-2xl text-base text-black dark:text-neutral-200 md:text-lg"
        }
      >
        {t("subheadline")}
      </p>
      <div className={isDashboard ? "mt-4 grid grid-cols-1 gap-3 text-start md:grid-cols-3" : "mb-10 grid grid-cols-1 gap-2 text-start md:grid-cols-3"}>
        <div className={cardClass}>
          <div className={iconClass}>🛡️</div>
          <h3 className={isDashboard ? "mb-1 text-sm font-bold text-ink dark:text-white" : "mb-1.5 text-lg font-extrabold text-black dark:text-neutral-200"}>
            {t("privateTitle")}
          </h3>
          <p className={isDashboard ? "text-xs leading-relaxed text-neutral-600 dark:text-neutral-400" : "text-sm text-black dark:text-neutral-200"}>
            {t("privateBody")}
          </p>
        </div>
        <div className={cardClass}>
          <div className={iconClass}>⚡</div>
          <h3 className={isDashboard ? "mb-1 text-sm font-bold text-ink dark:text-white" : "mb-1.5 text-lg font-extrabold text-black dark:text-neutral-200"}>
            {t("fastTitle")}
          </h3>
          <p className={isDashboard ? "text-xs leading-relaxed text-neutral-600 dark:text-neutral-400" : "text-sm text-black dark:text-neutral-200"}>
            {t("fastBody")}
          </p>
        </div>
        <div className={cardClass}>
          <div className={iconClass}>✨</div>
          <h3 className={isDashboard ? "mb-1 text-sm font-bold text-ink dark:text-white" : "mb-1.5 text-lg font-extrabold text-black dark:text-neutral-200"}>
            {t("limitsTitle")}
          </h3>
          <p className={isDashboard ? "text-xs leading-relaxed text-neutral-600 dark:text-neutral-400" : "text-sm text-black dark:text-neutral-200"}>
            {t("limitsBody")}
          </p>
        </div>
      </div>
    </>
  );

  if (isDashboard) {
    return (
      <ToolPageDashboardSection
        className={className}
        aria-labelledby="local-processing-heading"
      >
        {body}
      </ToolPageDashboardSection>
    );
  }

  return (
    <section
      className={`mx-auto max-w-6xl px-4 py-12 text-center ${className}`.trim()}
      aria-labelledby="local-processing-heading"
    >
      {body}
    </section>
  );
}
