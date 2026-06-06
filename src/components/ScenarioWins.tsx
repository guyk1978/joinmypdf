import { getTranslations } from "next-intl/server";

export async function ScenarioWins() {
  const t = await getTranslations("ScenarioWins");

  const scenarios = [
    { title: t("invoicesTitle"), body: t("invoicesBody") },
    { title: t("legalTitle"), body: t("legalBody") },
    { title: t("photosTitle"), body: t("photosBody") },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">{t("heading")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">{t("subheading")}</p>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {scenarios.map((s) => (
          <li key={s.title} className="rounded-none border border-white/10 bg-white/[0.02] p-3">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">{s.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
