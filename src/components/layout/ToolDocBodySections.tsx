"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  buildEnrichedToolDocContent,
  resolveLocalizedToolDocFields,
  type ToolDocSynthesisTemplates,
} from "@/lib/tool-doc-content";

type ToolDocBodySectionsProps = {
  slug: string;
  title: string;
  description?: string | null;
  intent?: string | null;
  whyItMatters?: string | null;
  useCases?: string[] | null;
  labels?: {
    overview?: string;
    howItWorks?: string;
    useCases?: string;
    realWorldExample?: string;
    whyYouNeedThis?: string;
    keyword?: string;
    comingSoon?: string;
  };
  primaryKeyword?: string | null;
};

/**
 * Shared enriched DOC body: Overview, How it works, Real-world example, Use cases.
 * Always resolves copy through the active locale — no English mid-paragraph fallbacks.
 */
export function ToolDocBodySections({
  slug,
  title,
  description,
  intent,
  whyItMatters,
  useCases,
  labels,
  primaryKeyword,
}: ToolDocBodySectionsProps) {
  const locale = useLocale();
  const tModal = useTranslations("ToolModal");
  const tTools = useTranslations("Tools");
  const tCard = useTranslations("ToolCard");

  const templates = useMemo((): ToolDocSynthesisTemplates => {
    const pick = (key: string, fallback: string) => {
      if (!tModal.has(key)) return fallback;
      try {
        // Keep the {toolName} token so synthesis can fill the resolved title.
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
      realWorldHeading: labels?.realWorldExample ?? pick("realWorldExample", "Real-world example"),
      whyYouNeedThisHeading: labels?.whyYouNeedThis ?? pick("whyYouNeedThis", "Why you need this"),
    };
  }, [tModal, labels?.realWorldExample, labels?.whyYouNeedThis]);

  const content = useMemo(() => {
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

    const exampleKey = `examples.${slug}`;
    const realWorldExampleBody = tCard.has(exampleKey) ? tCard(exampleKey) : null;

    return buildEnrichedToolDocContent({
      slug,
      title: localized.title,
      locale,
      description: localized.description,
      intent: localized.intent,
      whyItMatters: localized.whyItMatters,
      useCases: localized.useCases,
      realWorldExampleBody,
      templates,
    });
  }, [
    slug,
    title,
    description,
    intent,
    whyItMatters,
    useCases,
    locale,
    tTools,
    tCard,
    templates,
  ]);

  const overviewHeading = labels?.overview ?? (tModal.has("overview") ? tModal("overview") : "Overview");
  const howHeading =
    labels?.howItWorks ?? (tModal.has("howItWorks") ? tModal("howItWorks") : "How it works");
  const useCasesHeading =
    labels?.useCases ?? (tModal.has("useCases") ? tModal("useCases") : "Use cases");

  const resolvedKeyword =
    locale === "en" ? primaryKeyword ?? null : null;

  const hasOverview = content.overviewParagraphs.length > 0;
  const hasHow = content.howItWorksParagraphs.length > 0;

  if (!hasOverview && !hasHow && !content.realWorldExample && content.useCases.length === 0) {
    return (
      <section className="tool-modal-docs__section">
        <p className="tool-modal-docs__text tool-modal-docs__text--muted">
          {labels?.comingSoon ??
            (tModal.has("comingSoon") ? tModal("comingSoon") : "Documentation for this tool is coming soon.")}
        </p>
      </section>
    );
  }

  return (
    <>
      {hasOverview ? (
        <section className="tool-modal-docs__section" aria-labelledby="tool-docs-overview">
          <h2 id="tool-docs-overview" className="tool-modal-docs__heading">
            {overviewHeading}
          </h2>
          {content.overviewParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 64)} className="tool-modal-docs__text">
              {paragraph}
            </p>
          ))}
          {resolvedKeyword ? (
            <p className="tool-modal-docs__meta">
              <span className="tool-modal-docs__meta-label">
                {labels?.keyword ?? (tModal.has("keyword") ? tModal("keyword") : "Focus")}
              </span>
              <span className="tool-modal-docs__meta-value">{resolvedKeyword}</span>
            </p>
          ) : null}
        </section>
      ) : null}

      {hasHow ? (
        <section className="tool-modal-docs__section" aria-labelledby="tool-docs-how">
          <h2 id="tool-docs-how" className="tool-modal-docs__heading">
            {howHeading}
          </h2>
          {content.howItWorksParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 64)} className="tool-modal-docs__text">
              {paragraph}
            </p>
          ))}
        </section>
      ) : null}

      {content.realWorldExample ? (
        <section className="tool-modal-docs__section" aria-labelledby="tool-docs-real-world">
          <h2 id="tool-docs-real-world" className="tool-modal-docs__heading">
            {content.realWorldExample.heading}
          </h2>
          <p className="tool-modal-docs__text tool-modal-docs__text--example">
            {content.realWorldExample.body}
          </p>
        </section>
      ) : null}

      {content.useCases.length > 0 ? (
        <section className="tool-modal-docs__section" aria-labelledby="tool-docs-use-cases">
          <h2 id="tool-docs-use-cases" className="tool-modal-docs__heading">
            {useCasesHeading}
          </h2>
          <ul className="tool-modal-docs__list">
            {content.useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
