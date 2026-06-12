import { getTranslations } from "next-intl/server";
import { clsx } from "clsx";
import type { BlogSection } from "@/lib/types";

type BlogArticleTocProps = {
  sections: BlogSection[];
  className?: string;
  sticky?: boolean;
};

export async function BlogArticleToc({ sections, className, sticky = false }: BlogArticleTocProps) {
  const t = await getTranslations("Blog");

  if (!sections?.length || sections.length < 3) return null;

  return (
    <nav
      aria-label={t("tocAriaLabel")}
      className={clsx(
        "article-toc rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50",
        sticky && "article-toc--sticky",
        className,
      )}
    >
      <p className="article-toc__label text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">
        {t("tocLabel")}
      </p>
      <ol className="article-toc__list mt-4 space-y-2.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              className="article-toc__link block text-sm leading-snug text-neutral-400 transition-colors hover:text-neutral-100"
              href={`#${s.id}`}
            >
              {s.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** @deprecated Use BlogArticleToc */
export const BlogToc = BlogArticleToc;
