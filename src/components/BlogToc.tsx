import { getTranslations } from "next-intl/server";
import type { BlogSection } from "@/lib/types";

export async function BlogToc({ sections }: { sections: BlogSection[] }) {
  const t = await getTranslations("Blog");

  if (!sections?.length || sections.length < 3) return null;

  return (
    <nav
      aria-label={t("tocAriaLabel")}
      className="rounded-none border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <p className="text-sm font-semibold text-black dark:text-neutral-200">{t("tocLabel")}</p>
      <ol className="mt-2 space-y-1 text-sm">
        {sections.map((s) => (
          <li key={s.id}>
            <a className="text-black hover:underline dark:text-neutral-200" href={`#${s.id}`}>
              {s.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
