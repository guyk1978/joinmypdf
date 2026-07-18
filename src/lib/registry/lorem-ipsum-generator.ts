import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `lorem-ipsum-generator` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Placeholder text is one of the oldest tricks in visual communication—and still one of the most useful. Designers need mass without meaning so layouts can be judged on hierarchy, spacing, and rhythm. Developers need content that stretches components the way real copy will. Writers need to see how a column behaves before the final article lands. Lorem Ipsum became the default filler because it looks like Latin prose without distracting readers with readable English. This guide covers the history of Lorem Ipsum, how to use placeholder text well in design and development, and practical tips for testing responsive typography. Pair it with the Free Online Lorem Ipsum Generator above when you need quick, local, realistically structured dummy copy. Whether you are polishing a marketing landing page or filling Storybook controls before a sprint demo, structured placeholder text keeps reviews focused on craft instead of unfinished sentences.",
  faq: [{"question":"Is my generated text uploaded?","answer":"No. Generation runs entirely in your browser on your device."},{"question":"Can I generate Markdown?","answer":"Yes. Choose Markdown output for paragraph breaks or sentence lists ready to paste into docs."},{"question":"Does the text look like real sentences?","answer":"Yes. The generator varies word counts, inserts commas, and capitalizes sentence starts so mockups feel more natural than random word soup."}],
};

export default documentation;
