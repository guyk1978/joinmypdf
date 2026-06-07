"use client";

import { DELETE_PAGES_THUMB_SCALE, renderPdfPageThumbnail } from "@/lib/pdf-delete-pages";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Grid } from "react-window";

const GRID_COLS = 4;
const CELL_WIDTH = 152;
const CELL_HEIGHT = 196;
const VIRTUALIZE_THRESHOLD = 48;
const GRID_HEIGHT = 520;

type SortableThumbProps = {
  id: string;
  originalPageIndex: number;
  displayIndex: number;
  fileBytes: Uint8Array;
  password: string;
  loadingLabel: string;
  pageLabel: string;
  moveUpLabel: string;
  moveDownLabel: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  selected?: boolean;
  style?: CSSProperties;
};

function LazyThumbCanvas({
  fileBytes,
  pageIndex,
  password,
  loadingLabel,
}: {
  fileBytes: Uint8Array;
  pageIndex: number;
  password: string;
  loadingLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    void renderPdfPageThumbnail(fileBytes, pageIndex, password, DELETE_PAGES_THUMB_SCALE).then(
      (canvas) => {
        if (cancelled || !canvasRef.current) return;
        const node = canvasRef.current;
        node.width = canvas.width;
        node.height = canvas.height;
        const ctx = node.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, 0);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [visible, fileBytes, pageIndex, password]);

  return (
    <div ref={wrapRef} className="page-manage-thumb__canvas-wrap">
      {loading ? <p className="page-manage-thumb__loading">{loadingLabel}</p> : null}
      <canvas ref={canvasRef} className="page-manage-thumb__canvas" />
    </div>
  );
}

function SortablePageThumb({
  id,
  originalPageIndex,
  displayIndex,
  fileBytes,
  password,
  loadingLabel,
  pageLabel,
  moveUpLabel,
  moveDownLabel,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  selected,
  style,
}: SortableThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const cardStyle: CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className={clsx(
        "page-manage-thumb visual-reorder-card visual-reorder-card--page",
        isDragging && "is-dragging is-neon-drag",
        selected && "is-selected",
      )}
      role="listitem"
    >
      <span className="visual-reorder-card__index">#{displayIndex + 1}</span>
      <button
        type="button"
        className="page-manage-thumb__grip"
        aria-label={pageLabel}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <div className="page-manage-thumb__moves" aria-label={pageLabel}>
        <button
          type="button"
          className="page-manage-thumb__move-btn"
          disabled={!canMoveUp}
          aria-label={moveUpLabel}
          onClick={onMoveUp}
        >
          <ChevronUp className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className="page-manage-thumb__move-btn"
          disabled={!canMoveDown}
          aria-label={moveDownLabel}
          onClick={onMoveDown}
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <LazyThumbCanvas
        fileBytes={fileBytes}
        pageIndex={originalPageIndex}
        password={password}
        loadingLabel={loadingLabel}
      />
      <p className="visual-reorder-card__name">{pageLabel}</p>
    </div>
  );
}

function DragOverlayThumb({
  originalPageIndex,
  displayIndex,
  pageLabel,
}: {
  originalPageIndex: number;
  displayIndex: number;
  pageLabel: string;
}) {
  return (
    <div className="page-manage-thumb visual-reorder-card visual-reorder-card--page is-dragging is-neon-drag shadow-lg">
      <span className="visual-reorder-card__index">#{displayIndex + 1}</span>
      <p className="visual-reorder-card__name">{pageLabel}</p>
      <p className="visual-reorder-card__meta">Page {originalPageIndex + 1}</p>
    </div>
  );
}

export type PageManageSortableGridProps = {
  fileBytes: Uint8Array;
  password?: string;
  pageOrder: number[];
  onPageOrderChange: (next: number[]) => void;
  loadingLabel: string;
  pageLabel: (page: number) => string;
  moveUpLabel: string;
  moveDownLabel: string;
  hint: string;
  selectedPages?: Set<number>;
};

type VirtualGridCellProps = {
  pageOrder: number[];
  fileBytes: Uint8Array;
  password: string;
  loadingLabel: string;
  pageLabel: (page: number) => string;
  moveUpLabel: string;
  moveDownLabel: string;
  onMoveItem: (from: number, to: number) => void;
  selectedPages?: Set<number>;
};

function VirtualGridCell({
  columnIndex,
  rowIndex,
  style,
  pageOrder,
  fileBytes,
  password,
  loadingLabel,
  pageLabel,
  moveUpLabel,
  moveDownLabel,
  onMoveItem,
  selectedPages,
}: {
  ariaAttributes: { "aria-colindex": number; role: "gridcell" };
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
} & VirtualGridCellProps) {
  const displayIndex = rowIndex * GRID_COLS + columnIndex;
  if (displayIndex >= pageOrder.length) return null;

  const originalIndex = pageOrder[displayIndex];
  const id = `page-${originalIndex}`;

  return (
    <div style={{ ...style, padding: "0.35rem" }}>
      <SortablePageThumb
        id={id}
        style={{ height: "100%" }}
        originalPageIndex={originalIndex}
        displayIndex={displayIndex}
        fileBytes={fileBytes}
        password={password}
        loadingLabel={loadingLabel}
        pageLabel={pageLabel(originalIndex + 1)}
        moveUpLabel={moveUpLabel}
        moveDownLabel={moveDownLabel}
        onMoveUp={() => onMoveItem(displayIndex, displayIndex - 1)}
        onMoveDown={() => onMoveItem(displayIndex, displayIndex + 1)}
        canMoveUp={displayIndex > 0}
        canMoveDown={displayIndex < pageOrder.length - 1}
        selected={selectedPages?.has(originalIndex)}
      />
    </div>
  );
}

export function PageManageSortableGrid({
  fileBytes,
  password = "",
  pageOrder,
  onPageOrderChange,
  loadingLabel,
  pageLabel,
  moveUpLabel,
  moveDownLabel,
  hint,
  selectedPages,
}: PageManageSortableGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortableIds = useMemo(
    () => pageOrder.map((originalIndex) => `page-${originalIndex}`),
    [pageOrder],
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= pageOrder.length || to >= pageOrder.length) {
        return;
      }
      onPageOrderChange(arrayMove(pageOrder, from, to));
    },
    [onPageOrderChange, pageOrder],
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = sortableIds.indexOf(String(active.id));
    const to = sortableIds.indexOf(String(over.id));
    if (from >= 0 && to >= 0) moveItem(from, to);
  };

  const activeDisplayIndex = activeId ? sortableIds.indexOf(activeId) : -1;
  const activeOriginal =
    activeDisplayIndex >= 0 ? pageOrder[activeDisplayIndex] : undefined;

  const renderThumb = (displayIndex: number, style?: CSSProperties) => {
    const originalIndex = pageOrder[displayIndex];
    const id = `page-${originalIndex}`;
    return (
      <SortablePageThumb
        key={id}
        id={id}
        style={style}
        originalPageIndex={originalIndex}
        displayIndex={displayIndex}
        fileBytes={fileBytes}
        password={password}
        loadingLabel={loadingLabel}
        pageLabel={pageLabel(originalIndex + 1)}
        moveUpLabel={moveUpLabel}
        moveDownLabel={moveDownLabel}
        onMoveUp={() => moveItem(displayIndex, displayIndex - 1)}
        onMoveDown={() => moveItem(displayIndex, displayIndex + 1)}
        canMoveUp={displayIndex > 0}
        canMoveDown={displayIndex < pageOrder.length - 1}
        selected={selectedPages?.has(originalIndex)}
      />
    );
  };

  const useVirtual = pageOrder.length > VIRTUALIZE_THRESHOLD;
  const rowCount = Math.ceil(pageOrder.length / GRID_COLS);
  const gridWidth = GRID_COLS * CELL_WIDTH;

  const virtualCellProps = useMemo<VirtualGridCellProps>(
    () => ({
      pageOrder,
      fileBytes,
      password,
      loadingLabel,
      pageLabel,
      moveUpLabel,
      moveDownLabel,
      onMoveItem: moveItem,
      selectedPages,
    }),
    [
      pageOrder,
      fileBytes,
      password,
      loadingLabel,
      pageLabel,
      moveUpLabel,
      moveDownLabel,
      moveItem,
      selectedPages,
    ],
  );

  return (
    <div className="visual-reorder-panel">
      <p className="visual-reorder-panel__hint">{hint}</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          {useVirtual ? (
            <div className="page-manage-virtual-wrap">
              <Grid
                cellComponent={VirtualGridCell}
                cellProps={virtualCellProps}
                columnCount={GRID_COLS}
                columnWidth={CELL_WIDTH}
                rowCount={rowCount}
                rowHeight={CELL_HEIGHT}
                defaultHeight={GRID_HEIGHT}
                defaultWidth={gridWidth}
                overscanCount={2}
                style={{ height: GRID_HEIGHT, width: gridWidth }}
              />
            </div>
          ) : (
            <div className="delete-pages-grid visual-reorder-grid page-manage-grid" role="list">
              {pageOrder.map((_, displayIndex) => renderThumb(displayIndex))}
            </div>
          )}
        </SortableContext>
        <DragOverlay adjustScale={false}>
          {activeId && activeOriginal !== undefined && activeDisplayIndex >= 0 ? (
            <DragOverlayThumb
              originalPageIndex={activeOriginal}
              displayIndex={activeDisplayIndex}
              pageLabel={pageLabel(activeOriginal + 1)}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
