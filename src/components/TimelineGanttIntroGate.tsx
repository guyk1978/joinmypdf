"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./timeline-gantt-landing.css";


type TimelineGanttIntroGateProps = {
  /** When false, children render immediately (non–timeline-gantt-generator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Timeline & Gantt.
 * Task list → scheduling engine → weekly Gantt bars → success.
 * Shows before the Gantt builder workspace (dedicated tool page).
 */
export function TimelineGanttIntroGate({
  active = true,
  children,
}: TimelineGanttIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-timeline-gantt-intro",
  });
  const t = useTranslations("TimelineGanttLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="tgg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tgg-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="tgg-fs__header">
          <h1 id="tgg-fs-title" className="tgg-fs__title">
            <span className="tgg-fs__title-brand">{t("brand")}</span>
            <span className="tgg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="tgg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="tgg-fs__stage" aria-hidden>
          <div className="tgg-fs__scene">
            <div className="tgg-fs__workspace animation-workspace">
              <div className="tgg-fs__card">
                <div className="tgg-fs__pipeline">
                  <div className="tgg-fs__pane tgg-fs__pane--tasks">
                    <span className="tgg-fs__tag">{t("tasksTag")}</span>
                    <div className="tgg-fs__tasks">
                      <div className="tgg-fs__task tgg-fs__task--1">
                        <span className="tgg-fs__task-dot tgg-fs__task-dot--plan" />
                        <span className="tgg-fs__task-name">{t("taskPlan")}</span>
                        <span className="tgg-fs__task-dur">5d</span>
                      </div>
                      <div className="tgg-fs__task tgg-fs__task--2">
                        <span className="tgg-fs__task-dot tgg-fs__task-dot--build" />
                        <span className="tgg-fs__task-name">{t("taskBuild")}</span>
                        <span className="tgg-fs__task-dur">8d</span>
                      </div>
                      <div className="tgg-fs__task tgg-fs__task--3">
                        <span className="tgg-fs__task-dot tgg-fs__task-dot--launch" />
                        <span className="tgg-fs__task-name">{t("taskLaunch")}</span>
                        <span className="tgg-fs__task-dur">3d</span>
                      </div>
                      <div className="tgg-fs__milestone">
                        <span className="tgg-fs__milestone-icon" />
                        {t("milestone")}
                      </div>
                      <span className="tgg-fs__laser" />
                    </div>
                  </div>

                  <div className="tgg-fs__engine">
                    <span className="tgg-fs__flow" />
                    <span className="tgg-fs__core" />
                    <span className="tgg-fs__badge">{t("viewBadge")}</span>
                  </div>

                  <div className="tgg-fs__pane tgg-fs__pane--gantt">
                    <span className="tgg-fs__tag tgg-fs__tag--gantt">{t("ganttTag")}</span>
                    <div className="tgg-fs__gantt">
                      <div className="tgg-fs__weeks">
                        <span>W1</span>
                        <span>W2</span>
                        <span>W3</span>
                        <span>W4</span>
                      </div>
                      <div className="tgg-fs__bars">
                        <div className="tgg-fs__bar-row">
                          <span className="tgg-fs__bar tgg-fs__bar--plan" />
                        </div>
                        <div className="tgg-fs__bar-row">
                          <span className="tgg-fs__bar tgg-fs__bar--build" />
                        </div>
                        <div className="tgg-fs__bar-row">
                          <span className="tgg-fs__bar tgg-fs__bar--launch" />
                        </div>
                      </div>
                      <div className="tgg-fs__phase">{t("phaseLabel")}</div>
                    </div>
                  </div>
                </div>

                <span className="tgg-fs__particle tgg-fs__particle--1" />
                <span className="tgg-fs__particle tgg-fs__particle--2" />
                <span className="tgg-fs__particle tgg-fs__particle--3" />

                <span className="tgg-fs__ok">
                  <span className="tgg-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="tgg-fs__footer">
          <button type="button" className="tgg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="tgg-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
