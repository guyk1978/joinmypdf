"use client";

import { clsx } from "clsx";
import { Download, ImagePlus, Loader2, Tags } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  isCoverImageFile,
  type Mp3MetadataFields,
} from "@/components/tools/ffmpeg/edit-mp3-metadata";
import { readMp3Id3Tags, type Mp3Id3Tags } from "@/components/tools/ffmpeg/read-mp3-id3";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegMp3Metadata,
  type FfmpegMp3MetadataResult,
} from "@/components/tools/hooks/useFfmpegMp3Metadata";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP3_ACCEPT = "audio/mpeg,audio/mp3,.mp3";
const COVER_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

const EMPTY_FIELDS: Mp3MetadataFields = {
  title: "",
  artist: "",
  album: "",
  year: "",
};

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

function tagsToFields(tags: Mp3Id3Tags): Mp3MetadataFields {
  return {
    title: tags.title,
    artist: tags.artist,
    album: tags.album,
    year: tags.year,
  };
}

function fieldsEqual(a: Mp3MetadataFields, b: Mp3MetadataFields): boolean {
  return (
    a.title === b.title &&
    a.artist === b.artist &&
    a.album === b.album &&
    a.year === b.year
  );
}

function previewValue(value: string): string {
  return value.trim() || "—";
}

export type Mp3MetadataEditorProps = ToolModuleProps & {
  onComplete?: (result: FfmpegMp3MetadataResult) => void;
};

export function Mp3MetadataEditor({ title, onComplete }: Mp3MetadataEditorProps) {
  const titleId = useId();
  const artistId = useId();
  const albumId = useId();
  const yearId = useId();
  const coverId = useId();
  const removeCoverId = useId();

  const [file, setFile] = useState<File | null>(null);
  const [originalTags, setOriginalTags] = useState<Mp3Id3Tags | null>(null);
  const [fields, setFields] = useState<Mp3MetadataFields>(EMPTY_FIELDS);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [pickError, setPickError] = useState("");
  const [coverError, setCoverError] = useState("");
  const [readingTags, setReadingTags] = useState(false);

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    saveMetadata,
    reset,
  } = useFfmpegMp3Metadata({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError =
    pickError || coverError || blockingError || (phase === "error" ? error : undefined);

  const hasExistingCover = Boolean(originalTags?.coverData);
  const hasMetadataChanges = originalTags
    ? !fieldsEqual(fields, tagsToFields(originalTags))
    : Boolean(fields.title || fields.artist || fields.album || fields.year);
  const hasChanges = hasMetadataChanges || Boolean(coverFile) || removeCover;

  const previewCoverUrl = useMemo(() => {
    if (removeCover) return null;
    if (coverPreviewUrl) return coverPreviewUrl;
    if (existingCoverUrl) return existingCoverUrl;
    return null;
  }, [coverPreviewUrl, existingCoverUrl, removeCover]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!originalTags?.coverData) {
      setExistingCoverUrl(null);
      return;
    }
    const mime = originalTags.coverMime || "image/jpeg";
    const bytes = originalTags.coverData;
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: mime });
    const url = URL.createObjectURL(blob);
    setExistingCoverUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalTags]);

  const loadTagsFromFile = useCallback(async (next: File) => {
    setReadingTags(true);
    try {
      const tags = await readMp3Id3Tags(next);
      setOriginalTags(tags);
      setFields(tagsToFields(tags));
    } catch {
      setOriginalTags({ ...EMPTY_FIELDS });
      setFields({ ...EMPTY_FIELDS });
    } finally {
      setReadingTags(false);
    }
  }, []);

  const pickFile = useCallback(
    async (next: File) => {
      if (!isMp3File(next)) {
        setPickError(
          "Invalid or unsupported file. Please upload a valid MP3 audio file for metadata editing.",
        );
        return;
      }

      setFile(next);
      setPickError("");
      setCoverError("");
      setCoverFile(null);
      setRemoveCover(false);
      reset();
      await loadTagsFromFile(next);
    },
    [loadTagsFromFile, reset],
  );

  const pickCover = useCallback((next: File) => {
    if (!isCoverImageFile(next)) {
      setCoverError(
        "Invalid cover image. Please upload a JPG, PNG, or WebP image for album art.",
      );
      return;
    }
    setCoverFile(next);
    setCoverError("");
    setRemoveCover(false);
  }, []);

  const saveAndDownload = useCallback(async () => {
    if (!file || busy || !hasChanges) return;

    const payload = await saveMetadata({
      file,
      fields,
      coverFile,
      removeCover,
    });
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, coverFile, fields, file, hasChanges, removeCover, saveMetadata]);

  const canSave = Boolean(file) && hasChanges && !busy && environment?.canRun !== false;

  const updateField = (key: keyof Mp3MetadataFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="mp3-metadata-editor-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Edit your MP3 tags, including title, artist, album, and album art directly in your browser. Fast, secure, and 100% private."}{" "}
        ffmpeg.wasm writes ID3 metadata locally with stream copy so audio quality is preserved.
      </p>

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="audio"
          accept={MP3_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP3"]}
          onFile={(next) => void pickFile(next)}
          onError={(message) => setPickError(message)}
          labels={{
            title: "Upload MP3",
            titleBusy: "Writing metadata in worker…",
            description: "Drag and drop an MP3 or browse from your device.",
            privacyBadge: "100% Private — metadata edited locally with ffmpeg.wasm.",
          }}
          className="rounded-none border-neutral-800 bg-[#1a1a1a]"
        />
      ) : (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {file.name} · {formatBytes(file.size)}
              {readingTags ? (
                <span className="ml-2 text-neutral-500">Reading existing tags…</span>
              ) : null}
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setFile(null);
                setOriginalTags(null);
                setFields({ ...EMPTY_FIELDS });
                setCoverFile(null);
                setRemoveCover(false);
                setPickError("");
                setCoverError("");
                reset();
              }}
            >
              Choose another file
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-300" htmlFor={titleId}>
                  Title
                </label>
                <input
                  id={titleId}
                  type="text"
                  value={fields.title}
                  disabled={busy || readingTags}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Track title"
                  className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-300" htmlFor={artistId}>
                  Artist
                </label>
                <input
                  id={artistId}
                  type="text"
                  value={fields.artist}
                  disabled={busy || readingTags}
                  onChange={(event) => updateField("artist", event.target.value)}
                  placeholder="Artist name"
                  className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-300" htmlFor={albumId}>
                  Album
                </label>
                <input
                  id={albumId}
                  type="text"
                  value={fields.album}
                  disabled={busy || readingTags}
                  onChange={(event) => updateField("album", event.target.value)}
                  placeholder="Album name"
                  className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-300" htmlFor={yearId}>
                  Year
                </label>
                <input
                  id={yearId}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={fields.year}
                  disabled={busy || readingTags}
                  onChange={(event) => updateField("year", event.target.value.replace(/\D/g, ""))}
                  placeholder="2026"
                  className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-300" htmlFor={coverId}>
                  Album cover
                </label>
                <input
                  id={coverId}
                  type="file"
                  accept={COVER_ACCEPT}
                  disabled={busy}
                  onChange={(event) => {
                    const next = event.target.files?.[0];
                    if (next) pickCover(next);
                    event.target.value = "";
                  }}
                  className="block w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 file:mr-3 file:rounded-none file:border-0 file:bg-neutral-800 file:px-3 file:py-1 file:text-sm file:text-neutral-100"
                />
                <p className="text-xs text-neutral-500">JPG, PNG, or WebP. Replaces embedded album art.</p>
              </div>

              {hasExistingCover || coverFile ? (
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input
                    id={removeCoverId}
                    type="checkbox"
                    checked={removeCover}
                    disabled={busy}
                    onChange={(event) => {
                      setRemoveCover(event.target.checked);
                      if (event.target.checked) setCoverFile(null);
                    }}
                    className="h-4 w-4 rounded-none border-neutral-600 bg-neutral-950 accent-neutral-100"
                  />
                  Remove existing album art
                </label>
              ) : null}
            </div>

            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Tag preview
              </p>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-neutral-500">Title</dt>
                  <dd className="font-medium text-neutral-100">{previewValue(fields.title)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Artist</dt>
                  <dd className="font-medium text-neutral-100">{previewValue(fields.artist)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Album</dt>
                  <dd className="font-medium text-neutral-100">{previewValue(fields.album)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Year</dt>
                  <dd className="font-medium text-neutral-100">{previewValue(fields.year)}</dd>
                </div>
              </dl>
              <div className="pt-2">
                <p className="text-xs text-neutral-500">Album art</p>
                {previewCoverUrl ? (
                  <img
                    src={previewCoverUrl}
                    alt="Album cover preview"
                    className="mt-2 aspect-square w-full max-w-[180px] border border-neutral-800 object-cover"
                  />
                ) : (
                  <div className="mt-2 flex aspect-square w-full max-w-[180px] items-center justify-center border border-dashed border-neutral-800 bg-[#141414] text-neutral-600">
                    <ImagePlus className="h-8 w-8" aria-hidden />
                  </div>
                )}
              </div>
            </div>
          </div>

          {!hasChanges ? (
            <p className="text-xs text-neutral-500">
              No metadata in this file yet? Fill in the fields above or add album art, then save.
            </p>
          ) : null}

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canSave}
            onClick={() => void saveAndDownload()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Saving metadata…
              </>
            ) : (
              <>
                <Tags className="mr-2 inline h-4 w-4" aria-hidden />
                Save Metadata &amp; Download
              </>
            )}
          </button>
        </div>
      )}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Metadata write progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            Metadata saved — {formatBytes(result.blob.size)} MP3 ready to download.
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download again
          </button>
          <PostSuccessUpsell
            operation="mp3-metadata-editor"
            fileContext={file?.name}
            sourceFile={file}
          />
        </div>
      ) : null}
    </div>
  );
}
