import type { SiteRegistry, ToolDefinition, ToolDocumentation } from "@/lib/types";
import raw from "../../../assets/data/tools.json";

import base_converterDocs from "./base-converter";
import color_converterDocs from "./color-converter";
import color_palette_extractorDocs from "./color-palette-extractor";
import favicon_generatorDocs from "./favicon-generator";
import global_timezone_converterDocs from "./global-timezone-converter";
import image_blur_redactDocs from "./image-blur-redact";
import image_converterDocs from "./image-converter";
import image_dpi_converterDocs from "./image-dpi-converter";
import image_grid_splitterDocs from "./image-grid-splitter";
import image_metadata_wiperDocs from "./image-metadata-wiper";
import image_watermarkDocs from "./image-watermark";
import json_csv_explorerDocs from "./json-csv-explorer";
import lorem_ipsum_generatorDocs from "./lorem-ipsum-generator";
import my_ipDocs from "./my-ip";
import pdf_editorDocs from "./pdf-editor";
import readability_analyzerDocs from "./readability-analyzer";
import rotate_imageDocs from "./rotate-image";
import ssl_decoderDocs from "./ssl-decoder";
import storage_data_converterDocs from "./storage-data-converter";
import subset_font_spikeDocs from "./subset-font-spike";
import svg_optimizerDocs from "./svg-optimizer";
import text_diffDocs from "./text-diff";
import text_sanitizerDocs from "./text-sanitizer";
import text_workspaceDocs from "./text-workspace";
import url_parameter_stripperDocs from "./url-parameter-stripper";
import video_compressorDocs from "./video-compressor";
import video_converterDocs from "./video-converter";
import video_metadata_cleanerDocs from "./video-metadata-cleaner";
import video_muterDocs from "./video-muter";
import video_resizerDocs from "./video-resizer";
import video_rotatorDocs from "./video-rotator";
import video_speedDocs from "./video-speed";
import video_to_gifDocs from "./video-to-gif";
import video_to_mp3Docs from "./video-to-mp3";
import video_trimmerDocs from "./video-trimmer";

/** Per-tool documentation modules under `src/lib/registry/`. */
export const DOCUMENTATION_BY_SLUG: Record<string, ToolDocumentation> = {
  "base-converter": base_converterDocs,
  "color-converter": color_converterDocs,
  "color-palette-extractor": color_palette_extractorDocs,
  "favicon-generator": favicon_generatorDocs,
  "global-timezone-converter": global_timezone_converterDocs,
  "image-blur-redact": image_blur_redactDocs,
  "image-converter": image_converterDocs,
  "image-dpi-converter": image_dpi_converterDocs,
  "image-grid-splitter": image_grid_splitterDocs,
  "image-metadata-wiper": image_metadata_wiperDocs,
  "image-watermark": image_watermarkDocs,
  "json-csv-explorer": json_csv_explorerDocs,
  "lorem-ipsum-generator": lorem_ipsum_generatorDocs,
  "my-ip": my_ipDocs,
  "pdf-editor": pdf_editorDocs,
  "readability-analyzer": readability_analyzerDocs,
  "rotate-image": rotate_imageDocs,
  "ssl-decoder": ssl_decoderDocs,
  "storage-data-converter": storage_data_converterDocs,
  "subset-font-spike": subset_font_spikeDocs,
  "svg-optimizer": svg_optimizerDocs,
  "text-diff": text_diffDocs,
  "text-sanitizer": text_sanitizerDocs,
  "text-workspace": text_workspaceDocs,
  "url-parameter-stripper": url_parameter_stripperDocs,
  "video-compressor": video_compressorDocs,
  "video-converter": video_converterDocs,
  "video-metadata-cleaner": video_metadata_cleanerDocs,
  "video-muter": video_muterDocs,
  "video-resizer": video_resizerDocs,
  "video-rotator": video_rotatorDocs,
  "video-speed": video_speedDocs,
  "video-to-gif": video_to_gifDocs,
  "video-to-mp3": video_to_mp3Docs,
  "video-trimmer": video_trimmerDocs,
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

/** Site registry with per-tool documentation overlays from `src/lib/registry/`. */
export const registry: SiteRegistry = {
  ...base,
  tools: base.tools.map(withDocumentation),
};

export function getToolDocumentation(slug: string): ToolDocumentation | undefined {
  return DOCUMENTATION_BY_SLUG[slug] ?? registry.tools.find((tool) => tool.slug === slug)?.documentation;
}

export default registry;
