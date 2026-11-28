/* Shared presentation for the Swedavia airport screens. */
const airportFids = (() => {
  const airports = Object.freeze({
    ARN: "ESSA", BMA: "ESSB", GOT: "ESGG", MMX: "ESMS", LLA: "ESPA",
    UME: "ESNU", OSD: "ESNZ", VBY: "ESSV", RNB: "ESDF", KRN: "ESNQ"
  });
  const columns = Object.freeze(["time", "place", "airline", "flight", "codeshare", "terminal", "remarks", "facility"]);
  const copy = {
    en: { dep: "Departures", arr: "Arrivals", time: "Time", to: "To", from: "From", airline: "Airline", flight: "Flight", remarks: "Remarks", belt: "Belt", unknown: "Status unavailable" },
    sv: { dep: "Avgångar", arr: "Ankomster", time: "Tid", to: "Till", from: "Från", airline: "Bolag", flight: "Flyg", remarks: "Info", belt: "Band", unknown: "Status saknas" },
    no: { dep: "Avganger", arr: "Ankomster", time: "Tid", to: "Til", from: "Fra", airline: "Selskap", flight: "Flyg", remarks: "Info", belt: "Bånd", unknown: "Status utilgjengelig" },
    da: { dep: "Afgange", arr: "Ankomster", time: "Tid", to: "Til", from: "Fra", airline: "Selskab", flight: "Fly", remarks: "Info", belt: "Bånd", unknown: "Status utilgængelig" },
    fi: { dep: "Lähtevät", arr: "Saapuvat", time: "Aika", to: "Kohde", from: "Lähtöpaikka", airline: "Lentoyhtiö", flight: "Lento", remarks: "Tiedot", belt: "Hihna", unknown: "Tilatieto puuttuu" }
  };
  const statusCopy = {
    en: { departed: "Departed", landed: "Landed", cancelled: "Cancelled", diverted: "Diverted" },
    sv: { departed: "Avgått", landed: "Landat", cancelled: "Inställt", diverted: "Omdirigerat" }
  };
  const lightFallbacks = new Set(["AS", "DL", "F9", "B6", "DY", "D8", "SK", "LX", "UA"]);
  const fallbackColors = { DY: "#d81939", D8: "#d81939", SK: "#1d4ed8" };
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  function carrier({ code, name, logo, fallbackLogo, color }) {
    const iataCode = String(code || "").toUpperCase();
    const src = logo || fallbackLogo;
    const light = Boolean(src && src === fallbackLogo && lightFallbacks.has(iataCode));
    const backup = src !== fallbackLogo ? fallbackLogo : "";
    const background = /^#[0-9a-f]{6}$/i.test(color || "") ? color : fallbackColors[iataCode] || "";
    return `<div class="fids-carrier" title="${escape(name)}"><span class="fids-tail fids-carrier-mark${src ? "" : " fallback"}${light ? " is-light-mark" : ""}"${background ? ` style="--fids-brand-color:${background}"` : ""}>
      ${src ? `<img src="${escape(src)}" alt="${escape(name)}" decoding="async"${backup ? ` data-fids-logo-backup="${escape(backup)}" data-fids-backup-light="${lightFallbacks.has(iataCode)}"` : ""}>` : ""}
      <span class="fids-logo-fallback"${src ? " hidden" : ""}>${escape(iataCode || "—")}</span>
    </span><span class="fids-carrier-name">${escape(name)}</span></div>`;
  }

  function bindCarrierImages(root) {
    root.querySelectorAll(".fids-carrier-mark img").forEach(image => {
      const failed = () => {
        const tile = image.parentElement;
        const backup = image.dataset.fidsLogoBackup;
        if (backup) {
          delete image.dataset.fidsLogoBackup;
          tile.classList.toggle("is-light-mark", image.dataset.fidsBackupLight === "true");
          image.src = backup;
          return;
        }
        image.remove();
        tile.classList.add("fallback");
        tile.querySelector(".fids-logo-fallback").hidden = false;
      };
      image.addEventListener("error", failed);
      if (image.complete && image.naturalWidth === 0) failed();
    });
  }

  function locale(value) {
    const code = String(value || "").trim().toLowerCase().split(/[-_]/)[0];
    if (code === "nb" || code === "nn") return "no";
    return Object.hasOwn(copy, code) ? code : "en";
  }

  function iata(value) {
    const code = String(value || "").trim().toUpperCase();
    return Object.hasOwn(airports, code) ? code : Object.keys(airports).find(key => airports[key] === code) || "";
  }

  function labels(language, arrivals) {
    const lang = locale(language);
    const chosen = copy[lang];
    const bilingual = key => lang === "en" ? chosen[key] : `${chosen[key]} / ${copy.en[key]}`;
    return {
      title: bilingual(arrivals ? "arr" : "dep"),
      time: bilingual("time"),
      place: bilingual(arrivals ? "from" : "to"),
      airline: chosen.airline,
      flight: chosen.flight,
      codeshare: "Codeshare",
      terminal: "Terminal",
      remarks: bilingual("remarks"),
      facility: arrivals ? bilingual("belt") : "Gate"
    };
  }

  function officialStatus(item, arrivals, language) {
    const lang = locale(language);
    const primary = lang === "sv" ? "sv" : "en";
    const alt = primary === "sv" ? "en" : "sv";
    const status = String(item.status || "").toLowerCase();
    const side = arrivals ? item.arrival : item.departure;
    const remarks = item.fidsRemarks || {};
    const labels = item.statusLabels || {};
    const abnormal = ["cancelled", "diverted", "suspended"].includes(status);
    const completed = !abnormal && (["landed", "departed"].includes(status) || side?.actual);
    let message = String(remarks[primary] || remarks[alt] || labels[primary] || labels[alt] ||
      statusCopy[primary][status] || copy[lang].unknown).trim();
    if (completed && side?.actualLocal && !message.includes(side.actualLocal)) message += ` · ${side.actualLocal}`;
    const tone = abnormal ? "flap-bad" : /delay|försen|final call|sista utrop/i.test(message) ? "flap-warn" : "flap-ok";
    return { message, tone };
  }

  return { columns, iata, labels, locale, officialStatus, carrier, bindCarrierImages };
})();
