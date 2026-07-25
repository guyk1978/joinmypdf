"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./quick-note-landing.css";


type QuickNoteIntroGateProps = {
  /** When false, children render immediately (non–quick-note tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Multi-Note Manager (quick-note).
 * Text input → local encryption storage node → color-coded sticky note cards.
 * Shows before the notes dashboard (embed modal and dedicated tool page).
 */
export function QuickNoteIntroGate({
  active = true,
  children,
}: QuickNoteIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-quick-note-intro",
  });
  const t = useTranslations("QuickNoteLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="qn-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qn-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="qn-fs__header">
          <h1 id="qn-fs-title" className="qn-fs__title">
            <span className="qn-fs__title-brand">{t("brand")}</span>
            <span className="qn-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="qn-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="qn-fs__stage" aria-hidden>
          <div className="qn-fs__scene">
            <div className="qn-fs__workspace animation-workspace">
              <div className="qn-fs__card">
                <div className="qn-fs__pipeline">
                  <div className="qn-fs__input">
                    <span className="qn-fs__tag">{t("inputTag")}</span>
                    <div className="qn-fs__editor">
                      <span className="qn-fs__title-line">{t("noteTitle")}</span>
                      <span className="qn-fs__body-line qn-fs__body-line--1" />
                      <span className="qn-fs__body-line qn-fs__body-line--2" />
                      <span className="qn-fs__body-line qn-fs__body-line--3" />
                      <span className="qn-fs__caret" />
                    </div>
                    <span className="qn-fs__privacy">{t("privacyBadge")}</span>
                  </div>

                  <div className="qn-fs__engine">
                    <span className="qn-fs__flow" />
                    <span className="qn-fs__core">
                      <span className="qn-fs__lock" />
                    </span>
                    <span className="qn-fs__packets">
                      <span className="qn-fs__packet qn-fs__packet--1" />
                      <span className="qn-fs__packet qn-fs__packet--2" />
                      <span className="qn-fs__packet qn-fs__packet--3" />
                    </span>
                  </div>

                  <div className="qn-fs__board">
                    <span className="qn-fs__tag qn-fs__tag--out">{t("boardTag")}</span>
                    <div className="qn-fs__notes">
                      <div className="qn-fs__sticky qn-fs__sticky--1">
                        <span className="qn-fs__sticky-tag">{t("tagIdeas")}</span>
                        <span className="qn-fs__sticky-line" />
                        <span className="qn-fs__sticky-line qn-fs__sticky-line--short" />
                      </div>
                      <div className="qn-fs__sticky qn-fs__sticky--2">
                        <span className="qn-fs__sticky-tag">{t("tagTasks")}</span>
                        <span className="qn-fs__sticky-line" />
                        <span className="qn-fs__sticky-line qn-fs__sticky-line--short" />
                      </div>
                      <div className="qn-fs__sticky qn-fs__sticky--3">
                        <span className="qn-fs__sticky-tag">{t("tagPrivate")}</span>
                        <span className="qn-fs__sticky-line" />
                        <span className="qn-fs__sticky-line qn-fs__sticky-line--short" />
                      </div>
                    </div>
                  </div>
                </div>

                <span className="qn-fs__particle qn-fs__particle--1" />
                <span className="qn-fs__particle qn-fs__particle--2" />
                <span className="qn-fs__particle qn-fs__particle--3" />
              </div>

              <span className="qn-fs__ok">
                <span className="qn-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="qn-fs__footer">
          <button type="button" className="qn-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="qn-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
