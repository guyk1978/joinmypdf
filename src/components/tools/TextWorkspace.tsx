"use client";

import { clsx } from "clsx";
import {
  Bold,
  Code2,
  Download,
  Italic,
  Lock,
  LockOpen,
  Replace,
  Search,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SaveProjectButton } from "@/components/SaveProjectButton";
import { useProjectResume } from "@/hooks/useProjectResume";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const SLUG = "text-workspace";

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
): { next: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(start, end);
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  return {
    next,
    selectionStart: start + before.length,
    selectionEnd: start + before.length + selected.length,
  };
}

export function TextWorkspace() {
  const t = useTranslations("TextWorkspace");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [locked, setLocked] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [projectLabel, setProjectLabel] = useState<string | null>(null);

  const words = useMemo(() => countWords(content), [content]);
  const chars = content.length;
  const charsNoSpaces = content.replace(/\s/g, "").length;

  const matchOffsets = useMemo(() => {
    if (!findQuery) return [] as number[];
    const offsets: number[] = [];
    const q = findQuery;
    let from = 0;
    while (from <= content.length) {
      const at = content.indexOf(q, from);
      if (at === -1) break;
      offsets.push(at);
      from = at + Math.max(q.length, 1);
    }
    return offsets;
  }, [content, findQuery]);

  const syncSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) {
      setSelection(null);
      setToolbarPos(null);
      return;
    }
    setSelection({ start, end });

    // Approximate floating toolbar near caret using textarea metrics.
    const style = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(style.lineHeight) || 22;
    const paddingTop = Number.parseFloat(style.paddingTop) || 16;
    const textBefore = el.value.slice(0, start);
    const lines = textBefore.split("\n");
    const line = lines.length - 1;
    const col = lines[lines.length - 1]?.length ?? 0;
    const charWidth = 8.2;
    const top = paddingTop + line * lineHeight - el.scrollTop + 8;
    const left = Math.min(
      Math.max(16 + col * charWidth - el.scrollLeft, 16),
      el.clientWidth - 180,
    );
    setToolbarPos({ top, left });
  }, []);

  const applyWrap = useCallback(
    (before: string, after: string) => {
      if (locked || !selection) return;
      const el = textareaRef.current;
      if (!el) return;
      const { next, selectionStart, selectionEnd } = wrapSelection(
        content,
        selection.start,
        selection.end,
        before,
        after,
      );
      setContent(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(selectionStart, selectionEnd);
        syncSelection();
      });
    },
    [content, locked, selection, syncSelection],
  );

  const jumpToMatch = useCallback(
    (index: number) => {
      if (!matchOffsets.length || !findQuery) return;
      const safe = ((index % matchOffsets.length) + matchOffsets.length) % matchOffsets.length;
      setMatchIndex(safe);
      const start = matchOffsets[safe]!;
      const end = start + findQuery.length;
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
      // Scroll roughly into view
      const line = content.slice(0, start).split("\n").length - 1;
      el.scrollTop = Math.max(0, line * 22 - 80);
      syncSelection();
    },
    [content, findQuery, matchOffsets, syncSelection],
  );

  const replaceCurrent = useCallback(() => {
    if (locked || !findQuery || !matchOffsets.length) return;
    const start = matchOffsets[matchIndex] ?? matchOffsets[0];
    if (start == null) return;
    const end = start + findQuery.length;
    const next = `${content.slice(0, start)}${replaceQuery}${content.slice(end)}`;
    setContent(next);
    requestAnimationFrame(() => jumpToMatch(matchIndex));
  }, [content, findQuery, jumpToMatch, locked, matchIndex, matchOffsets, replaceQuery]);

  const replaceAll = useCallback(() => {
    if (locked || !findQuery) return;
    setContent(content.split(findQuery).join(replaceQuery));
    setMatchIndex(0);
  }, [content, findQuery, locked, replaceQuery]);

  const exportFile = useCallback(
    (format: "txt" | "md") => {
      const ext = format === "md" ? "md" : "txt";
      const mime = format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `text-workspace.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [content],
  );

  const projectFile = useMemo(() => {
    if (!content) return [] as File[];
    return [new File([content], "text-workspace.txt", { type: "text/plain" })];
  }, [content]);

  useProjectResume({
    toolSlug: SLUG,
    onRestore: ({ files, settings, projectName }) => {
      void (async () => {
        const fromSettings = typeof settings.content === "string" ? settings.content : null;
        if (fromSettings != null) {
          setContent(fromSettings);
        } else if (files[0]) {
          setContent(await files[0].text());
        }
        setProjectLabel(projectName);
      })();
    },
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === "f") {
        event.preventDefault();
        setFindOpen(true);
        setReplaceMode(false);
      } else if (key === "h") {
        event.preventDefault();
        setFindOpen(true);
        setReplaceMode(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="text-workspace">
      <div className="text-workspace__top">
        <div className="text-workspace__toolbar" role="toolbar" aria-label={t("toolbarLabel")}>
          <div className="text-workspace__toolbar-group">
            <button
              type="button"
              className={toolOutlineBtn}
              onClick={() => {
                setFindOpen(true);
                setReplaceMode(false);
              }}
            >
              <Search className="h-4 w-4" aria-hidden />
              {t("find")}
            </button>
            <button
              type="button"
              className={toolOutlineBtn}
              onClick={() => {
                setFindOpen(true);
                setReplaceMode(true);
              }}
            >
              <Replace className="h-4 w-4" aria-hidden />
              {t("replace")}
            </button>
            <button
              type="button"
              className={toolOutlineBtn}
              aria-pressed={locked}
              onClick={() => setLocked((value) => !value)}
            >
              {locked ? <Lock className="h-4 w-4" aria-hidden /> : <LockOpen className="h-4 w-4" aria-hidden />}
              {locked ? t("unlock") : t("lock")}
            </button>
          </div>

          <p className="text-workspace__privacy" role="status">
            {t("privacyBanner")}
          </p>

          <div className="text-workspace__toolbar-group">
            <SaveProjectButton
              toolSlug={SLUG}
              operation={SLUG}
              files={projectFile}
              settings={{ content, format: "txt" }}
              disabled={!content}
            />
            <button type="button" className={toolOutlineBtn} onClick={() => exportFile("txt")} disabled={!content}>
              <Download className="h-4 w-4" aria-hidden />
              {t("exportTxt")}
            </button>
            <button type="button" className={toolPrimaryBtn} onClick={() => exportFile("md")} disabled={!content}>
              <Type className="h-4 w-4" aria-hidden />
              {t("exportMd")}
            </button>
          </div>
        </div>

        {projectLabel ? (
          <p className="text-workspace__project-label">
            {t("loadedProject", { name: projectLabel })}
          </p>
        ) : null}

        {findOpen ? (
          <div className="text-workspace__find" role="search">
            <label className="text-workspace__find-field">
              <span>{t("findLabel")}</span>
              <input
                type="text"
                value={findQuery}
                onChange={(event) => {
                  setFindQuery(event.target.value);
                  setMatchIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    jumpToMatch(matchIndex + (event.shiftKey ? -1 : 1));
                  }
                  if (event.key === "Escape") setFindOpen(false);
                }}
                autoFocus
              />
            </label>
            {replaceMode ? (
              <label className="text-workspace__find-field">
                <span>{t("replaceLabel")}</span>
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(event) => setReplaceQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      replaceCurrent();
                    }
                  }}
                />
              </label>
            ) : null}
            <div className="text-workspace__find-actions">
              <span className="text-workspace__find-count">
                {findQuery
                  ? t("matchCount", { current: matchOffsets.length ? matchIndex + 1 : 0, total: matchOffsets.length })
                  : t("matchHint")}
              </span>
              <button type="button" className={toolOutlineBtn} onClick={() => jumpToMatch(matchIndex - 1)} disabled={!matchOffsets.length}>
                {t("prev")}
              </button>
              <button type="button" className={toolOutlineBtn} onClick={() => jumpToMatch(matchIndex + 1)} disabled={!matchOffsets.length}>
                {t("next")}
              </button>
              {replaceMode ? (
                <>
                  <button type="button" className={toolOutlineBtn} onClick={replaceCurrent} disabled={locked || !matchOffsets.length}>
                    {t("replaceOne")}
                  </button>
                  <button type="button" className={toolOutlineBtn} onClick={replaceAll} disabled={locked || !findQuery}>
                    {t("replaceAll")}
                  </button>
                </>
              ) : null}
              <button type="button" className={toolOutlineBtn} onClick={() => setFindOpen(false)}>
                {t("closeFind")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="text-workspace__editor-shell">
        {selection && toolbarPos && !locked ? (
          <div
            className="text-workspace__float-toolbar"
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
            role="toolbar"
            aria-label={t("formatToolbar")}
          >
            <button type="button" onClick={() => applyWrap("**", "**")} title={t("bold")}>
              <Bold className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => applyWrap("*", "*")} title={t("italic")}>
              <Italic className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => applyWrap("`", "`")} title={t("code")}>
              <Code2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          className={clsx("text-workspace__editor", locked && "is-locked")}
          value={content}
          readOnly={locked}
          spellCheck
          placeholder={t("placeholder")}
          aria-label={t("editorLabel")}
          onChange={(event) => setContent(event.target.value)}
          onSelect={syncSelection}
          onKeyUp={syncSelection}
          onMouseUp={syncSelection}
          onScroll={syncSelection}
        />
      </div>

      <div className="text-workspace__stats" aria-live="polite">
        <span>{t("words", { count: words })}</span>
        <span>{t("chars", { count: chars })}</span>
        <span>{t("charsNoSpaces", { count: charsNoSpaces })}</span>
        {locked ? <span className="text-workspace__locked-pill">{t("lockedHint")}</span> : null}
      </div>
    </div>
  );
}
