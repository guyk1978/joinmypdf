import { getTranslations } from "next-intl/server";

type LocalProcessingInfographicProps = {
  className?: string;
  headline?: string;
  headingAs?: "h1" | "h2";
};

export async function LocalProcessingInfographic({
  className = "",
  headline,
  headingAs = "h2",
}: LocalProcessingInfographicProps) {
  const t = await getTranslations("Hero");
  const Heading = headingAs;
  const headlineText = headline ?? (headingAs === "h1" ? t("headline") : t("defaultHeadline"));

  const cardClass =
    "rounded-none border border-neutral-300 bg-neutral-100 p-3 dark:border-neutral-800 dark:bg-neutral-900";
  const iconClass =
    "mb-3 flex h-12 w-12 items-center justify-center rounded-none bg-neutral-200 text-xl text-black dark:bg-neutral-800 dark:text-neutral-200";

  return (
    <section
      className={`mx-auto max-w-6xl px-4 py-12 text-center ${className}`.trim()}
      aria-labelledby="local-processing-heading"
    >
      <Heading
        id="local-processing-heading"
        className="mx-auto mb-3 max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-black dark:text-neutral-200 md:text-4xl"
      >
        {headlineText}
      </Heading>
      <p className="mx-auto mb-10 max-w-2xl text-base text-black dark:text-neutral-200 md:text-lg">
        {t("subheadline")}
      </p>
      <div className="mb-10 grid grid-cols-1 gap-2 text-start md:grid-cols-3">
        <div className={cardClass}>
          <div className={iconClass}>🛡️</div>
          <h3 className="mb-1.5 text-lg font-extrabold text-black dark:text-neutral-200">{t("privateTitle")}</h3>
          <p className="text-sm text-black dark:text-neutral-200">{t("privateBody")}</p>
        </div>
        <div className={cardClass}>
          <div className={iconClass}>⚡</div>
          <h3 className="mb-1.5 text-lg font-extrabold text-black dark:text-neutral-200">{t("fastTitle")}</h3>
          <p className="text-sm text-black dark:text-neutral-200">{t("fastBody")}</p>
        </div>
        <div className={cardClass}>
          <div className={iconClass}>✨</div>
          <h3 className="mb-1.5 text-lg font-extrabold text-black dark:text-neutral-200">{t("limitsTitle")}</h3>
          <p className="text-sm text-black dark:text-neutral-200">{t("limitsBody")}</p>
        </div>
      </div>
    </section>
  );
}
