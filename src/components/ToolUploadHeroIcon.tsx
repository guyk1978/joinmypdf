import { clsx } from "clsx";
import { ConvertFlowArrow, getToolUploadHeroVisual } from "@/lib/tool-upload-visual";
import { TOOL_ICON_BARE_CLASS } from "@/lib/tool-icons";

type ToolUploadHeroIconProps = {
  slug?: string;
  headline?: string;
  active?: boolean;
  framed?: boolean;
};

const HERO_CONVERT_ICON_SIZE_FRAMED =
  "h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem] md:h-[5.25rem] md:w-[5.25rem]";

const HERO_CONVERT_ICON_SIZE_DEFAULT =
  "h-[11rem] w-[11rem] sm:h-[14rem] sm:w-[14rem] md:h-[17rem] md:w-[17rem] lg:h-[19rem] lg:w-[19rem]";

const HERO_SINGLE_ICON_SIZE_FRAMED =
  "[&_svg]:h-[5.75rem] [&_svg]:w-[5.75rem] sm:[&_svg]:h-[6.25rem] sm:[&_svg]:w-[6.25rem] md:[&_svg]:h-[6.75rem] md:[&_svg]:w-[6.75rem]";

const HERO_SINGLE_ICON_SIZE_DEFAULT =
  "[&_svg]:h-[16rem] [&_svg]:w-[16rem] sm:[&_svg]:h-[20rem] sm:[&_svg]:w-[20rem] md:[&_svg]:h-[24rem] md:[&_svg]:w-[24rem]";

export function ToolUploadHeroIcon({ slug, headline, active, framed = false }: ToolUploadHeroIconProps) {
  const visual = getToolUploadHeroVisual(slug, headline);
  const convertSize = framed ? HERO_CONVERT_ICON_SIZE_FRAMED : HERO_CONVERT_ICON_SIZE_DEFAULT;
  const singleSize = framed ? HERO_SINGLE_ICON_SIZE_FRAMED : HERO_SINGLE_ICON_SIZE_DEFAULT;

  if (visual.kind === "convert") {
    return (
      <div
        className={clsx(
          "tool-upload-zone__hero-convert",
          TOOL_ICON_BARE_CLASS,
          "inline-flex items-center justify-center gap-2.5 sm:gap-3",
          active && "scale-[1.02]",
        )}
        aria-hidden
      >
        <span className={clsx("tool-upload-zone__hero-format", convertSize)}>{visual.from}</span>
        <span className="tool-upload-zone__hero-arrow text-neutral-400 dark:text-neutral-500">
          <ConvertFlowArrow compact={framed} />
        </span>
        <span className={clsx("tool-upload-zone__hero-format", convertSize)}>{visual.to}</span>
      </div>
    );
  }

  return (
    <span
      className={clsx(
        "tool-upload-zone__icon",
        TOOL_ICON_BARE_CLASS,
        "inline-flex items-center justify-center transition-transform duration-300",
        singleSize,
        active && "scale-[1.03]",
      )}
      aria-hidden
    >
      {visual.icon}
    </span>
  );
}
