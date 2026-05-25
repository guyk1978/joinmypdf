import { TASK_COLOR_PRESETS, MILESTONE_COLOR_PRESETS } from "./constants";
import type { Milestone, Task, TimelineProject } from "./types";

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createMilestoneId(): string {
  return `ms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyTask(rowOrder: number): Task {
  const start = isoDateOffset(0);
  return {
    id: createTaskId(),
    title: "New task",
    startDate: start,
    endDate: isoDateOffset(7),
    color: TASK_COLOR_PRESETS[rowOrder % TASK_COLOR_PRESETS.length],
    rowOrder,
  };
}

export function createEmptyMilestone(): Milestone {
  return {
    id: createMilestoneId(),
    title: "Milestone",
    date: isoDateOffset(14),
    color: MILESTONE_COLOR_PRESETS[0],
  };
}

/** Mock 4-task software deployment sequence. */
export function createDefaultTimelineProject(): TimelineProject {
  const base = isoDateOffset(0);

  const tasks: Task[] = [
    {
      id: createTaskId(),
      title: "Environment setup & CI/CD",
      startDate: base,
      endDate: isoDateOffset(13),
      color: TASK_COLOR_PRESETS[0],
      rowOrder: 0,
    },
    {
      id: createTaskId(),
      title: "Staging deployment",
      startDate: isoDateOffset(14),
      endDate: isoDateOffset(20),
      color: TASK_COLOR_PRESETS[1],
      rowOrder: 1,
    },
    {
      id: createTaskId(),
      title: "QA & UAT",
      startDate: isoDateOffset(21),
      endDate: isoDateOffset(34),
      color: TASK_COLOR_PRESETS[2],
      rowOrder: 2,
    },
    {
      id: createTaskId(),
      title: "Production rollout",
      startDate: isoDateOffset(35),
      endDate: isoDateOffset(48),
      color: TASK_COLOR_PRESETS[3],
      rowOrder: 3,
    },
  ];

  const milestones: Milestone[] = [
    {
      id: createMilestoneId(),
      title: "Project kickoff",
      date: base,
      color: MILESTONE_COLOR_PRESETS[0],
    },
    {
      id: createMilestoneId(),
      title: "Go-live",
      date: isoDateOffset(48),
      color: MILESTONE_COLOR_PRESETS[1],
    },
  ];

  return {
    title: "Product deployment timeline",
    tasks,
    milestones,
  };
}
