"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import { Eye } from "lucide-react";

const MAX_CONTENT_LENGTH = 3000;
const MAX_TITLE_LENGTH = 120;
const PREVIEW_LENGTH = 120;
const STORAGE_KEY = "joinmypdf:quick-notes";
const LEGACY_STORAGE_KEY = "joinmypdf:quick-note";

export type NoteItem = {
  id: string;
  title: string;
  content: string;
  timestamp: string;
};

export type QuickNoteLabels = {
  editorTitle: string;
  editorEditTitle: string;
  viewerTitle: string;
  titleLabel: string;
  titlePlaceholder: string;
  contentLabel: string;
  contentPlaceholder: string;
  saveButton: string;
  updateButton: string;
  clearButton: string;
  createNewButton: string;
  editButton: string;
  viewButton: string;
  deleteButton: string;
  closeViewerButton: string;
  listTitle: string;
  emptyList: string;
  discardConfirm: string;
  formatSavedAt: (datetime: string) => string;
  untitled: string;
};

type QuickNoteProps = {
  labels: QuickNoteLabels;
  className?: string;
};

type PaneMode = "edit" | "view";

function createNoteId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function previewContent(content: string): string {
  const trimmed = content.replace(/\s+/g, " ").trim();
  if (trimmed.length <= PREVIEW_LENGTH) return trimmed;
  return `${trimmed.slice(0, PREVIEW_LENGTH).trimEnd()}…`;
}

function normalizeNote(raw: unknown): NoteItem | null {
  if (!raw || typeof raw !== "object") return null;
  const note = raw as Partial<NoteItem> & { text?: string; savedAt?: string };
  const content =
    typeof note.content === "string"
      ? note.content
      : typeof note.text === "string"
        ? note.text
        : "";
  const timestamp =
    typeof note.timestamp === "string"
      ? note.timestamp
      : typeof note.savedAt === "string"
        ? note.savedAt
        : new Date().toISOString();
  return {
    id: typeof note.id === "string" && note.id ? note.id : createNoteId(),
    title: typeof note.title === "string" ? note.title.slice(0, MAX_TITLE_LENGTH) : "",
    content: content.slice(0, MAX_CONTENT_LENGTH),
    timestamp,
  };
}

function readStoredNotes(): NoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeNote).filter((note): note is NoteItem => Boolean(note));
      }
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return [];
    const parsedLegacy = JSON.parse(legacy) as unknown;
    const migrated = normalizeNote(parsedLegacy);
    if (!migrated || (!migrated.content && !migrated.title)) return [];
    if (!migrated.title) migrated.title = migrated.content.slice(0, 40) || "Note";
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([migrated]));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return [migrated];
  } catch {
    return [];
  }
}

function persistNotes(notes: NoteItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Quota / private mode — keep UI usable without throwing.
  }
}

export function QuickNote({ labels, className }: QuickNoteProps) {
  const titleId = useId();
  const contentId = useId();
  const counterId = useId();
  const listId = useId();
  const viewerTitleId = useId();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [paneMode, setPaneMode] = useState<PaneMode>("edit");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNotes(readStoredNotes());
    setHydrated(true);
  }, []);

  const viewingNote = useMemo(
    () => (viewingId ? notes.find((note) => note.id === viewingId) ?? null : null),
    [notes, viewingId],
  );

  const sourceNote = useMemo(
    () => (editingId ? notes.find((note) => note.id === editingId) ?? null : null),
    [notes, editingId],
  );

  const isDirty = useMemo(() => {
    if (paneMode !== "edit") return false;
    if (editingId && sourceNote) {
      return title !== sourceNote.title || content !== sourceNote.content;
    }
    return Boolean(title.trim() || content.trim());
  }, [paneMode, editingId, sourceNote, title, content]);

  const clearInputsOnly = () => {
    setTitle("");
    setContent("");
  };

  const enterCreateMode = () => {
    setPaneMode("edit");
    setViewingId(null);
    setEditingId(null);
    clearInputsOnly();
  };

  const confirmLeaveDirty = () => {
    if (!isDirty) return true;
    return window.confirm(labels.discardConfirm);
  };

  const handleCreateNew = () => {
    if (!confirmLeaveDirty()) return;
    enterCreateMode();
  };

  const handleClear = () => {
    // Clears draft inputs only — never touches the saved notes list.
    clearInputsOnly();
  };

  const handleSave = () => {
    const nextTitle = title.trim();
    const nextContent = content.trim();
    if (!nextTitle && !nextContent) return;

    const timestamp = new Date().toISOString();
    let nextNotes: NoteItem[];

    if (editingId) {
      nextNotes = notes.map((note) =>
        note.id === editingId
          ? {
              ...note,
              title: nextTitle.slice(0, MAX_TITLE_LENGTH),
              content: nextContent.slice(0, MAX_CONTENT_LENGTH),
              timestamp,
            }
          : note,
      );
    } else {
      nextNotes = [
        {
          id: createNoteId(),
          title: nextTitle.slice(0, MAX_TITLE_LENGTH),
          content: nextContent.slice(0, MAX_CONTENT_LENGTH),
          timestamp,
        },
        ...notes,
      ];
    }

    setNotes(nextNotes);
    persistNotes(nextNotes);
    enterCreateMode();
  };

  const handleView = (note: NoteItem) => {
    setPaneMode("view");
    setViewingId(note.id);
  };

  const handleEdit = (note: NoteItem) => {
    if (paneMode === "edit" && isDirty && editingId !== note.id && !confirmLeaveDirty()) {
      return;
    }
    setPaneMode("edit");
    setViewingId(null);
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleCloseViewer = () => {
    setPaneMode("edit");
    setViewingId(null);
  };

  const handleDelete = (id: string) => {
    const nextNotes = notes.filter((note) => note.id !== id);
    setNotes(nextNotes);
    persistNotes(nextNotes);
    if (editingId === id) {
      setEditingId(null);
      clearInputsOnly();
    }
    if (viewingId === id) {
      setViewingId(null);
      setPaneMode("edit");
    }
  };

  const canSave = Boolean(title.trim() || content.trim());
  const primarySaveLabel = editingId ? labels.updateButton : labels.saveButton;

  return (
    <div className={clsx("quick-note-tool", className)}>
      <div className="quick-note-tool__primary-col">
        <button
          type="button"
          className="quick-note-tool__btn quick-note-tool__btn--primary quick-note-tool__create-btn"
          onClick={handleCreateNew}
          disabled={!hydrated}
        >
          {labels.createNewButton}
        </button>

        {paneMode === "view" && viewingNote ? (
          <section
            className="quick-note-tool__viewer tool-workspace-panel"
            aria-labelledby={viewerTitleId}
          >
            <div className="quick-note-tool__header">
              <h2 id={viewerTitleId} className="quick-note-tool__section-title">
                {labels.viewerTitle}
              </h2>
              <div className="quick-note-tool__actions">
                <button
                  type="button"
                  className="quick-note-tool__btn quick-note-tool__btn--ghost"
                  onClick={handleCloseViewer}
                >
                  {labels.closeViewerButton}
                </button>
                <button
                  type="button"
                  className="quick-note-tool__btn quick-note-tool__btn--primary"
                  onClick={() => handleEdit(viewingNote)}
                >
                  {labels.editButton}
                </button>
              </div>
            </div>

            <article className="quick-note-tool__viewer-body">
              <h3 className="quick-note-tool__viewer-note-title">
                {viewingNote.title.trim() || labels.untitled}
              </h3>
              <time className="quick-note-tool__viewer-time" dateTime={viewingNote.timestamp}>
                {labels.formatSavedAt(formatTimestamp(viewingNote.timestamp))}
              </time>
              <div className="quick-note-tool__viewer-content" dir="auto">
                {viewingNote.content || "—"}
              </div>
            </article>
          </section>
        ) : (
          <section className="quick-note-tool__workspace tool-workspace-panel">
            <div className="quick-note-tool__header">
              <h2 className="quick-note-tool__section-title">
                {editingId ? labels.editorEditTitle : labels.editorTitle}
              </h2>
              <div className="quick-note-tool__actions">
                <button
                  type="button"
                  className="quick-note-tool__btn quick-note-tool__btn--ghost"
                  onClick={handleClear}
                >
                  {labels.clearButton}
                </button>
                <button
                  type="button"
                  className="quick-note-tool__btn quick-note-tool__btn--primary"
                  onClick={handleSave}
                  disabled={!canSave || !hydrated}
                >
                  {primarySaveLabel}
                </button>
              </div>
            </div>

            <div className="quick-note-tool__title-field">
              <label className="quick-note-tool__label" htmlFor={titleId}>
                {labels.titleLabel}
              </label>
              <input
                id={titleId}
                type="text"
                className="input-dark quick-note-tool__title-input"
                value={title}
                onChange={(event) => setTitle(event.target.value.slice(0, MAX_TITLE_LENGTH))}
                placeholder={labels.titlePlaceholder}
                maxLength={MAX_TITLE_LENGTH}
                dir="auto"
                disabled={!hydrated}
              />
            </div>

            <div className="quick-note-tool__field">
              <label className="quick-note-tool__label" htmlFor={contentId}>
                {labels.contentLabel}
              </label>
              <textarea
                id={contentId}
                className="input-dark quick-note-tool__textarea"
                value={content}
                onChange={(event) => setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH))}
                placeholder={labels.contentPlaceholder}
                maxLength={MAX_CONTENT_LENGTH}
                rows={10}
                dir="auto"
                spellCheck
                aria-describedby={counterId}
                disabled={!hydrated}
              />
              <span id={counterId} className="quick-note-tool__counter" aria-live="polite">
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
          </section>
        )}
      </div>

      <section className="quick-note-tool__list-panel tool-workspace-panel" aria-labelledby={listId}>
        <div className="quick-note-tool__list-header">
          <h2 id={listId} className="quick-note-tool__section-title">
            {labels.listTitle}
          </h2>
          <span className="quick-note-tool__list-count">{notes.length}</span>
        </div>

        {notes.length === 0 ? (
          <p className="quick-note-tool__empty">{labels.emptyList}</p>
        ) : (
          <ul className="quick-note-tool__list">
            {notes.map((note) => {
              const preview = previewContent(note.content);
              const isActiveView = paneMode === "view" && viewingId === note.id;
              const isActiveEdit = paneMode === "edit" && editingId === note.id;
              return (
                <li
                  key={note.id}
                  className={clsx(
                    "quick-note-tool__item",
                    isActiveView && "quick-note-tool__item--viewing",
                    isActiveEdit && "quick-note-tool__item--editing",
                  )}
                >
                  <div className="quick-note-tool__item-card">
                  <button
                    type="button"
                    className="quick-note-tool__item-main"
                    onClick={() => handleView(note)}
                    aria-label={`${labels.viewButton}: ${note.title.trim() || labels.untitled}`}
                  >
                    <h3 className="quick-note-tool__item-title" dir="auto">
                      {note.title.trim() || labels.untitled}
                    </h3>
                    {preview ? (
                      <p className="quick-note-tool__item-preview" dir="auto" title={preview}>
                        {preview}
                      </p>
                    ) : null}
                    <time className="quick-note-tool__item-time" dateTime={note.timestamp}>
                      {labels.formatSavedAt(formatTimestamp(note.timestamp))}
                    </time>
                  </button>
                  <div className="quick-note-tool__item-actions">
                    <button
                      type="button"
                      className="quick-note-tool__btn quick-note-tool__btn--ghost quick-note-tool__btn--icon"
                      onClick={() => handleView(note)}
                      aria-label={labels.viewButton}
                      title={labels.viewButton}
                    >
                      <Eye size={16} strokeWidth={2} aria-hidden />
                      <span className="quick-note-tool__btn-label">{labels.viewButton}</span>
                    </button>
                    <button
                      type="button"
                      className="quick-note-tool__btn quick-note-tool__btn--ghost"
                      onClick={() => handleEdit(note)}
                    >
                      {labels.editButton}
                    </button>
                    <button
                      type="button"
                      className="quick-note-tool__btn quick-note-tool__btn--danger"
                      onClick={() => handleDelete(note.id)}
                    >
                      {labels.deleteButton}
                    </button>
                  </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
