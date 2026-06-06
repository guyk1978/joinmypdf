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
      className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:shadow-xl dark:hover:shadow-black/25 md:items-start md:p-5"
      prefetch={false}
    >
      <ToolDirectoryIcon slug={slug} label={label} />
      <h3 className="mb-1 text-center text-base font-extrabold tracking-tight text-slate-900 dark:text-white md:text-start md:text-lg">
        {label}
      </h3>
    </Link>
  );
}
