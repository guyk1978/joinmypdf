(function () {
  "use strict";

  var MIN_CHARS = 2;
  var LIMIT = 8;
  var indexCache = null;
  var indexPromise = null;

  function mergeBlogPosts(main, editorial) {
    var bySlug = Object.create(null);
    function add(source) {
      var list = source && source.blog ? source.blog : [];
      list.forEach(function (post) {
        if (post && post.slug) bySlug[post.slug] = post;
      });
    }
    add(main);
    add(editorial);
    return Object.keys(bySlug).map(function (slug) {
      return bySlug[slug];
    });
  }

  function buildIndex(toolsJson, studioJson, blogPosts) {
    var studio = (studioJson.tools || []).map(function (tool) {
      return {
        type: "tool",
        title: tool.title || "",
        description: tool.description || "",
        href: tool.href || "/tools/" + tool.slug + "/",
      };
    });
    var tools = (toolsJson.tools || []).map(function (tool) {
      return {
        type: "tool",
        title: tool.title || "",
        description: tool.description || tool.intent || "",
        href: "/tools/" + tool.slug + "/",
      };
    });
    var guides = blogPosts.map(function (post) {
      var desc = post.description || "";
      if (!desc && post.seo && post.seo.metaDescription) desc = post.seo.metaDescription;
      if (!desc && post.intent) desc = post.intent;
      return {
        type: "guide",
        title: post.title || "",
        description: desc,
        href: "/blog/" + post.slug + "/",
      };
    });
    return studio.concat(tools).concat(guides);
  }

  function loadIndex() {
    if (indexCache) return Promise.resolve(indexCache);
    if (indexPromise) return indexPromise;
    indexPromise = Promise.all([
      fetch("/assets/data/tools.json", { credentials: "same-origin" }).then(function (r) {
        return r.ok ? r.json() : { tools: [] };
      }),
      fetch("/assets/data/studio-tools.json", { credentials: "same-origin" }).then(function (r) {
        return r.ok ? r.json() : { tools: [] };
      }),
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
    ]).then(function (parts) {
      var blogPosts = mergeBlogPosts(parts[2], parts[3]);
      indexCache = buildIndex(parts[0], parts[1], blogPosts);
      return indexCache;
    });
    return indexPromise;
  }

  function filterIndex(index, query) {
    var q = String(query || "")
      .trim()
      .toLowerCase();
    if (q.length < MIN_CHARS) return { tools: [], guides: [] };
    function matches(entry) {
      return (entry.title + " " + entry.description).toLowerCase().indexOf(q) !== -1;
    }
    var tools = [];
    var guides = [];
    index.forEach(function (entry) {
      if (!matches(entry)) return;
      if (entry.type === "tool" && tools.length < LIMIT) tools.push(entry);
      if (entry.type === "guide" && guides.length < LIMIT) guides.push(entry);
    });
    return { tools: tools, guides: guides };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderResults(dropdown, results, query) {
    if (query.trim().length < MIN_CHARS) {
      dropdown.hidden = true;
      dropdown.innerHTML = "";
      return;
    }

    dropdown.hidden = false;
    dropdown.classList.add("site-search__dropdown--open");

    if (!results.tools.length && !results.guides.length) {
      dropdown.innerHTML = '<p class="site-search__empty">No tools found</p>';
      return;
    }

    var html = "";
    if (results.tools.length) {
      html +=
        '<div class="site-search__group"><p class="site-search__group-title">Tools</p><ul class="site-search__list">';
      results.tools.forEach(function (item) {
        html +=
          '<li><a class="site-search__result" role="option" href="' +
          escapeHtml(item.href) +
          '"><span class="site-search__result-title">' +
          escapeHtml(item.title) +
          "</span>";
        if (item.description) {
          html +=
            '<span class="site-search__result-desc">' + escapeHtml(item.description) + "</span>";
        }
        html += "</a></li>";
      });
      html += "</ul></div>";
    }
    if (results.guides.length) {
      html +=
        '<div class="site-search__group"><p class="site-search__group-title">Guides &amp; Articles</p><ul class="site-search__list">';
      results.guides.forEach(function (item) {
        html +=
          '<li><a class="site-search__result" role="option" href="' +
          escapeHtml(item.href) +
          '"><span class="site-search__result-title">' +
          escapeHtml(item.title) +
          "</span>";
        if (item.description) {
          html +=
            '<span class="site-search__result-desc">' + escapeHtml(item.description) + "</span>";
        }
        html += "</a></li>";
      });
      html += "</ul></div>";
    }
    dropdown.innerHTML = html;
  }

  function bindInstance(root, index) {
    if (root.getAttribute("data-react-search") === "true") return;
    var variant = root.getAttribute("data-variant") || "hero";
    var input = root.querySelector(".site-search__input");
    var dropdown = root.querySelector(".site-search__dropdown");
    var toggle = root.querySelector(".site-search__toggle");
    var popover = root.querySelector(".site-search__popover");
    if (!input || !dropdown) return;

    var headerOpen = false;

    function setExpanded(open) {
      input.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function clearResults() {
      dropdown.hidden = true;
      dropdown.classList.remove("site-search__dropdown--open");
      dropdown.innerHTML = "";
      setExpanded(false);
    }

    function closeHeader() {
      headerOpen = false;
      if (popover) {
        popover.classList.remove("site-search__popover--open");
        popover.setAttribute("hidden", "");
      }
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    function closeAll() {
      clearResults();
      if (variant === "header") closeHeader();
    }

    function openHeader() {
      if (!popover) return;
      headerOpen = true;
      popover.removeAttribute("hidden");
      popover.classList.add("site-search__popover--open");
      if (toggle) toggle.setAttribute("aria-expanded", "true");
    }

    function onQueryChange() {
      var q = input.value;
      if (variant === "header" && !headerOpen) openHeader();
      var results = filterIndex(index, q);
      if (q.trim().length >= MIN_CHARS) {
        renderResults(dropdown, results, q);
        setExpanded(true);
      } else {
        clearResults();
      }
    }

    input.addEventListener("input", onQueryChange);
    input.addEventListener("focus", function () {
      if (variant === "header") openHeader();
      if (input.value.trim().length >= MIN_CHARS) onQueryChange();
    });

    if (toggle && popover) {
      toggle.addEventListener("click", function () {
        if (headerOpen) {
          closeAll();
          input.value = "";
        } else {
          openHeader();
          input.focus();
        }
      });
    }

    function onDocumentPointerDown(event) {
      if (root.contains(event.target)) return;
      closeAll();
    }

    document.addEventListener("mousedown", onDocumentPointerDown);
    root._siteSearchDestroy = function () {
      document.removeEventListener("mousedown", onDocumentPointerDown);
    };

    root._siteSearchClose = closeAll;
    root._siteSearchFocus = function () {
      if (variant === "header") openHeader();
      input.focus();
    };
  }

  function initAll(index) {
    document.querySelectorAll("[data-site-search]").forEach(function (root) {
      bindInstance(root, index);
    });
  }

  function initGlobalKeys() {
    document.addEventListener("keydown", function (event) {
      var target = event.target;
      var tag = target && target.tagName ? target.tagName.toLowerCase() : "";
      if (event.key === "Escape") {
        document.querySelectorAll("[data-site-search]").forEach(function (root) {
          if (root._siteSearchClose) root._siteSearchClose();
        });
        return;
      }
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) return;
      event.preventDefault();
      var hero = document.querySelector('[data-site-search][data-variant="hero"]');
      var header = document.querySelector('[data-site-search][data-variant="header"]');
      var preferred = hero || header;
      if (preferred && preferred._siteSearchFocus) preferred._siteSearchFocus();
    });
  }

  function boot() {
    loadIndex()
      .then(function (index) {
        initAll(index);
        initGlobalKeys();
      })
      .catch(function () {
        /* search unavailable offline */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
