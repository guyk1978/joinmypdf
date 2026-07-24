"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MP3_TOOLS_HUB_PATH } from "@/lib/mp3-tools";

export function RelatedAudioToolsHub() {
  const t = useTranslations("RelatedAudioTools");

  return (
    <aside className="related-audio-tools-hub">
      <p className="text-sm leading-relaxed text-[#a3a3a3]">{t("hubPrompt")}</p>
      <Link
        href={MP3_TOOLS_HUB_PATH}
        className="mt-3 inline-flex text-xs uppercase tracking-widest text-white transition-colors hover:text-[#d4d4d4]"
        prefetch={false}
      >
        {t("viewAllMp3Tools")}
      </Link>
    </aside>
  );
}
