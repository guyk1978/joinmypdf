import { RouteIntlProvider } from "@/components/RouteIntlProvider";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function TemplatesLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <RouteIntlProvider locale={locale} namespaces={["StudioTools"]}>
      {children}
    </RouteIntlProvider>
  );
}
