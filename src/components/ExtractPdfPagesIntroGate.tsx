"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./extract-pdf-pages-landing.css";


type ExtractPdfPagesIntroGateProps = {
  /** When false, children render immediately (non–extract-pages tools). */
  active?: boolean;
  children: ReactNode;
};

function FrostPage({
  title,
  badge,
  className,
}: {
  title: string;
  badge: number | string;
  className?: string;
}) {
  return (
    <article className={className}>
      <header className="ext-fs__page-head">
        <span className="ext-fs__page-title">{title}</span>
        <span className="ext-fs__page-badge">{badge}</span>
      </header>
      <div className="ext-fs__page-body">
        <span className="ext-fs__rule ext-fs__rule--wide" />
        <span className="ext-fs__rule" />
        <span className="ext-fs__rule ext-fs__rule--mid" />
        <span className="ext-fs__rule" />
        <span className="ext-fs__rule ext-fs__rule--short" />
        <span className="ext-fs__rule ext-fs__rule--mid" />
      </div>
    </article>
  );
}

/**
 * One-way cinematic fullscreen splash for Extract PDF Pages Online.
 * Frosted multi-page stack → cursor peel → particle trail → glowing single page.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function ExtractPdfPagesIntroGate({
  active = true,
  children,
}: ExtractPdfPagesIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-extract-intro",
  });
  const t = useTranslations("ExtractPdfPagesLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="ext-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ext-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ext-fs__header">
          <h1 id="ext-fs-title" className="ext-fs__title">
            <span className="ext-fs__title-brand">{t("brand")}</span>
            <span className="ext-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ext-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ext-fs__stage" aria-hidden>
          <div className="ext-fs__scene">
            <div
              className="ext-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="ext-fs__card">
                <div className="ext-fs__board">
                  <div className="ext-fs__source">
                    <span className="ext-fs__label">{t("sourceLabel")}</span>
                    <div className="ext-fs__stack">
                      <FrostPage
                        className="ext-fs__sheet ext-fs__sheet--back"
                        title={t("pageLabel", { n: 4 })}
                        badge={4}
                      />
                      <FrostPage
                        className="ext-fs__sheet ext-fs__sheet--mid"
                        title={t("pageLabel", { n: 3 })}
                        badge={3}
                      />
                      <FrostPage
                        className="ext-fs__sheet ext-fs__sheet--front"
                        title={t("pageLabel", { n: 1 })}
                        badge={1}
                      />
                      <FrostPage
                        className="ext-fs__sheet ext-fs__sheet--peel"
                        title={t("pageLabel", { n: 2 })}
                        badge={2}
                      />
                    </div>
                  </div>

                  <div className="ext-fs__bridge">
                    <span className="ext-fs__trail" />
                    <span className="ext-fs__shimmer" />
                    <div className="ext-fs__particles">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className="ext-fs__result">
                    <span className="ext-fs__label">{t("resultLabel")}</span>
                    <div className="ext-fs__output">
                      <FrostPage
                        className="ext-fs__sheet ext-fs__sheet--out"
                        title={t("pageLabel", { n: 2 })}
                        badge={2}
                      />
                      <span className="ext-fs__glow" />
                    </div>
                  </div>

                  <div className="ext-fs__cursor">
                    <span className="ext-fs__cursor-pointer" />
                    <span className="ext-fs__cursor-click" />
                  </div>
                </div>

                <span className="ext-fs__ok">
                  <span className="ext-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ext-fs__footer">
          <button type="button" className="ext-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ext-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
