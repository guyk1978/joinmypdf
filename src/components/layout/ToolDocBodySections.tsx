"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { buildEnrichedToolDocContent } from "@/lib/tool-doc-content";

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
  const tModal = useTranslations("ToolModal");

  const content = useMemo(
    () =>
      buildEnrichedToolDocContent({
        slug,
        title,
        description,
        intent,
        whyItMatters,
        useCases,
        realWorldHeading: tModal.has("realWorldExample")
          ? tModal("realWorldExample")
          : labels?.realWorldExample ?? "Real-world example",
      }),
    [slug, title, description, intent, whyItMatters, useCases, tModal, labels?.realWorldExample],
  );

  const overviewHeading = labels?.overview ?? (tModal.has("overview") ? tModal("overview") : "Overview");
  const howHeading =
    labels?.howItWorks ?? (tModal.has("howItWorks") ? tModal("howItWorks") : "How it works");
  const useCasesHeading =
    labels?.useCases ?? (tModal.has("useCases") ? tModal("useCases") : "Use cases");

  const hasOverview = content.overviewParagraphs.length > 0;
  const hasHow = content.howItWorksParagraphs.length > 0;

  if (!hasOverview && !hasHow && !content.realWorldExample && content.useCases.length === 0) {
    return (
      <section className="tool-modal-docs__section">
        <p className="tool-modal-docs__text tool-modal-docs__text--muted">
          {labels?.comingSoon ?? "Documentation for this tool is coming soon."}
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
          {primaryKeyword ? (
            <p className="tool-modal-docs__meta">
              <span className="tool-modal-docs__meta-label">
                {labels?.keyword ?? (tModal.has("keyword") ? tModal("keyword") : "Focus")}
              </span>
              <span className="tool-modal-docs__meta-value">{primaryKeyword}</span>
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
