export const WORKSPACE_UPLOAD_ID = "workspace-upload";
export const WORKSPACE_OPERATIONS_ID = "workspace-operations";

export function scrollToWorkspaceOperations() {
  requestAnimationFrame(() => {
    document.getElementById(WORKSPACE_OPERATIONS_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function scrollToWorkspaceUpload() {
  requestAnimationFrame(() => {
    document.getElementById(WORKSPACE_UPLOAD_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}
