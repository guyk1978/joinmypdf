"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** Legacy `/favicon-tools` → hub at `/tools/favicon-tools/`. */
export default function FaviconToolsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tools/favicon-tools/");
  }, [router]);

  return (
    <p className="px-4 py-10 text-center text-sm text-[#a3a3a3]">
      Redirecting to Favicon Tools…
    </p>
  );
}
