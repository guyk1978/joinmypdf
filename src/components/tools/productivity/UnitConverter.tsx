"use client";

import { useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  convertUnitValue,
  formatConvertedValue,
  getDefaultUnits,
  UNIT_CATEGORIES,
  UNITS_BY_CATEGORY,
  type UnitCategory,
} from "@/lib/unit-converter";

export type UnitConverterLabels = {
  categoryLabel: string;
  categoryWeight: string;
  categoryLength: string;
  categoryArea: string;
  inputLabel: string;
  fromLabel: string;
  toLabel: string;
  resultLabel: string;
  resetButton: string;
  invalidInput: string;
};

type UnitConverterProps = {
  labels: UnitConverterLabels;
  className?: string;
};

const CATEGORY_LABEL_KEYS: Record<UnitCategory, keyof UnitConverterLabels> = {
  weight: "categoryWeight",
  length: "categoryLength",
  area: "categoryArea",
};

export function UnitConverter({ labels, className }: UnitConverterProps) {
  const inputId = useId();
  const [category, setCategory] = useState<UnitCategory>("weight");
  const defaults = getDefaultUnits(category);
  const [fromUnit, setFromUnit] = useState(defaults.from);
  const [toUnit, setToUnit] = useState(defaults.to);
  const [value, setValue] = useState("1");

  const units = UNITS_BY_CATEGORY[category];

  const result = useMemo(() => {
    const numeric = Number(value);
    if (!value.trim() || !Number.isFinite(numeric)) return null;
    return convertUnitValue(numeric, category, fromUnit, toUnit);
  }, [value, category, fromUnit, toUnit]);

  const onCategoryChange = (next: UnitCategory) => {
    const nextDefaults = getDefaultUnits(next);
    setCategory(next);
    setFromUnit(nextDefaults.from);
    setToUnit(nextDefaults.to);
  };

  const onReset = () => {
    const nextDefaults = getDefaultUnits(category);
    setValue("1");
    setFromUnit(nextDefaults.from);
    setToUnit(nextDefaults.to);
  };

  const unitLabel = (unitId: string) => {
    const unit = units.find((item) => item.id === unitId);
    return unit?.labelKey ?? unitId;
  };

  return (
    <div className={clsx("unit-converter-tool", className)}>
      <section className="productivity-tool__pane tool-workspace-panel">
        <div className="productivity-tool__pane-header">
          <h2 className="productivity-tool__section-title">{labels.categoryLabel}</h2>
          <button type="button" className="productivity-tool__reset-btn" onClick={onReset}>
            {labels.resetButton}
          </button>
        </div>

        <select
          className="productivity-tool__select"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value as UnitCategory)}
        >
          {UNIT_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {labels[CATEGORY_LABEL_KEYS[item]]}
            </option>
          ))}
        </select>

        <label className="productivity-tool__label" htmlFor={inputId}>
          {labels.inputLabel}
        </label>
        <input
          id={inputId}
          type="number"
          className="productivity-tool__input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputMode="decimal"
        />

        <div className="unit-converter-tool__unit-row">
          <div className="unit-converter-tool__field">
            <label className="productivity-tool__label" htmlFor="unit-from">
              {labels.fromLabel}
            </label>
            <select
              id="unit-from"
              className="productivity-tool__select"
              value={fromUnit}
              onChange={(event) => setFromUnit(event.target.value)}
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.labelKey}
                </option>
              ))}
            </select>
          </div>

          <div className="unit-converter-tool__field">
            <label className="productivity-tool__label" htmlFor="unit-to">
              {labels.toLabel}
            </label>
            <select
              id="unit-to"
              className="productivity-tool__select"
              value={toUnit}
              onChange={(event) => setToUnit(event.target.value)}
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.labelKey}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="productivity-tool__pane tool-workspace-panel unit-converter-tool__result-pane">
        <span className="productivity-tool__label">{labels.resultLabel}</span>
        <output className="unit-converter-tool__result" aria-live="polite">
          {result === null ? labels.invalidInput : `${formatConvertedValue(result)} ${unitLabel(toUnit)}`}
        </output>
      </section>
    </div>
  );
}
