"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FaviconPreviewer, type FaviconPreviewerLabels } from "@/components/FaviconPreviewer";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type FaviconPreviewerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function FaviconPreviewerWorkspace({ tool, slug }: FaviconPreviewerWorkspaceProps) {
  const t = useTranslations("FaviconPreviewer");
  const [previewActive, setPreviewActive] = useState(false);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<FaviconPreviewerLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      orUseUrl: t("orUseUrl"),
      urlLabel: t("urlLabel"),
      urlPlaceholder: t("urlPlaceholder"),
      applyUrl: t("applyUrl"),
      titleLabel: t("titleLabel"),
      titlePlaceholder: t("titlePlaceholder"),
      uiThemeLabel: t("uiThemeLabel"),
      themeLight: t("themeLight"),
      themeDark: t("themeDark"),
      previewInstructions: t("previewInstructions"),
      browserTabLabel: t("browserTabLabel"),
      bookmarksLabel: t("bookmarksLabel"),
      homeScreenLabel: t("homeScreenLabel"),
      bookmarkOtherSite: t("bookmarkOtherSite"),
      invalidFile: t("invalidFile"),
      invalidUrl: t("invalidUrl"),
      replaceFavicon: t("replaceFavicon"),
      downloadPack: t("downloadPack"),
      downloadingPack: t("downloadingPack"),
      downloadFailed: t("downloadFailed"),
      library: {
        openLibrary: t("library.openLibrary"),
        libraryTitle: t("library.libraryTitle"),
        libraryHint: t("library.libraryHint"),
        closeLibrary: t("library.closeLibrary"),
        usePreset: t("library.usePreset"),
        categories: {
          tech: t("library.categories.tech"),
          ecommerce: t("library.categories.ecommerce"),
          minimalist: t("library.categories.minimalist"),
          emoji: t("library.categories.emoji"),
          social: t("library.categories.social"),
        },
        presets: {
          pulseSaaS: t("library.presets.pulseSaaS"),
          orbitApi: t("library.presets.orbitApi"),
          stackCloud: t("library.presets.stackCloud"),
          neonDev: t("library.presets.neonDev"),
          hexLabs: t("library.presets.hexLabs"),
          cartShop: t("library.presets.cartShop"),
          bagMarket: t("library.presets.bagMarket"),
          tagSale: t("library.presets.tagSale"),
          storeFront: t("library.presets.storeFront"),
          monoMark: t("library.presets.monoMark"),
          dotMark: t("library.presets.dotMark"),
          lineMark: t("library.presets.lineMark"),
          squareMark: t("library.presets.squareMark"),
          arcMark: t("library.presets.arcMark"),
          emojiRocket: t("library.presets.emojiRocket"),
          emojiStar: t("library.presets.emojiStar"),
          emojiFire: t("library.presets.emojiFire"),
          emojiSpark: t("library.presets.emojiSpark"),
          emojiHeart: t("library.presets.emojiHeart"),
          shareNode: t("library.presets.shareNode"),
          chatBubble: t("library.presets.chatBubble"),
          likeMark: t("library.presets.likeMark"),
          waveSignal: t("library.presets.waveSignal"),
        },
      },
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell active={previewActive} showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="favicon-previewer-tool-page">
        <FaviconPreviewer
          labels={labels}
          toolSlug={slug}
          operation={tool.operation}
          onPreviewActiveChange={setPreviewActive}
        />
      </div>
    </WorkspaceUploadShell>
  );
}
