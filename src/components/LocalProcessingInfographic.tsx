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
        className="mx-auto mb-4 max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-slate-900 dark:text-white md:text-4xl"
      >
        {headlineText}
      </Heading>
      <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 text-base md:text-lg">
        {t("subheadline")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 mb-4 text-xl">
            🛡️
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{t("privateTitle")}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t("privateBody")}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 mb-4 text-xl">
            ⚡
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{t("fastTitle")}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t("fastBody")}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 mb-4 text-xl">
            ✨
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{t("limitsTitle")}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t("limitsBody")}</p>
        </div>
      </div>
    </section>
  );
}
