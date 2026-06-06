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
      className="group flex flex-col items-center rounded-none border border-neutral-300 bg-white p-3 transition-colors hover:border-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600 md:items-start"
      prefetch={false}
    >
      <ToolDirectoryIcon slug={slug} label={label} />
      <h3 className="mb-1 text-center text-base font-extrabold tracking-tight text-black dark:text-neutral-200 dark:text-white md:text-start md:text-lg">
        {label}
      </h3>
    </Link>
  );
}
