import { Link } from "@/i18n/navigation";
import { ToolListIcon } from "@/components/ToolListIcon";

type ToolsDirectoryToolLinkProps = {
  href: string;
  label: string;
  slugHint: string;
};

export function ToolsDirectoryToolLink({ href, label, slugHint }: ToolsDirectoryToolLinkProps) {
  return (
    <Link href={href} className="tools-directory-link group flex items-center gap-2" prefetch={false}>
      <ToolListIcon slug={slugHint} label={label} />
      <span className="tools-directory-link__label">{label}</span>
    </Link>
  );
}
