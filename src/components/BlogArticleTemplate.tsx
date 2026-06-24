import type { ReactNode } from "react";

type BlogArticleTemplateProps = {
  children: ReactNode;
};

/** Fixed centered layout for all JoinMyPDF blog articles — no sidebar, monochrome, uniform spacing. */
export function BlogArticleTemplate({ children }: BlogArticleTemplateProps) {
  return (
    <main className="article-page">
      <div className="article-template mx-auto w-full max-w-3xl px-4 py-10 md:px-8 md:py-14">
        {children}
      </div>
    </main>
  );
}
