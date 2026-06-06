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
};

function TypicalCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-neutral-300 px-4 py-3 align-top text-start text-black dark:border-neutral-800 dark:text-neutral-200">
      <span className="flex items-start justify-start gap-2 text-start">
        <X
          className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-neutral-200"
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
    <td className="border-b border-neutral-300 bg-neutral-100 px-4 py-3 align-top text-start text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
      <span className="flex items-start justify-start gap-2 text-start">
        <Check
          className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-neutral-200"
          strokeWidth={2.5}
          aria-hidden
        />
        <span className="font-medium">{children}</span>
      </span>
    </td>
  );
}

export function ComparisonTable({ locale, headers, rows }: ComparisonTableProps) {
  const isRtl = locale === "he";

  return (
    <div className="w-full overflow-x-auto rounded-none border border-neutral-300 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <table
        dir={isRtl ? "rtl" : "ltr"}
        className="w-full table-fixed text-sm"
      >
        <colgroup>
          <col style={{ width: "33.334%" }} />
          <col style={{ width: "33.333%" }} />
          <col style={{ width: "33.333%" }} />
        </colgroup>
        <thead className="bg-neutral-100 text-xs uppercase tracking-wider text-black dark:bg-neutral-950 dark:text-neutral-200">
          <tr>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              {headers.topic}
            </th>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              {headers.typical}
            </th>
            <th scope="col" className="bg-neutral-200 px-4 py-3 text-start font-extrabold dark:bg-neutral-800">
              {headers.join}
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child_td]:border-b-0">
          {rows.map((row) => (
            <tr key={row.topic}>
              <td className="border-b border-neutral-300 px-4 py-3 align-top text-start font-semibold text-black dark:border-neutral-800 dark:text-neutral-200">
                {row.topic}
              </td>
              <TypicalCell>{row.typical}</TypicalCell>
              <JoinCell>{row.join}</JoinCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
