import { RouteIntlProvider } from "@/components/RouteIntlProvider";
import type { ReactNode } from "react";

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <RouteIntlProvider namespaces={["SearchPage"]}>{children}</RouteIntlProvider>
  );
}
