"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  convertJsonToCsv,
  downloadJsonToCsv,
  getJsonToCsvPreviewRows,
  formatPreviewCell,
} from "@/lib/json-to-csv";

export type JsonToCsvLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  convertButton: string;
  previewLabel: string;
  previewMoreRows: string;
  downloadButton: string;
  emptyInput: string;
};

type JsonToCsvProps = {
  labels: JsonToCsvLabels;
  className?: string;
};

export function JsonToCsv({ labels, className }: JsonToCsvProps) {
  const [input, setInput] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [csv, setCsv] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runConvert = useCallback((raw: string) => {
    const result = convertJsonToCsv(raw);
    if (result.ok) {
      setHeaders(result.headers);
      setRows(result.rows);
      setCsv(result.csv);
      setTotalRows(result.totalRows);
      setError(null);
      return;
    }

    setHeaders([]);
    setRows([]);
    setCsv("");
    setTotalRows(0);
    setError(result.error);
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setHeaders([]);
      setRows([]);
      setCsv("");
      setTotalRows(0);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => runConvert(input), 400);
    return () => window.clearTimeout(timer);
  }, [input, runConvert]);

  const previewRows = useMemo(() => getJsonToCsvPreviewRows(rows), [rows]);
  const hiddenRowCount = Math.max(0, totalRows - previewRows.length);

  const onDownload = () => {
    if (!csv) return;
    downloadJsonToCsv(csv);
  };

  return (
    <div className={clsx("json-to-csv-tool", className)}>
      <div className="json-to-csv-tool__input tool-workspace-panel">
        <label htmlFor="json-to-csv-input" className="json-to-csv-tool__label">
          {labels.inputLabel}
        </label>
        <textarea
          id="json-to-csv-input"
          className="json-to-csv-tool__textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={12}
        />
      </div>

      {error ? (
        <p className="json-to-csv-tool__error" role="status">
          {error}
        </p>
      ) : null}

      {previewRows.length > 0 && headers.length > 0 ? (
        <div className="json-to-csv-tool__preview tool-workspace-panel">
          <div className="json-to-csv-tool__preview-header">
            <span className="json-to-csv-tool__label">{labels.previewLabel}</span>
          </div>
          <div className="json-to-csv-tool__preview-wrap">
            <table className="json-to-csv-tool__preview-table">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header} scope="col">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header) => (
                      <td key={`${rowIndex}-${header}`}>{formatPreviewCell(row[header] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hiddenRowCount > 0 ? (
            <p className="json-to-csv-tool__preview-note">
              {labels.previewMoreRows.replace("{count}", String(hiddenRowCount))}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="json-to-csv-tool__actions tool-workspace-panel">
        <button
          type="button"
          className="json-to-csv-tool__convert-btn"
          onClick={() => runConvert(input)}
          disabled={!input.trim()}
        >
          {labels.convertButton}
        </button>
        <button
          type="button"
          className="json-to-csv-tool__download-btn"
          onClick={onDownload}
          disabled={!csv}
        >
          {labels.downloadButton}
        </button>
      </div>
    </div>
  );
}
