export type InventoryToolStatus = "active" | "inactive";

export type InventoryCategoryId =
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "developer"
  | "data"
  | "security"
  | "productivity"
  | "design"
  | "utilities"
  | "articles";

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  category: InventoryCategoryId;
  path: string;
  source: string;
  status: InventoryToolStatus;
  slug: string;
};

export type InventoryCategoryGroup = {
  id: InventoryCategoryId;
  label: string;
  items: InventoryItem[];
};

export const INVENTORY_CATEGORY_META: ReadonlyArray<{ id: InventoryCategoryId; label: string }> = [
  { id: "pdf", label: "PDF" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
  { id: "developer", label: "Developer" },
  { id: "data", label: "Data & Conversion" },
  { id: "security", label: "Security" },
  { id: "productivity", label: "Productivity" },
  { id: "design", label: "Design Tools" },
  { id: "utilities", label: "Utilities" },
  { id: "articles", label: "Articles" },
];
