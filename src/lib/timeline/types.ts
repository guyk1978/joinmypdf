export type Task = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  rowOrder: number;
};

export type Milestone = {
  id: string;
  title: string;
  date: string;
  color: string;
};

export type TimelineProject = {
  title: string;
  tasks: Task[];
  milestones: Milestone[];
};

export type ProjectBounds = {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
};

export type BarLayout = {
  leftPercent: number;
  widthPercent: number;
};

export type MilestoneLayout = {
  leftPercent: number;
};

export type TimeAxisTick = {
  label: string;
  leftPercent: number;
};
