import { RouteIntlProvider } from "@/components/RouteIntlProvider";
import type { ReactNode } from "react";

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <RouteIntlProvider namespaces={["Contact"]}>{children}</RouteIntlProvider>
  );
}
