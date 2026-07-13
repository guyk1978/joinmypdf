export type PdfEditorTextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type PdfEditorBlock = {
  kind: "paragraph" | "heading";
  level?: 1 | 2 | 3;
  runs: PdfEditorTextRun[];
};
