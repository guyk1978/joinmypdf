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

/** App page shell — neutral-50 light / neutral-950 dark */
export const appShell = "min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-200";

/** Shared gap between tool cards — matches .home-tool-grid in globals.css */
export const toolGridGap = "gap-3";

/** Homepage & favorites tool grid cards */
export const homeToolGridCard =
  "relative flex min-h-[124px] flex-col items-center justify-center rounded-[20px] border border-neutral-200 bg-white/70 p-5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md transition-[background-color,box-shadow] hover:bg-white/85 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] dark:border-white/5 dark:bg-neutral-900/50 dark:shadow-none dark:hover:bg-neutral-900/60 dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]";

export const homeToolGridCardLabel =
  "mt-3 line-clamp-2 text-xs font-semibold leading-snug tracking-wide text-neutral-900 dark:text-neutral-200";

export const homeSecondaryPillBtn =
  "inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white/70 px-8 py-3.5 text-sm font-bold tracking-wide text-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md transition-[background-color,box-shadow] hover:border-neutral-300 hover:bg-white hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] dark:border-white/15 dark:bg-neutral-900/50 dark:text-neutral-200 dark:shadow-none dark:hover:border-white/25 dark:hover:bg-neutral-900/70";

export const homePrimaryPillBtn =
  "inline-flex items-center justify-center rounded-full bg-emerald-700 px-10 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_4px_16px_rgba(4,120,87,0.28)] transition-[background-color,box-shadow] hover:bg-emerald-800 hover:shadow-[0_6px_20px_rgba(4,120,87,0.32)] dark:bg-emerald-600/90 dark:shadow-inner dark:hover:bg-emerald-600 dark:hover:shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)]";

export const homeGlassPanel =
  "rounded-[20px] border border-neutral-200 bg-white/70 p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/5 dark:bg-neutral-900/50 dark:shadow-none";

/** Shared max width for tool upload stack — full width within column, capped for readability */
export const toolUploadStack = "mx-auto w-full max-w-2xl";

/** Tool page — unified dashboard column and flush glass panels */
export const toolPageDashboardWidth = "mx-auto w-full max-w-2xl";

export const toolPageDashboardStack = "tool-page-dashboard flex w-full flex-col gap-0";

/** Marketing / info pages — flush vertical stack with hairline gaps */
export const contentDashboardStack = "flex w-full flex-col gap-[3px]";

export const contentDashboardPanel =
  "w-full rounded-none border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50";

export const contentDashboardInset =
  "rounded-none border border-neutral-200/80 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/50";

export const toolPageDashboardPanel = "tool-page-dashboard-panel w-full p-6";

export const toolPageDashboardInset =
  "rounded-none border border-neutral-200/80 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-black/25";

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
