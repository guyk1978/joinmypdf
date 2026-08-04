"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { ToolPageStorySections } from "@/components/layout/ToolPageStorySections";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { registry } from "@/lib/registry";
import {
  buildEnrichedToolDocContent,
  resolveLocalizedToolDocFields,
  type ToolDocSynthesisTemplates,
} from "@/lib/tool-doc-content";
import { parseToolHierarchyPath } from "@/lib/tool-hierarchy";
import { toolPagePaneRailClassName } from "@/lib/tool-ui";

type ToolWorkspaceOverviewProps = {
  className?: string;
  /** Cap visible paragraphs (DOC overview can be 2–3 blocks). */
  maxParagraphs?: number;
};

/**
 * Brief DOC overview mirrored under the primary tool/upload UI.
 * Always mounted in the CALC view (and dedicated tool pages) so crawlers
 * see indexable copy without opening the DOC tab.
 */
export function ToolWorkspaceOverview({
  className,
  maxParagraphs = 2,
}: ToolWorkspaceOverviewProps) {
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const shell = useToolPageShell();
  const tModal = useTranslations("ToolModal");
  const tTools = useTranslations("Tools");

  const slug =
    shell.slug ||
    parseToolHierarchyPath(pathname)?.slug ||
    "";

  const isToolRoute = pathname.includes("/tools/");

  const registryTool = slug
    ? registry.tools.find((entry) => entry.slug === slug)
    : undefined;

  const templates = useMemo((): ToolDocSynthesisTemplates => {
    const pick = (key: string, fallback: string) => {
      if (!tModal.has(key)) return fallback;
      try {
        return tModal(key, { toolName: "{toolName}" });
      } catch {
        return fallback;
      }
    };

    return {
      overviewExpand1: pick(
        "docOverviewExpand1",
        "{toolName} is a free, browser-based utility designed for fast everyday work. It helps you finish the job without installing desktop software or sending sensitive files to a third-party converter.",
      ),
      overviewExpand2: pick(
        "docOverviewExpand2",
        "Whether you are cleaning up a single file before a deadline or preparing assets for publishing, {toolName} keeps the interface focused on the task while privacy-first local processing runs in the background.",
      ),
      howItWorksSteps: pick(
        "docHowItWorksSteps",
        "Using {toolName} is straightforward: open the tool, add your file or paste your input, adjust any options you need, then run the action. Everything processes locally in your browser—nothing is uploaded to a remote server—so you can download the finished result as soon as processing completes.",
      ),
      howItWorksPrivacy: pick(
        "docHowItWorksPrivacy",
        "Because the workflow stays on your device, you keep full control of private documents, photos, and drafts. There is no account wall, no waiting in a cloud queue, and no copy of your file left behind after you close the tab.",
      ),
      realWorldFallback: pick(
        "docRealWorldFallback",
        "People use {toolName} when they need a fast, private way to finish this task in the browser—without installing software or uploading files.",
      ),
      useCaseDeadline: pick(
        "docUseCaseDeadline",
        "Finish a last-minute job with {toolName} without installing desktop software.",
      ),
      useCasePrivate: pick(
        "docUseCasePrivate",
        "Handle private files with {toolName} while keeping every byte on your device.",
      ),
      useCaseShare: pick(
        "docUseCaseShare",
        "Prepare a clean result with {toolName} before emailing, uploading, or publishing.",
      ),
      realWorldHeading: pick("realWorldExample", "Real-world example"),
      whyYouNeedThisHeading: pick("whyYouNeedThis", "Why you need this"),
    };
  }, [tModal]);

  const paragraphs = useMemo(() => {
    if (!slug) return [] as string[];

    const title = shell.headline || registryTool?.title || slug;
    const description = shell.subline || registryTool?.description || "";
    const intent = shell.tagline || registryTool?.intent || "";
    const whyItMatters =
      locale === "en" ? registryTool?.documentation?.whyItMatters ?? null : null;
    const useCases = locale === "en" ? registryTool?.useCases ?? null : null;

    const localized = resolveLocalizedToolDocFields({
      slug,
      locale,
      tTools,
      title,
      description,
      intent,
      whyItMatters,
      useCases,
    });

    const content = buildEnrichedToolDocContent({
      slug,
      title: localized.title,
      locale,
      description: localized.description,
      intent: localized.intent,
      whyItMatters: localized.whyItMatters,
      useCases: localized.useCases,
      templates,
    });

    // Prefer the DOC Overview block; fall back to whyItMatters when present.
    const fromOverview = content.overviewParagraphs;
    if (fromOverview.length) return fromOverview.slice(0, Math.max(1, maxParagraphs));
    if (content.whyItMatters) return [content.whyItMatters];
    return [] as string[];
  }, [
    slug,
    shell.headline,
    shell.subline,
    shell.tagline,
    registryTool,
    locale,
    tTools,
    templates,
    maxParagraphs,
  ]);

  if (!isToolRoute || !slug) return null;

  const headingId = "tool-workspace-overview-heading";
  const overviewHeading = tModal.has("overview") ? tModal("overview") : "Overview";
  const story = (
    <ToolPageStorySections
      slug={slug}
      headline={shell.headline}
      tagline={shell.tagline}
      subline={shell.subline}
    />
  );

  if (paragraphs.length === 0) {
    return (
      <section
        className={clsx(
          "tool-workspace-overview",
          toolPagePaneRailClassName,
          className,
        )}
        data-tool-overview="1"
      >
        {story}
      </section>
    );
  }

  return (
    <section
      className={clsx(
        "tool-workspace-overview",
        toolPagePaneRailClassName,
        className,
      )}
      aria-labelledby={headingId}
      data-tool-overview="1"
    >
      <h2 id={headingId} className="tool-workspace-overview__title">
        {overviewHeading}
      </h2>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 72)} className="tool-workspace-overview__text">
          {paragraph}
        </p>
      ))}
      {story}
    </section>
  );
}
