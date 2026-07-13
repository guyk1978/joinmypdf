"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, List, ListOrdered, Underline as UnderlineIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { toolOutlineBtn } from "@/lib/tool-ui";

export type PdfEditorRichTextProps = {
  /** Parent-owned OCR HTML; injected only when ocrCompleteState is true and editor exists. */
  lastOcrResultRef: MutableRefObject<string | null>;
  /** Flips true when OCR for the active page finished (and may flip again per inject token). */
  ocrCompleteState: boolean;
  /** Bumped whenever a new OCR result should be applied (page change / re-run). */
  injectToken: number;
  editable: boolean;
  placeholder: string;
  initializingLabel: string;
  toolbarLabel: string;
  dir?: "ltr" | "rtl" | "auto";
  labels: {
    bold: string;
    italic: string;
    underline: string;
    heading: string;
    bulletList: string;
    orderedList: string;
  };
  onEditorReadyChange: (ready: boolean) => void;
  onContentInjected: (payload: { html: string; json: Record<string, unknown> }) => void;
  onUpdate: (payload: { html: string; json: Record<string, unknown> }) => void;
};

export function PdfEditorRichText({
  lastOcrResultRef,
  ocrCompleteState,
  injectToken,
  editable,
  placeholder,
  initializingLabel,
  toolbarLabel,
  dir = "auto",
  labels,
  onEditorReadyChange,
  onContentInjected,
  onUpdate,
}: PdfEditorRichTextProps) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onReadyRef = useRef(onEditorReadyChange);
  onReadyRef.current = onEditorReadyChange;
  const onInjectedRef = useRef(onContentInjected);
  onInjectedRef.current = onContentInjected;

  const appliedTokenRef = useRef(-1);
  const [editorReady, setEditorReady] = useState(false);

  // TipTap v3 StarterKit already includes Underline — do not register it twice.
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    [],
  );

  const editor = useEditor(
    {
      extensions,
      content: "",
      editable: false,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "pdf-editor__tiptap-editor",
          "aria-label": placeholder,
          dir,
          spellcheck: "false",
        },
      },
      onCreate: () => {
        setEditorReady(true);
        onReadyRef.current(true);
      },
      onDestroy: () => {
        setEditorReady(false);
        onReadyRef.current(false);
      },
      onUpdate: ({ editor: current }) => {
        onUpdateRef.current({
          html: current.getHTML(),
          json: current.getJSON() as Record<string, unknown>,
        });
      },
    },
    [extensions],
  );

  // Strict inject gate: editor instance + OCR complete + ref payload.
  useEffect(() => {
    if (!editor || !ocrCompleteState || !lastOcrResultRef.current) return;
    if (appliedTokenRef.current === injectToken) return;

    const html = lastOcrResultRef.current;
    // Clear first to avoid duplicated / stale content, then inject OCR HTML.
    editor.commands.setContent("");
    editor.commands.setContent(html, { emitUpdate: false });
    appliedTokenRef.current = injectToken;

    onInjectedRef.current({
      html: editor.getHTML(),
      json: editor.getJSON() as Record<string, unknown>,
    });
  }, [editor, ocrCompleteState, injectToken, lastOcrResultRef]);

  useEffect(() => {
    if (!editor || !editorReady) return;
    editor.setEditable(editable);
  }, [editor, editorReady, editable]);

  useEffect(() => {
    if (!editor?.view?.dom) return;
    editor.view.dom.setAttribute("dir", dir);
  }, [editor, dir]);

  useEffect(() => {
    return () => {
      onReadyRef.current(false);
    };
  }, []);

  const btn = (active: boolean) =>
    `${toolOutlineBtn} pdf-editor__format-btn${active ? " is-active" : ""}`;

  const showEditor = Boolean(editor && editorReady);

  return (
    <div className="pdf-editor__richtext">
      <div className="pdf-editor__format-toolbar" role="toolbar" aria-label={toolbarLabel}>
        <FormatButton
          active={Boolean(editor?.isActive("bold"))}
          disabled={!showEditor || !editable}
          label={labels.bold}
          className={btn(Boolean(editor?.isActive("bold")))}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" aria-hidden />
        </FormatButton>
        <FormatButton
          active={Boolean(editor?.isActive("italic"))}
          disabled={!showEditor || !editable}
          label={labels.italic}
          className={btn(Boolean(editor?.isActive("italic")))}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" aria-hidden />
        </FormatButton>
        <FormatButton
          active={Boolean(editor?.isActive("underline"))}
          disabled={!showEditor || !editable}
          label={labels.underline}
          className={btn(Boolean(editor?.isActive("underline")))}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" aria-hidden />
        </FormatButton>
        <FormatButton
          active={Boolean(editor?.isActive("heading", { level: 2 }))}
          disabled={!showEditor || !editable}
          label={labels.heading}
          className={btn(Boolean(editor?.isActive("heading", { level: 2 })))}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" aria-hidden />
        </FormatButton>
        <FormatButton
          active={Boolean(editor?.isActive("bulletList"))}
          disabled={!showEditor || !editable}
          label={labels.bulletList}
          className={btn(Boolean(editor?.isActive("bulletList")))}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" aria-hidden />
        </FormatButton>
        <FormatButton
          active={Boolean(editor?.isActive("orderedList"))}
          disabled={!showEditor || !editable}
          label={labels.orderedList}
          className={btn(Boolean(editor?.isActive("orderedList")))}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" aria-hidden />
        </FormatButton>
      </div>

      {showEditor && editor ? (
        <div id="tiptap-editor-container" className="pdf-editor__tiptap-editor" dir={dir}>
          <EditorContent editor={editor as Editor} />
        </div>
      ) : (
        <div
          id="tiptap-editor-container"
          className="pdf-editor__tiptap-editor pdf-editor__tiptap-editor--loading"
          aria-busy="true"
        >
          {initializingLabel}
        </div>
      )}
    </div>
  );
}

function FormatButton({
  active,
  disabled,
  label,
  className,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  className: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
