"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./text-workspace-landing.css";

type IntroPhase = "intro" | "workspace";

type TextWorkspaceIntroGateProps = {
  /** When false, children render immediately (non–text-workspace tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Text Workspace.
 * Writing canvas → find/replace engine → export cards → Workspace Ready.
 * Shows before the editor workspace (embed modal and dedicated tool page).
 */
export function TextWorkspaceIntroGate({
  active = true,
  children,
}: TextWorkspaceIntroGateProps) {
  const introActive = active;
  const t = useTranslations("TextWorkspaceLanding");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-text-workspace-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-text-workspace-intro");
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introActive, phase]);

  const startTool = useCallback(() => {
    setPhase("workspace");
  }, []);

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="tw-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tw-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="tw-fs__header">
          <h1 id="tw-fs-title" className="tw-fs__title">
            <span className="tw-fs__title-brand">{t("brand")}</span>
            <span className="tw-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="tw-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="tw-fs__stage" aria-hidden>
          <div className="tw-fs__scene">
            <div className="tw-fs__workspace animation-workspace">
              <div className="tw-fs__card">
                <div className="tw-fs__pipeline">
                  <div className="tw-fs__pane tw-fs__pane--editor">
                    <span className="tw-fs__tag">{t("editorTag")}</span>
                    <div className="tw-fs__findbar">
                      <span className="tw-fs__find-label">{t("findLabel")}</span>
                      <span className="tw-fs__find-query">{t("findQuery")}</span>
                    </div>
                    <div className="tw-fs__lines">
                      <span className="tw-fs__line">
                        {t("lineBefore")}
                        <mark className="tw-fs__hit">{t("findQuery")}</mark>
                        {t("lineAfter")}
                      </span>
                      <span className="tw-fs__line tw-fs__line--dim">{t("line2")}</span>
                      <span className="tw-fs__line">
                        {t("line3Before")}
                        <mark className="tw-fs__hit tw-fs__hit--2">{t("findQuery")}</mark>
                        {t("line3After")}
                      </span>
                      <span className="tw-fs__line tw-fs__line--replace">
                        {t("lineBefore")}
                        <mark className="tw-fs__replace">{t("replaceQuery")}</mark>
                        {t("lineAfter")}
                      </span>
                      <span className="tw-fs__sweep" />
                    </div>
                  </div>

                  <div className="tw-fs__engine">
                    <span className="tw-fs__flow" />
                    <span className="tw-fs__core" />
                    <span className="tw-fs__badge">{t("envBadge")}</span>
                  </div>

                  <div className="tw-fs__pane tw-fs__pane--export">
                    <span className="tw-fs__tag tw-fs__tag--export">{t("exportTag")}</span>
                    <div className="tw-fs__exports">
                      <span className="tw-fs__file tw-fs__file--1">
                        <span className="tw-fs__file-ext">.txt</span>
                        <span className="tw-fs__file-name">{t("exportTxt")}</span>
                      </span>
                      <span className="tw-fs__file tw-fs__file--2">
                        <span className="tw-fs__file-ext tw-fs__file-ext--md">.md</span>
                        <span className="tw-fs__file-name">{t("exportMd")}</span>
                      </span>
                      <span className="tw-fs__file tw-fs__file--3">
                        <span className="tw-fs__file-ext tw-fs__file-ext--doc">.docx</span>
                        <span className="tw-fs__file-name">{t("exportDocx")}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <span className="tw-fs__particle tw-fs__particle--1" />
                <span className="tw-fs__particle tw-fs__particle--2" />
                <span className="tw-fs__particle tw-fs__particle--3" />
              </div>

              <span className="tw-fs__ok">
                <span className="tw-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="tw-fs__footer">
          <button type="button" className="tw-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="tw-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
