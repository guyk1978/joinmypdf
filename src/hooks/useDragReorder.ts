"use client";

import { useCallback, useState, type DragEvent } from "react";

export function reorderIndices(length: number, from: number, to: number): number[] {
  if (from === to || from < 0 || to < 0 || from >= length || to >= length) {
    return Array.from({ length }, (_, i) => i);
  }
  const next = Array.from({ length }, (_, i) => i);
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function moveArrayItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function useDragReorder() {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const clearDrag = useCallback(() => {
    setDragFrom(null);
    setDragOver(null);
  }, []);

  const getCardProps = useCallback(
    (index: number, onDrop: (from: number, to: number) => void) => ({
      draggable: true,
      onDragStart: (e: DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
        setDragFrom(index);
      },
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(index);
      },
      onDragLeave: () => {
        setDragOver((prev) => (prev === index ? null : prev));
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData("text/plain"));
        if (!Number.isNaN(from)) onDrop(from, index);
        clearDrag();
      },
      onDragEnd: clearDrag,
    }),
    [clearDrag],
  );

  const cardClassName = useCallback(
    (index: number, base = "") => {
      const parts = [base];
      if (dragFrom === index) parts.push("is-dragging");
      if (dragOver === index && dragFrom !== index) parts.push("is-drag-over");
      return parts.filter(Boolean).join(" ");
    },
    [dragFrom, dragOver],
  );

  return { dragFrom, dragOver, getCardProps, cardClassName, clearDrag };
}
