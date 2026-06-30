"use client";

import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { Link, usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { isDropdownActive, isNavItemActive, type NavDropdown } from "@/lib/nav-config";

const OPEN_DELAY = 100;
const CLOSE_DELAY = 320;

type HeaderNavDropdownProps = {
  dropdown: NavDropdown;
  onNavigate?: () => void;
};

const SCROLL_ITEM_THRESHOLD = 10;

export function HeaderNavDropdown({ dropdown, onNavigate }: HeaderNavDropdownProps) {
  const pathname = usePathname() || "/";
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const active = isDropdownActive(pathname, dropdown);

  const clearTimer = (timerRef: { current: ReturnType<typeof setTimeout> | null }) => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const setDropdownOpen = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  const scheduleOpen = useCallback(() => {
    clearTimer(closeTimerRef);
    clearTimer(openTimerRef);
    openTimerRef.current = setTimeout(() => setDropdownOpen(true), OPEN_DELAY);
  }, [setDropdownOpen]);

  const scheduleClose = useCallback(() => {
    clearTimer(openTimerRef);
    clearTimer(closeTimerRef);
    closeTimerRef.current = setTimeout(() => setDropdownOpen(false), CLOSE_DELAY);
  }, [setDropdownOpen]);

  useEffect(() => {
    return () => {
      clearTimer(closeTimerRef);
      clearTimer(openTimerRef);
    };
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname, setDropdownOpen]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setDropdownOpen]);

  return (
    <div
      ref={rootRef}
      className={clsx("nav-dropdown", active && "is-active", open && "is-open")}
      data-nav-dropdown
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="nav-dropdown__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={() => setDropdownOpen(!open)}
      >
        {dropdown.label}
        <ChevronDown className="nav-dropdown__chevron h-4 w-4 shrink-0" aria-hidden />
      </button>

      <div
        id={panelId}
        className={clsx(
          "nav-dropdown__panel",
          dropdown.items.length > SCROLL_ITEM_THRESHOLD && "nav-dropdown__panel--scroll",
        )}
        role="menu"
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
      >
        {dropdown.items.map((item) => {
          const itemActive = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={clsx("nav-dropdown__item", itemActive && "is-active")}
              prefetch={false}
              onClick={() => {
                onNavigate?.();
                setDropdownOpen(false);
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
