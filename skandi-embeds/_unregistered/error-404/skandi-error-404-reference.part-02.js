
    (function () {
      "use strict";

      const MASTER_PARENT_SOURCE = "SKANDI_WIX_PARENT";
      const MASTER_LOGO_FALLBACK = "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-NAVY-SIDE-WAVE.svg";
      const MASTER_HERO_FALLBACK = "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/branding/skandi_club/SKANDI_MARKETING_CUSTOMER-LIFESTYLE_GREECE_SANTORINI_PREMIUM-TRAVEL_01.png";

      function safeInternalPath(value, fallback) {
        const candidate = String(value || "").trim();
        if (!candidate) return fallback;
        try {
          const parsed = new URL(candidate, window.location.origin);
          if (parsed.origin !== window.location.origin || !/^https?:$/.test(parsed.protocol)) return fallback;
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch (_) {
          return fallback;
        }
      }

      function safeImageUrl(value, fallback) {
        const candidate = String(value || "").trim();
        if (!candidate) return fallback;
        try {
          const parsed = new URL(candidate, window.location.href);
          return /^https?:$/.test(parsed.protocol) ? parsed.href : fallback;
        } catch (_) {
          return fallback;
        }
      }

      function safeCssLength(value, fallback) {
        const candidate = String(value || "").trim();
        return /^(?:\d+(?:\.\d+)?)(?:px|rem|em|vw|vh|%)$/.test(candidate) ? candidate : fallback;
      }

      const homeUrl = safeInternalPath(window.SKANDI_404_HOME_URL, "/");
      const destinationsUrl = safeInternalPath(window.SKANDI_404_DESTINATIONS_URL, "/destinations");
      const supportUrl = safeInternalPath(window.SKANDI_404_SUPPORT_URL, "/about/support");
      const homeLink = document.getElementById("homeLink");
      const homeBrandLink = document.getElementById("homeBrandLink");
      const headerSupportLink = document.getElementById("headerSupportLink");
      const supportLink = document.getElementById("supportLink");
      const destinationsLink = document.getElementById("destinationsLink");
      const backButton = document.getElementById("backButton");
      const brandLogo = document.getElementById("brandLogo");
      const brandFallback = document.getElementById("brandFallback");
      const destinationPhoto = document.getElementById("destinationPhoto");

      [homeLink, homeBrandLink].forEach((link) => {
        if (link) link.href = homeUrl;
      });
      [headerSupportLink, supportLink].forEach((link) => {
        if (link) link.href = supportUrl;
      });
      if (destinationsLink) destinationsLink.href = destinationsUrl;

      function showLogo(url) {
        if (!brandLogo || !brandFallback) return;
        const safeUrl = safeImageUrl(url, "");
        if (!safeUrl) {
          brandLogo.classList.add("is-hidden");
          brandFallback.classList.add("is-visible");
          return;
        }
        brandLogo.onload = function () {
          brandLogo.classList.remove("is-hidden");
          brandFallback.classList.remove("is-visible");
        };
        brandLogo.onerror = function () {
          brandLogo.classList.add("is-hidden");
          brandFallback.classList.add("is-visible");
          brandLogo.removeAttribute("src");
        };
        brandLogo.src = safeUrl;
      }

      function showHero(url) {
        if (!destinationPhoto) return;
        const safeUrl = safeImageUrl(url, "");
        if (!safeUrl) {
          destinationPhoto.hidden = true;
          return;
        }
        destinationPhoto.onload = function () {
          destinationPhoto.hidden = false;
        };
        destinationPhoto.onerror = function () {
          destinationPhoto.hidden = true;
          destinationPhoto.removeAttribute("src");
        };
        destinationPhoto.src = safeUrl;
      }

      document.documentElement.style.setProperty("--sk-logo-width", safeCssLength(window.SKANDI_404_LOGO_WIDTH, "260px"));
      document.documentElement.style.setProperty("--sk-logo-height", safeCssLength(window.SKANDI_404_LOGO_HEIGHT, "72px"));
      document.documentElement.style.setProperty("--sk-logo-fit", window.SKANDI_404_LOGO_FIT === "cover" ? "cover" : "contain");

      const configuredLogo = String(window.SKANDI_404_LOGO_URL || "").trim();
      const configuredHero = String(window.SKANDI_404_HERO_IMAGE_URL || "").trim();
      showLogo(configuredLogo || MASTER_LOGO_FALLBACK);
      showHero(configuredHero || MASTER_HERO_FALLBACK);

      window.addEventListener("message", function (event) {
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!message || message.source !== MASTER_PARENT_SOURCE || message.type !== "SKANDI_MASTER_ASSETS") return;
        const assets = message.payload && typeof message.payload === "object" ? message.payload : {};
        const masterLogo = assets.logos && assets.logos.customerHeader;
        const masterHero = assets.images && assets.images.clubLoginHero;
        if (!configuredLogo && masterLogo) showLogo(masterLogo);
        if (!configuredHero && masterHero) showHero(masterHero);
      });

      if (window.parent !== window) {
        window.parent.postMessage({
          source: "SKANDI_ERROR_404",
          type: "MASTER_ASSETS_REQUEST",
          payload: {}
        }, "*");
      }

      if (backButton) {
        backButton.addEventListener("click", function () {
          if (window.history.length > 1) window.history.back();
          else window.location.assign(homeUrl);
        });
      }
    })();
  