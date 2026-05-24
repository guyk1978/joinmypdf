"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export function SignPageSelect({
  pageCount,
  value,
  onChange,
}: {
  pageCount: number;
  value: number;
  onChange: (pageIndex: number) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (pageCount <= 0) return null;

  return (
    <div className="sign-page-select" ref={rootRef}>
      <span className="sign-page-select__label" id={`${listId}-label`}>
        Active page
      </span>
      <div className={`sign-page-dropdown${open ? " is-open" : ""}`}>
        <button
          type="button"
          className="sign-page-dropdown__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${listId}-label`}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span>Page {value + 1}</span>
          <svg className="sign-page-dropdown__chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open ? (
          <ul className="sign-page-dropdown__menu" role="listbox" aria-labelledby={`${listId}-label`}>
            {Array.from({ length: pageCount }, (_, i) => (
              <li key={i} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === i}
                  className={`sign-page-dropdown__option${value === i ? " is-selected" : ""}`}
                  onClick={() => {
                    onChange(i);
                    close();
                  }}
                >
                  Page {i + 1}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
