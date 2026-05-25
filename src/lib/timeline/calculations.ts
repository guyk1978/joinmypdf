import type {
  BarLayout,
  Milestone,
  MilestoneLayout,
  ProjectBounds,
  Task,
  TimeAxisTick,
} from "./types";

const MS_PER_DAY = 86_400_000;

export function parseISODate(iso: string): Date | null {
  if (!iso) return null;
  const parsed = new Date(`${iso}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDisplayDate(isoDate: string): string {
  const parsed = parseISODate(isoDate);
  if (!parsed) return isoDate || "—";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetweenInclusive(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diff / MS_PER_DAY) + 1);
}

export function getProjectBounds(tasks: Task[], milestones: Milestone[]): ProjectBounds | null {
  const dates: Date[] = [];

  for (const task of tasks) {
    const start = parseISODate(task.startDate);
    const end = parseISODate(task.endDate);
    if (start) dates.push(start);
    if (end) dates.push(end);
  }

  for (const milestone of milestones) {
    const date = parseISODate(milestone.date);
    if (date) dates.push(date);
  }

  if (!dates.length) return null;

  const start = new Date(Math.min(...dates.map((d) => d.getTime())));
  const end = new Date(Math.max(...dates.map((d) => d.getTime())));

  return {
    start,
    end,
    startIso: toISODate(start),
    endIso: toISODate(end),
  };
}

export function getTotalDurationDays(bounds: ProjectBounds): number {
  return daysBetweenInclusive(bounds.start, bounds.end);
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Map a date within [rangeStart, rangeEnd] to a horizontal percentage (0–100).
 */
export function dateToLeftPercent(dateIso: string, bounds: ProjectBounds): number {
  const date = parseISODate(dateIso);
  if (!date) return 0;

  const spanMs = bounds.end.getTime() - bounds.start.getTime();
  if (spanMs <= 0) return 0;

  const offset = date.getTime() - bounds.start.getTime();
  return clampPercent((offset / spanMs) * 100);
}

export function layoutTaskBar(task: Task, bounds: ProjectBounds): BarLayout {
  const start = parseISODate(task.startDate);
  const end = parseISODate(task.endDate);

  if (!start || !end) {
    return { leftPercent: 0, widthPercent: 0 };
  }

  const rangeStart = bounds.start.getTime();
  const rangeEnd = bounds.end.getTime();
  const spanMs = rangeEnd - rangeStart;

  if (spanMs <= 0) {
    return { leftPercent: 0, widthPercent: 100 };
  }

  const barStart = Math.max(start.getTime(), rangeStart);
  const barEnd = Math.min(Math.max(end.getTime(), barStart), rangeEnd);

  const leftPercent = clampPercent(((barStart - rangeStart) / spanMs) * 100);
  const widthPercent = clampPercent(((barEnd - barStart) / spanMs) * 100);

  return {
    leftPercent,
    widthPercent: Math.max(widthPercent, 0.8),
  };
}

export function layoutMilestone(milestone: Milestone, bounds: ProjectBounds): MilestoneLayout {
  return { leftPercent: dateToLeftPercent(milestone.date, bounds) };
}

export function sortTasksByRow(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.rowOrder - b.rowOrder || a.title.localeCompare(b.title));
}

export function generateTimeAxisTicks(bounds: ProjectBounds, tickCount = 6): TimeAxisTick[] {
  const count = Math.max(2, tickCount);
  const ticks: TimeAxisTick[] = [];
  const spanMs = bounds.end.getTime() - bounds.start.getTime();

  for (let i = 0; i < count; i++) {
    const ratio = count === 1 ? 0 : i / (count - 1);
    const at = new Date(bounds.start.getTime() + spanMs * ratio);
    ticks.push({
      label: at.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      leftPercent: clampPercent(ratio * 100),
    });
  }

  return ticks;
}

export function normalizeTaskDates(task: Task): Task {
  const start = parseISODate(task.startDate);
  const end = parseISODate(task.endDate);
  if (!start || !end) return task;
  if (end.getTime() < start.getTime()) {
    return { ...task, endDate: task.startDate };
  }
  return task;
}
