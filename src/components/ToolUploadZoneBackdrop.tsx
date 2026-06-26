import { getToolUploadWatermarks } from "@/lib/tool-upload-visual";

type ToolUploadZoneBackdropProps = {
  slug: string;
  headline?: string;
};

/** Shared tool upload background — subtle card pattern + faded format icons. */
export function ToolUploadZoneBackdrop({ slug, headline }: ToolUploadZoneBackdropProps) {
  const watermarks = getToolUploadWatermarks(slug, headline);

  return (
    <div className="tool-upload-zone__backdrop" aria-hidden>
      <div className="tool-upload-zone__pattern">
        <span className="tool-upload-zone__pattern-card tool-upload-zone__pattern-card--a" />
        <span className="tool-upload-zone__pattern-card tool-upload-zone__pattern-card--b" />
        <span className="tool-upload-zone__pattern-card tool-upload-zone__pattern-card--c" />
      </div>

      <div className="tool-upload-zone__watermarks">
        {watermarks.map((mark, index) => (
          <span
            key={`${mark.placement}-${index}`}
            className={`tool-upload-zone__watermark tool-upload-zone__watermark--${mark.placement}`}
          >
            {mark.icon}
          </span>
        ))}
      </div>
    </div>
  );
}
