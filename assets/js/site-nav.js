(function () {
  "use strict";

  var nav = document.querySelector(".main-nav");
  var menuBtn = document.querySelector(".site-header__menu-btn");
  if (!nav || !menuBtn) return;

  var dropdowns = Array.prototype.slice.call(nav.querySelectorAll("[data-nav-dropdown]"));
  var mqDesktop = window.matchMedia("(min-width: 901px)");

  function closeDropdowns() {
    dropdowns.forEach(function (dd) {
      dd.classList.remove("is-open");
      var trigger = dd.querySelector(".nav-dropdown__trigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  function closeMobile() {
    nav.classList.remove("is-mobile-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("site-nav-open");
    closeDropdowns();
  }

  function setDropdownOpen(dd, open) {
    if (!dd) return;
    dd.classList.toggle("is-open", open);
    var trigger = dd.querySelector(".nav-dropdown__trigger");
    if (trigger) trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  menuBtn.addEventListener("click", function () {
    var willOpen = !nav.classList.contains("is-mobile-open");
    nav.classList.toggle("is-mobile-open", willOpen);
    menuBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    menuBtn.setAttribute("aria-label", willOpen ? "Close menu" : "Open menu");
    document.body.classList.toggle("site-nav-open", willOpen);
    if (!willOpen) closeDropdowns();
  });

  dropdowns.forEach(function (dd) {
    var trigger = dd.querySelector(".nav-dropdown__trigger");
    if (!trigger) return;

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      var isOpen = dd.classList.contains("is-open");
      closeDropdowns();
      setDropdownOpen(dd, !isOpen);
    });

    dd.addEventListener("mouseenter", function () {
      if (!mqDesktop.matches) return;
      closeDropdowns();
      setDropdownOpen(dd, true);
    });

    dd.addEventListener("mouseleave", function () {
      if (!mqDesktop.matches) return;
      setDropdownOpen(dd, false);
    });
  });

  nav.addEventListener("click", function (event) {
    var link = event.target.closest("a.nav-dropdown__item, a.nav-link");
    if (link) closeMobile();
  });

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!nav.contains(target) && !menuBtn.contains(target)) {
      if (mqDesktop.matches) closeDropdowns();
      else closeMobile();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (mqDesktop.matches) closeDropdowns();
      else closeMobile();
    }
  });

  mqDesktop.addEventListener("change", function () {
    closeMobile();
    closeDropdowns();
  });

  var path = window.location.pathname.replace(/\/+$/, "") || "/";
  nav.querySelectorAll("a[href]").forEach(function (link) {
    var href = link.getAttribute("href");
    if (!href || href === "#") return;
    var normalized = href.replace(/\/+$/, "") || "/";
    if (path === normalized || (normalized !== "/" && path.indexOf(normalized) === 0)) {
      link.classList.add("is-active");
      var parent = link.closest("[data-nav-dropdown]");
      if (parent) parent.classList.add("is-active");
    }
  });
})();
