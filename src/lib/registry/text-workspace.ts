import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `text-workspace` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Cloud writing suites are convenient, but convenience often means your draft travels through accounts, sync pipes, and vendor storage before you decide whether it is finished. For NDAs, personnel notes, incident write-ups, product strategy, legal outlines, and anything that should stay confidential until publication, that path is a risk. A local-first text workspace flips the default: the document lives in your browser tab and on your device until you deliberately export or copy it. This article explains why that model is safer for sensitive drafting, how browser projects help you manage unfinished work, and which text manipulation habits keep speed without sacrificing privacy.",
  faq: [{"question":"Does Text Workspace upload my writing?","answer":"No. Editing, find/replace, project saves, and exports all run locally in your browser."},{"question":"Can I save a draft and reopen it later?","answer":"Yes. Save Project stores your text in IndexedDB on this device so you can resume from the Projects list."},{"question":"What formats can I export?","answer":"Download your draft as plain TXT or Markdown (.md) with one click."},{"question":"How do I prevent accidental edits?","answer":"Use Lock to make the editor read-only until you unlock it."}],
};

export default documentation;
