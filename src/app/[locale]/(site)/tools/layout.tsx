import { RouteIntlProvider } from "@/components/RouteIntlProvider";
import { ToolPageDocumentScrollMarker } from "@/components/ToolPageDocumentScrollMarker";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Tool routes prefer a single document scrollbar (Overview / FAQ under the
 * workspace). Mark <html> when this layout is active so clean-phase unlock
 * does not depend solely on WorkspaceUploadShell.
 */
export default async function ToolsLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <RouteIntlProvider locale={locale}>
      <ToolPageDocumentScrollMarker />
      {children}
    </RouteIntlProvider>
  );
}
