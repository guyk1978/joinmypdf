import { RouteIntlProvider } from "@/components/RouteIntlProvider";
import type { ReactNode } from "react";

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return (
    <RouteIntlProvider namespaces={["StudioTools"]}>
      {children}
    </RouteIntlProvider>
  );
}
