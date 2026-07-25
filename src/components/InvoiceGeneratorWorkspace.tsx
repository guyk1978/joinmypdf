"use client";

import { useEffect } from "react";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { InvoiceGenerator } from "@/components/invoice/InvoiceGenerator";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type InvoiceGeneratorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function InvoiceGeneratorWorkspace({ tool, slug }: InvoiceGeneratorWorkspaceProps) {
  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  return (
    <UtilityWorkspaceShell immersive pageClassName="invoice-generator-tool-page">
      <InvoiceGenerator />
    </UtilityWorkspaceShell>
  );
}
