
        (function() {
            const SOURCE = "SKANDI_FLIGHT_STATUS";
            const PARENT_SOURCE = "SKANDI_WIX_PARENT";
            let currentMode = "airport";
            let clockTimer = 0;
            let searchTimer = 0;
            let searchSerial = 0,
                pendingSearch = "",
                lastQuery = "",
                refreshTimer = 0;
            let contextTimer = 0;
            const SEARCH_TIMEOUT_MS = 25000;
            const CONTEXT_TIMEOUT_MS = 15000;
            let airportTimezone = "UTC";
            let activeAirportContext = null;
            let contextRequestSerial = 0;
            let pendingContext = null;
            let airportDirectory = [];
            let selectedAirportIata = "";
            let selectedFromIata = "";
            let selectedToIata = "";
            const suggestionIndex = {
                airport: -1,
                from: -1,
                to: -1
            };
            let activeSuggestionIndex = -1;
            let lastFlightItems = [];
            let lastFlightMeta = {};
            let codeshareTick = false;
            window.setInterval(() => {
                codeshareTick = !codeshareTick;
                if (lastFlightItems && lastFlightItems.length) {
                    refreshVisibleFidsRows();
                }
            }, 3500);

            const airportContextCache = new Map();
            const fidsValueCache = new Map();

            const el = (id) => document.getElementById(id);
            const escapeHtml = (value) => String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
            const fields = {
                airport: document.querySelector("#airport"),
                from: document.querySelector("#from"),
                to: document.querySelector("#to"),
                flightNumber: document.querySelector("#flightNumber")
            };

            function safeUrl(value) {
                try {
                    const url = new URL(String(value || "").trim());
                    return url.protocol === "https:" ? url.href : "";
                } catch (_) {
                    return ""
                }
            }

            function calculateCustomStatus(item, rulesMeta, isArrivals) {
  const statusStr = String(item.status || "").toLowerCase();
  
  // Hard rule overrides take priority
  if (statusStr === "cancelled") return { text: "CANCELLED", cls: "flap-bad" };
  if (statusStr === "diverted") return { text: "DIVERTED", cls: "flap-bad" };
  if (statusStr === "landed") return { text: "ARRIVED", cls: "flap-ok" };
  
  const side = isArrivals ? item.arrival : item.departure;
  if (!side) return { text: "ON TIME", cls: "flap-ok" };

  // If a delay integer exists and is greater than zero
  if (side.delay && Number(side.delay) > 0) {
    return { text: "DELAYED " + side.delay + "M", cls: "flap-warn" };
  }

  // If the telemetry stream reports active airborne tracking status
  if (statusStr === "en-route" || statusStr === "active") {
    return { text: isArrivals ? "EN ROUTE" : "DEPARTED", cls: "flap-ok" };
  }

  // Calculate live clock windows for scheduled upcoming operations
  if (!side.scheduled) return { text: "ON TIME", cls: "flap-ok" };
  
  const scheduledTime = new Date(side.scheduled);
  const currentTime = new Date(); // Browser system time tracking clock

  if (Number.isNaN(scheduledTime.getTime())) return { text: "ON TIME", cls: "flap-ok" };

  // Calculate absolute left window time duration metric in minutes
  const deltaMinutes = (scheduledTime - currentTime) / (1000 * 60);

  const activeCarrier = (item.cs_airline_iata && codeshareTick) ? item.cs_airline_iata : item.airlineIata;
  const rules = rulesMeta || {};
  const rule = rules[activeCarrier] || rules["DEFAULT"] || { boarding_window: 40, final_call_window: 15 };

  // If the flight is past takeoff but has no airborne signal yet, keep it as dynamic wayfinding status
  if (deltaMinutes <= 0) {
    return { text: isArrivals ? "EXPECTING" : "GATE CLOSED", cls: "flap-ok" };
  }
  if (deltaMinutes <= rule.final_call_window) {
    return { text: "FINAL CALL", cls: "flap-warn" };
  }
  if (deltaMinutes <= rule.boarding_window) {
    return { text: "BOARDING", cls: "flap-warn" };
  }

  return { text: "ON TIME", cls: "flap-ok" };
}


            function parseMaybeJson(value) {
                if (value == null || value === "") return null;
                if (typeof value === "object") return value;
                try {
                    return JSON.parse(String(value))
                } catch (_) {
                    return value
                }
            }

            function normalizeList(value) {
                if (value == null || value === "") return [];
                const parsed = parseMaybeJson(value);
                const list = Array.isArray(parsed) ? parsed : [parsed];
                return list.flatMap(entry => {
                    const next = parseMaybeJson(entry);
                    return Array.isArray(next) ? next : [next];
                }).filter(Boolean);
            }

            function objectFrom(value) {
                const parsed = parseMaybeJson(value);
                return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
            }

            function textValue(value, fallback = "") {
                if (value == null) return fallback;
                if (typeof value === "string" || typeof value === "number") return String(value);
                return fallback;
            }

            function validHex(value) {
                const v = String(value || "").trim();
                return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "";
            }

            function contextPathAction(kind, item) {
                const source = item && typeof item === "object" ? item : {};
                post("FLIGHT_STATUS_AIRPORT_ACTION", {
                    kind,
                    airportIata: activeAirportContext?.airport?.iata || resolveAirportIata(),
                    item: {
                        publicId: textValue(source.publicId),
                        entityType: textValue(source.entityType),
                        slug: textValue(source.slug),
                        destinationSlug: textValue(source.destinationSlug)
                    }
                });
            }

            function post(type, payload) {
                window.parent.postMessage({
                    source: SOURCE,
                    type,
                    payload: payload || {},
                    timestamp: new Date().toISOString()
                }, "*");
            }

            function isoDate(d) {
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                return local.toISOString().slice(0, 10);
            }

            function setDateLimits() {
                const todayLive = isoDate(new Date());

                // AirLabs /schedules owns the current live schedule window and does not
                // accept a date query parameter. Keep one current display date only.
                el("date").min = todayLive;
                el("date").max = todayLive;
                el("date").value = todayLive;
                el("date").disabled = true;

                el("dateHint").textContent = `Current schedule · ${todayLive} · Refreshes every 60 seconds`;
                if (el("dateWindow")) el("dateWindow").textContent = todayLive;
            }

            function setMode(mode = "airport") {
                currentMode = ["airport", "flight", "route"].includes(mode) ? mode : "airport";
                document.querySelectorAll("[data-lookup-mode]").forEach(button => {
                    const active = button.dataset.lookupMode === currentMode;
                    button.classList.toggle("active", active);
                    button.setAttribute("aria-selected", String(active));
                });
                document.querySelectorAll("[data-mode-field]").forEach(node => node.classList.toggle("hidden", node.dataset.modeField !== currentMode));
                const controls = el("searchBtn")?.closest(".airport-controls");
                if (controls) {
                    controls.classList.remove("mode-airport", "mode-flight", "mode-route");
                    controls.classList.add(`mode-${currentMode}`);
                }
                if (currentMode !== "airport") {
                    el("boardType").value = "departures";
                    closeAllAirportSuggestions();
                }
                const labels = {
                    airport: "Airport Board",
                    flight: "Flight Number",
                    route: "Route"
                };
                if (el("boardMode")) el("boardMode").textContent = labels[currentMode];
                if (el("queryLabel")) el("queryLabel").textContent = currentMode === "airport" ? "Airport board" : currentMode === "flight" ? "Flight lookup" : "Route lookup";
                if (el("screenPrimaryLabel")) el("screenPrimaryLabel").textContent = currentMode === "airport" ? "AIRPORT" : currentMode === "flight" ? "FLIGHT" : "ROUTE";
                if (el("resultScopeLabel")) el("resultScopeLabel").textContent = currentMode === "airport" ? "Airport view" : currentMode === "flight" ? "Flight view" : "Route view";
                const meta = currentMode === "airport" ?
                    "Select an airport to load departures or arrivals and unlock its airport guide." :
                    currentMode === "flight" ?
                    "Enter an airline flight number to check the latest returned status for the selected date." :
                    "Enter at least an origin or destination airport to review flights on that route.";
                el("boardMeta").textContent = meta;
                if (el("querySummary")) el("querySummary").textContent = currentMode === "airport" ? "Select an airport to load the board" : currentMode === "flight" ? "Enter a flight number" : "Enter a route";
                updateBoardType();
                setNotice("");
            }

            function cleanIata(value) {
                return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
            }

            function airportSearchText(value) {
                return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            }

            function selectedIataFor(fieldId) {
                if (fieldId === "airport") return selectedAirportIata;
                if (fieldId === "from") return selectedFromIata;
                if (fieldId === "to") return selectedToIata;
                return "";
            }

            function setSelectedIata(fieldId, value) {
                const code = cleanIata(value);
                if (fieldId === "airport") selectedAirportIata = code;
                if (fieldId === "from") selectedFromIata = code;
                if (fieldId === "to") selectedToIata = code;
                const input = el(fieldId);
                if (input) input.dataset.selectedIata = code;
            }

            function resolveAirportField(fieldId) {
                const selected = selectedIataFor(fieldId);
                if (selected) return selected;
                const input = el(fieldId);
                const raw = String(input?.value || "").trim();
                if (!raw) return "";
                const exact = cleanIata(raw);
                if (/^[A-Z0-9]{3,4}$/.test(exact) && raw.replace(/[^A-Za-z0-9]/g, "").length <= 4) return exact;
                const needle = airportSearchText(raw);
                const match = airportDirectory.find(item => {
                    const values = [item.iata, item.icao, item.title, item.city, item.country].map(airportSearchText);
                    return values.some(value => value === needle);
                });
                return cleanIata(match?.iata);
            }

            function airportLabel(item) {
                return [item?.city, item?.country].filter(Boolean).join(" · ");
            }

            function suggestionHost(fieldId) {
                return el(`${fieldId}Suggestions`)
            }

            function closeAirportSuggestions(fieldId = "airport") {
                const host = suggestionHost(fieldId);
                if (host) {
                    host.classList.remove("open");
                    host.innerHTML = "";
                }
                const input = el(fieldId);
                if (input) input.setAttribute("aria-expanded", "false");
                suggestionIndex[fieldId] = -1;
                if (fieldId === "airport") activeSuggestionIndex = -1;
            }

            function closeAllAirportSuggestions() {
                ["airport", "from", "to"].forEach(closeAirportSuggestions)
            }

            function selectAirport(item, {
                searchNow = false,
                fieldId = "airport"
            } = {}) {
                if (!item?.iata) return;
                const code = cleanIata(item.iata);
                setSelectedIata(fieldId, code);
                const input = el(fieldId);
                if (input) input.value = code;
                closeAirportSuggestions(fieldId);
                if (searchNow) search();
            }

            function airportMatches(query) {
                const needle = airportSearchText(query);
                if (!needle) return airportDirectory.slice(0, 8);
                return airportDirectory.filter(item => {
                    const hay = [item.iata, item.icao, item.title, item.city, item.country].map(airportSearchText).join(" ");
                    return hay.includes(needle);
                }).slice(0, 8);
            }

            function renderAirportSuggestions(query, fieldId = "airport") {
                const host = suggestionHost(fieldId);
                const input = el(fieldId);
                if (!host || !input || !airportDirectory.length) {
                    closeAirportSuggestions(fieldId);
                    return;
                }
                const matches = airportMatches(query);
                if (!matches.length) {
                    closeAirportSuggestions(fieldId);
                    return;
                }
                let index = suggestionIndex[fieldId];
                index = Math.min(Math.max(index, 0), matches.length - 1);
                suggestionIndex[fieldId] = index;
                if (fieldId === "airport") activeSuggestionIndex = index;
                host.innerHTML = matches.map((item, i) => `<button type="button" class="airport-suggestion ${i===index?"active":""}" role="option" aria-selected="${i===index}" data-airport-index="${i}"><span class="airport-suggestion-code">${escapeHtml(item.iata)}</span><span class="airport-suggestion-copy"><strong>${escapeHtml(item.title||item.iata)}</strong><small>${escapeHtml(airportLabel(item))}</small></span></button>`).join("");
                host.classList.add("open");
                input.setAttribute("aria-expanded", "true");
                host.querySelectorAll("[data-airport-index]").forEach(button => button.addEventListener("click", () => {
                    const item = matches[Number(button.dataset.airportIndex)];
                    selectAirport(item, {
                        searchNow: false,
                        fieldId
                    });
                }));
            }

            function values() {
                const base = {
                    mode: currentMode,
                    date: el("date").value,
                    clientToday: isoDate(new Date()),
                    boardType: el("boardType").value
                };
                if (currentMode === "airport") return {
                    ...base,
                    airport: resolveAirportField("airport")
                };
                if (currentMode === "flight") return {
                    ...base,
                    flightNumber: String(el("flightNumber")?.value || "").trim().toUpperCase().replace(/\s+/g, "")
                };
                return {
                    ...base,
                    from: resolveAirportField("from"),
                    to: resolveAirportField("to")
                };
            }

            function validate(v) {
                if (!v.date) return "Please select a travel date.";
                const selected = new Date(v.date + "T12:00:00");
                const min = new Date(el("date").min + "T00:00:00");
                const max = new Date(el("date").max + "T23:59:59");
                if (selected < min || selected > max) return "That date is outside the available search window.";
                if (v.mode === "airport" && !v.airport) return "Select an airport from the list or enter a valid IATA code.";
                if (v.mode === "flight" && !v.flightNumber) return "Enter a flight number, for example SK904.";
                if (v.mode === "route" && !v.from && !v.to) return "Enter at least a From or To airport.";
                return "";
            }

            function setNotice(message, isError) {
                const notice = el("notice");
                if (!message) {
                    notice.style.display = "none";
                    notice.textContent = "";
                    return;
                }
                notice.className = isError ? "notice error" : "notice ok";
                notice.textContent = message;
                notice.style.display = "block";
            }

            function setStatusLabels(syncText, resultText) {
                if (syncText != null) {
                    if (el("updatedAt")) el("updatedAt").textContent = syncText;
                    if (el("updatedAtHero")) el("updatedAtHero").textContent = syncText;
                }
                if (resultText != null) {
                    if (el("resultCount")) el("resultCount").textContent = resultText;
                    if (el("resultCountHero")) el("resultCountHero").textContent = resultText;
                }
            }

            function setBoardBusy(isBusy) {
                const button = el("searchBtn");
                if (!button) return;
                button.disabled = Boolean(isBusy);
                button.classList.toggle("is-busy", Boolean(isBusy));
                button.innerHTML = isBusy ?
                    '<span class="airport-update-led"></span> Updating…' :
                    '<span class="airport-update-led"></span> Show board';
            }

            function clearSearchTimeout() {
                if (searchTimer) {
                    window.clearTimeout(searchTimer);
                    searchTimer = 0;
                }
            }

            function clearContextTimeout() {
                if (contextTimer) {
                    window.clearTimeout(contextTimer);
                    contextTimer = 0;
                }
            }

            function clearRequestTimeouts() {
                pendingSearch = "";
                lastQuery = "";
                searchSerial++;
                clearSearchTimeout();
                clearContextTimeout();
            }

            function hasReadySearch() {
                const v = values();
                if (currentMode === "airport") return Boolean(v.airport);
                if (currentMode === "flight") return Boolean(v.flightNumber);
                return Boolean(v.from || v.to);
            }

            function armSearchTimeout() {
                clearSearchTimeout();
                searchTimer = window.setTimeout(() => {
                    searchTimer = 0;
                    pendingSearch = "";
                    setBoardBusy(false);
                    el("hardwareCasing")?.classList.remove("is-searching");
                    el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");
                    setBoardMessage("UPDATE TIMED OUT", "The flight feed did not answer in time. Please try again.", "flap-warn");
                    setStatusLabels("Update Timed Out", "Retry");
                    if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                    setNotice("The flight feed took too long to respond. Please try again.", true);
                }, SEARCH_TIMEOUT_MS);
            }

            function armContextTimeout(code, serial, key) {
                clearContextTimeout();
                contextTimer = window.setTimeout(() => {
                    contextTimer = 0;
                    if (!pendingContext || pendingContext.serial !== serial || pendingContext.key !== key) return;
                    pendingContext = null;
                    if (!activeAirportContext) setContextState("welcome");
                    document.body.classList.remove("has-airport-selection");
                    setNotice(`Airport guide for ${code} is taking longer than expected. The flight board can still be used.`, false);
                }, CONTEXT_TIMEOUT_MS);
            }

            function search() {
                clearSearchTimeout();
                setDateLimits();
                const v = values();
                const error = validate(v);
                if (error) {
                    setNotice(error, true);
                    return;
                }
                setNotice("");
                closeAllAirportSuggestions();
                if (v.mode === "airport") {
                    setSelectedIata("airport", v.airport);
                    /* Airport guide moved to Travel Info / Airport Information. */
                } else {
                    activeAirportContext = null;
                    pendingContext = null;
                    airportTimezone = "UTC";
                    document.body.classList.remove("has-airport-selection", "has-airport-context");
                    setContextState("welcome");
                }
                if (v.mode === "route") {
                    if (v.from) setSelectedIata("from", v.from);
                    if (v.to) setSelectedIata("to", v.to);
                }
                setBoardBusy(true);
                el("hardwareCasing")?.classList.add("is-searching");
                el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "true");
                setStatusLabels("Updating", "");
                el("querySummary").textContent = describeQuery(v);
                if (el("screenAirport")) {
                    el("screenAirport").textContent = v.mode === "airport" ? (v.airport || "---") : v.mode === "flight" ? (v.flightNumber || "---") : `${v.from||"ANY"}→${v.to||"ANY"}`;
                }
                if (el("screenDate")) el("screenDate").textContent = v.date || "---";
                if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                setBoardMessage("UPDATING FIDS", "Loading the latest available flight information", "flap-warn", true);
                armSearchTimeout();
                pendingSearch = String(++searchSerial);
                lastQuery = JSON.stringify(v);
                post("FLIGHT_STATUS_SEARCH", {
                    ...v,
                    requestId: pendingSearch
                });
            }

            function fmtDate(value) {
                if (!value) return "";
                const d = new Date(value);
                if (Number.isNaN(d.getTime())) return String(value).slice(0, 9);
                const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}`;
            }

            function fmtTime(value) {
                if (!value) return "";
                const raw = String(value).trim();
                if (/^\d{2}:\d{2}(?::\d{2})?$/.test(raw)) return raw.slice(0, 5);
                const localIso = raw.match(/T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?[+-]\d{2}:?\d{2}$/);
                if (localIso) return localIso[1];
                const d = new Date(raw);
                if (Number.isNaN(d.getTime())) return raw.slice(0, 5);
                try {
                    return new Intl.DateTimeFormat("en-GB", {
                        timeZone: "UTC",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                    }).format(d)
                } catch (_) {
                    return new Intl.DateTimeFormat("en-GB", {
                        timeZone: "UTC",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                    }).format(d)
                }
            }

            function statusColorClass(status) {
                const s = String(status || "").toLowerCase();
                if (s.includes("delay") || s.includes("incident") || s.includes("divert") || s.includes("estimated") || s.includes("board")) return "flap-warn";
                if (s.includes("cancel")) return "flap-bad";
                return "flap-ok";
            }

            const KNOWN_AIRLINE_LOGOS = Object.freeze({
                AS: "https://static.wixstatic.com/shapes/394052_6535b791dd404055903a12f5350d61c3.svg",
                AA: "https://static.wixstatic.com/shapes/394052_47809f4547c04f6eb7e098c5602ff57c.svg",
                PG: "https://static.wixstatic.com/shapes/394052_3627db92f99544d8bc42c98e684ce5d4.svg",
                BA: "https://static.wixstatic.com/shapes/394052_85c56f21c63c42d2b5fba0273ee3b0a6.svg",
                DL: "https://static.wixstatic.com/shapes/394052_4f692ba92b43482292d87d1c6b7df036.svg",
                AY: "https://static.wixstatic.com/shapes/394052_97cf9b3a9a884781b3186ededecd7b45.svg",
                F9: "https://static.wixstatic.com/shapes/394052_cca48f82a42043d79743561a784e92c8.svg",
                IB: "https://static.wixstatic.com/shapes/394052_3726a2f12dcd44ab8dea7085713902b9.svg",
                FI: "https://static.wixstatic.com/shapes/394052_e09b3c2f6dfd4ca3a87497e34f538c53.svg",
                B6: "https://static.wixstatic.com/shapes/394052_d0e052d862be40cba0231eae50b4b5dd.svg",
                KL: "https://static.wixstatic.com/shapes/394052_0c2eaf7331a147648b444fdb12329073.svg",
                LH: "https://static.wixstatic.com/shapes/394052_76a1dce4673a429d86b4d816faf88b6d.svg",
                N0: "https://static.wixstatic.com/shapes/394052_2c0b19b3399a4938a36e4dd7d8820c91.svg",
                Z0: "https://static.wixstatic.com/shapes/394052_2c0b19b3399a4938a36e4dd7d8820c91.svg",
                DY: "https://static.wixstatic.com/shapes/394052_05f76b5094374d11951f14a93fa1ea88.svg",
                D8: "https://static.wixstatic.com/shapes/394052_05f76b5094374d11951f14a93fa1ea88.svg",
                SK: "https://static.wixstatic.com/shapes/394052_bfbc7fc4f8b74360bf5398ac8d12a280.svg",
                LX: "https://static.wixstatic.com/shapes/394052_69b2702a5c434d03a9aa0182c430979e.svg",
                TG: "https://static.wixstatic.com/shapes/394052_c370132e76c64a29befdfd67496234fe.svg",
                UA: "https://static.wixstatic.com/shapes/394052_6002f849a3574cd4827d4ba1c3d339ef.svg"
            });

            function airlineCode(item) {
                const explicit = String(item?.airlineIata || "").trim().toUpperCase();
                if (explicit) return explicit;
                const flight = String(item?.flightIata || "").trim().toUpperCase();
                const match = flight.match(/^([A-Z0-9]{2})/);
                return match ? match[1] : "";
            }

            function airlineLogo(item) {
                const direct = safeUrl(item?.airlineLogoUrl);
                if (direct) return direct;
                return KNOWN_AIRLINE_LOGOS[airlineCode(item)] || "";
            }

            function createFlaps(str, exactLength = 0, statusClass = "") {
                const raw = String(str || "").trim().toUpperCase();
                const visible = exactLength ? raw.substring(0, exactLength) : raw;
                const safe = escapeHtml(visible || "—");
                return `<span class="message-flip ${statusClass}">${safe}</span>`;
            }

            function cacheChanged(key, value) {
                if (!key) return false;
                const next = String(value || "");
                const previous = fidsValueCache.get(key);
                fidsValueCache.set(key, next);
                return previous !== undefined && previous !== next;
            }

            function flightKey(item) {
                return String(item?.id || item?.flightIata || "FLIGHT") + "|" + String(item?.departure?.scheduled || item?.arrival?.scheduled || "");
            }

            function createTimeDisplay(item, arrivals, key) {
                const side = arrivals ? item?.arrival : item?.departure;
                const scheduled = side?.scheduledLocal || fmtTime(side?.scheduled) || "—";
                const latest = side?.actualLocal || side?.estimatedLocal || fmtTime(side?.actual || side?.estimated) || scheduled;
                const changed = cacheChanged(`${key}:time`, latest);
                const moved = scheduled && latest && scheduled !== latest;
                const arrival = item?.arrival;
                const arrivalTime = arrival?.actualLocal || arrival?.estimatedLocal || arrival?.scheduledLocal || fmtTime(arrival?.actual || arrival?.estimated || arrival?.scheduled) || "—";
                return `<div class="fids-time"><strong class="fids-time-main ${changed?"is-changing":""}">${escapeHtml(latest)}</strong>${moved?`<small>Sched ${escapeHtml(scheduled)}</small>`:""}${currentMode!=="airport"?`<small>Arr ${escapeHtml(arrivalTime)}</small>`:""}</div>`;
            }

            function createFlightDisplay(item, key) {
                const value = String(item?.flightIata || item?.flightIcao || "—").replace(/\s+/g, "").toUpperCase();
                const changed = cacheChanged(`${key}:flight`, value);
                return `<div class="fids-flight"><strong class="${changed?"is-changing":""}">${escapeHtml(value)}</strong></div>`;
            }

            function destinationLabel(side) {
                const code = String(side?.iata || side?.icao || "").trim().toUpperCase();
                const directory = airportDirectory.find(a => (code && a.iata === code) || (side?.icao && a.icao === side.icao));
                const city = String(side?.city || directory?.city || "").trim();
                const supplied = String(side?.airport || "").trim();
                const fullName = (supplied && supplied.toUpperCase() !== code ? supplied : String(directory?.title || "")).trim();
                let name = fullName.replace(/\s*\([A-Z0-9]{3,4}\)\s*$/i, "").replace(/\bInternational\b|\bAirport\b/gi, "").replace(/\s+/g, " ").trim();
                if (city && name.toLowerCase().startsWith(city.toLowerCase())) name = name.slice(city.length).replace(/^[\s/–—-]+/, "");
                const place = [city, name].filter(Boolean).join(" / ").toUpperCase();
                return {
                    place: place || code || "—",
                    code: place ? code : "",
                    title: [city, fullName, code].filter(Boolean).join(" · ")
                };
            }

            function createDestinationDisplay(side) {
                const label = destinationLabel(side);
                return `<div class="fids-destination" title="${escapeHtml(label.title)}"><strong>${escapeHtml(label.place)}${label.code?` <span>(${escapeHtml(label.code)})</span>`:""}</strong></div>`;
            }

            function createStatusDisplay(status, key) {
                const value = String(status || "Unknown").trim().replace(/[_-]+/g, " ").toUpperCase();
                const cls = statusColorClass(value);
                const changed = cacheChanged(`${key}:status`, value);
                return `<span class="fids-status ${cls} ${changed?"is-changing":""}">${escapeHtml(value)}</span>`;
            }

            function createGateDisplay(gate, key) {
                const value = String(gate || "—").trim().toUpperCase();
                const changed = cacheChanged(`${key}:gate`, value);
                return `<span class="fids-gate ${changed?"is-changing":""}">${escapeHtml(value)}</span>`;
            }

            function createTerminalDisplay(terminal, key) {
                const raw = String(terminal ?? "").trim().toUpperCase();
                const short = raw.replace(/^TERMINAL\s*/i, "");
                const value = /^[0-9]+[A-Z]?$/.test(short) || /^[A-SU-Z]$/.test(short) ? `T${short}` : (short || "—");
                const changed = cacheChanged(`${key}:terminal`, value);
                return `<span class="fids-terminal ${changed?"is-changing":""}">${escapeHtml(value)}</span>`;
            }

            function createLogoFlaps(item) {
                const airlineName = String(item?.airlineName || airlineCode(item) || "Airline");
                const src = airlineLogo(item);
                // These existing Wix assets contain white marks and need a dark display tile.
                const darkLogo = src === KNOWN_AIRLINE_LOGOS[airlineCode(item)] && ["AS", "DL", "F9", "B6", "LH", "DY", "D8", "SK", "LX", "UA"].includes(airlineCode(item));
                const fallback = (airlineCode(item) || airlineName.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "--");
                return `<div class="fids-carrier" title="${escapeHtml(airlineName)}"><span class="fids-tail ${src?"":"fallback"} ${darkLogo?"logo-dark":""}"><span class="fids-logo-fallback" ${src?"hidden":""}>${escapeHtml(fallback)}</span>${src?`<img src="${escapeHtml(src)}" alt="${escapeHtml(airlineName)}" decoding="async">`:""}</span><span class="fids-carrier-name">${escapeHtml(airlineName)}</span></div>`;
            }

            function describeQuery(v) {
                if (v.mode === "flight") return `${v.flightNumber||"FLIGHT"} · ${v.date||""}`;
                if (v.mode === "route") return `${v.from||"ANY"} → ${v.to||"ANY"} · ${v.date||""}`;
                return `${v.airport||"AIRPORT"} · ${(v.boardType||"departures").toUpperCase()} · ${v.date||""}`;
            }

            function setBoardMessage(title, note = "", statusClass = "", radar = false) {
                const rows = el("rows");
                if (!rows) return;
                rows.innerHTML = `<div class="board-message ${statusClass==="flap-bad"?"error":""}">
      ${radar?`<div class="search-radar" aria-hidden="true"></div>`:""}
      <strong class="board-message-title ${statusClass}">${escapeHtml(title)}</strong>
      ${note?`<div class="board-message-note">${escapeHtml(note)}</div>`:""}
    </div>`;
            }

            function renderIdleBoard() {
                setBoardMessage("FLIGHT INFORMATION", "Choose an airport and select Show board.", "flap-ok");
                if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
            }

            // Global toggle flag for historical records visibility
let showHistoricalFlights = false;

function render(items, meta) {
  lastFlightItems = Array.isArray(items) ? items : [];
  lastFlightMeta = meta && typeof meta === "object" ? meta : {};
  const rows = el("rows");
  setBoardBusy(false);
  el("hardwareCasing")?.classList.remove("is-searching");
  el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");

  

  if (!items || !items.length) {
    setBoardMessage("NO FLIGHTS FOUND", currentMode === "airport" ? "No flights were returned for this airport board." : currentMode === "flight" ? "No matching flight was returned for this date." : "No flights were returned for this route and date.", "flap-warn");
    el("boardMeta").textContent = meta?.message || "No flights matched the selected airport board.";
    setStatusLabels(meta?.partial ? "Partial update" : "Updated", "0 Flights");
    setNotice(meta?.note || "", false);
    return;
  }

  const arrivals = currentMode === "airport" && el("boardType").value === "arrivals";
  const nowTime = new Date();

  // 1. Sort all incoming items in perfect chronological sequence
  const sorted = [...items].sort((a, b) => {
    const av = arrivals ? (a?.arrival?.scheduled || a?.arrival?.estimated) : (a?.departure?.scheduled || a?.departure?.estimated);
    const bv = arrivals ? (b?.arrival?.scheduled || b?.arrival?.estimated) : (b?.departure?.scheduled || b?.departure?.estimated);
    return new Date(av || 0) - new Date(bv || 0);
  });

  // 2. Separate rows into previous history vs upcoming schedules
  const previousFlights = [];
  const upcomingFlights = [];

  sorted.forEach(item => {
    const side = arrivals ? item.arrival : item.departure;
    const flightTime = new Date(side?.scheduled || side?.estimated);
    
    // If the scheduled takeoff/landing was more than 15 minutes ago, classify as historical record
    if (flightTime && (nowTime - flightTime) > (15 * 60 * 1000)) {
      previousFlights.push(item);
    } else {
      upcomingFlights.push(item);
    }
  });

  // 3. Row template compilation mapping closure
  const mapRowHtml = (item, rowIndex) => {
    const key = flightKey(item);
    const side = arrivals ? item.arrival : item.departure;
    const destination = arrivals ? item.departure : item.arrival;
    
    const hasCodeshare = !!(item.operatingFlightIata || item.operatingAirlineIata);
    const displayAsCodeshare = hasCodeshare && codeshareTick;
    
    const activeAirline = displayAsCodeshare ? item.operatingAirlineIata : item.airlineIata;
    const activeFlightNo = displayAsCodeshare ? item.operatingFlightIata : item.flightIata;
    
    const rules = lastFlightMeta.boardingRules || {};
    const carrierName = rules[activeAirline]?.name || item.airlineName || activeAirline;
    const logoUrl = KNOWN_AIRLINE_LOGOS[activeAirline] || "";

    // Safely fetch city tracking values out of the schema models without duplication loops
    const targetCity = destination?.city || "";
    const targetIata = destination?.iata || "";
    const cleanDestinationLabel = targetCity ? `${targetCity.toUpperCase()} <span>(${targetIata.toUpperCase()})</span>` : targetIata.toUpperCase();

    // Fallback parser logic path to prevent —:— display errors on live telemetry streams
    const timeDisplayValue = side?.scheduledLocal || fmtTime(side?.scheduled) || "—:—";

    // 4. Custom Reference Boarding Status evaluation
    let statusText = "ON TIME";
    let statusClass = "flap-ok";
    const statusStr = String(item.status || "").toLowerCase();

    const flightTime = new Date(side?.scheduled || side?.estimated);
    const isPastFlight = flightTime && (nowTime - flightTime) > (15 * 60 * 1000);

    if (isPastFlight) {
      if (statusStr === "cancelled") {
        statusText = "CANCELLED";
        statusClass = "flap-bad";
      } else {
        const completionTime = side?.actualLocal || side?.estimatedLocal || timeDisplayValue;
        statusText = arrivals ? `ARRIVED ${completionTime}` : `DEPARTED ${completionTime}`;
        statusClass = "flap-ok";
      }
    } else {
      const calculatedStatus = calculateCustomStatus(item, lastFlightMeta.boardingRules, arrivals);
      statusText = calculatedStatus.text;
      statusClass = calculatedStatus.cls;
    }

    const gateValue = side?.gate || "—";
    const baggageBelt = item.arrival?.baggage || "—";
    const activeFacilityText = arrivals ? baggageBelt : gateValue;
    const compactMobileLabel = arrivals ? "Belt" : "Gate";

    return `
      <div class="fids-row fids-layout" role="row" style="--row:${rowIndex}" data-flight-key="${escapeHtml(key)}">
        <div class="fids-cell cell-airline" role="cell">
          <div class="fids-carrier" title="${escapeHtml(carrierName)}">
            <span class="fids-tail ${logoUrl ? "" : "fallback"} ${logoUrl ? "logo-dark" : ""} is-changing">
              <span class="fids-logo-fallback" ${logoUrl ? "hidden" : ""}>${escapeHtml(activeAirline)}</span>
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(carrierName)}" decoding="async">` : ""}
            </span>
            <span class="fids-carrier-name">${escapeHtml(carrierName)}</span>
          </div>
        </div>
        <div class="fids-cell cell-flight" role="cell">
          <div class="fids-flight"><strong class="is-changing">${escapeHtml(activeFlightNo)}</strong></div>
        </div>
        <div class="fids-cell cell-time" role="cell">
          <div class="fids-time">
            <strong class="fids-time-main">${escapeHtml(timeDisplayValue)}</strong>
          </div>
        </div>
        <div class="fids-cell cell-place" role="cell">
          <div class="fids-destination"><strong>${cleanDestinationLabel}</strong></div>
        </div>
        <div class="fids-cell cell-terminal" role="cell">
          <span class="fids-terminal">${escapeHtml(side?.terminal || "—")}</span>
        </div>
        <div class="fids-cell cell-gate" data-label="${compactMobileLabel}" role="cell">
          <span class="fids-gate is-changing">${escapeHtml(activeFacilityText)}</span>
        </div>
        <div class="fids-cell cell-remarks" role="cell">
          <span class="fids-status ${statusClass} is-changing">${escapeHtml(statusText)}</span>
        </div>
      </div>
    `;
  };

  // 5. Assemble layout arrays with interactive history toggle row button
  let finalHtmlOutput = "";
  
  if (previousFlights.length > 0) {
    finalHtmlOutput += `
      <div class="fids-history-toggle-row">
        <button type="button" class="fids-history-btn" id="toggleHistoryBtn">
          ${showHistoricalFlights ? "↑ Hide completed flights" : `↓ See previous flights (\\${previousFlights.length})`}
        </button>
      </div>
    `;
    
    if (showHistoricalFlights) {
      finalHtmlOutput += previousFlights.map((item, idx) => mapRowHtml(item, idx)).join("");
    }
  }

  finalHtmlOutput += upcomingFlights.map((item, idx) => mapRowHtml(item, previousFlights.length + idx)).join("");
  rows.innerHTML = finalHtmlOutput;

  // 6. Bind event listener for the historical disclosure row toggle element
  const toggleBtn = el("toggleHistoryBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      showHistoricalFlights = !showHistoricalFlights;
      const scrollBox = rows.closest(".board-scroll");
      const currentScroll = scrollBox ? scrollBox.scrollTop : 0;
      
      render(lastFlightItems, lastFlightMeta);
      
      if (scrollBox && showHistoricalFlights) {
        scrollBox.scrollTop = currentScroll;
      }
    });
  }

  rows.querySelectorAll(".fids-tail img").forEach(img => img.addEventListener("error", () => {
    img.hidden = true; img.parentElement.classList.add("fallback"); img.parentElement.querySelector(".fids-logo-fallback").hidden = false;
  }, { once: true }));
  
  el("boardMeta").textContent = meta?.message || `Displaying ${sorted.length} flights`;
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: airportTimezone || "UTC", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(meta?.searchedAt || Date.now()));
  setStatusLabels(`Updated ${now}`, `${sorted.length} ${sorted.length === 1 ? "Flight" : "Flights"}`);
  if (el("boardStatusEcho")) el("boardStatusEcho").textContent = meta?.partial ? "PARTIAL" : "UPDATED";
  setNotice(meta?.note || "", false);
}


            function setContextState(state, iata = "") {
                el("contextWelcome")?.classList.toggle("hidden", state !== "welcome");
                el("contextLoading")?.classList.toggle("hidden", state !== "loading");
                el("contextContent")?.classList.toggle("hidden", state !== "content");
                if (el("loadingAirportCode")) el("loadingAirportCode").textContent = iata || "---";
            }

            function contextKey(iata, searchValues = {}) {
                const code = cleanIata(iata);
                const date = searchValues.date || el("date")?.value || "";
                const boardType = searchValues.boardType || el("boardType")?.value || "departures";
                return `${code}|${date}|${boardType}`;
            }

            function requestAirportContext(iata, searchValues = {}) {
                const code = cleanIata(iata);
                if (!code) return;
                const key = contextKey(code, searchValues);
                const cached = airportContextCache.get(key);
                if (cached && Date.now() - cached._cachedAt < 120000) {
                    clearContextTimeout();
                    contextRequestSerial++;
                    pendingContext = null;
                    renderAirportContext(cached);
                    return;
                }
                const serial = ++contextRequestSerial;
                pendingContext = {
                    serial,
                    key,
                    iata: code
                };
                setContextState("loading", code);
                armContextTimeout(code, serial, key);
                document.body.classList.add("has-airport-selection");
                post("FLIGHT_STATUS_AIRPORT_CONTEXT_REQUEST", {
                    iata: code,
                    date: searchValues.date || el("date")?.value || "",
                    boardType: searchValues.boardType || el("boardType")?.value || "departures",
                    language: "EN",
                    requestSerial: serial,
                    contextKey: key
                });
            }

            function mediaUrlFromAirport(airport) {
                const direct = safeUrl(airport?.heroImageUrl || airport?.image_url || airport?.imageUrl);
                if (direct) return direct;
                const media = normalizeList(airport?.media_assets || airport?.mediaAssets);
                const primary = media.find(x => x && typeof x === "object" && (x.isHero || x.isPrimary || x.role === "PRIMARY")) || media[0];
                return safeUrl(primary?.url);
            }

            function normalizeAirportContext(payload) {
                const source = payload && typeof payload === "object" ? payload : {};
                const airport = source.airport && typeof source.airport === "object" ? source.airport : source;
                const commerce = source.commerce && typeof source.commerce === "object" ? source.commerce : {};
                const quickFacts = normalizeList(airport.quickFacts || airport.quickFactsJson);
                const terminals = normalizeList(airport.terminals || airport.terminalsJson);
                const transport = normalizeList(airport.transport || airport.transportJson);
                const foodDrinks = normalizeList(airport.foodDrinks || airport.foodDrinksJson);
                const destinationAds = normalizeList(airport.destinationAds || airport.destinationAdsJson);
                const lostFound = normalizeList(airport.lostFound || airport.lostFoundJson);
                const loungesObj = objectFrom(airport.lounges);
                const lounges = Array.isArray(loungesObj.lounges) ? loungesObj.lounges : normalizeList(airport.lounges);
                const airportHotel = objectFrom(airport.airportHotel || airport.airportHotels);
                return {
                    airport: {
                        ...airport,
                        iata: cleanIata(airport.iata || airport.iata_code || airport.code),
                        title: textValue(airport.title || airport.airport_name || airport.name),
                        city: textValue(airport.city || airport.locationCity),
                        country: textValue(airport.country || airport.countryName),
                        summary: textValue(airport.summary || airport.information || airport.body),
                        timezone: textValue(airport.timezone, "UTC"),
                        website: safeUrl(airport.website),
                        contactUrl: safeUrl(airport.contactUrl),
                        heroImageUrl: mediaUrlFromAirport(airport),
                        logoUrl: safeUrl(airport.logoUrl || airport.logoIconUrl || airport.airport_logo),
                        primaryColor: validHex(airport.primaryColor),
                        accentColor: validHex(airport.accentColor),
                        distanceToCityCenterKm: airport.distanceToCityCenterKm,
                        lastReviewed: airport.lastReviewed,
                        quickFacts,
                        terminals,
                        transport,
                        lounges,
                        foodDrinks,
                        airportHotel,
                        destinationAds,
                        lostFound
                    },
                    commerce: {
                        transferOffers: normalizeList(commerce.transferOffers || commerce.transfers),
                        hotels: normalizeList(commerce.hotels),
                        destinations: normalizeList(commerce.destinations),
                        tours: normalizeList(commerce.tours || commerce.activities)
                    }
                };
            }

            function listItem(title, detail = "") {
                return `<div class="context-list-item"><strong>${escapeHtml(title||"")}</strong>${detail?`<span>${escapeHtml(detail)}</span>`:""}</div>`;
            }

            function renderSimpleList(hostId, items, titleKeys, detailKeys, emptyText) {
                const host = el(hostId);
                if (!host) return 0;
                const rows = (items || []).slice(0, 5).map(item => {
                    if (typeof item === "string") return listItem(item);
                    const title = titleKeys.map(k => item?.[k]).find(Boolean) || "";
                    const detail = detailKeys.map(k => item?.[k]).find(Boolean) || "";
                    return title ? listItem(title, detail) : "";
                }).filter(Boolean);
                host.innerHTML = rows.length ? rows.join("") : `<p class="context-empty">${escapeHtml(emptyText)}</p>`;
                return rows.length;
            }

            function renderTransfer(offers, airport) {
                const module = el("moduleTransfer"),
                    host = el("transferContent");
                if (!module || !host) return;
                const offer = (offers || [])[0];
                if (!offer) {
                    module.classList.add("hidden");
                    host.innerHTML = "";
                    return;
                }
                module.classList.remove("hidden");
                const title = textValue(offer.title || offer.name, "SKANDI Transfer");
                const detail = textValue(offer.summary || offer.description || offer.destination || offer.meetingPoint || "Continue from arrivals with a SKANDI transfer option linked to this airport.");
                const amount = Number(offer.price ?? offer.publicPrice);
                const currency = textValue(offer.currency);
                const price = Number.isFinite(amount) && amount > 0 ? `<div class="transfer-price">${escapeHtml(currency)} ${escapeHtml(amount.toFixed(0))}<small> from</small></div>` : "";
                el("transferTitle").textContent = title;
                host.innerHTML = `${price}<p>${escapeHtml(detail)}</p><button class="transfer-cta" type="button" id="transferCta">View SKANDI Transfer →</button>`;
                el("transferCta")?.addEventListener("click", () => contextPathAction("TRANSFER", offer));
            }

            function contextCard(item, kind) {
                const image = safeUrl(item?.imageUrl || item?.heroImageUrl || item?.image || item?.media?.[0]?.url);
                const title = textValue(item?.title || item?.name, kind);
                const summary = textValue(item?.summary || item?.description || item?.subtitle || "");
                return `<article class="commerce-card ${image?"has-media":"no-media"}">
      ${image?`<div class="commerce-card-media" style="background-image:url('${escapeHtml(image)}')"></div>`:""}
      <div class="commerce-card-copy"><small>${escapeHtml(kind)}</small><h3>${escapeHtml(title)}</h3>${summary?`<p>${escapeHtml(summary)}</p>`:""}<button type="button" data-commerce-kind="${escapeHtml(kind)}" data-commerce-id="${escapeHtml(item?.id||item?.publicId||item?.slug||title)}">Explore →</button></div>
    </article>`;
            }

            function destinationCard(item, kind) {
                const title = textValue(item?.title || item?.name, kind);
                const summary = textValue(item?.summary || item?.description || item?.subtitle || "");
                return `<article class="destination-card"><small>${escapeHtml(kind)}</small><h3>${escapeHtml(title)}</h3>${summary?`<p>${escapeHtml(summary)}</p>`:""}<button type="button" data-destination-kind="${escapeHtml(kind)}" data-destination-id="${escapeHtml(item?.id||item?.publicId||item?.slug||title)}">Discover →</button></article>`;
            }

            function renderAirportContext(payload) {
                const context = normalizeAirportContext(payload);
                const airport = context.airport;
                if (!airport.iata) return;
                activeAirportContext = context;
                const key = payload?.contextKey || contextKey(airport.iata, payload?.meta || {});
                airportContextCache.set(key, {
                    ...payload,
                    _cachedAt: Date.now()
                });
                if (airportContextCache.size > 30) airportContextCache.delete(airportContextCache.keys().next().value);
                airportTimezone = airport.timezone || "UTC";
                selectedAirportIata = airport.iata;
                el("airport").dataset.selectedIata = airport.iata;
                setContextState("content", airport.iata);
                document.body.classList.add("has-airport-context");

                if (el("airport") && el("airport").value !== airport.iata) el("airport").value = airport.iata;
                if (el("screenAirport")) el("screenAirport").textContent = airport.iata;
                if (el("contextAirportCode")) el("contextAirportCode").textContent = airport.iata;
                if (el("destinationAirportCode")) el("destinationAirportCode").textContent = airport.iata;
                if (el("contextAirportEyebrow")) el("contextAirportEyebrow").textContent = [airport.city, airport.country].filter(Boolean).join(" · ") || "Airport guide";
                if (el("contextAirportTitle")) el("contextAirportTitle").textContent = airport.title || airport.iata;
                if (el("contextAirportSummary")) el("contextAirportSummary").textContent = airport.summary || `Passenger guide for ${airport.iata}.`;
                if (el("destinationEditTitle")) el("destinationEditTitle").textContent = airport.city ? `Continue into ${airport.city}.` : `Continue beyond ${airport.iata}.`;
                if (el("practicalHeading")) el("practicalHeading").textContent = `Useful at ${airport.iata}.`;

                const profile = el("airportProfile");
                if (profile) {
                    if (airport.primaryColor) profile.style.setProperty("--airport-primary", airport.primaryColor);
                    if (airport.accentColor) profile.style.setProperty("--airport-accent", airport.accentColor);
                }
                const media = el("airportProfileMedia");
                if (media) media.style.backgroundImage = airport.heroImageUrl ? `url('${airport.heroImageUrl}')` : "";

                const actions = [];
                if (airport.website) actions.push(`<a class="context-action primary" href="${escapeHtml(airport.website)}" target="_blank" rel="noopener noreferrer">Official airport site ↗</a>`);
                if (airport.contactUrl) actions.push(`<a class="context-action" href="${escapeHtml(airport.contactUrl)}" target="_blank" rel="noopener noreferrer">Airport contact ↗</a>`);
                el("contextAirportActions").innerHTML = actions.join("");

                const facts = [];
                facts.push(["IATA", airport.iata]);
                if (airport.city) facts.push(["City", airport.city]);
                if (airport.country) facts.push(["Country", airport.country]);
                if (airport.distanceToCityCenterKm != null && airport.distanceToCityCenterKm !== "") facts.push(["City center", `${airport.distanceToCityCenterKm} km`]);
                airport.quickFacts.forEach(item => {
                    const obj = typeof item === "object" ? item : {
                        label: "",
                        value: item
                    };
                    if (obj.label && obj.value) facts.push([obj.label, obj.value]);
                });
                el("contextQuickFacts").innerHTML = facts.slice(0, 6).map(([label, value]) => `<div class="profile-fact"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join("");

                const terminalCount = renderSimpleList("terminalContent", airport.terminals, ["terminal", "name", "title"], ["notes", "description"], "");
                const transportCount = renderSimpleList("transportContent", airport.transport, ["mode", "name", "title"], ["notes", "description"], "");
                const diningCount = renderSimpleList("diningContent", airport.foodDrinks, ["name", "title", "venue"], ["location", "notes", "description"], "");
                const loungeCount = renderSimpleList("loungeContent", airport.lounges, ["name", "title"], ["location", "access", "description"], "");
                el("moduleTerminals")?.classList.toggle("hidden", !terminalCount);
                el("moduleTransport")?.classList.toggle("hidden", !transportCount);
                el("moduleDining")?.classList.toggle("hidden", !diningCount);
                el("moduleLounges")?.classList.toggle("hidden", !loungeCount);

                const hotel = airport.airportHotel;
                const hotelHost = el("airportHotelContent");
                if (hotelHost) {
                    if (Object.keys(hotel).length) {
                        const amenities = normalizeList(hotel.amenities).slice(0, 3).map(String).join(" · ");
                        hotelHost.innerHTML = listItem(hotel.hotel || hotel.name || "Airport hotel", [hotel.location, amenities].filter(Boolean).join(" · "));
                    } else hotelHost.innerHTML = "";
                    el("moduleAirportHotel")?.classList.toggle("hidden", !Object.keys(hotel).length);
                }

                renderTransfer(context.commerce.transferOffers, airport);

                const commerceItems = [
                    ...context.commerce.hotels.map(x => ({
                        item: x,
                        kind: "Hotel"
                    })),
                    ...context.commerce.tours.map(x => ({
                        item: x,
                        kind: "Experience"
                    }))
                ].slice(0, 6);
                const commerce = el("airportCommerce"),
                    grid = el("commerceGrid");
                if (commerce && grid) {
                    commerce.classList.toggle("hidden", !commerceItems.length);
                    grid.innerHTML = commerceItems.map(x => contextCard(x.item, x.kind)).join("");
                    grid.querySelectorAll("[data-commerce-kind]").forEach(button => button.addEventListener("click", () => {
                        const all = commerceItems.map(x => x.item);
                        const item = all.find(x => String(x?.id || x?.publicId || x?.slug || x?.title || x?.name) === button.dataset.commerceId) || null;
                        contextPathAction(button.dataset.commerceKind.toUpperCase(), item);
                    }));
                }

                const destinationItems = [
                    ...airport.destinationAds.map(x => ({
                        item: x,
                        kind: "Destination"
                    })),
                    ...context.commerce.destinations.map(x => ({
                        item: x,
                        kind: "Destination"
                    }))
                ].slice(0, 6);
                const destSection = el("airportDestinationEdit"),
                    destGrid = el("destinationEditGrid");
                if (destSection && destGrid) {
                    destSection.classList.toggle("hidden", !destinationItems.length);
                    destGrid.innerHTML = destinationItems.map(x => destinationCard(x.item, x.kind)).join("");
                    destGrid.querySelectorAll("[data-destination-kind]").forEach(button => button.addEventListener("click", () => {
                        const all = destinationItems.map(x => x.item);
                        const item = all.find(x => String(x?.id || x?.publicId || x?.slug || x?.title || x?.name) === button.dataset.destinationId) || null;
                        contextPathAction("DESTINATION", item);
                    }));
                }

                const practical = [];
                if (airport.distanceToCityCenterKm != null && airport.distanceToCityCenterKm !== "") practical.push(["City center", `${airport.distanceToCityCenterKm} km from the airport.`]);
                if (terminalCount) practical.push(["Terminal planning", `${terminalCount} terminal ${terminalCount===1?"section":"sections"} in this airport guide.`]);
                if (transportCount) practical.push(["Ground transport", `${transportCount} documented way${transportCount===1?"":"s"} to continue from the airport.`]);
                if (loungeCount) practical.push(["Lounges", `${loungeCount} lounge ${loungeCount===1?"option":"options"} in this airport guide.`]);
                if (diningCount) practical.push(["Food & drink", `${diningCount} dining ${diningCount===1?"recommendation":"recommendations"} in this airport guide.`]);
                if (airport.website) practical.push(["Official airport site", "Use the airport’s official site for final operational instructions and local notices."]);
                el("practicalGrid").innerHTML = practical.map(([title, copy]) => `<article class="practical-card"><span>${escapeHtml(airport.iata)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`).join("");
                el("airportPractical")?.classList.toggle("hidden", !practical.length);

                updateClock();
            }

            window.addEventListener("message", function(event) {
                if (event.source !== window.parent) return;
                const data = event.data || {};
                if (data.source !== PARENT_SOURCE) return;

                if (data.type === "FLIGHT_STATUS_RESULTS") {
                    const payload = data.payload || {};
                    if (!pendingSearch || String(payload.requestId) !== pendingSearch) return;
                    pendingSearch = "";
                    clearSearchTimeout();
                    if (payload.airportContext) renderAirportContext(payload.airportContext);
                    render(payload.items || [], payload.meta || {});
                    return;
                }

                if (data.type === "FLIGHT_STATUS_AIRPORTS_RESULTS") {
                    const payload = data.payload || {};
                    airportDirectory = normalizeList(payload.items).map(item => ({
                        iata: cleanIata(item?.iata),
                        icao: textValue(item?.icao),
                        title: textValue(item?.title),
                        city: textValue(item?.city),
                        country: textValue(item?.country),
                        timezone: textValue(item?.timezone),
                        logoUrl: safeUrl(item?.logoUrl)
                    })).filter(item => item.iata);
                    if (!pendingSearch && lastFlightItems.length && el("rows").querySelector(".fids-row")) {
                        const arrivals = currentMode === "airport" && el("boardType").value === "arrivals";
                        el("rows").querySelectorAll(".fids-row").forEach(row => {
                            const item = lastFlightItems.find(item => flightKey(item) === row.dataset.flightKey);
                            if (item) row.querySelector(".cell-place").innerHTML = createDestinationDisplay(arrivals ? item.departure : item.arrival);
                        });
                    }
                    const focused = document.activeElement?.id;
                    if (["airport", "from", "to"].includes(focused)) {
                        suggestionIndex[focused] = 0;
                        renderAirportSuggestions(el(focused).value, focused);
                    }
                    return;
                }

                if (data.type === "FLIGHT_STATUS_AIRPORTS_ERROR") {
                    setNotice("Airport suggestions are unavailable. Enter a 3-letter IATA or 4-letter ICAO code to search.", true);
                    return;
                }

                if (data.type === "FLIGHT_STATUS_AIRPORT_CONTEXT_RESULTS") {
                    const payload = data.payload || {};
                    const serial = Number(payload.requestSerial || 0);
                    const key = textValue(payload.contextKey);
                    if (!pendingContext || serial !== pendingContext.serial) return;
                    if (key !== pendingContext.key || currentMode !== "airport") return;
                    clearContextTimeout();
                    pendingContext = null;
                    renderAirportContext(payload);
                    return;
                }

                if (data.type === "FLIGHT_STATUS_AIRPORT_CONTEXT_ERROR") {
                    const payload = data.payload || {};
                    const serial = Number(payload.requestSerial || 0);
                    if (!pendingContext || serial !== pendingContext.serial) return;
                    clearContextTimeout();
                    pendingContext = null;
                    if (!activeAirportContext) setContextState("welcome");
                    if (payload.message) setNotice(payload.message, false);
                    return;
                }

                if (data.type === "FLIGHT_STATUS_HOST_READY") {
                    post("FLIGHT_STATUS_AIRPORTS_REQUEST", {});
                    return;
                }

                if (data.type === "FLIGHT_STATUS_ERROR") {
                    const payload = data.payload || {};
                    if (!pendingSearch || String(payload.requestId) !== pendingSearch) return;
                    pendingSearch = "";
                    clearSearchTimeout();
                    setBoardBusy(false);
                    el("hardwareCasing")?.classList.remove("is-searching");
                    el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");
                    setNotice(payload.message || "Flight information is temporarily unavailable.", true);
                    setBoardMessage("BOARD UNAVAILABLE", "Please try updating the FIDS again shortly.", "flap-bad");
                    setStatusLabels("Update failed", "");
                    if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                }
            });

            function updateBoardType() {
  const type = el("boardType")?.value || "departures";
  const arrivals = currentMode === "airport" && type === "arrivals";
  
  // FIXED: Correctly grab the individual column element by index to prevent crashes
  const columns = document.querySelectorAll(".board-columns > div");
  if (columns && columns.length >= 6) {
    // Index 5 targets the 6th header column: Gate / Belt
    columns[5].textContent = arrivals ? "Belt" : "Gate";
  }
  
  // Keep the rest of your standard updateBoardType logic here...
  let label = "Departures";
  if (currentMode === "airport") label = type === "arrivals" ? "Arrivals" : "Departures";
  else if (currentMode === "flight") label = "Flight status";
  else if (currentMode === "route") label = "Route status";
  if (el("boardSubMode")) el("boardSubMode").textContent = label;
  if (el("railTitle")) el("railTitle").textContent = label.toUpperCase();
  
  if (el("timeHeader")) el("timeHeader").textContent = currentMode !== "airport" ? "Departure / Arrival" : arrivals ? "Arrival time" : "Departure time";
  if (el("placeHeader")) el("placeHeader").textContent = arrivals ? "From" : "To";
  if (el("boardDirectionIcon")) el("boardDirectionIcon").textContent = arrivals ? "↘" : "↗";
  document.querySelectorAll("[data-board-view]").forEach(btn => btn.classList.toggle("active", currentMode === "airport" && btn.dataset.boardView === type));
  if (el("commerceHeading")) el("commerceHeading").textContent = type === "arrivals" ? "From arrivals into the next part of the trip." : "Make the time before departure work harder.";
  document.body.classList.toggle("context-arrivals", currentMode === "airport" && type === "arrivals");
  document.body.classList.toggle("context-departures", currentMode !== "airport" || type !== "arrivals");
}

  



            function updateClock() {
                const now = new Date();
                let value = "";
                try {
                    value = new Intl.DateTimeFormat("en-GB", {
                        timeZone: airportTimezone || "UTC",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                    }).format(now);
                } catch (_) {
                    airportTimezone = "UTC";
                    value = new Intl.DateTimeFormat("en-GB", {
                        timeZone: "UTC",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                    }).format(now);
                }
                if (el("utcClock")) el("utcClock").textContent = `${value} ${airportTimezone==="UTC"?"UTC":"LOCAL"}`;
                if (el("boardClockEcho")) el("boardClockEcho").textContent = value;
                if (el("boardClockLabel")) el("boardClockLabel").textContent = airportTimezone === "UTC" ? "UTC" : "LOCAL";
            }

            function installPointerLight() {
                if (!window.matchMedia?.("(pointer:fine)")?.matches) return;
                document.addEventListener("pointermove", event => {
                    document.documentElement.style.setProperty("--mx", `${(event.clientX/window.innerWidth*100).toFixed(1)}%`);
                    document.documentElement.style.setProperty("--my", `${(event.clientY/window.innerHeight*100).toFixed(1)}%`);
                }, {
                    passive: true
                });
            }

            function installReveal() {
                const nodes = [...document.querySelectorAll(".reveal")];
                if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || !("IntersectionObserver" in window)) {
                    nodes.forEach(node => node.classList.add("is-visible"));
                    return;
                }
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    });
                }, {
                    threshold: .10,
                    rootMargin: "0px 0px -6% 0px"
                });
                nodes.forEach(node => observer.observe(node));
                window.addEventListener("pagehide", () => observer.disconnect(), {
                    once: true
                });
            }
            function refreshVisibleFidsRows() {
  const rowsContainer = el("rows");
  if (!rowsContainer || !lastFlightItems || !lastFlightItems.length) return;
  
  // Re-run the layout generator engine using the current flight state data sets
  // This smoothly reapplies the .is-changing animations as the frames toggle
  const targetScrollTop = el("rows").closest(".board-scroll")?.scrollTop || 0;
  
  render(lastFlightItems, lastFlightMeta);
  
  // Preserve user position inside the scroll box container during background flip ticks
  const scrollBox = el("rows").closest(".board-scroll");
  if (scrollBox) scrollBox.scrollTop = targetScrollTop;
}


            document.querySelectorAll("[data-lookup-mode]").forEach(button => {
                button.addEventListener("click", () => {
                    if (button.dataset.lookupMode === currentMode) return;
                    clearRequestTimeouts();
                    contextRequestSerial++;
                    setMode(button.dataset.lookupMode);
                    setBoardBusy(false);
                    el("hardwareCasing")?.classList.remove("is-searching");
                    el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");
                    setBoardMessage("FLIGHT INFORMATION", currentMode === "airport" ? "Choose an airport and select Show board." : currentMode === "flight" ? "Enter a flight number and date." : "Enter a route and date.", "flap-ok");
                    setStatusLabels("", "");
                    el("screenAirport").textContent = "---";
                    activeAirportContext = null;
                    pendingContext = null;
                    airportTimezone = "UTC";
                    document.body.classList.remove("has-airport-selection", "has-airport-context");
                    setContextState("welcome");
                    if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                });
            });

            document.querySelectorAll("[data-board-view]").forEach((button) => {
                button.addEventListener("click", () => {
                    el("boardType").value = button.dataset.boardView;
                    updateBoardType();
                    const v = values();
                    if ((currentMode === "airport" && v.airport) || (currentMode === "flight" && v.flightNumber) || (currentMode === "route" && (v.from || v.to))) search();
                });
            });

            el("boardType").addEventListener("change", updateBoardType);
            el("searchBtn").addEventListener("click", search);
            el("clearBtn").addEventListener("click", function() {
                clearRequestTimeouts();
                contextRequestSerial++;
                ["airport", "from", "to", "flightNumber"].forEach(id => {
                    if (el(id)) {
                        el(id).value = "";
                        el(id).dataset.selectedIata = "";
                    }
                });
                selectedAirportIata = "";
                selectedFromIata = "";
                selectedToIata = "";
                closeAllAirportSuggestions();
                setBoardBusy(false);
                el("hardwareCasing")?.classList.remove("is-searching");
                el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");
                setBoardMessage("FLIGHT INFORMATION", currentMode === "airport" ? "Choose an airport and select Show board." : currentMode === "flight" ? "Enter a flight number and date." : "Enter a route and date.", "flap-ok");
                setNotice("");
                setStatusLabels("", "");
                el("querySummary").textContent = currentMode === "airport" ? "Select an airport to load the board" : currentMode === "flight" ? "Enter a flight number" : "Enter a route";
                el("screenAirport").textContent = "---";
                el("screenDate").textContent = el("date").value || "---";
                activeAirportContext = null;
                pendingContext = null;
                airportTimezone = "UTC";
                document.body.classList.remove("has-airport-selection", "has-airport-context");
                setContextState("welcome");
                if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                updateBoardType();
            });

            function bindAirportPicker(fieldId) {
                const input = el(fieldId);
                if (!input) return;
                input.addEventListener("input", () => {
                    setSelectedIata(fieldId, "");
                    suggestionIndex[fieldId] = 0;
                    renderAirportSuggestions(input.value, fieldId);
                });
                input.addEventListener("focus", () => {
                    closeAllAirportSuggestions();
                    if (airportDirectory.length) {
                        suggestionIndex[fieldId] = 0;
                        renderAirportSuggestions(input.value, fieldId)
                    } else post("FLIGHT_STATUS_AIRPORTS_REQUEST", {});
                });
                input.addEventListener("keydown", event => {
                    const host = suggestionHost(fieldId);
                    const open = host?.classList.contains("open");
                    if (event.key === "ArrowDown" && open) {
                        event.preventDefault();
                        suggestionIndex[fieldId]++;
                        renderAirportSuggestions(input.value, fieldId);
                        return
                    }
                    if (event.key === "ArrowUp" && open) {
                        event.preventDefault();
                        suggestionIndex[fieldId] = Math.max(0, suggestionIndex[fieldId] - 1);
                        renderAirportSuggestions(input.value, fieldId);
                        return
                    }
                    if (event.key === "Escape") {
                        closeAirportSuggestions(fieldId);
                        return
                    }
                    if (event.key === "Enter") {
                        if (open) {
                            const matches = airportMatches(input.value);
                            const index = Math.min(Math.max(suggestionIndex[fieldId], 0), matches.length - 1);
                            const item = matches[index];
                            if (item) {
                                event.preventDefault();
                                selectAirport(item, {
                                    searchNow: false,
                                    fieldId
                                });
                                return
                            }
                        }
                        search();
                    }
                });
            }
            ["airport", "from", "to"].forEach(bindAirportPicker);
            el("flightNumber")?.addEventListener("keydown", event => {
                if (event.key === "Enter") search()
            });
            document.addEventListener("pointerdown", event => {
                if (!event.target.closest(".airport-code-control")) closeAllAirportSuggestions()
            }, {
                passive: true
            });

            el("date").addEventListener("change", () => {
                if (el("screenDate")) el("screenDate").textContent = el("date").value || "---";
                if (hasReadySearch()) search();
            });

            setDateLimits();
            setMode("airport");
            setContextState("welcome");
            updateBoardType();
            updateClock();
            if (el("screenDate")) el("screenDate").textContent = el("date").value || "---";
            clockTimer = window.setInterval(updateClock, 1000);
            installPointerLight();
            installReveal();
            setBoardMessage("FLIGHT INFORMATION", "Choose an airport and select Show board.", "flap-ok");
            window.addEventListener("pagehide", () => {
                window.clearInterval(clockTimer);
                window.clearInterval(refreshTimer);
                clearRequestTimeouts();
            }, {
                once: true
            });
            post("FLIGHT_STATUS_READY", {
                version: "V12"
            });
            post("FLIGHT_STATUS_AIRPORTS_REQUEST", {});
            refreshTimer = window.setInterval(() => {
                if (document.visibilityState === "hidden" || pendingSearch || !lastQuery) return;
                if (JSON.stringify(values()) === lastQuery) search();
            }, 60000);
        })();
    