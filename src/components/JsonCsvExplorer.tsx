"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { clsx } from "clsx";
import { List, type RowComponentProps } from "react-window";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import type { DataRow } from "@/lib/data-tool/types";
import {
  buildVisibleJsonTree,
  downloadExplorerFile,
  exportExplorerData,
  filterCsvRows,
  parseExplorerInput,
  type ExplorerFormat,
  type JsonTreeNode,
} from "@/lib/json-csv-explorer";

export type JsonCsvExplorerLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  formatAuto: string;
  formatJson: string;
  formatCsv: string;
  parseButton: string;
  clearButton: string;
  searchLabel: string;
  searchPlaceholder: string;
  columnPickerTitle: string;
  selectAll: string;
  selectNone: string;
  explorerTitle: string;
  emptyHint: string;
  errorEmpty: string;
  errorInvalid: string;
  exportButton: string;
  copyPathHint: string;
  pathCopied: string;
  rowsLabel: string;
  privacyLabel: string;
  pageTitle: string;
};

type JsonCsvExplorerProps = {
  labels: JsonCsvExplorerLabels;
  className?: string;
};

type FormatMode = "auto" | ExplorerFormat;

type TreeRowProps = {
  nodes: JsonTreeNode[];
  expanded: Set<string>;
  searchActive: boolean;
  onToggle: (path: string) => void;
  onCopyPath: (path: string) => void;
};

type CsvRowProps = {
  rows: DataRow[];
  columns: string[];
  query: string;
};

function TreeRow({
  index,
  style,
  ariaAttributes,
  nodes,
  expanded,
  searchActive,
  onToggle,
  onCopyPath,
}: RowComponentProps<TreeRowProps>) {
  const node = nodes[index];
  if (!node) {
    return <div style={style} {...ariaAttributes} />;
  }
  const isOpen = searchActive || expanded.has(node.id);

  return (
    <div
      style={style}
      {...ariaAttributes}
      className={clsx("json-csv-explorer__tree-row", node.match && "json-csv-explorer__tree-row--match")}
    >
      <div
        className="json-csv-explorer__tree-indent"
        style={{ paddingInlineStart: `${node.depth * 1.1}rem` }}
      >
        {node.hasChildren ? (
          <button
            type="button"
            className={clsx("json-csv-explorer__toggle", isOpen && "json-csv-explorer__toggle--open")}
            aria-expanded={isOpen}
            onClick={() => onToggle(node.id)}
          >
            ▸
          </button>
        ) : (
          <span className="json-csv-explorer__toggle-spacer" aria-hidden />
        )}
        <button
          type="button"
          className="json-csv-explorer__key"
          title="Copy path"
          onClick={() => onCopyPath(node.path === "$" ? "" : node.path)}
        >
          {node.keyLabel}
        </button>
        <span className="json-csv-explorer__type">{node.type}</span>
        <span className="json-csv-explorer__preview">{node.preview}</span>
      </div>
    </div>
  );
}

function CsvVirtualRow({
  index,
  style,
  ariaAttributes,
  rows,
  columns,
  query,
}: RowComponentProps<CsvRowProps>) {
  const row = rows[index];
  if (!row) {
    return <div style={style} {...ariaAttributes} />;
  }
  const q = query.trim().toLowerCase();

  return (
    <div style={style} {...ariaAttributes} className="json-csv-explorer__csv-row">
      <span className="json-csv-explorer__csv-index">{index + 1}</span>
      {columns.map((col) => {
        const value = row[col] ?? "";
        const highlight = q.length > 0 && value.toLowerCase().includes(q);
        return (
          <span
            key={col}
            className={clsx("json-csv-explorer__csv-cell", highlight && "json-csv-explorer__csv-cell--match")}
            title={value}
          >
            {value}
          </span>
        );
      })}
    </div>
  );
}

export function JsonCsvExplorer({ labels, className }: JsonCsvExplorerProps) {
  const [input, setInput] = useState("");
  const [formatMode, setFormatMode] = useState<FormatMode>("auto");
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ExplorerFormat | null>(null);
  const [jsonData, setJsonData] = useState<unknown>(null);
  const [csvRows, setCsvRows] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["$"]));
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [interacted, setInteracted] = useState(false);
  const [exported, setExported] = useState(false);
  const [pathCopied, setPathCopied] = useState(false);

  const treeNodes = useMemo(() => {
    if (format !== "json" || jsonData === null) return [];
    return buildVisibleJsonTree(jsonData, expanded, search);
  }, [format, jsonData, expanded, search]);

  const visibleCsvRows = useMemo(() => {
    if (format !== "csv") return [];
    return filterCsvRows(csvRows, columns, search, sortColumn, sortDir);
  }, [format, csvRows, columns, search, sortColumn, sortDir]);

  const markInteracted = useCallback(() => setInteracted(true), []);

  const handleParse = () => {
    const result = parseExplorerInput(input, formatMode);
    if (!result.ok) {
      setError(result.code === "empty" ? labels.errorEmpty : labels.errorInvalid);
      setFormat(null);
      setJsonData(null);
      setCsvRows([]);
      setColumns([]);
      setSelectedColumns([]);
      setExported(false);
      return;
    }

    setError(null);
    setExported(false);
    setSearch("");
    setSortColumn(null);
    setExpanded(new Set(["$"]));

    if (result.format === "json") {
      setFormat("json");
      setJsonData(result.data);
      setCsvRows([]);
      setColumns(result.columns);
      setSelectedColumns(result.columns);
      setInput(result.beautified);
    } else {
      setFormat("csv");
      setJsonData(null);
      setCsvRows(result.rows);
      setColumns(result.columns);
      setSelectedColumns(result.columns);
    }
  };

  const handleClear = () => {
    setInput("");
    setError(null);
    setFormat(null);
    setJsonData(null);
    setCsvRows([]);
    setColumns([]);
    setSelectedColumns([]);
    setSearch("");
    setInteracted(false);
    setExported(false);
    setExpanded(new Set(["$"]));
  };

  const toggleExpand = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const copyPath = useCallback(async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setPathCopied(true);
      markInteracted();
      window.setTimeout(() => setPathCopied(false), 1400);
    } catch {
      /* ignore */
    }
  }, [markInteracted]);

  const treeRowProps = useMemo(
    () => ({
      nodes: treeNodes,
      expanded,
      searchActive: search.trim().length > 0,
      onToggle: toggleExpand,
      onCopyPath: copyPath,
    }),
    [treeNodes, expanded, search, toggleExpand, copyPath],
  );

  const csvRowProps = useMemo(
    () => ({
      rows: visibleCsvRows,
      columns: selectedColumns.length ? selectedColumns : columns,
      query: search,
    }),
    [visibleCsvRows, selectedColumns, columns, search],
  );

  const toggleColumn = (col: string) => {
    markInteracted();
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((item) => item !== col) : [...prev, col],
    );
  };

  const handleExport = () => {
    if (!format) return;
    const cols = selectedColumns.length ? selectedColumns : columns;
    const payload = exportExplorerData({
      format,
      jsonData: jsonData ?? undefined,
      csvRows: format === "csv" ? visibleCsvRows : undefined,
      selectedColumns: cols,
    });
    downloadExplorerFile(payload.content, payload.fileName, payload.mime);
    setExported(true);
  };

  const onSort = (col: string) => {
    markInteracted();
    if (sortColumn === col) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    if (search.trim()) markInteracted();
  }, [search, markInteracted]);

  const showRating = interacted && exported;

  return (
    <div className={clsx("json-csv-explorer", className)}>
      <div className="json-csv-explorer__layout">
        <section className="json-csv-explorer__input-pane tool-workspace-panel security-tool__pane">
          <label className="security-tool__label" htmlFor="json-csv-explorer-input">
            {labels.inputLabel}
          </label>
          <textarea
            id="json-csv-explorer-input"
            className="security-tool__textarea json-csv-explorer__textarea"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={labels.inputPlaceholder}
            spellCheck={false}
            rows={16}
          />

          <div className="json-csv-explorer__format-row" role="group" aria-label="format">
            {(["auto", "json", "csv"] as const).map((mode) => (
              <label key={mode} className="json-csv-explorer__radio">
                <input
                  type="radio"
                  name="explorer-format"
                  checked={formatMode === mode}
                  onChange={() => setFormatMode(mode)}
                />
                <span>
                  {mode === "auto"
                    ? labels.formatAuto
                    : mode === "json"
                      ? labels.formatJson
                      : labels.formatCsv}
                </span>
              </label>
            ))}
          </div>

          <div className="json-csv-explorer__actions">
            <button type="button" className="security-tool__action-btn" onClick={handleParse}>
              {labels.parseButton}
            </button>
            <button type="button" className="security-tool__copy-btn" onClick={handleClear}>
              {labels.clearButton}
            </button>
          </div>
          <p className="security-tool__hint">{labels.privacyLabel}</p>
        </section>

        <section className="json-csv-explorer__explorer-pane tool-workspace-panel security-tool__pane">
          <div className="json-csv-explorer__explorer-head">
            <h2 className="security-tool__section-title">{labels.explorerTitle}</h2>
            {format === "json" ? (
              <p className="json-csv-explorer__hint">
                {pathCopied ? labels.pathCopied : labels.copyPathHint}
              </p>
            ) : null}
          </div>

          {!format ? (
            <p className="json-csv-explorer__empty">{labels.emptyHint}</p>
          ) : (
            <>
              <label className="security-tool__label" htmlFor="json-csv-explorer-search">
                {labels.searchLabel}
              </label>
              <input
                id="json-csv-explorer-search"
                className="json-csv-explorer__search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={labels.searchPlaceholder}
                spellCheck={false}
              />

              {columns.length > 0 ? (
                <div className="json-csv-explorer__columns">
                  <div className="json-csv-explorer__columns-head">
                    <h3 className="json-csv-explorer__columns-title">{labels.columnPickerTitle}</h3>
                    <div className="json-csv-explorer__columns-actions">
                      <button
                        type="button"
                        className="json-csv-explorer__link-btn"
                        onClick={() => {
                          markInteracted();
                          setSelectedColumns(columns);
                        }}
                      >
                        {labels.selectAll}
                      </button>
                      <button
                        type="button"
                        className="json-csv-explorer__link-btn"
                        onClick={() => {
                          markInteracted();
                          setSelectedColumns([]);
                        }}
                      >
                        {labels.selectNone}
                      </button>
                    </div>
                  </div>
                  <ul className="json-csv-explorer__column-list">
                    {columns.map((col) => (
                      <li key={col}>
                        <label className="json-csv-explorer__checkbox">
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(col)}
                            onChange={() => toggleColumn(col)}
                          />
                          <span>{col}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {format === "json" ? (
                <div className="json-csv-explorer__tree-shell">
                  <List<TreeRowProps>
                    className="json-csv-explorer__virtual"
                    rowComponent={TreeRow}
                    rowCount={treeNodes.length}
                    rowHeight={30}
                    rowProps={treeRowProps}
                    style={{ height: 360 } as CSSProperties}
                    overscanCount={8}
                  />
                </div>
              ) : (
                <div className="json-csv-explorer__csv-shell">
                  <div className="json-csv-explorer__csv-header">
                    <span className="json-csv-explorer__csv-index">#</span>
                    {(selectedColumns.length ? selectedColumns : columns).map((col) => (
                      <button
                        key={col}
                        type="button"
                        className="json-csv-explorer__csv-header-btn"
                        onClick={() => onSort(col)}
                      >
                        {col}
                        {sortColumn === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                      </button>
                    ))}
                  </div>
                  <List<CsvRowProps>
                    className="json-csv-explorer__virtual"
                    rowComponent={CsvVirtualRow}
                    rowCount={visibleCsvRows.length}
                    rowHeight={32}
                    rowProps={csvRowProps}
                    style={{ height: 320 } as CSSProperties}
                    overscanCount={10}
                  />
                  <p className="json-csv-explorer__rows-meta">
                    {labels.rowsLabel.replace("{count}", String(visibleCsvRows.length))}
                  </p>
                </div>
              )}

              <button
                type="button"
                className="security-tool__action-btn"
                onClick={handleExport}
                disabled={!format || (columns.length > 0 && selectedColumns.length === 0)}
              >
                {labels.exportButton}
              </button>
            </>
          )}
        </section>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {showRating ? (
        <ToolSuccessEngagement
          pageTitle={labels.pageTitle}
          className="json-csv-explorer__engagement"
        />
      ) : null}
    </div>
  );
}
