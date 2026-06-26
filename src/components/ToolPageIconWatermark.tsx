import { getToolIcon } from "@/lib/tool-icons";

type ToolPageIconWatermarkProps = {
  slug: string;
  headline?: string;
};

/** Giant faded tool icon behind the upload zone — tool pages only. */
export function ToolPageIconWatermark({ slug, headline }: ToolPageIconWatermarkProps) {
  const visual = getToolIcon(slug, headline);

  return (
    <div className="tool-upload-zone__watermark" aria-hidden>
      <span className="tool-upload-zone__watermark-inner">{visual.icon}</span>
    </div>
  );
}
