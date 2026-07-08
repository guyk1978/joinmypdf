"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { Download, GripVertical, Loader2, Music2, Trash2 } from "lucide-react";
import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegAudioMerge,
  type FfmpegAudioMergeResult,
} from "@/components/tools/hooks/useFfmpegAudioMerge";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP3_ACCEPT = "audio/mpeg,audio/mp3,.mp3";

type MergeFileItem = {
  id: string;
  file: File;
};

function createMergeItem(file: File): MergeFileItem {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${file.name}-${Date.now()}-${Math.random()}`,
    file,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function validateMp3Batch(files: File[]): string | null {
  const invalid = files.find((file) => !isMp3File(file));
  if (invalid) {
    return `Invalid file "${invalid.name}". Please upload valid MP3 files only.`;
  }
  return null;
}

type SortableMergeRowProps = {
  item: MergeFileItem;
  index: number;
  disabled: boolean;
  onRemove: (id: string) => void;
};

function SortableMergeRow({ item, index, disabled, onRemove }: SortableMergeRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex items-center gap-3 border border-neutral-800 bg-neutral-950 px-3 py-2",
        isDragging && "z-10 opacity-80",
      )}
    >
      <button
        type="button"
        className="cursor-grab text-neutral-500 hover:text-neutral-300 active:cursor-grabbing"
        disabled={disabled}
        aria-label={`Reorder ${item.file.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <span className="w-6 text-xs font-semibold tabular-nums text-neutral-500">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-neutral-100">{item.file.name}</p>
        <p className="text-xs text-neutral-500">{formatBytes(item.file.size)}</p>
      </div>
      <button
        type="button"
        className={toolOutlineBtn}
        disabled={disabled}
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.file.name}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}

export type AudioMergerProps = ToolModuleProps & {
  onComplete?: (result: FfmpegAudioMergeResult) => void;
};

export function AudioMerger({ title, onComplete }: AudioMergerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MergeFileItem[]>([]);
  const [pickError, setPickError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    merge,
    reset,
  } = useFfmpegAudioMerge({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;

      const batchError = validateMp3Batch(incoming);
      if (batchError) {
        setPickError(batchError);
        return;
      }

      setItems((current) => [...current, ...incoming.map(createMergeItem)]);
      setPickError("");
      reset();
    },
    [reset],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.id === active.id);
      const newIndex = current.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      setItems((current) => current.filter((item) => item.id !== id));
      reset();
    },
    [reset],
  );

  const mergeAndDownload = useCallback(async () => {
    if (items.length < 2 || busy) return;

    const files = items.map((item) => item.file);
    const batchError = validateMp3Batch(files);
    if (batchError) {
      setPickError(batchError);
      return;
    }

    const payload = await merge(files);
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, items, merge]);

  const canMerge = items.length >= 2 && !busy && environment?.canRun !== false;
  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);
  const isDisabled = busy || Boolean(blockingError);

  const onDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="audio-merger-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Combine multiple MP3 files into one seamless audio track locally. Fast, secure, and 100% private."}{" "}
        ffmpeg.wasm uses the concat demuxer with <code className="text-neutral-500">-c copy</code>{" "}
        for lossless joining in a Web Worker.
      </p>

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      <IndustrialMatteDropzone
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        active={dragActive}
        disabled={isDisabled}
        dropTitle={busy ? "Merging in worker…" : "Drop your MP3 files here"}
        selectLabel="Select MP3 from device"
        supportsLabel={formatSupportsLabel(["MP3"])}
        onKeyDown={onDropzoneKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isDisabled) setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (isDisabled) return;
          addFiles(Array.from(event.dataTransfer.files));
        }}
        onClick={() => {
          if (!isDisabled) inputRef.current?.click();
        }}
        input={
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={MP3_ACCEPT}
            multiple
            disabled={isDisabled}
            className="sr-only"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        }
      />

      {items.length > 0 ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {items.length} file{items.length === 1 ? "" : "s"} · {formatBytes(totalBytes)} total
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setItems([]);
                setPickError("");
                reset();
              }}
            >
              Clear all
            </button>
          </div>

          <p className="text-xs text-neutral-500">
            Drag the grip handle to reorder tracks before merging.
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <SortableMergeRow
                    key={item.id}
                    item={item}
                    index={index}
                    disabled={busy}
                    onRemove={removeItem}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          {items.length < 2 ? (
            <p className="text-xs text-amber-500/90">Add at least one more MP3 to enable merging.</p>
          ) : null}

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canMerge}
            onClick={() => void mergeAndDownload()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Merging…
              </>
            ) : (
              <>
                <Music2 className="mr-2 inline h-4 w-4" aria-hidden />
                Merge &amp; Download
              </>
            )}
          </button>
        </div>
      ) : null}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Merge progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            Merged {result.fileCount} tracks — {formatBytes(result.blob.size)} MP3 ready to download.
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download again
          </button>
          <PostSuccessUpsell operation="audio-merger" fileContext={result.fileName} />
        </div>
      ) : null}
    </div>
  );
}
