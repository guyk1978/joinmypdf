import type { ToolPageTranslator } from "@/lib/i18n-tool-page";
import { MIN_TOOL_FAQ_COUNT } from "@/lib/tool-faqs";
import type { ToolSeoBenefitCard, ToolSeoPageOverride } from "@/lib/tool-seo-overrides";
import type { ToolListEntry } from "@/lib/tool-module";
import type { ToolFaq } from "@/lib/types";

const AUDIO_ID_TO_OVERRIDE_KEY: Record<string, string> = {
  "mp3-converter": "mp3Converter",
  "audio-compressor": "audioCompressor",
  "mp3-compressor": "mp3Compressor",
  "wav-to-mp3": "wavToMp3",
  "mp3-to-wav": "mp3ToWav",
  "mp3-trimmer": "mp3Trimmer",
  "audio-trimmer": "audioTrimmer",
  "ogg-converter": "oggConverter",
  "flac-converter": "flacConverter",
  "m4a-converter": "m4aConverter",
  "mp3-volume-booster": "mp3VolumeBooster",
  "mp3-metadata-editor": "mp3MetadataEditor",
  "audio-merger": "audioMerger",
  "voice-remover": "voiceRemover",
  "mp3-speed-changer": "mp3SpeedChanger",
  "fade-in-out-creator": "fadeInOutCreator",
  "audio-normalizer": "audioNormalizer",
  "silence-remover": "silentRemover",
  "mp4-to-mp3": "mp4ToMp3",
  "mp3-to-mp4": "mp3ToMp4",
};

const AUDIO_TOOL_SPECIFIC_FAQ_IDS: Record<string, readonly string[]> = {
  "mp3-converter": [
    "formats",
    "bitrate",
    "quality",
    "firstLoad",
    "worker",
    "privacy",
    "mobileUse",
    "limits",
  ],
  "mp3-trimmer": [
    "trimPoints",
    "copyMode",
    "preview",
    "formats",
    "firstLoad",
    "privacy",
    "mobileUse",
    "limits",
  ],
  "audio-trimmer": [
    "quality",
    "formats",
    "privacy",
    "waveform",
    "fade",
    "copyMode",
    "firstLoad",
    "limits",
  ],
  "mp3-volume-booster": [
    "distortion",
    "security",
    "allMp3",
    "loudnorm",
    "preview",
    "boostRange",
    "firstLoad",
    "worker",
  ],
  "mp3-to-wav": [
    "localConversion",
    "qualityLoss",
    "fileRetention",
    "wavSize",
    "formats",
    "firstLoad",
    "worker",
    "editing",
  ],
  "audio-compressor": [
    "spaceSavings",
    "qualityAffected",
    "privacy",
    "bitrate",
    "formats",
    "firstLoad",
    "worker",
    "limits",
  ],
  "mp3-compressor": [
    "bitrateQuality",
    "reversible",
    "privacy",
    "targetBitrate",
    "sizeEstimate",
    "formats",
    "firstLoad",
    "worker",
  ],
  "wav-to-mp3": [
    "whyConvert",
    "qualityChange",
    "freePrivate",
    "vbrQuality",
    "formats",
    "firstLoad",
    "worker",
    "limits",
  ],
  "ogg-converter": [
    "opusFiles",
    "qualityAffected",
    "privacy",
    "vbrQuality",
    "formats",
    "firstLoad",
    "worker",
    "limits",
  ],
  "mp3-metadata-editor": [
    "id3Versions",
    "privacy",
    "removeArt",
    "emptyTags",
    "coverFormats",
    "streamCopy",
    "firstLoad",
    "worker",
  ],
  "audio-merger": [
    "reorder",
    "quality",
    "local",
    "concatMethod",
    "formats",
    "minFiles",
    "firstLoad",
    "worker",
  ],
  "voice-remover": [
    "howItWorks",
    "quality",
    "privacy",
    "stereo",
    "estimation",
    "formats",
    "processingTime",
    "firstLoad",
  ],
  "mp3-speed-changer": [
    "robotic",
    "music",
    "maxSpeed",
    "pitch",
    "speedRange",
    "atempo",
    "podcasts",
    "privacy",
    "formats",
    "firstLoad",
    "worker",
  ],
  "fade-in-out-creator": [
    "duration",
    "quality",
    "privacy",
    "afade",
    "timing",
    "formats",
    "firstLoad",
    "worker",
  ],
  "audio-normalizer": [
    "removeNoise",
    "distort",
    "quality",
    "whyNormalize",
    "loudnorm",
    "playlist",
    "structure",
    "privacy",
    "batchErrors",
    "formats",
    "firstLoad",
    "worker",
  ],
  "silence-remover": [
    "threshold",
    "cutWords",
    "privacy",
    "howItWorks",
    "formats",
    "longFiles",
    "output",
    "firstLoad",
  ],
  "flac-converter": [
    "whyTranscode",
    "quality",
    "localMachine",
    "outputFormats",
    "integrity",
    "formats",
    "firstLoad",
    "worker",
  ],
  "m4a-converter": [
    "whyConvert",
    "quality",
    "privacy",
    "outputFormats",
    "codecIssues",
    "formats",
    "firstLoad",
    "worker",
  ],
  "mp4-to-mp3": [
    "whyExtract",
    "quality",
    "privacy",
    "noVideo",
    "codecIssues",
    "formats",
    "firstLoad",
    "worker",
  ],
  "mp3-to-mp4": [
    "whyCreate",
    "imageFormats",
    "quality",
    "privacy",
    "socialShare",
    "formats",
    "firstLoad",
    "worker",
  ],
};

const AUDIO_UNIVERSAL_FAQ_KEYS = [
  "free",
  "upload",
  "watermark",
  "mobile",
  "limits",
  "browser",
  "offline",
  "account",
  "retention",
  "formats",
  "errors",
  "security",
] as const;

const AUDIO_RELATED_TOOLS: Record<string, string[]> = {
  "mp3-converter": ["audio-trimmer", "mp3-trimmer", "mp3-volume-booster"],
  "mp3-trimmer": ["audio-trimmer", "mp3-converter", "fade-in-out-creator"],
  "audio-trimmer": ["mp3-trimmer", "fade-in-out-creator", "mp3-volume-booster"],
  "mp3-volume-booster": ["audio-trimmer", "mp3-trimmer", "mp3-compressor"],
  "wav-to-mp3": ["mp3-converter", "mp3-trimmer", "mp3-compressor"],
  "mp3-to-wav": ["mp3-converter", "mp3-trimmer", "flac-converter"],
  "mp3-compressor": ["mp3-converter", "mp3-trimmer", "wav-to-mp3"],
  "audio-compressor": ["mp3-compressor", "mp3-converter", "mp3-volume-booster"],
  "ogg-converter": ["mp3-converter", "flac-converter", "m4a-converter"],
  "flac-converter": ["mp3-converter", "wav-to-mp3", "ogg-converter"],
  "m4a-converter": ["mp3-converter", "audio-compressor", "ogg-converter"],
  "mp3-metadata-editor": ["mp3-converter", "mp3-trimmer", "mp3-compressor"],
  "audio-merger": ["mp3-trimmer", "mp3-converter", "mp3-compressor"],
  "voice-remover": ["mp3-volume-booster", "mp3-trimmer", "mp3-compressor"],
  "mp3-speed-changer": ["audio-trimmer", "mp3-volume-booster", "audio-normalizer"],
  "fade-in-out-creator": ["mp3-trimmer", "audio-merger", "mp3-volume-booster"],
  "audio-normalizer": ["mp3-volume-booster", "audio-trimmer", "audio-merger"],
  "silence-remover": ["audio-trimmer", "audio-normalizer", "mp3-speed-changer"],
  "mp4-to-mp3": ["mp3-trimmer", "mp3-compressor", "mp3-converter"],
  "mp3-to-mp4": ["mp3-trimmer", "mp3-metadata-editor", "mp3-volume-booster"],
};

const WHY_BENEFIT_ICONS = {
  lossless: "🎯",
  quality: "✨",
  local: "⚡",
} as const;

function audioOverrideKey(toolId: string): string {
  return AUDIO_ID_TO_OVERRIDE_KEY[toolId] ?? "audioGeneric";
}

function readWhyBenefits(t: ToolPageTranslator, base: string): ToolSeoBenefitCard[] | undefined {
  const ids = Object.keys(WHY_BENEFIT_ICONS) as (keyof typeof WHY_BENEFIT_ICONS)[];
  if (!t.has(`${base}.whyBenefits.lossless.title`)) return undefined;

  return ids.map((id) => ({
    icon: WHY_BENEFIT_ICONS[id],
    title: t(`${base}.whyBenefits.${id}.title`),
    body: t(`${base}.whyBenefits.${id}.body`),
  }));
}

export function resolveAudioToolSeoOverride(
  tool: ToolListEntry,
  t: ToolPageTranslator,
): ToolSeoPageOverride | null {
  const key = audioOverrideKey(tool.id);
  const base = `toolSeo.${key}`;
  if (!t.has(`${base}.h1`)) return null;

  const workflowLinkDefs = [
    { href: "/tools/mp3-converter/", labelKey: "mp3ConverterLabel" },
    { href: "/tools/mp3-trimmer/", labelKey: "mp3TrimmerLabel" },
    { href: "/tools/audio-trimmer/", labelKey: "audioTrimmerLabel" },
    { href: "/tools/mp3-volume-booster/", labelKey: "mp3VolumeBoosterLabel" },
    { href: "/tools/wav-to-mp3/", labelKey: "wavToMp3Label" },
    { href: "/tools/mp3-to-wav/", labelKey: "mp3ToWavLabel" },
    { href: "/tools/audio-compressor/", labelKey: "audioCompressorLabel" },
    { href: "/tools/mp3-compressor/", labelKey: "mp3CompressorLabel" },
    { href: "/tools/mp3-metadata-editor/", labelKey: "mp3MetadataEditorLabel" },
    { href: "/tools/audio-merger/", labelKey: "audioMergerLabel" },
    { href: "/tools/voice-remover/", labelKey: "voiceRemoverLabel" },
    { href: "/tools/mp3-speed-changer/", labelKey: "mp3SpeedChangerLabel" },
    { href: "/tools/fade-in-out-creator/", labelKey: "fadeInOutCreatorLabel" },
    { href: "/tools/audio-normalizer/", labelKey: "audioNormalizerLabel" },
    { href: "/tools/silence-remover/", labelKey: "silenceRemoverLabel" },
    { href: "/tools/flac-converter/", labelKey: "flacConverterLabel" },
    { href: "/tools/mp4-to-mp3/", labelKey: "mp4ToMp3Label" },
    { href: "/tools/mp3-to-mp4/", labelKey: "mp3ToMp4Label" },
    { href: "/tools/m4a-converter/", labelKey: "m4aConverterLabel" },
  ] as const;

  const workflowLinks = workflowLinkDefs
    .filter((def) => t.has(`${base}.relatedWorkflowLinks.${def.labelKey}`))
    .map((def) => ({
      href: def.href,
      label: t(`${base}.relatedWorkflowLinks.${def.labelKey}`),
    }));

  const relatedWorkflowLinks =
    workflowLinks.length && t.has(`${base}.relatedWorkflowLinks.prompt`)
      ? {
          prompt: t(`${base}.relatedWorkflowLinks.prompt`),
          links: workflowLinks,
        }
      : undefined;

  const params = { toolName: tool.name, toolTitle: tool.title };

  return {
    slug: tool.id as ToolSeoPageOverride["slug"],
    overrideKey: key,
    h1: t(`${base}.h1`, params),
    heroTagline: t.has(`${base}.heroTagline`) ? t(`${base}.heroTagline`, params) : undefined,
    introSectionTitle: t(`${base}.introSectionTitle`, params),
    whySectionTitle: t(`${base}.whySectionTitle`, params),
    whySectionSubheadline: t.has(`${base}.whySectionSubheadline`)
      ? t(`${base}.whySectionSubheadline`, params)
      : undefined,
    whyBenefits: readWhyBenefits(t, base),
    schemaDescription: t(`${base}.schemaDescription`, params),
    relatedWorkflowLinks,
  };
}

export function buildLocalizedAudioGuideParagraphs(
  t: ToolPageTranslator,
  tool: ToolListEntry,
): string[] {
  const key = audioOverrideKey(tool.id);
  const overrideP1 = t.has(`guide.toolOverrides.${key}.p1`)
    ? t(`guide.toolOverrides.${key}.p1`)
    : t.has("guide.toolOverrides.audioGeneric.p1")
      ? t("guide.toolOverrides.audioGeneric.p1", { toolName: tool.name })
      : t("guide.audio.defaultP1", { toolName: tool.name, toolTitle: tool.title });

  const p2 = t.has(`guide.audio.p2`) ? t("guide.audio.p2") : t("guide.p2");
  const p3 = t.has(`guide.toolOverrides.${key}.p3`)
    ? t(`guide.toolOverrides.${key}.p3`)
    : t("guide.audio.p3");
  const p4 = t.has(`guide.toolOverrides.${key}.p4`)
    ? t(`guide.toolOverrides.${key}.p4`)
    : t("guide.audio.p4");
  const p5 = t.has(`guide.toolOverrides.${key}.p5`)
    ? t(`guide.toolOverrides.${key}.p5`)
    : t("guide.audio.p5");
  const p6 = t.has(`guide.toolOverrides.${key}.p6`)
    ? t(`guide.toolOverrides.${key}.p6`)
    : t("guide.audio.p6");

  return [overrideP1, p2, p3, p4, p5, p6];
}

function dedupeFaqs(faqs: ToolFaq[]): ToolFaq[] {
  const seen = new Set<string>();
  return faqs.filter((item) => {
    const key = item.q.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildAudioUniversalFaqs(t: ToolPageTranslator, toolTitle: string): ToolFaq[] {
  return AUDIO_UNIVERSAL_FAQ_KEYS.map((id) => {
    const audioKey = `audioFaqs.${id}Q`;
    const audioAnswerKey = `audioFaqs.${id}A`;
    return {
      q: t.has(audioKey) ? t(audioKey, { toolTitle }) : t(`faqs.${id}Q`, { toolTitle }),
      a: t.has(audioAnswerKey) ? t(audioAnswerKey, { toolTitle }) : t(`faqs.${id}A`, { toolTitle }),
    };
  });
}

function buildAudioSpecificFaqs(
  t: ToolPageTranslator,
  tool: ToolListEntry,
  toolTitle: string,
): ToolFaq[] {
  const key = audioOverrideKey(tool.id);
  const faqIds = AUDIO_TOOL_SPECIFIC_FAQ_IDS[tool.id] ?? AUDIO_TOOL_SPECIFIC_FAQ_IDS["mp3-converter"];

  return faqIds
    .map((id) => {
      const qKey = `audioToolFaqs.${key}.${id}Q`;
      const aKey = `audioToolFaqs.${key}.${id}A`;
      if (!t.has(qKey) || !t.has(aKey)) return null;
      return {
        q: t(qKey, { toolTitle, toolName: tool.name }),
        a: t(aKey, { toolTitle, toolName: tool.name }),
      };
    })
    .filter((item): item is ToolFaq => item !== null);
}

export function buildLocalizedAudioToolFaqs(
  t: ToolPageTranslator,
  tool: ToolListEntry,
  toolTitle: string,
): ToolFaq[] {
  const specific = buildAudioSpecificFaqs(t, tool, toolTitle);
  const universal = buildAudioUniversalFaqs(t, toolTitle);
  return dedupeFaqs([...specific, ...universal]).slice(
    0,
    Math.max(MIN_TOOL_FAQ_COUNT, universal.length + specific.length),
  );
}

export function getRelatedAudioToolIds(toolId: string): string[] {
  return AUDIO_RELATED_TOOLS[toolId] ?? ["mp3-converter", "mp3-trimmer", "mp3-volume-booster"];
}

export function getAudioToolOperation(toolId: string): string {
  return toolId;
}
