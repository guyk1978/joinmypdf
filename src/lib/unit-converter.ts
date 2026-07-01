export type UnitCategory = "weight" | "length" | "area";

export type UnitDefinition = {
  id: string;
  labelKey: string;
  toBase: number;
};

export const UNIT_CATEGORIES: UnitCategory[] = ["weight", "length", "area"];

export const UNITS_BY_CATEGORY: Record<UnitCategory, UnitDefinition[]> = {
  weight: [
    { id: "kg", labelKey: "kg", toBase: 1 },
    { id: "g", labelKey: "g", toBase: 0.001 },
    { id: "lb", labelKey: "lb", toBase: 0.45359237 },
    { id: "oz", labelKey: "oz", toBase: 0.028349523125 },
  ],
  length: [
    { id: "m", labelKey: "m", toBase: 1 },
    { id: "km", labelKey: "km", toBase: 1000 },
    { id: "cm", labelKey: "cm", toBase: 0.01 },
    { id: "mm", labelKey: "mm", toBase: 0.001 },
    { id: "ft", labelKey: "ft", toBase: 0.3048 },
    { id: "in", labelKey: "in", toBase: 0.0254 },
    { id: "mi", labelKey: "mi", toBase: 1609.344 },
  ],
  area: [
    { id: "m2", labelKey: "m2", toBase: 1 },
    { id: "km2", labelKey: "km2", toBase: 1_000_000 },
    { id: "ft2", labelKey: "ft2", toBase: 0.09290304 },
    { id: "acre", labelKey: "acre", toBase: 4046.8564224 },
    { id: "hectare", labelKey: "hectare", toBase: 10_000 },
  ],
};

export function convertUnitValue(
  value: number,
  category: UnitCategory,
  fromUnitId: string,
  toUnitId: string,
): number | null {
  if (!Number.isFinite(value)) return null;

  const units = UNITS_BY_CATEGORY[category];
  const fromUnit = units.find((unit) => unit.id === fromUnitId);
  const toUnit = units.find((unit) => unit.id === toUnitId);
  if (!fromUnit || !toUnit || toUnit.toBase === 0) return null;

  const baseValue = value * fromUnit.toBase;
  return baseValue / toUnit.toBase;
}

export function getDefaultUnits(category: UnitCategory): { from: string; to: string } {
  const units = UNITS_BY_CATEGORY[category];
  if (category === "weight") return { from: "kg", to: "lb" };
  if (category === "length") return { from: "m", to: "ft" };
  return { from: units[0]?.id ?? "m2", to: units[3]?.id ?? "acre" };
}

export function formatConvertedValue(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1_000_000 || abs < 0.0001) return value.toExponential(6);
  return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
}
