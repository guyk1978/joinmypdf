import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

export type ComparisonTableRow = {
  topic: string;
  typical: ReactNode;
  join: ReactNode;
};

type ComparisonTableProps = {
  locale: string;
  headers: {
    topic: string;
    typical: string;
    join: string;
  };
  rows: ComparisonTableRow[];
  /** Flush inside a dashboard panel — no outer border/background */
  flush?: boolean;
};

function TypicalCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-white/10 px-4 py-3 align-top text-start text-neutral-300">
      <span className="flex items-start justify-start gap-2 text-start">
        <X
          className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500"
          strokeWidth={2.5}
          aria-hidden
        />
        <span>{children}</span>
      </span>
    </td>
  );
}

function JoinCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-white/10 bg-emerald-400/[0.06] px-4 py-3 align-top text-start text-neutral-100">
      <span className="flex items-start justify-start gap-2 text-start">
        <Check
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
          strokeWidth={2.5}
          aria-hidden
        />
        <span className="font-medium">{children}</span>
      </span>
    </td>
  );
}

export function ComparisonTable({ locale, headers, rows, flush = false }: ComparisonTableProps) {
  const isRtl = locale === "he";

  return (
    <div
      className={
        flush
          ? "comparison-table w-full overflow-x-auto"
          : "comparison-table w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035]"
      }
    >
      <table
        dir={isRtl ? "rtl" : "ltr"}
        className="w-full table-fixed text-sm"
      >
        <colgroup>
          <col style={{ width: "33.334%" }} />
          <col style={{ width: "33.333%" }} />
          <col style={{ width: "33.333%" }} />
        </colgroup>
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-neutral-300">
          <tr>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              {headers.topic}
            </th>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              {headers.typical}
            </th>
            <th scope="col" className="bg-emerald-400/10 px-4 py-3 text-start font-extrabold text-emerald-300">
              {headers.join}
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child_td]:border-b-0 [&_tr:last-child_th]:border-b-0">
          {rows.map((row) => (
            <tr key={row.topic}>
              <th
                scope="row"
                className="border-b border-white/10 px-4 py-3 align-top text-start font-semibold text-neutral-100"
              >
                {row.topic}
              </th>
              <TypicalCell>{row.typical}</TypicalCell>
              <JoinCell>{row.join}</JoinCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
