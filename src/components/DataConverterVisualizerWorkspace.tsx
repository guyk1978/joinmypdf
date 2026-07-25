"use client";

import { useEffect } from "react";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { DataToolDashboard } from "@/components/data-tool/DataToolDashboard";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type DataConverterVisualizerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function DataConverterVisualizerWorkspace({
  tool,
  slug,
}: DataConverterVisualizerWorkspaceProps) {
  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  return (
    <UtilityWorkspaceShell
      immersive
      requiresUpload
      pageClassName="data-converter-visualizer-tool-page"
    >
      <DataToolDashboard />
    </UtilityWorkspaceShell>
  );
}
