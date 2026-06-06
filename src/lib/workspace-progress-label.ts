type WorkspaceProgressHelper = {
  wsProgress: (key: string, values?: Record<string, string | number>) => string;
};

/** Map convert/processing progress objects to Workspaces progress keys. */
export function progressLabelFromPhase(
  operation: string,
  progress: unknown,
  ws: WorkspaceProgressHelper,
): string {
  if (!progress || typeof progress !== "object") return "";

  const p = progress as Record<string, unknown>;
  const phase = typeof p.phase === "string" ? p.phase : "";

  if (!phase) return "";

  if (typeof p.currentPage === "number" && typeof p.totalPages === "number") {
    if (phase === "extracting" || phase === "extractingPage" || phase === "extractingText") {
      const labeled = ws.wsProgress("extractingPage", {
        current: p.currentPage,
        total: p.totalPages,
      });
      if (labeled) return labeled;
    }
    if (phase === "flattening" || phase === "flatteningPage") {
      if (typeof p.totalPages === "number" && p.totalPages > 0) {
        const current = typeof p.currentPage === "number" ? p.currentPage : 0;
        if (current === 0) {
          const prep = ws.wsProgress("preparing");
          if (prep) return prep;
        }
        const labeled = ws.wsProgress("flatteningPage", {
          current: p.currentPage,
          total: p.totalPages,
        });
        if (labeled) return labeled;
      }
    }
  }

  if (phase === "parsing") {
    if (typeof p.currentSlide === "number" && typeof p.totalSlides === "number") {
      const slide = ws.wsProgress("readingSlide", {
        current: p.currentSlide,
        total: p.totalSlides,
      });
      if (slide) return slide;
    }
  }

  if (phase === "rendering") {
    if (typeof p.totalSheets === "number" && p.totalSheets > 0) {
      const sheets = ws.wsProgress("renderingSheets", { count: p.totalSheets });
      if (sheets) return sheets;
    }
  }

  if (phase === "preparing") {
    const prep = ws.wsProgress("preparing");
    if (prep) return prep;
  }

  const byPhase = ws.wsProgress(phase);
  if (byPhase) return byPhase;

  return ws.wsProgress("processing") || "";
}
