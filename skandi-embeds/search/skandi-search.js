
"use strict";
(() => {
  const VERSION = "B-011.1";
  const SOURCE = "SKANDI_SEARCH_RESULTS";
  const PARENT = "SKANDI_WIX_PARENT";
  const PARENT_ORIGIN = (() => {
    try { return document.referrer ? new URL(document.referrer).origin : "*"; }
    catch (_) { return "*"; }
  })();

  const POPULAR = [
    "Flights",
    "Hotels",
    "Car Rental",
    "Flight Status",
    "Baggage",
    "Passport",
    "Support",
    "SKANDI Club"
  ];

  const START_GROUPS = [
    {
      title: "Book & travel",
      copy: "Find the main places to search, book and manage travel.",
      queries: ["Flights", "Hotels", "Packages", "Car Rental"]
    },
    {
      title: "Plan & prepare",
      copy: "Browse destinations and practical information before departure.",
      queries: ["Destinations", "Travel Information", "Flight Status", "Passport"]
    },
    {
      title: "Help & SKANDI",
      copy: "Find support, policies, membership and company information.",
      queries: ["Support", "Legal", "SKANDI Club", "About SKANDI"]
    }
  ];

  const GLYPHS = Object.freeze({
    "Book": "↗",
    "Discover": "◎",
    "Travel Info": "i",
    "Support": "?",
    "SKANDI": "S",
    "Club": "◆",
    "Store": "□",
    "Legal": "§",
    "Page": "•"
  });

  let currentQuery = "";
  let activeCategory = "All";
  let searchIndex = [];
  let indexReady = false;

  const $ = id => document.getElementById(id);

  const esc = value => String(value ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c])
  );

  const normalize = value => String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  function post(type, payload = {}) {
    window.parent.postMessage({
      source: SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    }, PARENT_ORIGIN);
  }

  function pathname(path) {
    const raw = String(path || "").trim();
    if (!raw) return "";
    try {
      if (/^https?:\/\//i.test(raw)) return new URL(raw).pathname.toLowerCase();
    } catch (_) {}
    return (raw.split("?")[0].split("#")[0] || "/").toLowerCase();
  }

  function allowed(item) {
    const path = pathname(item?.path);
    if (!path || !path.startsWith("/")) return false;
    if (path === "/riaintra" || path.startsWith("/riaintra/")) return false;
    if (path === "/my-profile" || path.startsWith("/my-profile/")) return false;
    return true;
  }

  function sanitizeIndex(items) {
    const byPath = new Map();

    (Array.isArray(items) ? items : []).forEach(raw => {
      if (!raw || typeof raw !== "object" || !allowed(raw)) return;

      const path = String(raw.path || "").trim().slice(0, 500);
      const key = path.toLowerCase();
      if (!key || byPath.has(key)) return;

      const title = String(raw.title || "").trim().slice(0, 160);
      if (!title) return;

      byPath.set(key, {
        title,
        path,
        category: String(raw.category || "Page").trim().slice(0, 80) || "Page",
        description: String(raw.description || "").trim().slice(0, 600),
        keywords: String(raw.keywords || "").trim().slice(0, 1600),
        priority: Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 0
      });
    });

    return [...byPath.values()];
  }

  function scoreItem(item, query) {
    const q = normalize(query);
    if (!q) return 0;

    const tokens = q.split(/\s+/).filter(Boolean);
    const title = normalize(item.title);
    const path = normalize(item.path);
    const description = normalize(item.description);
    const keywords = normalize(item.keywords);
    const category = normalize(item.category);
    const all = `${title} ${path} ${description} ${keywords} ${category}`;

    let score = 0;

    if (title === q) score += 180;
    if (title.startsWith(q)) score += 105;
    if (title.includes(q)) score += 78;
    if (keywords.includes(q)) score += 62;
    if (path.includes(q)) score += 48;
    if (description.includes(q)) score += 28;
    if (category.includes(q)) score += 18;

    let matched = 0;

    for (const token of tokens) {
      if (title.includes(token)) {
        score += 34;
        matched++;
      } else if (keywords.includes(token)) {
        score += 24;
        matched++;
      } else if (path.includes(token)) {
        score += 17;
        matched++;
      } else if (description.includes(token)) {
        score += 12;
        matched++;
      } else if (category.includes(token)) {
        score += 8;
        matched++;
      }
    }

    if (tokens.length > 1 && matched === tokens.length) score += 42;
    if (!all.includes(q) && matched === 0) return 0;

    score += Math.max(-20, Math.min(20, Number(item.priority || 0)));
    return score;
  }

  function allResults(query) {
    return searchIndex
      .map(item => ({ ...item, _score: scoreItem(item, query) }))
      .filter(item => item._score > 0)
      .sort((a, b) =>
        b._score - a._score ||
        String(a.title).localeCompare(String(b.title))
      )
      .slice(0, 40);
  }

  function highlight(text, query) {
    const safe = esc(text);
    const terms = normalize(query)
      .split(/\s+/)
      .filter(term => term.length > 1)
      .sort((a, b) => b.length - a.length);

    if (!terms.length) return safe;

    let out = safe;

    terms.forEach(term => {
      const pattern = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`(${pattern})`, "ig"), "<mark>$1</mark>");
    });

    return out;
  }

  function categoryCounts(results) {
    const counts = { All: results.length };
    results.forEach(item => {
      const category = item.category || "Page";
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }

  function visibleResults(results) {
    return activeCategory === "All"
      ? results
      : results.filter(item => item.category === activeCategory);
  }

  function displayPath(path) {
    const value = String(path || "");
    if (value === "/") return "skanditravels.com";
    return `skanditravels.com${value}`;
  }

  function resultCard(item, query, index) {
    const category = item.category || "Page";
    const glyph = GLYPHS[category] || GLYPHS.Page;

    return `
      <button
        class="result ${index === 0 && activeCategory === "All" ? "best" : ""}"
        type="button"
        data-path="${esc(item.path)}"
        aria-label="Open ${esc(item.title)}"
      >
        <span class="result-icon" aria-hidden="true">${esc(glyph)}</span>

        <span class="result-copy">
          <span class="result-topline">
            <span class="result-category">${esc(category)}</span>
            ${index === 0 && activeCategory === "All"
              ? `<span class="best-label">Best match</span>`
              : ""}
          </span>
          <span class="result-title">${highlight(item.title, query)}</span>
          ${item.description
            ? `<span class="result-description">${highlight(item.description, query)}</span>`
            : ""}
          <span class="result-path">${esc(displayPath(item.path))}</span>
        </span>

        <span class="result-arrow" aria-hidden="true">→</span>
      </button>`;
  }

  function renderStart() {
    const output = $("output");

    output.innerHTML = `
      <section class="start-panel" data-section-id="search-start">
        <div class="start-intro">
          <div class="eyebrow">START SEARCHING</div>
          <h2>What can we help you find?</h2>
          <p>
            Search the current public SKANDI page index. Private profile areas and
            internal staff systems are intentionally excluded.
          </p>

          <div class="popular-title">Popular searches</div>
          <div class="chips">
            ${POPULAR.map(query => `
              <button class="chip" type="button" data-query="${esc(query)}">
                ${esc(query)}
              </button>
            `).join("")}
          </div>

          <div class="public-note">
            The index is supplied by the Wix page controller from the canonical SKANDI route registry.
          </div>
        </div>

        <aside class="start-aside" aria-label="Browse search topics">
          ${START_GROUPS.map(group => `
            <section class="browse-card">
              <strong>${esc(group.title)}</strong>
              <span>${esc(group.copy)}</span>
              <div class="browse-links">
                ${group.queries.map(query => `
                  <button class="browse-link" type="button" data-query="${esc(query)}">
                    ${esc(query)}
                  </button>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </aside>
      </section>`;

    resize();
  }

  function renderEmpty(query) {
    $("output").innerHTML = `
      <section class="empty">
        <div class="eyebrow">NO MATCH FOUND</div>
        <h2>No results for “${esc(query)}”</h2>
        <p>
          Try a shorter phrase or search for a travel product, destination,
          travel-information topic, support area or SKANDI service.
        </p>
        <div class="chips">
          ${POPULAR.map(item => `
            <button class="chip" type="button" data-query="${esc(item)}">
              ${esc(item)}
            </button>
          `).join("")}
        </div>
      </section>`;

    resize();
  }

  function renderResults(query) {
    const results = allResults(query);

    if (!results.length) {
      renderEmpty(query);
      return;
    }

    const counts = categoryCounts(results);

    if (activeCategory !== "All" && !counts[activeCategory]) {
      activeCategory = "All";
    }

    const categories = Object.keys(counts)
      .sort((a, b) => {
        if (a === "All") return -1;
        if (b === "All") return 1;
        return a.localeCompare(b);
      });

    const visible = visibleResults(results);

    $("output").innerHTML = `
      <section class="results-layout" data-section-id="search-results">
        <aside class="filters" aria-label="Filter search results">
          <div class="filters-head">
            <strong>Filter results</strong>
            <span>Show matching pages by section.</span>
          </div>
          <div class="category-list">
            ${categories.map(category => `
              <button
                class="category-filter ${category === activeCategory ? "active" : ""}"
                type="button"
                data-category="${esc(category)}"
                aria-pressed="${category === activeCategory ? "true" : "false"}"
              >
                <span>${esc(category)}</span>
                <span class="category-count">${counts[category]}</span>
              </button>
            `).join("")}
          </div>
        </aside>

        <div class="results-column">
          <div class="results-meta">
            <div>
              <h2>Results for “${esc(query)}”</h2>
              <p>${activeCategory === "All"
                ? "Showing all matching public SKANDI pages."
                : `Filtered to ${esc(activeCategory)}.`}
              </p>
            </div>
            <span class="results-count">
              ${visible.length} result${visible.length === 1 ? "" : "s"}
            </span>
          </div>

          <div class="results">
            ${visible.map((item, index) => resultCard(item, query, index)).join("")}
          </div>
        </div>
      </section>`;

    resize();
  }

  function render(query) {
    currentQuery = String(query || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 100);

    $("searchInput").value = currentQuery;

    if (!indexReady) {
      $("output").innerHTML = `
        <div class="loading-state">
          <span class="spinner" aria-hidden="true"></span>
          <span>Preparing the SKANDI public search index…</span>
        </div>`;
      resize();
      return;
    }

    if (!currentQuery) {
      activeCategory = "All";
      renderStart();
      return;
    }

    renderResults(currentQuery);
  }

  function resize() {
    requestAnimationFrame(() => {
      const height = Math.max(
        620,
        Math.ceil(document.documentElement.scrollHeight + 12)
      );
      post("SEARCH_RESIZE", { height });
    });
  }

  $("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    const query = String($("searchInput").value || "").trim();
    activeCategory = "All";
    render(query);
    post("SEARCH_QUERY_UPDATE", { query });
  });

  document.addEventListener("click", event => {
    const result = event.target.closest("[data-path]");

    if (result) {
      const path = result.getAttribute("data-path") || "";
      if (allowed({ path })) {
        post("SEARCH_RESULT_NAVIGATE", { path });
      }
      return;
    }

    const queryButton = event.target.closest("[data-query]");

    if (queryButton) {
      const query = queryButton.getAttribute("data-query") || "";
      activeCategory = "All";
      render(query);
      post("SEARCH_QUERY_UPDATE", { query });
      return;
    }

    const categoryButton = event.target.closest("[data-category]");

    if (categoryButton) {
      activeCategory = categoryButton.getAttribute("data-category") || "All";
      renderResults(currentQuery);
    }
  });

  window.addEventListener("message", event => {
    if (event.source !== window.parent) return;

    let message = event.data;

    if (typeof message === "string") {
      try { message = JSON.parse(message); }
      catch (_) { return; }
    }

    if (!message || typeof message !== "object" || message.source !== PARENT) {
      return;
    }

    if (message.type === "SEARCH_PAGE_QUERY") {
      render(message.payload?.query || "");
      return;
    }

    if (message.type === "SEARCH_INDEX_UPDATE") {
      searchIndex = sanitizeIndex(message.payload?.items);
      indexReady = true;
      render(currentQuery || message.payload?.query || "");
      return;
    }
  });

  post("SEARCH_READY", { version: VERSION });
  resize();
})();
