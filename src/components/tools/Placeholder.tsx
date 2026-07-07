"use client";

import { Clock3, Sparkles } from "lucide-react";
import type { ToolModuleProps } from "@/lib/tool-module";

export function Placeholder({ name, title }: ToolModuleProps) {
  return (
    <div className="tool-placeholder space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{name}</p>
          <p className="mt-1 text-sm text-neutral-300">{title}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-none border border-neutral-700 bg-[#0a0a0a] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
          <Clock3 className="h-3 w-3" aria-hidden />
          Coming Soon
        </span>
      </div>

      <div className="rounded-none border border-dashed border-neutral-800 bg-[#0a0a0a] p-6 text-center">
        <Sparkles className="mx-auto mb-2 h-5 w-5 text-neutral-500" aria-hidden />
        <p className="text-sm text-neutral-400">
          This audio utility is on the roadmap and will appear here when ready.
        </p>
      </div>
    </div>
  );
}
