import { ToolPageHeader } from "@/components/ToolPageHeader";

type SecondaryPageHeaderProps = {
  title: string;
  description?: string;
};

/** @deprecated Use ProductPageLayout or ToolPageHeader */
export function SecondaryPageHeader({ title, description }: SecondaryPageHeaderProps) {
  return <ToolPageHeader title={title} description={description} />;
}
