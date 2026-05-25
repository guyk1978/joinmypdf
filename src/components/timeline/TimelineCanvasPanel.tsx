"use client";

import { TIMELINE_PRINT_ROOT_ID } from "@/lib/timeline/constants";
import type { TimelineProject } from "@/lib/timeline/types";
import {
  formatDisplayDate,
  generateTimeAxisTicks,
  getProjectBounds,
  getTotalDurationDays,
  layoutMilestone,
  layoutTaskBar,
  sortTasksByRow,
} from "@/lib/timeline/calculations";

const ROW_HEIGHT = 52;
const AXIS_HEIGHT = 48;
const LABEL_WIDTH = 200;

type TimelineCanvasPanelProps = {
  project: TimelineProject;
  onDownload: () => void | Promise<void>;
  downloadBusy?: boolean;
};

export function TimelineCanvasPanel({
  project,
  onDownload,
  downloadBusy = false,
}: TimelineCanvasPanelProps) {
  const bounds = getProjectBounds(project.tasks, project.milestones);
  const sortedTasks = sortTasksByRow(project.tasks);
  const ticks = bounds ? generateTimeAxisTicks(bounds, 7) : [];
  const durationDays = bounds ? getTotalDurationDays(bounds) : 0;
  const chartHeight = Math.max(sortedTasks.length, 1) * ROW_HEIGHT + AXIS_HEIGHT + 56;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-semibold text-ink">Gantt preview</h2>
          <p className="text-xs text-ink-muted">Landscape PDF · updates as you edit</p>
        </div>
        <button
          type="button"
          onClick={() => void onDownload()}
          disabled={downloadBusy || !bounds}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-surface shadow-lg shadow-brand/25 transition hover:bg-brand-deep active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3v12m0 0l4-4m-4 4L8 11M4 19h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {downloadBusy ? "Generating PDF…" : "Download PDF"}
        </button>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 md:p-5">
        <article
          id={TIMELINE_PRINT_ROOT_ID}
          className="w-full min-w-[640px] max-w-4xl overflow-hidden rounded-xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl shadow-black/40"
          style={{ minHeight: chartHeight }}
        >
          <header className="border-b border-slate-700/60 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">JoinMyPDF</p>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-50">
              {project.title.trim() || "Timeline"}
            </h3>
            {bounds ? (
              <p className="mt-2 text-sm text-slate-400">
                {formatDisplayDate(bounds.startIso)} — {formatDisplayDate(bounds.endIso)}
                <span className="mx-2 text-slate-600">·</span>
                {durationDays} days
                <span className="mx-2 text-slate-600">·</span>
                {sortedTasks.length} task{sortedTasks.length === 1 ? "" : "s"}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Add a task or milestone to render the chart.</p>
            )}
          </header>

          {bounds ? (
            <div className="px-4 pb-6 pt-4 md:px-6">
              {/* Milestones row */}
              {project.milestones.length > 0 ? (
                <div
                  className="mb-3 grid items-center gap-3"
                  style={{ gridTemplateColumns: `${LABEL_WIDTH}px 1fr` }}
                >
                  <span className="text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Milestones
                  </span>
                  <div className="relative h-10 rounded-lg border border-slate-700/50 bg-slate-800/40">
                    {project.milestones.map((milestone) => {
                      const { leftPercent } = layoutMilestone(milestone, bounds);
                      return (
                        <div
                          key={milestone.id}
                          className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                          style={{ left: `${leftPercent}%` }}
                          title={`${milestone.title} — ${formatDisplayDate(milestone.date)}`}
                        >
                          <span
                            className="block h-3 w-3 rotate-45 border-2 border-slate-900"
                            style={{ backgroundColor: milestone.color }}
                          />
                          <span className="mt-1 max-w-[5rem] truncate text-[10px] font-medium text-slate-300">
                            {milestone.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Time axis */}
              <div
                className="mb-2 grid gap-3"
                style={{ gridTemplateColumns: `${LABEL_WIDTH}px 1fr` }}
              >
                <span />
                <div className="relative h-12 border-b border-slate-600/80">
                  {ticks.map((tick) => (
                    <div
                      key={`${tick.label}-${tick.leftPercent}`}
                      className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                      style={{ left: `${tick.leftPercent}%` }}
                    >
                      <span className="mb-1 text-[11px] font-medium text-slate-400">{tick.label}</span>
                      <span className="h-2 w-px bg-slate-500" />
                    </div>
                  ))}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to right, rgba(100,116,139,0.15) 0, rgba(100,116,139,0.15) 1px, transparent 1px, transparent calc(100% / 6))",
                    }}
                  />
                </div>
              </div>

              {/* Task rows */}
              <div className="space-y-1">
                {sortedTasks.map((task) => {
                  const bar = layoutTaskBar(task, bounds);
                  return (
                    <div
                      key={task.id}
                      className="grid items-center gap-3"
                      style={{
                        gridTemplateColumns: `${LABEL_WIDTH}px 1fr`,
                        minHeight: ROW_HEIGHT,
                      }}
                    >
                      <span
                        className="truncate text-right text-sm font-medium text-slate-300"
                        title={task.title}
                      >
                        {task.title}
                      </span>
                      <div className="relative h-9 rounded-lg border border-slate-700/40 bg-slate-800/30">
                        <div
                          className="absolute top-1/2 h-7 -translate-y-1/2 rounded-md shadow-md"
                          style={{
                            left: `${bar.leftPercent}%`,
                            width: `${bar.widthPercent}%`,
                            backgroundColor: task.color,
                            boxShadow: `0 0 20px ${task.color}40`,
                            minWidth: "4px",
                          }}
                          title={`${formatDisplayDate(task.startDate)} — ${formatDisplayDate(task.endDate)}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center px-6 py-16 text-sm text-slate-500">
              Your schedule will appear here once you add dates.
            </div>
          )}

          <footer className="border-t border-slate-700/50 px-6 py-3 text-center text-[11px] text-slate-500">
            Generated with JoinMyPDF — client-side timeline &amp; Gantt chart
          </footer>
        </article>
      </div>
    </div>
  );
}
