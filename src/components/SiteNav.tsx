"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  NAV_DROPDOWNS,
  NAV_GUIDES_DROPDOWN,
  NAV_LINKS,
  type NavItem,
  isDropdownActive,
  isNavItemActive,
} from "@/lib/nav-config";

const OPEN_DELAY_MS = 100;
const CLOSE_DELAY_MS = 320;

function NavChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`nav-dropdown__chevron${open ? " nav-dropdown__chevron--open" : ""}`}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SiteNavProps = {
  guidesItems: NavItem[];
};

export function SiteNav({ guidesItems }: SiteNavProps) {
  const pathname = usePathname() || "/";
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mqDesktopRef = useRef(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 901px)") : null,
  );

  const closeAll = useCallback(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    openTimerRef.current = null;
    closeTimerRef.current = null;
  }, []);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  }, []);

  const scheduleOpen = useCallback((id: string) => {
    if (!mqDesktopRef.current?.matches) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      setOpenDropdown(id);
    }, OPEN_DELAY_MS);
  }, []);

  const scheduleClose = useCallback(() => {
    if (!mqDesktopRef.current?.matches) return;
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setOpenDropdown(null);
    }, CLOSE_DELAY_MS);
  }, []);

  const onDropdownMouseEnter = useCallback(
    (id: string) => scheduleOpen(id),
    [scheduleOpen],
  );

  const onDropdownMouseLeave = useCallback(() => scheduleClose(), [scheduleClose]);

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  useEffect(() => {
    if (!mobileOpen && openDropdown === null) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (navRef.current && target && !navRef.current.contains(target)) {
        closeAll();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen, openDropdown, closeAll]);

  useEffect(() => {
    document.body.classList.toggle("site-nav-open", mobileOpen);
    return () => document.body.classList.remove("site-nav-open");
  }, [mobileOpen]);

  const guidesDropdown = {
    ...NAV_GUIDES_DROPDOWN,
    items: guidesItems.length ? guidesItems : NAV_GUIDES_DROPDOWN.items,
  };

  const allDropdowns = [...NAV_DROPDOWNS, guidesDropdown];

  function renderDropdown(dropdown: (typeof NAV_DROPDOWNS)[number]) {
    const isOpen = openDropdown === dropdown.id;
    const active = isDropdownActive(pathname, dropdown);
    const isGuides = dropdown.id === "guides";
    return (
      <div
        key={dropdown.id}
        className={`nav-dropdown${isOpen ? " is-open" : ""}${active ? " is-active" : ""}${
          isGuides ? " nav-dropdown--guides" : ""
        }`}
        data-nav-dropdown={dropdown.id}
        onMouseEnter={() => onDropdownMouseEnter(dropdown.id)}
        onMouseLeave={onDropdownMouseLeave}
      >
        <button
          type="button"
          className="nav-dropdown__trigger"
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={() => toggleDropdown(dropdown.id)}
        >
          {dropdown.label}
          <NavChevron open={isOpen} />
        </button>
        <div
          className={`nav-dropdown__panel${isGuides ? " nav-dropdown__panel--guides" : ""}`}
          id={isGuides ? "nav-guides-panel" : undefined}
          role="menu"
        >
          {dropdown.items.map((item) =>
            item.comingSoon ? (
              <span
                key={item.label}
                className="nav-dropdown__item nav-dropdown__item--soon"
                role="menuitem"
                aria-disabled="true"
              >
                <span>{item.label}</span>
                <span className="nav-dropdown__badge">Coming soon</span>
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-dropdown__item${
                  isNavItemActive(pathname, item.href) ? " is-active" : ""
                }`}
                role="menuitem"
                prefetch={false}
                onClick={closeAll}
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="site-header__menu-btn"
        aria-expanded={mobileOpen}
        aria-controls="primary-nav"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <span className="site-header__menu-icon" aria-hidden="true" />
      </button>

      <nav
        ref={navRef}
        id="primary-nav"
        className={`main-nav${mobileOpen ? " is-mobile-open" : ""}`}
        aria-label="Primary"
      >
        {allDropdowns.map(renderDropdown)}

        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link${isNavItemActive(pathname, link.href) ? " is-active" : ""}`}
            prefetch={false}
            onClick={closeAll}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
