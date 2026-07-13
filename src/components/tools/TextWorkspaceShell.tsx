"use client";

import { Suspense, useEffect } from "react";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { TextWorkspace } from "@/components/tools/TextWorkspace";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type TextWorkspaceShellProps = {
  tool: ToolDefinition;
  slug: string;
};

function TextWorkspaceInner({ tool, slug }: TextWorkspaceShellProps) {
  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  return (
    <UtilityWorkspaceShell>
      <TextWorkspace />
    </UtilityWorkspaceShell>
  );
}

export function TextWorkspaceShell({ tool, slug }: TextWorkspaceShellProps) {
  return (
    <Suspense fallback={<div className="text-workspace text-workspace--loading" aria-hidden />}>
      <TextWorkspaceInner tool={tool} slug={slug} />
    </Suspense>
  );
}
