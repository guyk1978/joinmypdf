import Link from "next/link";
import { ToolDirectoryIcon } from "@/lib/tool-icons";

type ToolDirectoryCardProps = {
  href: string;
  label: string;
  slug: string;
};

export function ToolDirectoryCard({ href, label, slug }: ToolDirectoryCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center rounded-none border border-dashed border-neutral-400 bg-neutral-200 p-2 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600 md:items-start"
      prefetch={false}
    >
      <ToolDirectoryIcon slug={slug} label={label} />
      <h3 className="mb-0.5 text-center text-sm font-extrabold tracking-tight text-black dark:text-neutral-200 md:text-start md:text-base">
        {label}
      </h3>
    </Link>
  );
}
