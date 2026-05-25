"use client";

import type { Milestone, Task, TimelineProject } from "@/lib/timeline/types";
import { normalizeTaskDates } from "@/lib/timeline/calculations";
import { createDefaultTimelineProject, createEmptyMilestone, createEmptyTask } from "@/lib/timeline/defaults";
import { MILESTONE_COLOR_PRESETS, TASK_COLOR_PRESETS } from "@/lib/timeline/constants";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface/60 px-3 py-2 text-sm text-ink transition focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20";

type TimelineFormPanelProps = {
  project: TimelineProject;
  onChange: (project: TimelineProject) => void;
};

function ColorSwatches({
  value,
  presets,
  onChange,
}: {
  value: string;
  presets: readonly string[];
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          aria-label={`Color ${color}`}
          aria-pressed={value === color}
          className={`h-7 w-7 rounded-full border-2 transition ${
            value === color ? "border-white scale-110" : "border-transparent opacity-80 hover:opacity-100"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
        aria-label="Custom color"
      />
    </div>
  );
}

export function TimelineFormPanel({ project, onChange }: TimelineFormPanelProps) {
  const patch = (partial: Partial<TimelineProject>) => onChange({ ...project, ...partial });

  const updateTask = (id: string, partial: Partial<Task>) => {
    patch({
      tasks: project.tasks.map((t) =>
        t.id === id ? normalizeTaskDates({ ...t, ...partial }) : t,
      ),
    });
  };

  const removeTask = (id: string) => {
    patch({ tasks: project.tasks.filter((t) => t.id !== id) });
  };

  const updateMilestone = (id: string, partial: Partial<Milestone>) => {
    patch({
      milestones: project.milestones.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    });
  };

  const removeMilestone = (id: string) => {
    patch({ milestones: project.milestones.filter((m) => m.id !== id) });
  };

  const nextRowOrder =
    project.tasks.length > 0 ? Math.max(...project.tasks.map((t) => t.rowOrder)) + 1 : 0;

  return (
    <div className="flex h-full flex-col gap-6 print:hidden">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Client-side only</p>
        <h2 className="text-xl font-bold text-ink">Timeline editor</h2>
        <p className="text-sm text-ink-muted">
          Add tasks and milestones — the Gantt chart updates instantly in your browser.
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-ink-muted">Project title</span>
        <input
          className={inputClass}
          type="text"
          value={project.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </label>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">Tasks</h3>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-brand transition hover:border-brand/35"
            onClick={() =>
              patch({ tasks: [...project.tasks, createEmptyTask(nextRowOrder)] })
            }
          >
            + Add task
          </button>
        </div>

        {project.tasks.length === 0 ? (
          <p className="text-sm text-ink-muted">No tasks yet. Add one to start your timeline.</p>
        ) : (
          <ul className="space-y-3">
            {project.tasks.map((task) => (
              <li
                key={task.id}
                className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="block flex-1">
                    <span className="mb-1 block text-xs text-ink-muted">Title</span>
                    <input
                      className={inputClass}
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(task.id, { title: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    className="mt-5 shrink-0 rounded-lg px-2 py-1 text-xs text-ink-muted transition hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => removeTask(task.id)}
                    aria-label={`Remove ${task.title}`}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-muted">Start</span>
                    <input
                      className={inputClass}
                      type="date"
                      value={task.startDate}
                      onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-muted">End</span>
                    <input
                      className={inputClass}
                      type="date"
                      value={task.endDate}
                      onChange={(e) => updateTask(task.id, { endDate: e.target.value })}
                    />
                  </label>
                </div>
                <label className="block max-w-[8rem]">
                  <span className="mb-1 block text-xs text-ink-muted">Row</span>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={task.rowOrder}
                    onChange={(e) =>
                      updateTask(task.id, { rowOrder: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </label>
                <div>
                  <span className="mb-1.5 block text-xs text-ink-muted">Bar color</span>
                  <ColorSwatches
                    value={task.color}
                    presets={TASK_COLOR_PRESETS}
                    onChange={(color) => updateTask(task.id, { color })}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">Milestones</h3>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-brand transition hover:border-brand/35"
            onClick={() =>
              patch({ milestones: [...project.milestones, createEmptyMilestone()] })
            }
          >
            + Add milestone
          </button>
        </div>

        {project.milestones.length === 0 ? (
          <p className="text-sm text-ink-muted">Optional markers for kickoff, releases, or deadlines.</p>
        ) : (
          <ul className="space-y-3">
            {project.milestones.map((milestone) => (
              <li
                key={milestone.id}
                className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="block flex-1">
                    <span className="mb-1 block text-xs text-ink-muted">Title</span>
                    <input
                      className={inputClass}
                      type="text"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    className="mt-5 shrink-0 rounded-lg px-2 py-1 text-xs text-ink-muted transition hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => removeMilestone(milestone.id)}
                    aria-label={`Remove ${milestone.title}`}
                  >
                    Remove
                  </button>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-muted">Date</span>
                  <input
                    className={inputClass}
                    type="date"
                    value={milestone.date}
                    onChange={(e) => updateMilestone(milestone.id, { date: e.target.value })}
                  />
                </label>
                <div>
                  <span className="mb-1.5 block text-xs text-ink-muted">Marker color</span>
                  <ColorSwatches
                    value={milestone.color}
                    presets={MILESTONE_COLOR_PRESETS}
                    onChange={(color) => updateMilestone(milestone.id, { color })}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        className="text-xs text-ink-muted underline-offset-2 hover:text-brand hover:underline"
        onClick={() => {
          const sample = createDefaultTimelineProject();
          onChange({ ...sample, title: project.title.trim() || sample.title });
        }}
      >
        Reset to sample deployment timeline
      </button>
    </div>
  );
}
