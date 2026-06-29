import { clsx } from "clsx";
import { ToolUploadDocFan } from "@/components/ToolUploadDocFan";
import { ToolUploadHeroIcon } from "@/components/ToolUploadHeroIcon";
import { getToolUploadHeroVisual } from "@/lib/tool-upload-visual";

type ToolUploadStageProps = {
  slug?: string;
  headline?: string;
  active?: boolean;
  compact?: boolean;
};

/** Center illustration — document fan + tool icon (or convert flow). */
export function ToolUploadStage({ slug, headline, active, compact = false }: ToolUploadStageProps) {
  const visual = getToolUploadHeroVisual(slug, headline);
  const isConvert = visual.kind === "convert";

  return (
    <div
      className={clsx(
        "tool-upload-zone__stage flex w-full items-center justify-center",
        compact && "tool-upload-zone__stage--compact",
        isConvert && "tool-upload-zone__stage--convert",
      )}
    >
      <div
        className={clsx(
          "tool-upload-zone__illustration",
          isConvert && "tool-upload-zone__illustration--convert",
        )}
      >
        {!isConvert ? <ToolUploadDocFan /> : null}

        <div className="tool-upload-zone__hero-mark">
          <ToolUploadHeroIcon slug={slug} headline={headline} active={active} framed={compact} />
        </div>
      </div>
    </div>
  );
}
