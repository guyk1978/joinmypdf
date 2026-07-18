import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `text-diff` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Whether you are reviewing a pull request snippet, checking an infrastructure config change, or debugging why a production file no longer matches staging, a clear text diff is one of the fastest ways to regain confidence. Version control systems already compute diffs, but you often need a lightweight browser tool for pasted fragments, exported configs, customer-provided text, or emergency troubleshooting when Git is not the right surface. This guide covers comparing code and configuration files, version control best practices that make diffs useful, and how to use a diff tool for debugging—while keeping sensitive material on your device.",
  faq: [{"question":"Is my text uploaded to a server?","answer":"No. Diffing runs entirely in your browser."},{"question":"Does the diff update in real time?","answer":"Yes. Additions and deletions highlight as you type."},{"question":"What do Swap and Clear do?","answer":"Swap exchanges the Original and Modified panes. Clear resets both inputs and the result."},{"question":"Is the Text Diff tool free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
