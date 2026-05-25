import type { ParsedDataset } from "./types";

export const DEMO_DATASET: ParsedDataset = {
  sourceFormat: "demo",
  fileName: "demo-sales.csv",
  columns: ["region", "product", "units", "revenue", "status"],
  rows: [
    { region: "North America", product: "Pro Plan", units: "128", revenue: "19200", status: "shipped" },
    { region: "EMEA", product: "Starter", units: "340", revenue: "10200", status: "processing" },
    { region: "APAC", product: "Enterprise", units: "42", revenue: "31500", status: "shipped" },
    { region: "LATAM", product: "Pro Plan", units: "76", revenue: "11400", status: "" },
    { region: "North America", product: "Add-on API", units: "210", revenue: "4200", status: "shipped" },
    { region: "EMEA", product: "Enterprise", units: "18", revenue: "13500", status: "pending" },
    { region: "APAC", product: "Starter", units: "95", revenue: "2850", status: "shipped" },
    { region: "LATAM", product: "Starter", units: "120", revenue: "3600", status: "cancelled" },
  ],
};
