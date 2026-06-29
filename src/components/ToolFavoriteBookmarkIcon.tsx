import { Bookmark, X } from "lucide-react";
import { clsx } from "clsx";

type ToolFavoriteBookmarkIconProps = {
  favorited: boolean;
  showRemove?: boolean;
  size?: "card" | "toolbar" | "empty";
  className?: string;
};

const SIZE_CLASS = {
  card: "h-4 w-4",
  toolbar: "h-5 w-5",
  empty: "h-9 w-9",
} as const;

export function ToolFavoriteBookmarkIcon({
  favorited,
  showRemove = false,
  size = "card",
  className,
}: ToolFavoriteBookmarkIconProps) {
  if (showRemove) {
    return <X className={clsx(SIZE_CLASS.card, className)} strokeWidth={2.25} aria-hidden />;
  }

  return (
    <Bookmark
      className={clsx(SIZE_CLASS[size], favorited && "fill-current", className)}
      strokeWidth={2}
      aria-hidden
    />
  );
}
