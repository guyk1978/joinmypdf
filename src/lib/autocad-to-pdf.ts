import DxfParser, { type IEntity, type IPoint } from "dxf-parser";
import { PDFDocument, type PDFPage, rgb } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";

export type AutocadProgressPhase = "parsing" | "layout" | "complete";

export type DxfBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const A4_LANDSCAPE = { width: 841.89, height: 595.28 };
const MARGIN_PT = 36;
const STROKE_RGB = rgb(0.1, 0.1, 0.12);
const LINE_WIDTH = 0.35;

type DxfLine = IEntity & { vertices?: IPoint[] };
type DxfCircle = IEntity & { center: IPoint; radius: number };
type DxfArc = IEntity & { center: IPoint; radius: number; startAngle?: number; endAngle?: number };
type DxfPolyline = IEntity & { vertices?: (IPoint & { bulge?: number })[]; shape?: boolean };
type DxfText = IEntity & { startPoint: IPoint; text: string; textHeight?: number };
type DxfMtext = IEntity & { position: IPoint; text: string; height?: number };

export const DWG_INSTRUCTION_MESSAGE =
  "To guarantee 100% serverless data security, please save your AutoCAD file as an AutoCAD DXF (.dxf) format within your CAD application and drop it here.";

export function isDwgFile(file: File): boolean {
  return /\.dwg$/i.test(file.name);
}

export function isDxfFile(file: File): boolean {
  return /\.dxf$/i.test(file.name);
}

function decodeDxfText(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("latin1").decode(bytes);
  }
}

function visitPoint(bounds: DxfBounds, x: number, y: number): DxfBounds {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return bounds;
  return {
    minX: Math.min(bounds.minX, x),
    minY: Math.min(bounds.minY, y),
    maxX: Math.max(bounds.maxX, x),
    maxY: Math.max(bounds.maxY, y),
  };
}

function collectBounds(entities: IEntity[]): DxfBounds | null {
  let bounds: DxfBounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  for (const entity of entities) {
    const type = entity.type?.toUpperCase() ?? "";

    if (type === "LINE") {
      const line = entity as DxfLine;
      for (const v of line.vertices ?? []) {
        bounds = visitPoint(bounds, v.x, v.y);
      }
      continue;
    }

    if (type === "CIRCLE") {
      const circle = entity as DxfCircle;
      const { x, y } = circle.center;
      const r = circle.radius ?? 0;
      bounds = visitPoint(bounds, x - r, y - r);
      bounds = visitPoint(bounds, x + r, y + r);
      continue;
    }

    if (type === "ARC") {
      const arc = entity as DxfArc;
      const { x, y } = arc.center;
      const r = arc.radius ?? 0;
      const start = ((arc.startAngle ?? 0) * Math.PI) / 180;
      const end = ((arc.endAngle ?? 360) * Math.PI) / 180;
      const steps = 16;
      for (let i = 0; i <= steps; i += 1) {
        const t = start + ((end - start) * i) / steps;
        bounds = visitPoint(bounds, x + r * Math.cos(t), y + r * Math.sin(t));
      }
      continue;
    }

    if (type === "LWPOLYLINE" || type === "POLYLINE") {
      const poly = entity as DxfPolyline;
      for (const v of poly.vertices ?? []) {
        bounds = visitPoint(bounds, v.x, v.y);
      }
      continue;
    }

    if (type === "TEXT") {
      const text = entity as DxfText;
      bounds = visitPoint(bounds, text.startPoint.x, text.startPoint.y);
      continue;
    }

    if (type === "MTEXT") {
      const mtext = entity as DxfMtext;
      bounds = visitPoint(bounds, mtext.position.x, mtext.position.y);
    }
  }

  if (!Number.isFinite(bounds.minX) || bounds.minX >= bounds.maxX) return null;
  return bounds;
}

type PdfTransform = {
  toPdf: (x: number, y: number) => { x: number; y: number };
  scale: number;
};

function buildTransform(bounds: DxfBounds, pageWidth: number, pageHeight: number): PdfTransform {
  const drawWidth = pageWidth - MARGIN_PT * 2;
  const drawHeight = pageHeight - MARGIN_PT * 2;
  const spanX = Math.max(bounds.maxX - bounds.minX, 1e-6);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1e-6);
  const scale = Math.min(drawWidth / spanX, drawHeight / spanY) * 0.92;
  const offsetX = MARGIN_PT + (drawWidth - spanX * scale) / 2;
  const offsetY = MARGIN_PT + (drawHeight - spanY * scale) / 2;

  return {
    scale,
    toPdf: (x: number, y: number) => ({
      x: offsetX + (x - bounds.minX) * scale,
      y: offsetY + (bounds.maxY - y) * scale,
    }),
  };
}

function drawLineSegment(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  transform: PdfTransform,
) {
  const a = transform.toPdf(x1, y1);
  const b = transform.toPdf(x2, y2);
  page.drawLine({
    start: { x: a.x, y: a.y },
    end: { x: b.x, y: b.y },
    thickness: LINE_WIDTH,
    color: STROKE_RGB,
  });
}

function drawArcSegments(page: PDFPage, arc: DxfArc, transform: PdfTransform) {
  const { x: cx, y: cy } = arc.center;
  const r = arc.radius ?? 0;
  let start = arc.startAngle ?? 0;
  let end = arc.endAngle ?? 360;
  if (end < start) end += 360;
  const steps = Math.max(8, Math.ceil((end - start) / 15));
  let prev: { x: number; y: number } | null = null;
  for (let i = 0; i <= steps; i += 1) {
    const deg = start + ((end - start) * i) / steps;
    const rad = (deg * Math.PI) / 180;
    const pt = { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    if (prev) drawLineSegment(page, prev.x, prev.y, pt.x, pt.y, transform);
    prev = pt;
  }
}

function drawEntitiesOnPage(
  page: PDFPage,
  entities: IEntity[],
  bounds: DxfBounds,
  pageWidth: number,
  pageHeight: number,
) {
  const transform = buildTransform(bounds, pageWidth, pageHeight);

  for (const entity of entities) {
    const type = entity.type?.toUpperCase() ?? "";

    if (type === "LINE") {
      const line = entity as DxfLine;
      const verts = line.vertices ?? [];
      if (verts.length >= 2) {
        drawLineSegment(page, verts[0].x, verts[0].y, verts[1].x, verts[1].y, transform);
      }
      continue;
    }

    if (type === "CIRCLE") {
      const circle = entity as DxfCircle;
      const c = transform.toPdf(circle.center.x, circle.center.y);
      const radiusPt = (circle.radius ?? 0) * transform.scale;
      if (radiusPt > 0) {
        page.drawCircle({
          x: c.x,
          y: c.y,
          size: radiusPt * 2,
          borderColor: STROKE_RGB,
          borderWidth: LINE_WIDTH,
        });
      }
      continue;
    }

    if (type === "ARC") {
      drawArcSegments(page, entity as DxfArc, transform);
      continue;
    }

    if (type === "LWPOLYLINE" || type === "POLYLINE") {
      const poly = entity as DxfPolyline;
      const verts = poly.vertices ?? [];
      for (let i = 0; i < verts.length - 1; i += 1) {
        drawLineSegment(page, verts[i].x, verts[i].y, verts[i + 1].x, verts[i + 1].y, transform);
      }
      if (poly.shape && verts.length > 2) {
        const last = verts[verts.length - 1];
        const first = verts[0];
        drawLineSegment(page, last.x, last.y, first.x, first.y, transform);
      }
      continue;
    }

    if (type === "TEXT") {
      const text = entity as DxfText;
      if (text.text) {
        const p = transform.toPdf(text.startPoint.x, text.startPoint.y);
        const size = Math.max(6, Math.min(14, (text.textHeight || 2.5) * transform.scale));
        page.drawText(text.text, { x: p.x, y: p.y, size, color: STROKE_RGB });
      }
      continue;
    }

    if (type === "MTEXT") {
      const mtext = entity as DxfMtext;
      if (mtext.text) {
        const p = transform.toPdf(mtext.position.x, mtext.position.y);
        const size = Math.max(6, Math.min(14, (mtext.height || 2.5) * transform.scale));
        const clean = mtext.text.replace(/\\P/g, "\n").replace(/\\[A-Za-z][^;]*;/g, "");
        page.drawText(clean, { x: p.x, y: p.y, size, color: STROKE_RGB, maxWidth: 400 });
      }
    }
  }
}

export async function convertAutocadToPdfBytes(
  file: File,
  onProgress?: (phase: AutocadProgressPhase, percent: number) => void,
): Promise<Uint8Array> {
  if (!file) throw new Error("Choose a file to convert.");
  if (isDwgFile(file)) {
    throw new Error(DWG_INSTRUCTION_MESSAGE);
  }
  if (!isDxfFile(file)) {
    throw new Error("Please upload a .dxf drawing file.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) throw new Error("That file is empty.");

  onProgress?.("parsing", 15);

  try {
    const text = decodeDxfText(bytes);
    const parser = new DxfParser();
    const parsed = parser.parseSync(text);
    if (!parsed?.entities?.length) {
      throw new Error("No drawable entities were found in this DXF file.");
    }

    onProgress?.("parsing", 45);

    const bounds = collectBounds(parsed.entities);
    if (!bounds) {
      throw new Error("Could not determine drawing bounds from the DXF content.");
    }

    onProgress?.("layout", 75);

    const doc = await PDFDocument.create();
    const page = doc.addPage([A4_LANDSCAPE.width, A4_LANDSCAPE.height]);
    drawEntitiesOnPage(page, parsed.entities, bounds, A4_LANDSCAPE.width, A4_LANDSCAPE.height);

    onProgress?.("complete", 95);

    return doc.save({ useObjectStreams: false });
  } catch (error) {
    if (error instanceof Error && error.message === DWG_INSTRUCTION_MESSAGE) {
      throw error;
    }
    throw classifyPdfError(error);
  }
}

export function autocadToPdfOutputName(file: File): string {
  const base = file.name.replace(/\.(dxf|dwg)$/i, "") || "drawing";
  return `${base}-blueprint.pdf`;
}