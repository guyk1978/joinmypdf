"use client";

import { useEffect } from "react";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { TimelineGenerator } from "@/components/timeline/TimelineGenerator";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type TimelineGanttWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function TimelineGanttWorkspace({ tool, slug }: TimelineGanttWorkspaceProps) {
  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  return (
    <UtilityWorkspaceShell immersive pageClassName="timeline-gantt-tool-page">
      <TimelineGenerator />
    </UtilityWorkspaceShell>
  );
}
