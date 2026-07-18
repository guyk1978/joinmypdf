"use client";

import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { getAudioToolById } from "@/lib/audio-tools";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";

type AudioToolWorkspaceProps = {
  toolId: string;
};

export function AudioToolWorkspace({ toolId }: AudioToolWorkspaceProps) {
  const tool = getAudioToolById(toolId);
  if (!tool) return null;

  const ToolComponent = tool.component;

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="audio-tool-workspace">
        <ToolComponent name={tool.name} title={tool.title} />
      </div>
    </WorkspaceUploadShell>
  );
}
