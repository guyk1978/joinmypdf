/**
 * Migrates embedded tool docs into src/lib/registry/<slug>.ts overlays.
 *
 * - Dedicated ARTICLE_SECTIONS pages → whyItMatters from messages/en.json article.intro
 * - FontSubsetter spike → hardcoded whyItMatters + FAQ moved out of the component
 * - tools.json → documentation field synced (whyItMatters + faq.question/answer)
 *
 * After running, delete src/lib/registry.ts if present so `@/lib/registry` resolves to this folder.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const messagesPath = path.join(root, "messages", "en.json");
const registryDir = path.join(root, "src", "lib", "registry");
const legacyAdapterPath = path.join(root, "src", "lib", "registry.ts");

/** Dedicated tool pages that embed ARTICLE_SECTIONS marketing copy. */
const PAGE_NAMESPACE_BY_SLUG = {
  "image-watermark": "ImageWatermarkPage",
  "image-grid-splitter": "ImageGridSplitterPage",
  "image-metadata-wiper": "ImageMetadataWiperPage",
  "image-dpi-converter": "ImageDpiConverterPage",
  "image-blur-redact": "ImageBlurRedactPage",
  "rotate-image": "RotateAlignSuitePage",
  "favicon-generator": "FaviconGeneratorPage",
  "color-palette-extractor": "ColorPaletteExtractorPage",
  "color-converter": "ColorConverterPage",
  "global-timezone-converter": "GlobalTimezoneConverterPage",
  "storage-data-converter": "StorageDataConverterPage",
  "base-converter": "BaseConverterPage",
  "readability-analyzer": "ReadabilityAnalyzerPage",
  "text-sanitizer": "TextSanitizerPage",
  "url-parameter-stripper": "UrlParameterStripperPage",
  "json-csv-explorer": "JsonCsvExplorerPage",
  "my-ip": "MyIpNetworkInfoPage",
  "svg-optimizer": "SvgOptimizerPage",
  "image-converter": "ImageConverterPage",
  "lorem-ipsum-generator": "LoremIpsumGeneratorPage",
  "text-diff": "TextDiffPage",
  "text-workspace": "TextWorkspacePage",
  "ssl-decoder": "SslDecoderPage",
  "pdf-editor": "PdfEditorPage",
  "video-compressor": "VideoCompressorPage",
  "video-converter": "VideoConverterPage",
  "video-resizer": "VideoResizerPage",
  "video-rotator": "VideoRotatorPage",
  "video-speed": "VideoSpeedPage",
  "video-to-gif": "VideoToGifPage",
  "video-trimmer": "VideoTrimmerPage",
  "video-to-mp3": "VideoToMp3Page",
  "video-muter": "VideoMuterPage",
  "video-metadata-cleaner": "VideoMetadataCleanerPage",
};

const FONT_SUBSETTER_DOCS = {
  whyItMatters:
    "Subset only the glyphs you actually use, reduce transfer size, and keep complete control over your files with local-first browser processing. Large font files are a common cause of slow website performance; subsetting helps eliminate Flash of Unstyled Text and improves Core Web Vitals without uploading brand assets to a server.",
  faq: [
    {
      question: "What is font subsetting?",
      answer:
        "Font subsetting is the process of removing unused characters (glyphs) from a font file. This significantly reduces file size while keeping only the characters needed for your website's language and content.",
    },
    {
      question: "Why should I subset my fonts?",
      answer:
        "Large font files are a common cause of slow website performance. Subsetting helps eliminate 'Flash of Unstyled Text' (FOUT) and improves your Google PageSpeed scores.",
    },
    {
      question: "Is this tool safe to use?",
      answer:
        "Yes. All processing happens 100% locally in your browser. Your font files are never uploaded to a server, ensuring complete privacy and security.",
    },
    {
      question: "Which font formats are supported?",
      answer: "We currently support TTF, OTF, and WOFF2 formats.",
    },
  ],
};

function toTsString(value) {
  return JSON.stringify(value);
}

function faqFromLegacy(faq = []) {
  return faq.map((item) => ({
    question: item.q ?? item.question ?? "",
    answer: item.a ?? item.answer ?? "",
  }));
}

function legacyFromDocumentationFaq(faq = []) {
  return faq.map((item) => ({
    q: item.question,
    a: item.answer,
  }));
}

function slugToIdent(slug) {
  return slug.replace(/[^a-zA-Z0-9]/g, "_");
}

function writeOverlay(slug, documentation) {
  const filePath = path.join(registryDir, `${slug}.ts`);
  const body = `import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for \`${slug}\` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: ${toTsString(documentation.whyItMatters)},
  faq: ${toTsString(documentation.faq)},
};

export default documentation;
`;
  fs.writeFileSync(filePath, body, "utf8");
}

function main() {
  fs.mkdirSync(registryDir, { recursive: true });

  const registry = JSON.parse(fs.readFileSync(toolsJsonPath, "utf8"));
  const messages = JSON.parse(fs.readFileSync(messagesPath, "utf8"));
  /** @type {Map<string, { whyItMatters: string, faq: { question: string, answer: string }[] }>} */
  const overlays = new Map();

  for (const [slug, pageNs] of Object.entries(PAGE_NAMESPACE_BY_SLUG)) {
    const tool = (registry.tools || []).find((entry) => entry.slug === slug);
    const intro = messages?.[pageNs]?.article?.intro;
    const whyItMatters =
      (typeof intro === "string" && intro.trim()) ||
      tool?.intent ||
      tool?.description ||
      "";
    overlays.set(slug, {
      whyItMatters,
      faq: faqFromLegacy(tool?.faq),
    });
  }

  overlays.set("subset-font-spike", FONT_SUBSETTER_DOCS);

  for (const tool of registry.tools || []) {
    const overlay = overlays.get(tool.slug);
    const documentation = overlay ?? {
      whyItMatters: tool.intent || tool.description || "",
      faq: faqFromLegacy(tool.faq),
    };
    tool.documentation = documentation;
    tool.faq = legacyFromDocumentationFaq(documentation.faq);
  }

  for (const [slug, documentation] of overlays) {
    writeOverlay(slug, documentation);
  }

  const indexEntries = [...overlays.keys()].sort();
  const indexSource = `import type { SiteRegistry, ToolDefinition, ToolDocumentation } from "@/lib/types";
import raw from "../../../assets/data/tools.json";

${indexEntries
  .map((slug) => `import ${slugToIdent(slug)}Docs from "./${slug}";`)
  .join("\n")}

/** Per-tool documentation modules under \`src/lib/registry/\`. */
export const DOCUMENTATION_BY_SLUG: Record<string, ToolDocumentation> = {
${indexEntries
  .map((slug) => `  "${slug}": ${slugToIdent(slug)}Docs,`)
  .join("\n")}
};

function legacyFaqFromDocumentation(documentation: ToolDocumentation) {
  return documentation.faq.map((item) => ({ q: item.question, a: item.answer }));
}

function synthesizeDocumentation(tool: ToolDefinition): ToolDocumentation {
  if (tool.documentation?.whyItMatters || tool.documentation?.faq?.length) {
    return {
      whyItMatters: tool.documentation.whyItMatters || tool.intent || tool.description || "",
      faq:
        tool.documentation.faq?.length
          ? tool.documentation.faq
          : (tool.faq || []).map((item) => ({ question: item.q, answer: item.a })),
    };
  }
  return {
    whyItMatters: tool.intent || tool.description || "",
    faq: (tool.faq || []).map((item) => ({ question: item.q, answer: item.a })),
  };
}

function withDocumentation(tool: ToolDefinition): ToolDefinition {
  const documentation = DOCUMENTATION_BY_SLUG[tool.slug] ?? synthesizeDocumentation(tool);
  return {
    ...tool,
    documentation,
    faq: legacyFaqFromDocumentation(documentation),
  };
}

const base = raw as SiteRegistry;

/** Site registry with per-tool documentation overlays from \`src/lib/registry/\`. */
export const registry: SiteRegistry = {
  ...base,
  tools: base.tools.map(withDocumentation),
};

export function getToolDocumentation(slug: string): ToolDocumentation | undefined {
  return DOCUMENTATION_BY_SLUG[slug] ?? registry.tools.find((tool) => tool.slug === slug)?.documentation;
}

export default registry;
`;

  fs.writeFileSync(path.join(registryDir, "index.ts"), indexSource, "utf8");
  fs.writeFileSync(toolsJsonPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");

  if (fs.existsSync(legacyAdapterPath)) {
    fs.unlinkSync(legacyAdapterPath);
  }

  console.log(`Wrote ${overlays.size} documentation overlays + registry/index.ts; removed legacy registry.ts`);
}

main();
