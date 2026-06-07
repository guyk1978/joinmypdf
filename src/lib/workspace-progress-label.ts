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

  if (typeof p.percent === "number" && ["scanning", "structure", "xref", "rebuild", "validate"].includes(phase)) {
    const repair = ws.wsProgress(phase, { percent: p.percent });
    if (repair) return repair;
  }

  const byPhase = ws.wsProgress(phase);
  if (byPhase) return byPhase;

  return ws.wsProgress("processing") || "";
}

/** Resolve a simple phase string to a Workspaces progress label. */
export function wsProgressPhase(
  ws: WorkspaceProgressHelper,
  phase: string | null | undefined,
): string {
  if (!phase) return "";
  return ws.wsProgress(phase) || ws.wsProgress("processing") || "";
}

/** HEIC multi-file progress objects. */
export function heicProgressLabel(progress: unknown, ws: WorkspaceProgressHelper): string {
  if (!progress || typeof progress !== "object") return "";
  const p = progress as Record<string, unknown>;
  if (p.phase === "converting") {
    if (typeof p.fileName === "string" && typeof p.currentFile === "number" && typeof p.totalFiles === "number") {
      const labeled = ws.wsProgress("decoding", {
        name: p.fileName,
        current: p.currentFile,
        total: p.totalFiles,
      });
      if (labeled) return labeled;
    }
    return ws.wsProgress("preparing") || "";
  }
  if (typeof p.currentPage === "number" && typeof p.totalPages === "number") {
    return ws.wsProgress("buildingPage", { current: p.currentPage, total: p.totalPages }) || "";
  }
  return ws.wsProgress("building") || "";
}
