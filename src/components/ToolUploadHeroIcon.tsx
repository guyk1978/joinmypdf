import { clsx } from "clsx";
import { ConvertFlowArrow, getToolUploadHeroVisual } from "@/lib/tool-upload-visual";
import { TOOL_ICON_BARE_CLASS } from "@/lib/tool-icons";

type ToolUploadHeroIconProps = {
  slug?: string;
  headline?: string;
  active?: boolean;
};

const HERO_CONVERT_ICON_SIZE =
  "h-[11rem] w-[11rem] sm:h-[14rem] sm:w-[14rem] md:h-[17rem] md:w-[17rem] lg:h-[19rem] lg:w-[19rem]";

const HERO_SINGLE_ICON_SIZE =
  "[&_svg]:h-[16rem] [&_svg]:w-[16rem] sm:[&_svg]:h-[20rem] sm:[&_svg]:w-[20rem] md:[&_svg]:h-[24rem] md:[&_svg]:w-[24rem]";

export function ToolUploadHeroIcon({ slug, headline, active }: ToolUploadHeroIconProps) {
  const visual = getToolUploadHeroVisual(slug, headline);

  if (visual.kind === "convert") {
    return (
      <div
        className={clsx(
          "tool-upload-zone__hero-convert",
          TOOL_ICON_BARE_CLASS,
          "inline-flex items-center justify-center gap-4 sm:gap-6 md:gap-8",
          active && "scale-[1.02]",
        )}
        aria-hidden
      >
        <span className={clsx("tool-upload-zone__hero-format", HERO_CONVERT_ICON_SIZE)}>{visual.from}</span>
        <span className="tool-upload-zone__hero-arrow text-cyan-500 dark:text-cyan-400">
          <ConvertFlowArrow />
        </span>
        <span className={clsx("tool-upload-zone__hero-format", HERO_CONVERT_ICON_SIZE)}>{visual.to}</span>
      </div>
    );
  }

  return (
    <span
      className={clsx(
        "tool-upload-zone__icon",
        TOOL_ICON_BARE_CLASS,
        "inline-flex items-center justify-center transition-transform duration-300",
        HERO_SINGLE_ICON_SIZE,
        active && "scale-[1.03]",
      )}
      aria-hidden
    >
      {visual.icon}
    </span>
  );
}
