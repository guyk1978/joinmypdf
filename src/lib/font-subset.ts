import * as opentypeModule from "opentype.js";
import type { Font, Glyph } from "opentype.js";

type OpentypeApi = {
  Font: typeof Font;
  parse: (buffer: ArrayBuffer, options?: object) => Font;
};

function getOpentype(): OpentypeApi {
  const mod = opentypeModule as OpentypeApi & { default?: OpentypeApi };
  if (typeof mod.parse === "function" && typeof mod.Font === "function") {
    return mod;
  }
  if (mod.default) {
    return mod.default;
  }
  throw new Error("Could not load opentype.js.");
}

const { Font: OpentypeFont, parse } = getOpentype();

export type FontSubsetResult = {
  data: Uint8Array;
  originalSize: number;
  subsetSize: number;
};

export class FontSubsetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FontSubsetError";
  }
}

function toArrayBuffer(fontData: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (fontData instanceof ArrayBuffer) {
    return fontData;
  }
  return fontData.buffer.slice(
    fontData.byteOffset,
    fontData.byteOffset + fontData.byteLength,
  ) as ArrayBuffer;
}

function assertSupportedFormat(fontData: ArrayBuffer | Uint8Array): void {
  const bytes = fontData instanceof Uint8Array ? fontData : new Uint8Array(fontData);
  if (bytes.byteLength < 4) {
    throw new FontSubsetError("This file is too small to be a valid font.");
  }

  const signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (signature === "wOFF" || signature === "wOF2") {
    throw new FontSubsetError(
      "WOFF and WOFF2 fonts are not supported. Please upload a TTF or OTF file.",
    );
  }
}

function uniqueGlyphText(text: string): string {
  const chars = new Set<string>();
  for (const char of text) {
    chars.add(char);
  }
  return [...chars].join("");
}

function readEnglishName(font: Font, key: string, fallback: string): string {
  return font.getEnglishName(key) || fallback;
}

function buildSubsetGlyphs(font: Font, text: string): Glyph[] {
  const notdefGlyph = font.glyphs.get(0);
  if (notdefGlyph) {
    notdefGlyph.name = ".notdef";
  }

  const glyphsForText: Glyph[] = [];
  for (const char of uniqueGlyphText(text)) {
    glyphsForText.push(font.charToGlyph(char));
  }
  const seen = new Set<number>();
  const subGlyphs: Glyph[] = [];

  const pushGlyph = (glyph: Glyph | undefined) => {
    if (!glyph || seen.has(glyph.index)) return;
    seen.add(glyph.index);
    subGlyphs.push(glyph);
  };

  pushGlyph(notdefGlyph);
  for (const glyph of glyphsForText) {
    pushGlyph(glyph);
  }

  if (subGlyphs.length <= 1) {
    throw new FontSubsetError(
      "None of the requested characters were found in this font. Try different characters.",
    );
  }

  return subGlyphs;
}

function createSubsetFont(font: Font, text: string): Font {
  const postScriptName = readEnglishName(font, "postScriptName", "SubsetFont");
  const familyName = readEnglishName(font, "fontFamily", postScriptName.split("-")[0] || "Subset");
  const styleName =
    readEnglishName(font, "fontSubfamily", postScriptName.split("-").slice(1).join("-")) || "Regular";

  return new OpentypeFont({
    familyName,
    styleName,
    unitsPerEm: font.unitsPerEm,
    ascender: font.ascender,
    descender: font.descender,
    designer: readEnglishName(font, "designer", ""),
    designerURL: readEnglishName(font, "designerURL", ""),
    manufacturer: readEnglishName(font, "manufacturer", ""),
    manufacturerURL: readEnglishName(font, "manufacturerURL", ""),
    license: readEnglishName(font, "license", ""),
    licenseURL: readEnglishName(font, "licenseURL", ""),
    version: readEnglishName(font, "version", ""),
    description: readEnglishName(font, "description", ""),
    copyright: `Subset of ${postScriptName}. ${readEnglishName(font, "copyright", "")}`.trim(),
    trademark: readEnglishName(font, "trademark", ""),
    glyphs: buildSubsetGlyphs(font, text),
  });
}

export function formatFontSubsetError(error: unknown): string {
  if (error instanceof FontSubsetError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (/substitutiontype|lookuptype|gsub|not yet supported/i.test(error.message)) {
      return "This font uses advanced OpenType substitutions that are not supported yet. Try another font file.";
    }
    if (/unsupported|invalid|corrupt|parse/i.test(error.message)) {
      return "Only valid TTF or OTF font files are supported. Please try another file.";
    }
    return error.message;
  }
  return "Font subsetting failed. Please try another file.";
}

/** Subset a font to TTF/OTF bytes using only the glyphs needed for `text`. */
export async function subsetFontFile(file: File, text: string): Promise<FontSubsetResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new FontSubsetError("Enter at least one character to keep in the subset.");
  }

  const fontData = await file.arrayBuffer();
  assertSupportedFormat(fontData);

  let font: Font;
  try {
    font = parse(toArrayBuffer(fontData));
  } catch {
    throw new FontSubsetError("Only valid TTF or OTF font files are supported. Please try another file.");
  }

  const subset = createSubsetFont(font, trimmed);
  const data = new Uint8Array(subset.toArrayBuffer());

  return {
    data,
    originalSize: fontData.byteLength,
    subsetSize: data.byteLength,
  };
}
