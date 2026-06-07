/** Shared Tailwind classes for tool workspaces — Dark Glassmorphism design system. */

export const toolPrimaryBtn =
  "rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-ink shadow-sm backdrop-blur-sm transition-[background-color,box-shadow,border-color] hover:border-white/25 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15";

export const toolSecondaryBtn =
  "rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-ink disabled:opacity-50 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white";

export const toolInput =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-ink backdrop-blur-sm transition-colors placeholder:text-ink-muted focus:border-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-60 dark:bg-black/30 dark:text-neutral-100";

export const toolDownloadBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-ink backdrop-blur-sm transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:text-white";

export const toolPanel =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-3 ring-1 ring-white/5 backdrop-blur-md dark:border-white/10 dark:bg-black/25";

export const toolGlassPanel = toolPanel;

export const toolCanvasStudio =
  "overflow-hidden rounded-2xl border border-white/10 bg-black/20 ring-1 ring-white/5 backdrop-blur-md dark:bg-black/30";

export const toolCanvasPage =
  "overflow-hidden rounded-xl border border-white/10 bg-black/10 ring-1 ring-white/5 backdrop-blur-sm dark:bg-black/20";

/** Calculator / invoice numeric fields */
export const matteField = toolInput;

export const matteFieldArea =
  "w-full min-h-[4.5rem] resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-ink backdrop-blur-sm transition-colors placeholder:text-ink-muted focus:border-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 dark:bg-black/30 dark:text-neutral-100";

export const mattePanel = toolPanel;

export const mattePanelInset =
  "rounded-xl border border-white/10 bg-black/15 p-2 ring-1 ring-white/5 backdrop-blur-sm dark:bg-black/20";

/** Shared max width for tool upload stack — full width within column, capped for readability */
export const toolUploadStack = "mx-auto w-full max-w-2xl";

/** @deprecated Privacy moved to ToolPrivacyBadge inside WorkspaceUploadShell */
export const toolPrivacyStatement =
  "rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs leading-snug text-ink-muted backdrop-blur-sm";

/** @deprecated Use ToolPrivacyBadge via ToolPrivacyStatement */
export const matteSecurityCallout = toolPrivacyStatement;

/** @deprecated Use glass dropzone via FileUploadZone + tool-glass-theme */
export const matteDropzone =
  "tool-upload-zone rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-ink backdrop-blur-md transition-[border-color,box-shadow] dark:border-white/15 dark:bg-black/20";

export const matteDropzoneActive = "border-white/40 ring-1 ring-white/20";

/** Invoice / timeline / data-tool split workspace panels */
export const matteWorkspaceSection =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-2 ring-1 ring-white/5 backdrop-blur-md dark:bg-black/25";

export const matteWorkspaceBanner =
  "rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-ink-muted backdrop-blur-sm dark:bg-black/20";
