export type ToolGridItem = {
  href: string;
  label: string;
  slugHint: string;
  description?: string;
};

export function chunkToolGridRows<T>(items: T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}
