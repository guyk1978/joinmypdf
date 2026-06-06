import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

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

  return (
    <section
      className={`py-16 px-4 max-w-6xl mx-auto text-center ${className}`.trim()}
      aria-labelledby="local-processing-heading"
    >
      <Heading
        id="local-processing-heading"
        className="mx-auto mb-4 max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-black dark:text-neutral-200 dark:text-white md:text-4xl"
      >
        {headlineText}
      </Heading>
      <p className="text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200 max-w-2xl mx-auto mb-12 text-base md:text-lg">
        {t("subheadline")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-start mb-12">
        <div className="bg-white dark:bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 dark:border-neutral-300 dark:border-neutral-800 rounded-none p-4 dark:border-white/[0.08] dark:bg-white/[0.03] dark:backdrop-blur-md">
          <div className="w-12 h-12 rounded-none bg-neutral-200 dark:bg-neutral-800 dark:bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-black dark:text-neutral-200 mb-4 text-xl">
            🛡️
          </div>
          <h3 className="text-lg font-extrabold text-black dark:text-neutral-200 dark:text-white mb-2">{t("privateTitle")}</h3>
          <p className="text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{t("privateBody")}</p>
        </div>
        <div className="bg-white dark:bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 dark:border-neutral-300 dark:border-neutral-800 rounded-none p-4 dark:border-white/[0.08] dark:bg-white/[0.03] dark:backdrop-blur-md">
          <div className="w-12 h-12 rounded-none bg-neutral-900 dark:bg-neutral-900/30 flex items-center justify-center text-black dark:text-neutral-200 mb-4 text-xl">
            ⚡
          </div>
          <h3 className="text-lg font-extrabold text-black dark:text-neutral-200 dark:text-white mb-2">{t("fastTitle")}</h3>
          <p className="text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{t("fastBody")}</p>
        </div>
        <div className="bg-white dark:bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 dark:border-neutral-300 dark:border-neutral-800 rounded-none p-4 dark:border-white/[0.08] dark:bg-white/[0.03] dark:backdrop-blur-md">
          <div className="w-12 h-12 rounded-none bg-neutral-900 dark:bg-neutral-200 dark:bg-neutral-900 dark:bg-neutral-200/30 flex items-center justify-center text-black dark:text-neutral-200 mb-4 text-xl">
            ✨
          </div>
          <h3 className="text-lg font-extrabold text-black dark:text-neutral-200 dark:text-white mb-2">{t("limitsTitle")}</h3>
          <p className="text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{t("limitsBody")}</p>
        </div>
      </div>
    </section>
  );
}
