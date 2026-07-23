/**
 * Locale-specific public SEO slugs for tools.
 * Canonical inventory / registry IDs stay English; URLs may use localized slugs.
 */
import type { AppLocale } from "@/i18n/routing";

/**
 * Russian SEO slugs for PDF-primary tools (transliterated, keyword-led).
 * Keys = inventory / registry IDs. Values = public path segments under `/ru/`.
 */
export const PDF_TOOL_SLUGS_RU: Record<string, string> = {
  "add-page-numbers": "dobavit-nomera-stranits-pdf",
  "add-watermark": "dobavit-vodianoi-znak-pdf",
  "annotate-pdf": "annotatsii-pdf",
  "autocad-to-pdf": "autocad-v-pdf",
  "batch-rename-pdf": "paketnoe-pereimenovanie-pdf",
  "compare-pdf": "sravnenie-pdf",
  "crop-pdf": "obrezka-pdf",
  "custom-paper-margin": "polia-stranitsy-pdf",
  "delete-pdf-pages": "udalenie-stranits-pdf",
  "ebook-to-pdf": "ebook-v-pdf",
  "excel-to-pdf": "excel-v-pdf",
  "extract-images": "izvlech-izobrazheniya-iz-pdf",
  "extract-pdf-pages": "izvlech-stranitsy-pdf",
  "extract-tables-pdf": "izvlech-tablitsy-iz-pdf",
  "flatten-pdf": "sploshit-pdf",
  "grayscale-pdf": "chernobelyi-pdf",
  "heic-to-pdf": "heic-v-pdf",
  "html-to-pdf": "html-v-pdf",
  "iwork-to-pdf": "iwork-v-pdf",
  "jpg-to-pdf": "jpg-v-pdf",
  "markdown-to-pdf": "markdown-v-pdf",
  "n-up-pdf": "neskolko-stranits-na-liste-pdf",
  "openoffice-to-pdf": "openoffice-v-pdf",
  "pdf-a-converter": "konverter-pdf-a",
  "pdf-compress": "szhatie-pdf",
  "pdf-editor": "redaktor-pdf",
  "pdf-linearization": "linearizatsiya-pdf",
  "pdf-merge": "obiedinenie-pdf",
  "pdf-metadata-editor": "redaktor-metadannykh-pdf",
  "pdf-password-recovery": "vosstanovlenie-parolya-pdf",
  "pdf-signature-validator": "proverka-podpisi-pdf",
  "pdf-split": "razdelenie-pdf",
  "pdf-text-editor": "redaktor-teksta-pdf",
  "pdf-to-booklet": "pdf-v-buklet",
  "pdf-to-epub": "pdf-v-epub",
  "pdf-to-excel": "pdf-v-excel",
  "pdf-to-html": "pdf-v-html",
  "pdf-to-jpg": "pdf-v-jpg",
  "pdf-to-png": "pdf-v-png",
  "pdf-to-powerpoint": "pdf-v-powerpoint",
  "pdf-to-text": "pdf-v-tekst",
  "pdf-to-word": "pdf-v-word",
  "pdf-to-xps": "pdf-v-xps",
  "png-to-pdf": "png-v-pdf",
  "powerpoint-to-pdf": "powerpoint-v-pdf",
  "protect-pdf": "zashchita-pdf",
  "redact-pdf": "redaktirovanie-pdf",
  "remove-hidden-metadata": "udalit-metadannye-pdf",
  "reorder-pdf-pages": "izmenit-poryadok-stranits-pdf",
  "repair-pdf": "vosstanovlenie-pdf",
  "rotate-pdf": "povorot-pdf",
  "safe-to-share-auditor": "proverka-pdf-pered-otpravkoi",
  "sign-pdf": "podpisat-pdf",
  "unlock-pdf": "razblokirovat-pdf",
  "word-to-pdf": "word-v-pdf",
};

/**
 * Russian SEO slugs for video / MP4 hub tools (transliterated, keyword-led).
 */
export const VIDEO_TOOL_SLUGS_RU: Record<string, string> = {
  "mp4-to-mp3": "mp4-v-mp3",
  "video-compressor": "szhatie-mp4",
  "video-converter": "konverter-video",
  "video-metadata-cleaner": "ochistka-metadannykh-video",
  "video-muter": "otklyuchit-zvuk-video",
  "video-resizer": "izmenenie-razmera-video",
  "video-rotator": "povorot-video",
  "video-speed": "skorost-video",
  "video-speed-controller": "kontrol-skorosti-video",
  "video-to-gif": "video-v-gif",
  "video-to-mp3": "video-v-mp3",
  "video-to-mp4": "konverter-mp4",
  "video-trimmer": "obrezka-mp4",
};

/**
 * Russian SEO slugs for convert-hub tools not already covered by PDF / video maps.
 * (Document/image/media/data converters tagged `convert`.)
 */
export const CONVERT_TOOL_SLUGS_RU: Record<string, string> = {
  "convert-to-png": "konverter-v-png",
  "csv-to-json": "csv-v-json",
  "csv-to-markdown-table": "csv-v-markdown",
  "heic-to-jpg": "heic-v-jpg",
  "html-markdown-converter": "html-markdown-konverter",
  "ico-to-png": "ico-v-png",
  "image-converter": "konverter-izobrazheniy",
  "json-to-csv": "json-v-csv",
  "mp3-to-mp4": "mp3-v-mp4",
  "mp3-to-wav": "mp3-v-wav",
  "sql-query-formatter": "formatirovanie-sql",
  "svg-to-png": "svg-v-png",
  "wav-to-mp3": "wav-v-mp3",
  "webp-to-jpg": "webp-v-jpg",
  "yaml-json-converter": "yaml-json-konverter",
};

/**
 * Russian SEO slugs for compress-hub tools not already covered by PDF / video maps.
 */
export const COMPRESS_TOOL_SLUGS_RU: Record<string, string> = {
  "audio-compressor": "szhatie-audio",
  "compress-image": "szhatie-izobrazheniy",
  "favicon-compressor": "szhatie-favicon",
  "mp3-compressor": "szhatie-mp3",
};

/**
 * Russian SEO slugs for MP4 hub tools (same IDs as video tools; keyword-led).
 * Kept explicit so mp4-tools mirrors other category maps.
 */
export const MP4_TOOL_SLUGS_RU: Record<string, string> = {
  "mp4-to-mp3": "mp4-v-mp3",
  "video-compressor": "szhatie-mp4",
  "video-converter": "konverter-video",
  "video-metadata-cleaner": "ochistka-metadannykh-video",
  "video-muter": "otklyuchit-zvuk-video",
  "video-resizer": "izmenenie-razmera-video",
  "video-rotator": "povorot-video",
  "video-speed": "skorost-video",
  "video-speed-controller": "kontrol-skorosti-video",
  "video-to-gif": "video-v-gif",
  "video-to-mp3": "video-v-mp3",
  "video-to-mp4": "konverter-mp4",
  "video-trimmer": "obrezka-mp4",
};

/**
 * Russian SEO slugs for extract-hub tools (aligned with PDF SEO map).
 * Action verb stays «извлечь» / «izvlech-» for consistency across the site.
 */
export const EXTRACT_TOOL_SLUGS_RU: Record<string, string> = {
  "extract-pdf-pages": "izvlech-stranitsy-pdf",
  "extract-tables-pdf": "izvlech-tablitsy-iz-pdf",
  "extract-images": "izvlech-izobrazheniya-iz-pdf",
  "color-palette-extractor": "extractor-palitry",
};

/**
 * Russian SEO slugs for image-hub tools not already covered by other maps.
 */
export const IMAGE_TOOL_SLUGS_RU: Record<string, string> = {
  "crop-image": "obrezka-izobrazheniya",
  "flip-image": "otrazhenie-izobrazheniya",
  "image-blur-redact": "razmytie-izobrazheniya",
  "image-dpi-converter": "izmenenie-dpi",
  "image-grayscale": "chernobeloe-izobrazhenie",
  "image-combiner": "obedinenie-izobrazheniy",
  "image-grid-splitter": "razbit-na-setku",
  "image-metadata-editor": "redaktor-metadannykh-izobrazheniya",
  "image-metadata-wiper": "udalit-metadannye-izobrazheniya",
  "image-optimizer": "optimizatsiya-izobrazheniy",
  "image-watermark": "vodianoi-znak-izobrazheniya",
  "paint-on-image": "risovanie-na-izobrazhenii",
  "png-to-ico": "png-v-ico",
  "resize-image": "izmenenie-razmera",
  "rotate-image": "povorot-izobrazheniya",
  "svg-optimizer": "optimizatsiya-svg",
};

/**
 * Russian SEO slugs for jpg-tools hub (category-first nests).
 * Compress keeps shared `szhatie-izobrazheniy` so image/compress/jpg hubs stay in sync.
 */
export const JPG_TOOL_SLUGS_RU: Record<string, string> = {
  "compress-image": "szhatie-izobrazheniy",
  "heic-to-jpg": "heic-v-jpg",
  "jpg-to-pdf": "jpg-v-pdf",
  "pdf-to-jpg": "pdf-v-jpg",
  "webp-to-jpg": "webp-v-jpg",
};

/**
 * Russian SEO slugs for png-tools hub (category-first nests).
 * Optimizer keeps shared `optimizatsiya-izobrazheniy` with image-tools.
 */
export const PNG_TOOL_SLUGS_RU: Record<string, string> = {
  "convert-to-png": "konverter-v-png",
  "ico-to-png": "ico-v-png",
  "image-optimizer": "optimizatsiya-izobrazheniy",
  "pdf-to-png": "pdf-v-png",
  "png-to-ico": "png-v-ico",
  "png-to-pdf": "png-v-pdf",
  "svg-to-png": "svg-v-png",
};

/**
 * Russian SEO slugs for mp3-tools hub (aligned with MP4: обрезка / скорость / сжатие).
 */
export const MP3_TOOL_SLUGS_RU: Record<string, string> = {
  "audio-compressor": "szhatie-audio",
  "audio-merger": "obedinenie-audio",
  "audio-normalizer": "normalizatsiya-audio",
  "audio-trimmer": "obrezka-audio",
  "fade-in-out-creator": "fade-in-out",
  "flac-converter": "konverter-flac",
  "m4a-converter": "konverter-m4a",
  "mp3-compressor": "szhatie-mp3",
  "mp3-converter": "konverter-mp3",
  "mp3-metadata-editor": "redaktor-metadannykh-mp3",
  "mp3-speed-changer": "skorost-audio",
  "mp3-to-mp4": "mp3-v-mp4",
  "mp3-to-wav": "mp3-v-wav",
  "mp3-trimmer": "obrezka-mp3",
  "mp3-volume-booster": "regulirovka-gromkosti",
  "mp4-to-mp3": "mp4-v-mp3",
  "ogg-converter": "konverter-ogg",
  "silence-remover": "udalenie-tishiny",
  "video-to-mp3": "video-v-mp3",
  "voice-remover": "udalenie-vokala",
  "wav-to-mp3": "wav-v-mp3",
};

/**
 * Russian SEO slugs for favicon-tools hub (category-first nests).
 * Keeps “favicon” in transliterated SEO forms where helpful (szhatie-favicon).
 */
export const FAVICON_TOOL_SLUGS_RU: Record<string, string> = {
  "apple-touch-icon": "apple-touch-icon",
  "favicon-code-generator": "generator-koda-favicon",
  "favicon-compressor": "szhatie-favicon",
  "favicon-cropper": "obrezka-favicon",
  "favicon-generator": "generator-favicon",
  "favicon-pack": "nabor-favicon",
  "favicon-previewer": "predprosmotr-favicon",
  "generate-favicon": "sozdat-favicon",
  "ico-to-png": "ico-v-png",
  "png-to-ico": "png-v-ico",
  "svg-to-favicon": "svg-v-favicon",
  "transparent-favicon": "prozrachnyi-favicon",
};

/**
 * Russian SEO slugs for text-tools hub (category-first nests).
 * Includes primary text tools plus multi-tagged peers shown on the hub.
 */
export const TEXT_TOOL_SLUGS_RU: Record<string, string> = {
  "base64-encoder-decoder": "base64-kodirovshik",
  "case-converter": "preobrazovatel-registra",
  "html-markdown-converter": "html-markdown-konverter",
  "json-csv-explorer": "issledovatel-json-csv",
  "lorem-ipsum-generator": "generator-lorem-ipsum",
  "quick-note": "menedzher-zametok",
  "readability-analyzer": "analizator-chitaemosti",
  "reading-time-calculator": "kalkulyator-vremeni-chteniya",
  "string-generator": "generator-strok",
  "text-diff": "sravnenie-teksta",
  "text-diff-checker": "proverka-razlichiy-teksta",
  "text-sanitizer": "ochistka-teksta",
  "text-workspace": "tekstovoe-prostranstvo",
  "timezone-converter": "konverter-chasovyh-poyasov",
  "unit-converter": "konverter-edinits",
  "url-encoder-decoder": "url-kodirovshik",
  "url-parameter-stripper": "udalenie-parametrov-url",
  "word-character-counter": "schetchik-slov",
};

/**
 * Russian SEO slugs for json-tools hub (category-first nests).
 * Reuses convert/text aliases where already defined; adds formatter/minifier SEO forms.
 */
export const JSON_TOOL_SLUGS_RU: Record<string, string> = {
  "csv-to-json": "csv-v-json",
  "html-markdown-converter": "html-markdown-konverter",
  "json-csv-explorer": "issledovatel-json-csv",
  "json-formatter": "formatirovshchik-json",
  "json-minifier": "minifikator-json",
  "json-to-csv": "json-v-csv",
  "yaml-json-converter": "yaml-json-konverter",
};

/**
 * Russian SEO slugs for developer-tools hub (category-first nests).
 * Reuses text/json/convert/pdf aliases; adds developer-primary SEO forms.
 * Also includes security peers commonly linked from this hub (uuid/hash/password).
 */
export const DEVELOPER_TOOL_SLUGS_RU: Record<string, string> = {
  "base-converter": "konverter-sistem-schisleniya",
  "base64-encoder-decoder": "base64-kodirovshik",
  "color-converter": "konverter-cvetov",
  "color-palette-extractor": "extractor-palitry",
  "csv-to-json": "csv-v-json",
  "data-converter-visualizer": "konverter-vizualizator-dannyh",
  "hash-generator": "generator-khesha",
  "html-markdown-converter": "html-markdown-konverter",
  "html-to-pdf": "html-v-pdf",
  "invoice-generator": "generator-schetov",
  "json-csv-explorer": "issledovatel-json-csv",
  "json-formatter": "formatirovshchik-json",
  "json-minifier": "minifikator-json",
  "json-to-csv": "json-v-csv",
  "jwt-debugger": "dekoder-jwt",
  "markdown-to-pdf": "markdown-v-pdf",
  "my-ip": "moy-ip",
  "password-generator": "generator-paroley",
  "qr-code-generator": "generator-qr-kodov",
  "sql-query-formatter": "formatirovanie-sql",
  "ssl-decoder": "dekoder-ssl",
  "storage-data-converter": "konverter-edinits-hraneniya",
  "string-generator": "generator-strok",
  "timeline-gantt-generator": "generator-diagrammy-ganta",
  "url-encoder-decoder": "url-kodirovshik",
  "url-parameter-stripper": "udalenie-parametrov-url",
  "user-agent-parser": "analizator-user-agent",
  "uuid-generator": "generator-uuid",
};

/**
 * Russian SEO slugs for word-tools hub (category-first nests).
 * Reuses PDF / text / developer aliases for shared tools.
 */
export const WORD_TOOL_SLUGS_RU: Record<string, string> = {
  "password-generator": "generator-paroley",
  "pdf-password-recovery": "vosstanovlenie-parolya-pdf",
  "pdf-to-word": "pdf-v-word",
  "word-character-counter": "schetchik-slov",
  "word-to-pdf": "word-v-pdf",
};

/**
 * Russian SEO slugs for excel-tools hub (category-first nests).
 * Reuses PDF / extract aliases for shared tools.
 */
export const EXCEL_TOOL_SLUGS_RU: Record<string, string> = {
  "excel-to-pdf": "excel-v-pdf",
  "extract-tables-pdf": "izvlech-tablitsy-iz-pdf",
  "pdf-to-excel": "pdf-v-excel",
};

/**
 * Russian SEO slugs for crop-tools hub (category-first nests).
 * Aligns with image/favicon “obrezka-*” terminology.
 */
export const CROP_TOOL_SLUGS_RU: Record<string, string> = {
  "crop-image": "obrezka-izobrazheniya",
  "crop-pdf": "obrezka-pdf",
  "favicon-cropper": "obrezka-favicon",
};

/**
 * Russian SEO slugs for rotate-tools hub (category-first nests).
 * Aligns with PDF/image/video “povorot-*” terminology.
 */
export const ROTATE_TOOL_SLUGS_RU: Record<string, string> = {
  "flip-image": "otrazhenie-izobrazheniya",
  "rotate-image": "povorot-izobrazheniya",
  "rotate-pdf": "povorot-pdf",
  "video-rotator": "povorot-video",
};

/**
 * Russian SEO slugs for security-tools hub (category-first nests).
 * Reuses PDF / image / video / developer aliases for shared tools.
 */
export const SECURITY_TOOL_SLUGS_RU: Record<string, string> = {
  "hash-generator": "generator-khesha",
  "image-blur-redact": "razmytie-izobrazheniya",
  "image-metadata-wiper": "udalit-metadannye-izobrazheniya",
  "password-generator": "generator-paroley",
  "pdf-password-recovery": "vosstanovlenie-parolya-pdf",
  "pdf-signature-validator": "proverka-podpisi-pdf",
  "protect-pdf": "zashchita-pdf",
  "redact-pdf": "redaktirovanie-pdf",
  "remove-hidden-metadata": "udalit-metadannye-pdf",
  "safe-to-share-auditor": "proverka-pdf-pered-otpravkoi",
  "sign-pdf": "podpisat-pdf",
  "ssl-decoder": "dekoder-ssl",
  "unlock-pdf": "razblokirovat-pdf",
  "uuid-generator": "generator-uuid",
  "video-metadata-cleaner": "ochistka-metadannykh-video",
};

/**
 * Russian SEO slugs for data-conversion-tools hub (category-first nests).
 * Reuses convert / json / developer aliases. Format names (CSV, JSON, YAML, SQL) stay Latin.
 */
export const DATA_CONVERSION_TOOL_SLUGS_RU: Record<string, string> = {
  "csv-to-markdown-table": "csv-v-markdown",
  "sql-query-formatter": "formatirovanie-sql",
  "yaml-json-converter": "yaml-json-konverter",
};

/**
 * Russian SEO slugs for productivity-tools hub (category-first nests).
 * Reuses text / developer / unit-math aliases for shared tools.
 */
export const PRODUCTIVITY_TOOL_SLUGS_RU: Record<string, string> = {
  "base-converter": "konverter-sistem-schisleniya",
  "case-converter": "preobrazovatel-registra",
  "global-timezone-converter": "globalnyi-konverter-chasovyh-poyasov",
  "lorem-ipsum-generator": "generator-lorem-ipsum",
  "quick-note": "menedzher-zametok",
  "readability-analyzer": "analizator-chitaemosti",
  "reading-time-calculator": "kalkulyator-vremeni-chteniya",
  "storage-data-converter": "konverter-edinits-hraneniya",
  "timezone-converter": "konverter-chasovyh-poyasov",
  "unit-converter": "konverter-edinits",
  "word-character-counter": "schetchik-slov",
};

/**
 * Russian SEO slugs for unit-converters hub (category-first nests).
 * Reuses productivity / text / developer aliases for shared tools.
 */
export const UNIT_MATH_TOOL_SLUGS_RU: Record<string, string> = {
  "base-converter": "konverter-sistem-schisleniya",
  "global-timezone-converter": "globalnyi-konverter-chasovyh-poyasov",
  "storage-data-converter": "konverter-edinits-hraneniya",
  "timezone-converter": "konverter-chasovyh-poyasov",
  "unit-converter": "konverter-edinits",
};

/**
 * Russian SEO slugs for network-tools hub (category-first nests).
 * Reuses developer / text / security aliases. Keep IP / DNS / SSL / JWT / URL Latin.
 */
export const NETWORK_TOOL_SLUGS_RU: Record<string, string> = {
  "jwt-debugger": "dekoder-jwt",
  "my-ip": "moy-ip",
  "ssl-decoder": "dekoder-ssl",
  "url-encoder-decoder": "url-kodirovshik",
  "url-parameter-stripper": "udalenie-parametrov-url",
  "user-agent-parser": "analizator-user-agent",
};

/** Combined RU SEO slug map (all category maps). */
export const TOOL_SLUGS_RU: Record<string, string> = {
  ...PDF_TOOL_SLUGS_RU,
  ...VIDEO_TOOL_SLUGS_RU,
  ...CONVERT_TOOL_SLUGS_RU,
  ...COMPRESS_TOOL_SLUGS_RU,
  ...MP4_TOOL_SLUGS_RU,
  ...EXTRACT_TOOL_SLUGS_RU,
  ...IMAGE_TOOL_SLUGS_RU,
  ...JPG_TOOL_SLUGS_RU,
  ...PNG_TOOL_SLUGS_RU,
  ...MP3_TOOL_SLUGS_RU,
  ...FAVICON_TOOL_SLUGS_RU,
  ...TEXT_TOOL_SLUGS_RU,
  ...JSON_TOOL_SLUGS_RU,
  ...DEVELOPER_TOOL_SLUGS_RU,
  ...WORD_TOOL_SLUGS_RU,
  ...EXCEL_TOOL_SLUGS_RU,
  ...CROP_TOOL_SLUGS_RU,
  ...ROTATE_TOOL_SLUGS_RU,
  ...SECURITY_TOOL_SLUGS_RU,
  ...DATA_CONVERSION_TOOL_SLUGS_RU,
  ...PRODUCTIVITY_TOOL_SLUGS_RU,
  ...UNIT_MATH_TOOL_SLUGS_RU,
  ...NETWORK_TOOL_SLUGS_RU,
};

const RU_SLUG_TO_CANONICAL = new Map(
  Object.entries(TOOL_SLUGS_RU).map(([canonical, localized]) => [localized, canonical]),
);

/** Resolve any public slug (EN or localized) to the canonical tool ID. */
export function resolveCanonicalToolSlug(slug: string): string {
  return RU_SLUG_TO_CANONICAL.get(slug) ?? slug;
}

/** Public path segment for a tool in a given locale. */
export function getLocalizedToolSlug(canonicalSlug: string, locale: string): string {
  if (locale === "ru") {
    return TOOL_SLUGS_RU[canonicalSlug] ?? canonicalSlug;
  }
  return canonicalSlug;
}

/** True when this slug is a Russian SEO alias (not the canonical EN id). */
export function isRussianSeoToolSlug(slug: string): boolean {
  return RU_SLUG_TO_CANONICAL.has(slug);
}

function listPublicSlugsFromMap(
  map: Record<string, string>,
  locale?: AppLocale | string,
): string[] {
  const canonical = Object.keys(map);
  if (locale === "ru") {
    return canonical.map((id) => map[id] ?? id);
  }
  if (!locale) {
    // Union for catch-all static params (all locales share the [slug] segment set).
    return [...new Set([...canonical, ...Object.values(map)])];
  }
  return canonical;
}

/** All public PDF tool slug variants that must be statically generated. */
export function listPdfToolPublicSlugs(locale?: AppLocale | string): string[] {
  return listPublicSlugsFromMap(PDF_TOOL_SLUGS_RU, locale);
}

/** All public video tool slug variants that must be statically generated. */
export function listVideoToolPublicSlugs(locale?: AppLocale | string): string[] {
  return listPublicSlugsFromMap(VIDEO_TOOL_SLUGS_RU, locale);
}

/** Convert-hub-specific RU aliases (image/data/media converters). */
export function listConvertToolPublicSlugs(locale?: AppLocale | string): string[] {
  return listPublicSlugsFromMap(CONVERT_TOOL_SLUGS_RU, locale);
}

/** Compress-hub-specific RU aliases (image/audio compressors). */
export function listCompressToolPublicSlugs(locale?: AppLocale | string): string[] {
  return listPublicSlugsFromMap(COMPRESS_TOOL_SLUGS_RU, locale);
}

/** MP4-hub RU aliases (shared with video tools). */
export function listMp4ToolPublicSlugs(locale?: AppLocale | string): string[] {
  return listPublicSlugsFromMap(MP4_TOOL_SLUGS_RU, locale);
}

/** Extract-hub RU aliases (shared with PDF extract tools). */
export function listExtractToolPublicSlugs(locale?: AppLocale | string): string[] {
  return listPublicSlugsFromMap(EXTRACT_TOOL_SLUGS_RU, locale);
}

/** Image-hub RU aliases (crop, resize, rotate, etc.). */
export function listImageToolPublicSlugs(locale?: AppLocale | string): string[] {
  return listPublicSlugsFromMap(IMAGE_TOOL_SLUGS_RU, locale);
}

/** Every Russian SEO slug alias across all tool maps. */
export function listAllRussianSeoToolSlugs(): string[] {
  return [...new Set(Object.values(TOOL_SLUGS_RU))];
}

/**
 * Remap a locale-stripped app pathname when switching locales so SEO slugs
 * stay correct (e.g. obiedinenie-pdf ↔ pdf-merge, konverter-mp4 ↔ video-to-mp4).
 */
export function remapLocalizedToolPathname(
  pathname: string,
  nextLocale: string,
): string {
  const bare = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  let path = bare.startsWith("/") ? bare : `/${bare}`;
  path = path.replace(/^\/(en|he|ru)(?=\/)/, "");
  if (!path.startsWith("/")) path = `/${path}`;

  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "tools" || parts.length < 2) return path.endsWith("/") ? path : `${path}/`;

  const slugIndex = parts.length - 1;
  const slug = parts[slugIndex];
  if (!slug || slug === "[slug]") return path.endsWith("/") ? path : `${path}/`;

  const canonical = resolveCanonicalToolSlug(slug);
  const localized = getLocalizedToolSlug(canonical, nextLocale);
  if (localized === slug) return path.endsWith("/") ? path : `${path}/`;

  parts[slugIndex] = localized;
  return `/${parts.join("/")}/`;
}
