"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { NAV_DROPDOWNS, NAV_LINKS, isDropdownActive, isNavItemActive } from "@/lib/nav-config";

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

export function SiteNav() {
  const pathname = usePathname() || "/";
  const navId = useId();
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const closeAll = useCallback(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, []);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  }, []);

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

  return (
    <>
      <button
        type="button"
        className="site-header__menu-btn"
        aria-expanded={mobileOpen}
        aria-controls={navId}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <span className="site-header__menu-icon" aria-hidden="true" />
      </button>

      <nav
        ref={navRef}
        id={navId}
        className={`main-nav${mobileOpen ? " is-mobile-open" : ""}`}
        aria-label="Primary"
      >
        {NAV_DROPDOWNS.map((dropdown) => {
          const isOpen = openDropdown === dropdown.id;
          const active = isDropdownActive(pathname, dropdown);
          return (
            <div
              key={dropdown.id}
              className={`nav-dropdown${isOpen ? " is-open" : ""}${active ? " is-active" : ""}`}
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
              <div className="nav-dropdown__panel" role="menu">
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
        })}

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
