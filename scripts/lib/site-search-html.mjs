/** Static HTML for client-side site search (header + hero variants). */

export function buildSiteSearchFieldHtml(variant) {
  const isHero = variant === "hero";
  const rootClass = `site-search site-search--${variant}`;
  const idSuffix = variant;

  if (isHero) {
    return `<div class="${rootClass}" data-site-search data-variant="hero">
          <div class="site-search__wrap">
            <label class="site-search__label" for="site-search-input-${idSuffix}">Search tools and guides</label>
            <div class="site-search__field">
              <span class="site-search__icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20L16.5 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </span>
              <input id="site-search-input-${idSuffix}" class="site-search__input" type="search" enterkeyhint="search" placeholder="Search tools and guides…" autocomplete="off" spellcheck="false" aria-autocomplete="list" aria-controls="site-search-results-${idSuffix}" aria-expanded="false" />
              <kbd class="site-search__kbd" aria-hidden="true">/</kbd>
            </div>
            <div id="site-search-results-${idSuffix}" class="site-search__dropdown" role="listbox" hidden></div>
          </div>
        </div>`;
  }

  return `<div class="${rootClass}" data-site-search data-variant="header">
          <button type="button" class="site-search__toggle" aria-label="Open search" aria-expanded="false" aria-controls="site-search-popover-${idSuffix}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20L16.5 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <div id="site-search-popover-${idSuffix}" class="site-search__popover" hidden>
            <div class="site-search__wrap">
              <label class="site-search__label" for="site-search-input-${idSuffix}">Search tools and guides</label>
              <div class="site-search__field">
                <span class="site-search__icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20L16.5 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </span>
                <input id="site-search-input-${idSuffix}" class="site-search__input" type="search" enterkeyhint="search" placeholder="Search tools and guides…" autocomplete="off" spellcheck="false" aria-autocomplete="list" aria-controls="site-search-results-${idSuffix}" aria-expanded="false" />
                <kbd class="site-search__kbd" aria-hidden="true">/</kbd>
              </div>
              <div id="site-search-results-${idSuffix}" class="site-search__dropdown" role="listbox" hidden></div>
            </div>
          </div>
        </div>`;
}

export function buildHeaderSearchHtml() {
  return buildSiteSearchFieldHtml("header");
}

export function buildHeroSearchHtml() {
  return buildSiteSearchFieldHtml("hero");
}
