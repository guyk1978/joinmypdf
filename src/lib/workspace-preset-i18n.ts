import type { PageNumberFontColor, PageNumberPosition } from "@/lib/add-page-numbers";
import type { WatermarkPosition } from "@/lib/add-watermark";
import type { BookletDuplexFlip, BookletPaperPreset } from "@/lib/pdf-booklet";
import type { AuditFinding, AuditFindingKind } from "@/lib/pdf-safe-auditor";
import type { TargetPaperPreset } from "@/lib/pdf-paper-margin";

type PresetWs = {
  wsCommon: (key: string, values?: Record<string, string | number>) => string;
};

const POSITION_KEY: Record<string, string> = {
  center: "center",
  "top-left": "topLeft",
  "top-center": "topCenter",
  "top-right": "topRight",
  "middle-left": "middleLeft",
  "middle-right": "middleRight",
  "bottom-left": "bottomLeft",
  "bottom-center": "bottomCenter",
  "bottom-right": "bottomRight",
};

const PAGE_NUMBER_COLOR_KEY: Record<PageNumberFontColor, string> = {
  "#000000": "black",
  "#6B7280": "gray",
  "#2563EB": "blue",
  "#DC2626": "red",
};

function preset(ws: PresetWs, path: string, values?: Record<string, string | number>): string {
  const translated = ws.wsCommon(`presets.${path}`, values);
  return translated || "";
}

export function paperPresetLabel(ws: PresetWs, key: BookletPaperPreset | TargetPaperPreset): string {
  return preset(ws, `paper.${key}`);
}

export function watermarkPositionLabel(ws: PresetWs, value: WatermarkPosition): string {
  const id = POSITION_KEY[value];
  return id ? preset(ws, `watermarkPosition.${id}`) : value;
}

export function pageNumberPositionLabel(ws: PresetWs, value: PageNumberPosition): string {
  const id = POSITION_KEY[value];
  return id ? preset(ws, `pageNumberPosition.${id}`) : value;
}

export function pageNumberColorLabel(ws: PresetWs, value: PageNumberFontColor): string {
  const id = PAGE_NUMBER_COLOR_KEY[value];
  return id ? preset(ws, `pageNumberColor.${id}`) : value;
}

export function duplexFlipHintLabel(ws: PresetWs, flip: BookletDuplexFlip): string {
  return flip === "long-edge" ? preset(ws, "duplexFlip.longEdge") : preset(ws, "duplexFlip.shortEdge");
}

export function auditKindLabel(ws: PresetWs, kind: AuditFindingKind): string {
  const map: Record<AuditFindingKind, string> = {
    regex: "auditKind.regex",
    annotation: "auditKind.annotation",
    signature: "auditKind.signature",
    "hidden-comment": "auditKind.hiddenComment",
  };
  return preset(ws, map[kind]);
}

export function auditFindingLabel(ws: PresetWs, finding: AuditFinding): string {
  if (finding.patternId) {
    const label = preset(ws, `auditPattern.${finding.patternId}`);
    if (label) return label;
  }
  if (finding.findingKey === "hidden-signature") {
    return preset(ws, "auditFinding.hiddenSignature");
  }
  if (finding.findingKey === "signature-ink") {
    return preset(ws, "auditFinding.signatureInk");
  }
  if (finding.findingKey === "hidden-comment") {
    return preset(ws, "auditFinding.hiddenComment", {
      subtype: finding.annotationSubtype || "Note",
    });
  }
  if (finding.findingKey === "visible-comment") {
    return preset(ws, "auditFinding.visibleComment", {
      subtype: finding.annotationSubtype || "Note",
    });
  }
  return finding.label;
}

export function marginSideLabel(ws: PresetWs, side: "top" | "right" | "bottom" | "left"): string {
  return preset(ws, `marginSide.${side}`);
}

export function iworkPackageFallbackLabel(ws: PresetWs): string {
  return preset(ws, "iworkPackage");
}
