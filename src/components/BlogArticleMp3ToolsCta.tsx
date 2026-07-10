"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MP3_TOOLS_HUB_PATH } from "@/lib/mp3-tools";

export function BlogArticleMp3ToolsCta() {
  const t = useTranslations("Blog");

  return (
    <aside className="article-mp3-tools-cta my-4 border border-[#262626] bg-[#0a0a0a] p-4">
      <p className="article-prose m-0">
        {t.rich("mp3ToolsHubCta", {
          link: (chunks) => (
            <Link
              href={MP3_TOOLS_HUB_PATH}
              className="font-medium text-white underline decoration-[#404040] underline-offset-[0.2em] transition-colors hover:decoration-[#a3a3a3]"
              prefetch={false}
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </aside>
  );
}
