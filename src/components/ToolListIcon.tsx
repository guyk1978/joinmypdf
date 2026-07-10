import { clsx } from "clsx";
import { getToolListLucideIcon } from "@/lib/tool-list-icons";

type ToolListIconProps = {
  slug?: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

export function ToolListIcon({ slug, label, size = "sm", className }: ToolListIconProps) {
  const Icon = getToolListLucideIcon(slug, label);

  return (
    <Icon
      className={clsx(
        "tool-list-icon shrink-0 text-current transition-colors duration-150",
        size === "sm" ? "size-[1.125rem]" : "size-6",
        className,
      )}
      strokeWidth={1.5}
      aria-hidden
    />
  );
}
