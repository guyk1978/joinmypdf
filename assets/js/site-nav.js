(function () {
  "use strict";

  var nav = document.querySelector(".main-nav");
  var menuBtn = document.querySelector(".site-header__menu-btn");
  if (!nav || !menuBtn) return;

  var OPEN_DELAY = 100;
  var CLOSE_DELAY = 320;
  var dropdowns = Array.prototype.slice.call(nav.querySelectorAll("[data-nav-dropdown]"));
  var mqDesktop = window.matchMedia("(min-width: 901px)");
  var closeTimers = new Map();
  var openTimers = new Map();

  function clearTimer(map, dd) {
    var id = map.get(dd);
    if (id != null) {
      clearTimeout(id);
      map.delete(dd);
    }
  }

  function setDropdownOpen(dd, open) {
    if (!dd) return;
    dd.classList.toggle("is-open", open);
    var trigger = dd.querySelector(".nav-dropdown__trigger");
    if (trigger) trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeDropdowns(except) {
    dropdowns.forEach(function (dd) {
      if (except && dd === except) return;
      clearTimer(closeTimers, dd);
      clearTimer(openTimers, dd);
      setDropdownOpen(dd, false);
    });
  }

  function closeMobile() {
    nav.classList.remove("is-mobile-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("site-nav-open");
    closeDropdowns();
  }

  function scheduleOpen(dd) {
    if (!mqDesktop.matches) return;
    clearTimer(closeTimers, dd);
    clearTimer(openTimers, dd);
    openTimers.set(
      dd,
      setTimeout(function () {
        openTimers.delete(dd);
        closeDropdowns(dd);
        setDropdownOpen(dd, true);
      }, OPEN_DELAY)
    );
  }

  function scheduleClose(dd) {
    if (!mqDesktop.matches) return;
    clearTimer(openTimers, dd);
    clearTimer(closeTimers, dd);
    closeTimers.set(
      dd,
      setTimeout(function () {
        closeTimers.delete(dd);
        setDropdownOpen(dd, false);
      }, CLOSE_DELAY)
    );
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
      scheduleOpen(dd);
    });

    dd.addEventListener("mouseleave", function () {
      if (!mqDesktop.matches) return;
      scheduleClose(dd);
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

  function mergeBlogPosts(main, editorial) {
    var bySlug = Object.create(null);
    function addPosts(source) {
      var list = source && source.blog ? source.blog : [];
      list.forEach(function (post) {
        if (post && post.slug) bySlug[post.slug] = post;
      });
    }
    addPosts(main);
    addPosts(editorial);
    return Object.keys(bySlug).map(function (slug) {
      return bySlug[slug];
    });
  }

  function sortPosts(posts) {
    return posts.slice().sort(function (a, b) {
      var da = a.datePublished || a.date || "";
      var db = b.datePublished || b.date || "";
      return db.localeCompare(da);
    });
  }

  function hydrateGuidesMenu() {
    var panel = document.getElementById("nav-guides-panel");
    if (!panel || !panel.getAttribute("data-nav-guides-hydrate")) return;

    Promise.all([
      fetch("/assets/data/blog.json", { credentials: "same-origin" }).then(function (r) {
        return r.ok ? r.json() : { blog: [] };
      }),
      fetch("/assets/data/blog-registry.json", { credentials: "same-origin" })
        .then(function (r) {
          return r.ok ? r.json() : { blog: [] };
        })
        .catch(function () {
          return { blog: [] };
        }),
    ])
      .then(function (results) {
        var posts = sortPosts(mergeBlogPosts(results[0], results[1]));
        var html =
          '<a class="nav-dropdown__item" href="/blog/" role="menuitem">All guides</a>';
        posts.forEach(function (post) {
          if (!post.slug || !post.title) return;
          var href = "/blog/" + post.slug + "/";
          var label = String(post.title)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
          html +=
            '<a class="nav-dropdown__item" href="' +
            href +
            '" role="menuitem">' +
            label +
            "</a>";
        });
        panel.innerHTML = html;

        var pathNow = window.location.pathname.replace(/\/+$/, "") || "/";
        panel.querySelectorAll("a[href]").forEach(function (link) {
          var href = link.getAttribute("href");
          if (!href) return;
          var normalized = href.replace(/\/+$/, "") || "/";
          if (
            pathNow === normalized ||
            (normalized !== "/" && pathNow.indexOf(normalized) === 0)
          ) {
            link.classList.add("is-active");
            var parent = link.closest("[data-nav-dropdown]");
            if (parent) parent.classList.add("is-active");
          }
        });
      })
      .catch(function () {
        /* keep static baked links */
      });
  }

  hydrateGuidesMenu();
})();
