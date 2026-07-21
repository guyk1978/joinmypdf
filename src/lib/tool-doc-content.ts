import { getToolRealWorldExample } from "@/data/tool-real-world-examples";
import { registry } from "@/lib/registry";
import { normalizeToolNameForDocH1 } from "@/lib/tool-doc-h1";

export type ToolDocBodyContent = {
  overviewParagraphs: string[];
  howItWorksParagraphs: string[];
  realWorldExample: { heading: string; body: string } | null;
  useCases: string[];
  whyItMatters: string | null;
};

function normalizeProse(value?: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function proseKey(value: string): string {
  return value.toLowerCase();
}

function uniqueParagraphs(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const text = normalizeProse(value);
    if (!text) continue;
    const key = proseKey(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function synthesizeHowItWorks(toolName: string, intent?: string): string[] {
  const paragraphs: string[] = [];
  if (intent) paragraphs.push(intent);

  paragraphs.push(
    `Using ${toolName} is straightforward: open the tool, add your file or paste your input, adjust any options you need, then run the action. Everything processes locally in your browser—nothing is uploaded to a remote server—so you can download the finished result as soon as processing completes.`,
  );

  paragraphs.push(
    `Because the workflow stays on your device, you keep full control of private documents, photos, and drafts. There is no account wall, no waiting in a cloud queue, and no copy of your file left behind after you close the tab.`,
  );

  return uniqueParagraphs(paragraphs);
}

function synthesizeOverview(
  toolName: string,
  description?: string,
  intent?: string,
): string[] {
  const paragraphs = uniqueParagraphs([description, intent]);

  if (paragraphs.join(" ").length < 160) {
    paragraphs.push(
      `${toolName} is a free, browser-based utility designed for fast everyday work. It helps you finish the job without installing desktop software or sending sensitive files to a third-party converter.`,
    );
  }

  if (paragraphs.join(" ").length < 280) {
    paragraphs.push(
      `Whether you are cleaning up a single file before a deadline or preparing assets for publishing, ${toolName} keeps the interface focused on the task while privacy-first local processing runs in the background.`,
    );
  }

  return uniqueParagraphs(paragraphs);
}

/**
 * Build enriched DOC-tab body copy for any tool from registry fields +
 * shared real-world examples. Used by modal and page DOC templates.
 */
export function buildEnrichedToolDocContent(params: {
  slug: string;
  title: string;
  description?: string | null;
  intent?: string | null;
  whyItMatters?: string | null;
  useCases?: string[] | null;
  realWorldHeading?: string;
}): ToolDocBodyContent {
  const tool = registry.tools.find((entry) => entry.slug === params.slug);
  const toolName =
    normalizeToolNameForDocH1(params.title) ||
    params.title.trim() ||
    tool?.title ||
    params.slug;

  const description = normalizeProse(params.description) || normalizeProse(tool?.description);
  const intent = normalizeProse(params.intent) || normalizeProse(tool?.intent);
  const whyItMatters =
    normalizeProse(params.whyItMatters) ||
    normalizeProse(tool?.documentation?.whyItMatters);
  const useCases = (params.useCases?.length ? params.useCases : tool?.useCases) ?? [];

  const overviewParagraphs = synthesizeOverview(toolName, description, intent);
  const howSource =
    intent && description && proseKey(intent) !== proseKey(description)
      ? intent
      : whyItMatters && proseKey(whyItMatters) !== proseKey(description)
        ? undefined
        : intent;
  const howItWorksParagraphs = synthesizeHowItWorks(toolName, howSource);

  // Prefer registry editorial prose for "why" when it isn't already used above.
  const whyDistinct =
    whyItMatters &&
    !overviewParagraphs.some((p) => proseKey(p) === proseKey(whyItMatters)) &&
    !howItWorksParagraphs.some((p) => proseKey(p) === proseKey(whyItMatters))
      ? whyItMatters
      : null;

  const exampleBody = getToolRealWorldExample(params.slug);
  const realWorldExample = exampleBody
    ? {
        heading: params.realWorldHeading ?? "Real-world example",
        body: exampleBody,
      }
    : whyDistinct
      ? {
          heading: params.realWorldHeading ?? "Why you need this",
          body: whyDistinct,
        }
      : null;

  return {
    overviewParagraphs,
    howItWorksParagraphs,
    realWorldExample,
    useCases: useCases.filter(Boolean),
    whyItMatters: realWorldExample?.body === whyDistinct ? null : whyDistinct,
  };
}
