/** Shared Tailwind classes for tool workspaces — Dark Glassmorphism design system. */

export const toolPrimaryBtn =
  "rounded-none bg-neutral-800 px-4 py-2 text-sm font-semibold text-white shadow-[var(--surface-elevate)] transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-200 dark:text-black dark:hover:bg-white";

export const toolSecondaryBtn =
  "rounded-none bg-transparent px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-black disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white";

export const toolOutlineBtn =
  "inline-flex items-center justify-center gap-2 rounded-none bg-transparent px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-45 dark:text-neutral-300 dark:hover:text-white";

export const toolInput =
  "w-full rounded-none bg-black/5 px-3 py-2 text-sm text-ink shadow-[var(--surface-separate)] transition-colors placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:opacity-60 dark:bg-white/5 dark:text-neutral-100 dark:focus:ring-neutral-600";

export const toolDownloadBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-ink backdrop-blur-sm transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:text-white";

export const toolPanel =
  "rounded-none bg-transparent p-3 shadow-[var(--surface-elevate)] dark:bg-transparent";

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

/** App page shell — pure monochrome */
export const appShell =
  "min-h-screen bg-white text-black dark:bg-black dark:text-white";

/** Shared gap between tool cards — matches .home-tool-grid in globals.css */
export const toolGridGap = "gap-6";

/** Homepage & favorites tool grid cards */
export const homeToolGridCard =
  "relative flex min-h-[7.5rem] flex-col items-center justify-center rounded-lg border border-transparent bg-transparent p-3 text-center shadow-none transition-[background-color,border-color,box-shadow] duration-200 ease-out hover:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500";

export const homeToolGridCardLabel =
  "mt-1.5 line-clamp-2 text-xs font-semibold leading-snug tracking-tight sm:text-sm";

export const homeToolGridCardFavorite =
  "home-tool-grid-card__favorite absolute end-1.5 top-1.5 p-0 opacity-0 transition-opacity duration-200 max-sm:opacity-80 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100";

export const homeSecondaryPillBtn =
  "inline-flex items-center justify-center rounded-none bg-transparent px-8 py-3.5 text-sm font-bold tracking-wide text-black shadow-[var(--surface-separate)] transition-colors hover:shadow-[var(--surface-elevate)] dark:text-white";

export const homePrimaryPillBtn =
  "inline-flex items-center justify-center rounded-none bg-neutral-900 px-10 py-3.5 text-sm font-bold tracking-wide text-white shadow-[var(--surface-elevate)] transition-colors hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200";

export const homeGlassPanel =
  "rounded-[20px] border border-neutral-200 bg-white p-8 text-center shadow-none dark:border-neutral-800 dark:bg-neutral-950";

/** Shared max width for tool upload stack — full width within column, capped for readability */
export const toolUploadStack = "mx-auto w-full max-w-2xl";

/** Tool page — full-width shell; solid tool surface is 70% centered in CSS */
export const toolPageDashboardWidth = "tool-page-main mx-auto w-full max-w-none";

export const toolPageInfoWidth = "mx-auto w-full max-w-2xl px-4";

export const toolPageDashboardStack = "tool-page-dashboard flex w-full flex-col gap-0";

/** Marketing / info pages — flush vertical stack with hairline gaps */
export const contentDashboardStack = "flex w-full flex-col gap-[3px]";

export const contentDashboardPanel =
  "w-full rounded-none bg-transparent p-6 shadow-[var(--surface-elevate)] dark:bg-transparent";

export const contentDashboardInset =
  "rounded-none border border-neutral-200/80 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/50";

export const toolPageDashboardPanel = "tool-page-dashboard-panel w-full p-6";

export const toolPageDashboardInset =
  "rounded-none border border-neutral-200/80 bg-transparent p-4 dark:border-white/10";

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
