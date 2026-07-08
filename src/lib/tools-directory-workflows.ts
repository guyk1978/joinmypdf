import type { MegaMenuSection } from "@/lib/mega-menu";

/** Three workflow columns on the All PDF Tools dashboard. */
export const TOOLS_DIRECTORY_WORKFLOW_IDS = [
  "convert-create",
  "organize-edit",
  "security-optimize",
] as const;

export type ToolsDirectoryWorkflowId = (typeof TOOLS_DIRECTORY_WORKFLOW_IDS)[number];

export type ToolsDirectoryWorkflow = {
  id: ToolsDirectoryWorkflowId;
  sectionIds: string[];
};

export const TOOLS_DIRECTORY_WORKFLOWS: ToolsDirectoryWorkflow[] = [
  { id: "convert-create", sectionIds: ["convert"] },
  { id: "organize-edit", sectionIds: ["edit"] },
  { id: "security-optimize", sectionIds: ["security", "optimize"] },
];

export function groupSectionsByWorkflow(
  sections: MegaMenuSection[],
): { workflow: ToolsDirectoryWorkflow; sections: MegaMenuSection[] }[] {
  return TOOLS_DIRECTORY_WORKFLOWS.map((workflow) => ({
    workflow,
    sections: workflow.sectionIds
      .map((id) => sections.find((section) => section.id === id))
      .filter((section): section is MegaMenuSection => Boolean(section)),
  }));
}
