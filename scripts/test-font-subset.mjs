import { readFileSync } from "node:fs";
import { Font, parse } from "../node_modules/opentype.js/dist/opentype.mjs";

const fontBytes = readFileSync("public/wasm/Roboto-400-test.ttf");

function subset(fontData, text) {
  const font = parse(fontData);
  const notdefGlyph = font.glyphs.get(0);
  if (notdefGlyph) notdefGlyph.name = ".notdef";
  const subGlyphs = [notdefGlyph, ...font.stringToGlyphs([...new Set(text)].join(""))].filter(Boolean);
  const subsetFont = new Font({
    familyName: font.getEnglishName("fontFamily") || "Subset",
    styleName: font.getEnglishName("fontSubfamily") || "Regular",
    unitsPerEm: font.unitsPerEm,
    ascender: font.ascender,
    descender: font.descender,
    glyphs: subGlyphs,
  });
  return subsetFont.toArrayBuffer();
}

const t0 = Date.now();
const output = subset(fontBytes, "ABCabc");
console.log("subset ttf", output.byteLength, "bytes in", Date.now() - t0, "ms");
