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
        "tool-list-icon shrink-0 text-neutral-400 transition-colors group-hover:text-white",
        size === "sm" ? "size-5" : "size-6",
        className,
      )}
      strokeWidth={1.5}
      aria-hidden
    />
  );
}
