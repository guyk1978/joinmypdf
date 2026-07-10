import { Link } from "@/i18n/navigation";
import { ToolListIcon } from "@/components/ToolListIcon";

type HomeFlatToolLinkProps = {
  href: string;
  label: string;
  slugHint: string;
};

/** Borderless icon + label link for the homepage “More Professional Tools” nav grid. */
export function HomeFlatToolLink({ href, label, slugHint }: HomeFlatToolLinkProps) {
  return (
    <Link href={href} className="home-tool-flat-link" prefetch={false}>
      <ToolListIcon slug={slugHint} label={label} className="home-tool-flat-link__icon" />
      <span className="home-tool-flat-link__label">{label}</span>
    </Link>
  );
}
