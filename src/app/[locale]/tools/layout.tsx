import { RouteIntlProvider } from "@/components/RouteIntlProvider";
import type { ReactNode } from "react";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <RouteIntlProvider>{children}</RouteIntlProvider>;
}
