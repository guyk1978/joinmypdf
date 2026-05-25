/** One record per row; keys are column headers. */
export type DataRow = Record<string, string>;

export type ParsedDataset = {
  rows: DataRow[];
  columns: string[];
  sourceFormat: "csv" | "json" | "demo";
  fileName?: string;
};

export type SortDirection = "asc" | "desc";

export type SortState = {
  column: string;
  direction: SortDirection;
} | null;
