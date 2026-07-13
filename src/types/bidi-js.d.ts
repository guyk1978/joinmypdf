declare module "bidi-js" {
  type EmbeddingLevels = {
    levels: Uint8Array;
    paragraphs: Array<{ start: number; end: number; level: number }>;
  };

  type Bidi = {
    getEmbeddingLevels: (text: string, explicitDirection?: "ltr" | "rtl" | null) => EmbeddingLevels;
    getReorderSegments: (
      text: string,
      embeddingLevels: EmbeddingLevels,
      start?: number,
      end?: number,
    ) => Array<[number, number]>;
    getMirroredCharactersMap: (
      text: string,
      embeddingLevels: EmbeddingLevels,
      start?: number,
      end?: number,
    ) => Map<number, string>;
    getMirroredCharacter: (char: string) => string | null;
    getBidiCharTypeName: (char: string) => string;
  };

  export default function bidiFactory(): Bidi;
}
