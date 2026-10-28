(() => {
  "use strict";

  const SOURCE = "SKANDI_MYROSTER_EMBED";
  const PARENT_SOURCE = "SKANDI_WIX_PARENT";
  const root = document.getElementById("myRosterRoot");
  if (!root) return;
  const desktopOnlyNotice = document.getElementById("desktopOnlyNotice");
  const desktopViewport = typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 768px)").matches
    : window.innerWidth >= 768;
  if (!desktopViewport) {
    root.hidden = true;
    if (desktopOnlyNotice) desktopOnlyNotice.hidden = false;
    return;
  }

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];
  const state = {
    boot: null,
    assignments: [],
    requests: [],
    clocks: [],
    timeOffBalances: [],
    pending: new Map(),
    flights: [],
    flightRequestId: "",
    selectedAssignment: null,
    activePanel: "schedule",
    lastSync: null,
    brandLogoUrl: "",
    loading: true
  };

  function text(value) { return String(value ?? ""); }
  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }
  function dateInputValue(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function offsetDate(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  function setSync(label, status = "ready") {
    const host = $("#syncState");
    if (!host) return;
    host.dataset.state = status;
    $("#syncLabel").textContent = label;
  }
  function showToast(message, error = false) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle("error", error);
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3400);
  }
  function post(type, payload = {}) {
    window.parent.postMessage({ source: SOURCE, type, payload, timestamp: new Date().toISOString() }, "*");
  }
  function applyMasterConfig(config) {
    const logos = config?.brand?.assets?.logos || {};
    const logoUrl = text(logos.altea || logos.alteaWhite || logos.skandiGroupWhite).trim();
    if (!/^https:\/\//i.test(logoUrl)) return;
    state.brandLogoUrl = logoUrl;
    const logo = $("#alteaBrandLogo");
    if (!logo) return;
    logo.src = logoUrl;
    logo.hidden = false;
    $("#brandMark").hidden = true;
  }
  function requestFlightSearch() {
    const query = text($("#flightQuery")?.value).trim();
    const from = text($("#flightDateFrom")?.value).trim();
    const to = text($("#flightDateTo")?.value).trim();
    if (query.length < 2) return showToast("Enter at least two characters for a flight or airport search.", true);
    if (!from || !to || from > to) return showToast("Choose a valid flight search date range.", true);
    const button = $("#flightSearchButton");
    state.flightRequestId = `FLIGHT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (button) button.disabled = true;
    $("#flightSearchStatus").textContent = "Searching canonical ALTEA flight data…";
    $("#flightResultsBody").innerHTML = '<tr><td colspan="7"><div class="mr-empty"><span class="mr-spinner"></span><strong>Searching ALTEA records</strong><span>Personal roster assignments are not used as a filter.</span></div></td></tr>';
    post("MYROSTER_FLIGHT_SEARCH_REQUEST", { query, from, to, requestId: state.flightRequestId });
  }
  function renderFlightResults(rows) {
    const body = $("#flightResultsBody");
    if (!body) return;
    state.flights = Array.isArray(rows) ? rows : [];
    if (!state.flights.length) {
      body.innerHTML = '<tr><td colspan="7"><div class="mr-empty"><strong>No matching live flight or schedule records</strong><span>The search is independent of your roster. This result means the selected ALTEA data sources returned no matching flight records.</span></div></td></tr>';
      return;
    }
    body.innerHTML = state.flights.map((flight) => {
      const departure = flight.departureTime || flight.estimatedTime || flight.actualTime || flight.scheduledTime || "—";
      const arrival = flight.arrivalTime || "";
      const route = [flight.origin, flight.viaPoint, flight.destination].filter(Boolean).join(" → ") || "Route not supplied";
      const status = [flight.status || "SCHEDULED", flight.gate ? `Gate ${flight.gate}` : ""].filter(Boolean).join(" · ");
      return `<tr><td><span class="mr-date-main">${escapeHtml(flight.departureDate || "—")}</span></td><td><div class="mr-assignment-cell"><strong>${escapeHtml(flight.flightNumber || "Flight number unavailable")}</strong><span>${escapeHtml(flight.airlineName || flight.source || "ALTEA")}</span></div></td><td>${escapeHtml(route)}</td><td class="mr-time">${escapeHtml(departure)}${arrival ? `<span class="mr-date-sub">Arr ${escapeHtml(arrival)}</span>` : ""}</td><td>${statusPill(status)}${flight.terminal ? `<span class="mr-flight-meta">Terminal ${escapeHtml(flight.terminal)}</span>` : ""}</td><td>${escapeHtml([flight.aircraftType, flight.registration].filter(Boolean).join(" · ") || "—")}</td><td><button class="mr-row-action" type="button" data-brief-flight="${escapeHtml(flight.id)}">CARI / Print</button></td></tr>`;
    }).join("");
  }
  function renderBriefing(flight = {}, assignment = null) {
    const profile = state.boot?.profile || {};
    const staffName = profile.displayName || profile.fullName || profile.preferredName || "Authenticated SKANDI staff member";
    const staffId = profile.agentId || profile.skId || "—";
    const flightNumber = flight.flightNumber || assignment?.flightNumber || assignment?.reference || assignment?.routeId || "—";
    const origin = flight.origin || assignment?.origin || "—";
    const destination = flight.destination || assignment?.destination || "—";
    const viaPoint = flight.viaPoint || assignment?.viaPoint || "";
    const date = flight.departureDate || (assignment?.startAt ? dateInputValue(assignment.startAt) : "—");
    const source = flight.source || (assignment ? "MyRoster assignment record" : "ALTEA flight search");
    const assignmentLabel = assignment ? assignmentTitle(assignment) : "No personal assignment linked to this search";
    const time = flight.departureTime || flight.estimatedTime || flight.actualTime || flight.scheduledTime || "—";
    const brandMark = state.brandLogoUrl ? `<img class="mr-cari-logo" src="${escapeHtml(state.brandLogoUrl)}" alt="ALTEA">` : "";
    const paper = $("#briefingPaper");
    if (!paper) return;
    paper.innerHTML = `<div class="mr-cari-head">${brandMark}<div class="mr-cari-head-title"><strong>SKANDI ALTEA</strong><span>CREW ASSIGNMENT &amp; ROSTER INFORMATION</span></div><div class="mr-cari-stamp"><span>GENERATED</span><strong>${escapeHtml(new Date().toISOString().replace("T", " ").slice(0, 16))}Z</strong></div></div>
      <h2>CARI OPERATIONAL BRIEFING CARD</h2><p class="mr-cari-subtitle">Operational details shown here are limited to the selected live flight or assignment record and your authenticated staff profile.</p>
      <div class="mr-cari-rule"></div><h3>FLIGHT / ROUTE IDENTIFICATION</h3><div class="mr-cari-grid"><div><span>FLIGHT / REF</span><strong>${escapeHtml(flightNumber)}</strong></div><div><span>DATE</span><strong>${escapeHtml(date)}</strong></div><div><span>ORIGIN</span><strong>${escapeHtml(origin)}</strong></div><div><span>VIA</span><strong>${escapeHtml(viaPoint || "Not supplied")}</strong></div><div><span>DESTINATION</span><strong>${escapeHtml(destination)}</strong></div><div><span>STATUS</span><strong>${escapeHtml(flight.status || "Not supplied")}</strong></div><div><span>DATA SOURCE</span><strong>${escapeHtml(source)}</strong></div></div>
      <div class="mr-cari-rule"></div><h3>SCHEDULE &amp; STATION DETAILS</h3><div class="mr-cari-grid"><div><span>SCHEDULED</span><strong>${escapeHtml(flight.scheduledTime || time)}</strong></div><div><span>ESTIMATED</span><strong>${escapeHtml(flight.estimatedTime || "Not supplied")}</strong></div><div><span>ACTUAL</span><strong>${escapeHtml(flight.actualTime || "Not supplied")}</strong></div><div><span>GATE / TERMINAL</span><strong>${escapeHtml([flight.gate, flight.terminal].filter(Boolean).join(" / ") || "Not supplied")}</strong></div><div><span>AIRCRAFT / REGISTRATION</span><strong>${escapeHtml([flight.aircraftType, flight.registration].filter(Boolean).join(" / ") || "Not supplied")}</strong></div><div><span>BAGGAGE BELT</span><strong>${escapeHtml(flight.belt || "Not supplied")}</strong></div></div>
      <div class="mr-cari-rule"></div><h3>AUTHENTICATED STAFF ASSIGNMENT</h3><table class="mr-cari-table"><thead><tr><th>STAFF ID</th><th>STAFF MEMBER</th><th>ROLE</th><th>BASE</th><th>ASSIGNMENT</th></tr></thead><tbody><tr><td>${escapeHtml(staffId)}</td><td>${escapeHtml(staffName)}</td><td>${escapeHtml(profile.jobTitle || profile.position || "Not supplied")}</td><td>${escapeHtml(state.boot?.base?.code || profile.baseCode || "Not supplied")}</td><td>${escapeHtml(assignmentLabel)}</td></tr></tbody></table>
      <div class="mr-cari-rule"></div><h3>BRIEFING CHECKLIST — COMPLETE WITH THE OPS TEAM</h3><div class="mr-cari-checks"><div>□ Review route and station information</div><div>□ Confirm current operational notices</div><div>□ Confirm local transfer / destination handover where applicable</div><div>□ Record safety briefing completion in the approved OPS workflow</div></div>
      <p class="mr-cari-note">This printable card does not record checklist completion and does not include other staff, passenger, or booking data. Those records remain in their authorized ALTEA / OPS workflows.</p><div class="mr-cari-footer">SKANDI ALTEA · CARI PRINT VIEW · SOURCE RECORDS: ${escapeHtml(source)}</div>`;
    openDialog($("#briefingDialog"));
  }
  function requestRefresh() {
    const from = $("#dateFrom")?.value || "";
    const to = $("#dateTo")?.value || "";
    state.loading = true;
    setSync("Syncing your schedule", "loading");
    post("MYROSTER_REFRESH_REQUEST", { from, to });
  }
  function action(type, payload, button, successText) {
    const requestId = `MYROSTER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    state.pending.set(requestId, { button, successText });
    if (button) button.disabled = true;
    setSync("Saving staff record", "loading");
    post(type, { ...payload, requestId });
  }
  function toDate(value) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  function dateParts(value, timeZone = "") {
    const date = toDate(value);
    if (!date) return { main: "Date not set", sub: "" };
    const options = { weekday: "short", day: "2-digit", month: "short" };
    if (timeZone) options.timeZone = timeZone;
    try {
      const parts = new Intl.DateTimeFormat(undefined, options).formatToParts(date);
      const part = (key) => parts.find((item) => item.type === key)?.value || "";
      return { main: `${part("day")} ${part("month")}`, sub: part("weekday") };
    } catch (_) {
      return { main: date.toLocaleDateString(undefined, { day: "2-digit", month: "short" }), sub: date.toLocaleDateString(undefined, { weekday: "short" }) };
    }
  }
  function formatTime(value, timeZone = "") {
    const date = toDate(value);
    if (!date) return "—";
    const options = { hour: "2-digit", minute: "2-digit", hour12: false };
    if (timeZone) options.timeZone = timeZone;
    try { return new Intl.DateTimeFormat(undefined, options).format(date); }
    catch (_) { return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }
  }
  function formatDateTime(value, timeZone = "") {
    const date = toDate(value);
    if (!date) return "—";
    const options = { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false };
    if (timeZone) options.timeZone = timeZone;
    try { return new Intl.DateTimeFormat(undefined, options).format(date); }
    catch (_) { return date.toLocaleString(undefined, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  }
  function titleCase(value) {
    const clean = text(value).replace(/[_-]+/g, " ").trim().toLowerCase();
    return clean ? clean.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Scheduled";
  }
  function baseLabel() {
    const base = state.boot?.base || {};
    const profile = state.boot?.profile || {};
    const name = text(base.name || profile.baseName || base.city || profile.base || profile.station || "Assigned destination");
    const code = text(base.destinationCode || base.airportIata || profile.destinationCode || base.code || profile.baseCode || "");
    return code && code.toLowerCase() !== name.toLowerCase() ? `${name} · ${code}` : name;
  }
  function statusClass(value) {
    const status = text(value).toUpperCase();
    if (["COMPLETED", "CONFIRMED", "APPROVED", "RECORDED", "CLOCKED IN", "CLOCKED_OUT", "CLOCKED OUT"].includes(status)) return "good";
    if (["PENDING", "PENDING REVIEW", "REQUESTED", "IN REVIEW"].includes(status)) return "warn";
    if (["CANCELLED", "CANCELED", "DECLINED", "REJECTED", "DISRUPTED"].includes(status)) return "bad";
    return "";
  }
  function assignmentPeriod(assignment) {
    const start = toDate(assignment.startAt);
    const end = toDate(assignment.endAt);
    if (!start) return "Schedule time not supplied";
    const tz = assignment.timeZone || "";
    const startText = `${formatDateTime(assignment.startAt, tz)}${tz ? ` · ${tz}` : ""}`;
    if (!end) return startText;
    const sameDay = dateInputValue(start) === dateInputValue(end);
    return sameDay ? `${formatTime(assignment.startAt, tz)}–${formatTime(assignment.endAt, tz)}` : `${startText} – ${formatDateTime(assignment.endAt, tz)}`;
  }
  function visibleAssignments() {
    const from = $("#dateFrom")?.value || "";
    const to = $("#dateTo")?.value || "";
    const status = $("#statusFilter")?.value || "ALL";
    return state.assignments.filter((assignment) => {
      const start = toDate(assignment.startAt);
      const day = start ? dateInputValue(start) : "";
      if (from && day && day < from) return false;
      if (to && day && day > to) return false;
      if (status !== "ALL" && text(assignment.status).toUpperCase() !== status) return false;
      return true;
    }).sort((a, b) => (Date.parse(a.startAt || "") || 0) - (Date.parse(b.startAt || "") || 0));
  }
  function clockedIn() {
    const latest = state.clocks[0];
    if (!latest) return false;
    const type = text(latest.eventType).toUpperCase().replace(/[^A-Z]/g, "");
    return type.includes("IN") && !type.includes("OUT");
  }
  function setActivePanel(panel) {
    state.activePanel = panel;
    $$("[data-nav]").forEach((item) => item.classList.toggle("active", item.dataset.nav === panel));
    $$("[data-panel]").forEach((item) => {
      const active = item.dataset.panel === panel;
      item.classList.toggle("active", active);
      item.hidden = !active;
    });
    if (panel === "time") renderClock();
    if (panel === "requests") renderRequests();
    if (panel === "flights") $("#flightQuery")?.focus();
  }
  function renderProfile() {
    const profile = state.boot?.profile || {};
    const name = profile.displayName || profile.fullName || profile.preferredName || "SKANDI staff";
    const role = profile.jobTitle || profile.position || profile.accessRole || "Destination staff";
    const base = baseLabel();
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
    $("#staffName").textContent = name;
    $("#staffMeta").textContent = role;
    $("#staffInitials").textContent = initials;
    $("#baseCode").textContent = base;
    $("#staffRole").textContent = role;
    $("#rangeBase").textContent = `Assigned destination · ${base}`;
    $("#timeBase").textContent = base;
    $("#timeRole").textContent = role;
    const groupTalk = (state.boot?.apps || []).find((app) => /grouptalk/i.test(`${app.id || ""} ${app.title || ""}`) && app.available !== false && app.path);
    const link = $("#groupTalkLink");
    if (groupTalk && link) {
      link.href = groupTalk.path;
      link.hidden = false;
    }
  }
  function assignmentTitle(assignment) {
    const source = text(assignment.sourceTable);
    if (assignment.label) return assignment.label;
    if (source === "driver_assignments") return "Transfer duty";
    if (source === "tour_assignments") return "Tour assignment";
    if (source === "airport_duty_assignments") return "Airport duty";
    if (source === "vehicle_assignments") return "Vehicle assignment";
    return "Destination shift";
  }
  function statusPill(value) {
    const label = titleCase(value || "Scheduled");
    return `<span class="mr-status ${statusClass(value)}">${escapeHtml(label)}</span>`;
  }
  function rowAction(assignment) {
    const canBrief = assignment.flightNumber || assignment.origin || assignment.destination || assignment.routeId || assignment.reference;
    const briefing = canBrief ? `<button class="mr-row-action" type="button" data-brief-assignment="${escapeHtml(assignment.id)}" data-source-table="${escapeHtml(assignment.sourceTable)}">CARI / Print</button>` : "";
    return `<div class="mr-row-actions">${briefing}<button class="mr-row-action" type="button" data-change="${escapeHtml(assignment.id)}" data-source-table="${escapeHtml(assignment.sourceTable)}">Request change</button></div>`;
  }
  function assignmentRow(assignment) {
    const date = dateParts(assignment.startAt, assignment.timeZone);
    const location = assignment.location || assignment.baseCode || baseLabel();
    const timeZone = assignment.timeZone || "";
    return `<tr>
      <td><span class="mr-date-main">${escapeHtml(date.main)}</span><span class="mr-date-sub">${escapeHtml(date.sub)}</span></td>
      <td><div class="mr-assignment-cell"><strong>${escapeHtml(assignmentTitle(assignment))}</strong><span>${escapeHtml(assignment.details || assignment.notes || assignment.reference || "")}</span></div></td>
      <td><span class="mr-location">${escapeHtml(location)}</span></td>
      <td class="mr-time">${escapeHtml(formatTime(assignment.startAt, timeZone))}</td>
      <td class="mr-time">${escapeHtml(formatTime(assignment.endAt, timeZone))}</td>
      <td>${statusPill(assignment.status)}</td>
      <td>${rowAction(assignment)}</td>
    </tr>`;
  }
  function mobileAssignment(assignment) {
    const date = dateParts(assignment.startAt, assignment.timeZone);
    const location = assignment.location || assignment.baseCode || baseLabel();
    const timeZone = assignment.timeZone || "";
    return `<article class="mr-mobile-row">
      <div class="mr-mobile-head"><div class="mr-mobile-date">${escapeHtml(date.main)}<span>${escapeHtml(date.sub)}</span></div>${statusPill(assignment.status)}</div>
      <div class="mr-mobile-title">${escapeHtml(assignmentTitle(assignment))}</div>
      <div class="mr-mobile-location">${escapeHtml(location)}${assignment.details ? ` · ${escapeHtml(assignment.details)}` : ""}</div>
      <div class="mr-mobile-times"><span>Start <b>${escapeHtml(formatTime(assignment.startAt, timeZone))}</b></span><span>End <b>${escapeHtml(formatTime(assignment.endAt, timeZone))}</b></span></div>
      <div class="mr-mobile-action">${rowAction(assignment)}</div>
    </article>`;
  }
  function nextAssignment() {
    const now = Date.now();
    return state.assignments.filter((assignment) => {
      const start = Date.parse(assignment.startAt || "");
      const status = text(assignment.status).toUpperCase();
      return Number.isFinite(start) && start >= now && !["CANCELLED", "CANCELED", "COMPLETED", "DECLINED"].includes(status);
    }).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0] || null;
  }
  function renderNext() {
    const host = $("#nextAssignment");
    const actionHost = $("#nextAction");
    const next = nextAssignment();
    if (!next) {
      host.innerHTML = '<div class="mr-next-empty">Your upcoming SKANDI assignments will appear here when published.</div>';
      actionHost.innerHTML = "";
      return;
    }
    const date = dateParts(next.startAt, next.timeZone);
    const location = next.location || next.baseCode || baseLabel();
    host.innerHTML = `<div class="mr-next-main"><div class="mr-next-date"><strong>${escapeHtml(date.main)}</strong><span>${escapeHtml(date.sub)}</span></div><div class="mr-next-detail"><strong>${escapeHtml(assignmentTitle(next))}</strong><span>${escapeHtml(location)}${next.details ? ` · ${escapeHtml(next.details)}` : ""}</span></div><div class="mr-next-time">${escapeHtml(assignmentPeriod(next))}</div></div>`;
    const type = clockedIn() ? "CLOCK_OUT" : "CLOCK_IN";
    const label = type === "CLOCK_OUT" ? "Clock out" : "Clock in";
    actionHost.innerHTML = `<button class="mr-btn mr-btn-primary" type="button" data-clock="${type}" data-assignment-id="${escapeHtml(next.id)}" data-source-table="${escapeHtml(next.sourceTable)}">${label}</button>`;
  }
  function renderSchedule() {
    const rows = visibleAssignments();
    $("#assignmentCount").textContent = String(rows.length);
    const body = $("#scheduleBody");
    const mobile = $("#mobileSchedule");
    if (!rows.length) {
      const message = '<div class="mr-empty"><strong>No published assignments in this date range</strong><span>When SKANDI publishes a shift or destination duty for you, it will appear here.</span></div>';
      body.innerHTML = `<tr><td colspan="7">${message}</td></tr>`;
      mobile.innerHTML = message;
    } else {
      body.innerHTML = rows.map(assignmentRow).join("");
      mobile.innerHTML = rows.map(mobileAssignment).join("");
    }
    renderNext();
    renderTimeSummary();
  }
  function renderTimeSummary() {
    const hours = Number(state.boot?.hoursLast30Days);
    const display = Number.isFinite(hours) ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(hours) : "—";
    $("#hoursValue").textContent = display;
    $("#timeHours").textContent = display;
    const latest = state.clocks[0];
    if (latest) {
      const status = clockedIn() ? "Clocked in" : titleCase(latest.eventType);
      $("#clockSummary").textContent = `${status} · ${formatDateTime(latest.eventAt, latest.timeZone)}`;
      $("#latestClock").textContent = status;
      $("#latestClockTime").textContent = formatDateTime(latest.eventAt, latest.timeZone);
    } else {
      $("#clockSummary").textContent = "No attendance event recorded in this period.";
      $("#latestClock").textContent = "No event recorded";
      $("#latestClockTime").textContent = "—";
    }
    const balances = state.timeOffBalances;
    $("#balanceList").innerHTML = balances.length ? balances.map((balance) => `<div class="mr-balance-item"><strong>${escapeHtml(balance.balanceHours ?? "—")} ${escapeHtml(balance.unit || "hrs")}</strong><span>${escapeHtml(titleCase(balance.type || "Time off"))}${balance.year ? ` · ${escapeHtml(balance.year)}` : ""}</span></div>`).join("") : '<span class="mr-summary-foot">No balance records are available for your profile.</span>';
  }
  function renderClock() {
    const rows = state.clocks;
    const body = $("#clockBody");
    const mobile = $("#mobileClock");
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="5"><div class="mr-empty"><strong>No attendance events recorded</strong><span>Time events connected to your staff ID will appear here.</span></div></td></tr>';
      mobile.innerHTML = '<div class="mr-empty"><strong>No attendance events recorded</strong><span>Time events connected to your staff ID will appear here.</span></div>';
      return;
    }
    body.innerHTML = rows.map((row) => `<tr><td>${escapeHtml(formatDateTime(row.eventAt, row.timeZone))}</td><td>${escapeHtml(titleCase(row.eventType))}</td><td>${escapeHtml(row.assignmentLabel || "—")}</td><td>${escapeHtml(row.location || baseLabel())}</td><td>${statusPill(row.status)}</td></tr>`).join("");
    mobile.innerHTML = rows.map((row) => `<article class="mr-mobile-row"><div class="mr-mobile-head"><strong>${escapeHtml(formatDateTime(row.eventAt, row.timeZone))}</strong>${statusPill(row.status)}</div><div class="mr-mobile-title">${escapeHtml(titleCase(row.eventType))}</div><div class="mr-mobile-location">${escapeHtml(row.assignmentLabel || row.location || "Assigned destination")}</div></article>`).join("");
  }
  function renderRequests() {
    const rows = state.requests;
    const body = $("#requestsBody");
    const mobile = $("#mobileRequests");
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="5"><div class="mr-empty"><strong>No requests submitted</strong><span>Time-off or schedule-change requests you submit will appear here.</span></div></td></tr>';
      mobile.innerHTML = '<div class="mr-empty"><strong>No requests submitted</strong><span>Time-off or schedule-change requests you submit will appear here.</span></div>';
      return;
    }
    body.innerHTML = rows.map((row) => `<tr><td>${escapeHtml(formatDateTime(row.createdAt))}</td><td>${escapeHtml(titleCase(row.requestType))}</td><td>${escapeHtml(row.summary || "—")}</td><td>${statusPill(row.status)}</td><td>${escapeHtml(formatDateTime(row.updatedAt || row.createdAt))}</td></tr>`).join("");
    mobile.innerHTML = rows.map((row) => `<article class="mr-mobile-row"><div class="mr-mobile-head"><strong>${escapeHtml(titleCase(row.requestType))}</strong>${statusPill(row.status)}</div><div class="mr-mobile-location">${escapeHtml(row.summary || "—")}</div><div class="mr-mobile-times"><span>Submitted <b>${escapeHtml(formatDateTime(row.createdAt))}</b></span></div></article>`).join("");
  }
  function render() {
    if (!state.boot?.ok) return;
    state.assignments = Array.isArray(state.boot.assignments) ? state.boot.assignments : [];
    state.requests = Array.isArray(state.boot.requests) ? state.boot.requests : [];
    state.clocks = Array.isArray(state.boot.clockEvents) ? state.boot.clockEvents : [];
    state.timeOffBalances = Array.isArray(state.boot.timeOffBalances) ? state.boot.timeOffBalances : [];
    renderProfile();
    renderSchedule();
    renderClock();
    renderRequests();
    const synced = state.boot.syncedAt ? formatDateTime(state.boot.syncedAt) : "";
    setSync(synced ? `Synced ${synced}` : "Connected to SKANDI schedule", "ready");
    state.loading = false;
    state.lastSync = Date.now();
  }
  function showAccessError(message) {
    const error = $("#accessError");
    const detail = $("#accessErrorText");
    if (detail) detail.textContent = message || "Your SKANDI destination staff profile could not be verified.";
    if (error) error.hidden = false;
  }
  function errorMessage(code) {
    const messages = {
      MYROSTER_DESTINATION_ACCESS_REQUIRED: "MyRoster is limited to staff assigned to a SKANDI destination or airport team.",
      MYROSTER_DESTINATION_BASE_REQUIRED: "Your SKANDI profile needs an assigned destination or base before this page can load.",
      STAFF_AUTH_REQUIRED: "Sign in to RIAINTRA to view your staff schedule.",
      STAFF_ACCESS_DENIED: "Your SKANDI staff access could not be confirmed.",
      MYROSTER_ASSIGNMENT_NOT_FOUND: "That assignment is no longer available for your staff account.",
      MYROSTER_TIMEOFF_DATES_INVALID: "Enter a valid time-off date range.",
      MYROSTER_REQUEST_REASON_REQUIRED: "Add a short note explaining your schedule-change request.",
      MYROSTER_FLIGHT_SEARCH_TERM_REQUIRED: "Enter at least two characters for a flight or airport search.",
      MYROSTER_FLIGHT_SEARCH_RANGE_INVALID: "Choose a flight search date range of up to 14 days.",
      MYROSTER_FLIGHT_SEARCH_INVALID: "The flight search could not be completed."
    };
    return messages[text(code)] || text(code) || "The request could not be completed. Refresh and try again.";
  }
  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "open");
  }
  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }
  function submitTimeOff(button) {
    const form = $("#timeOffForm");
    const data = new FormData(form);
    const startDate = text(data.get("startDate")).trim();
    const endDate = text(data.get("endDate")).trim();
    const notes = text(data.get("notes")).trim();
    if (!startDate || !endDate || startDate > endDate) return showToast("Choose a valid start and end date.", true);
    action("MYROSTER_TIMEOFF_REQUEST", { startDate, endDate, notes }, button, "Time-off request submitted for review.");
  }
  function submitShiftChange(button) {
    const form = $("#shiftChangeForm");
    const reason = text(new FormData(form).get("reason")).trim();
    if (!reason) return showToast("Describe the schedule change you are requesting.", true);
    action("MYROSTER_SHIFT_CHANGE_REQUEST", { reason, assignment: state.selectedAssignment || null }, button, "Schedule-change request submitted for review.");
  }
  function downloadCsv() {
    const rows = visibleAssignments();
    if (!rows.length) return showToast("There are no assignments in this date range to export.", true);
    const columns = ["date", "assignment", "location", "start_at", "end_at", "status"];
    const csv = [columns.join(","), ...rows.map((row) => [
      row.startAt ? dateInputValue(row.startAt) : "",
      assignmentTitle(row), row.location || row.baseCode || "", row.startAt || "", row.endAt || "", row.status || ""
    ].map((value) => `"${text(value).replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "skandi-my-schedule.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  root.addEventListener("click", (event) => {
    if (event.target.closest("#closeBriefing")) { closeDialog($("#briefingDialog")); return; }
    if (event.target.closest("#printBriefing")) { window.print(); return; }
    const flightBriefing = event.target.closest("[data-brief-flight]");
    if (flightBriefing) {
      const flight = state.flights.find((row) => row.id === flightBriefing.dataset.briefFlight);
      if (flight) renderBriefing(flight);
      return;
    }
    const assignmentBriefing = event.target.closest("[data-brief-assignment]");
    if (assignmentBriefing) {
      const assignment = state.assignments.find((row) => row.id === assignmentBriefing.dataset.briefAssignment && row.sourceTable === assignmentBriefing.dataset.sourceTable);
      if (assignment) renderBriefing({}, assignment);
      return;
    }
    const groupTalk = event.target.closest("#groupTalkLink");
    if (groupTalk && groupTalk.href && groupTalk.getAttribute("href") !== "#") {
      event.preventDefault();
      post("MYROSTER_NAVIGATE", { path: groupTalk.pathname });
      return;
    }
    const nav = event.target.closest("[data-nav]");
    if (nav) { event.preventDefault(); setActivePanel(nav.dataset.nav); return; }
    const refresh = event.target.closest("#refreshBtn, #timeRefreshBtn");
    if (refresh) { requestRefresh(); return; }
    if (event.target.closest("#exportBtn")) { downloadCsv(); return; }
    if (event.target.closest("#openTimeOff, #requestsTimeOff")) { openDialog($("#timeOffDialog")); return; }
    if (event.target.closest("#openShiftChange")) { state.selectedAssignment = null; $("#shiftChangeAssignment").textContent = "Describe the date or assignment you need your local schedule team to review."; openDialog($("#shiftChangeDialog")); return; }
    const change = event.target.closest("[data-change]");
    if (change) {
      const assignment = state.assignments.find((row) => row.id === change.dataset.change && row.sourceTable === change.dataset.sourceTable);
      state.selectedAssignment = assignment ? { id: assignment.id, sourceTable: assignment.sourceTable, label: assignmentTitle(assignment), startAt: assignment.startAt } : null;
      const description = state.selectedAssignment ? `${state.selectedAssignment.label}${state.selectedAssignment.startAt ? ` · ${formatDateTime(state.selectedAssignment.startAt)}` : ""}` : "This assignment is no longer available.";
      $("#shiftChangeAssignment").textContent = `Assignment under review: ${description}`;
      openDialog($("#shiftChangeDialog"));
      return;
    }
    const clock = event.target.closest("[data-clock]");
    if (clock) {
      const eventType = clock.dataset.clock;
      const assignmentId = clock.dataset.assignmentId;
      const sourceTable = clock.dataset.sourceTable;
      if (!assignmentId || !sourceTable) return showToast("Select a published assignment before recording time.", true);
      action("MYROSTER_CLOCK_EVENT_REQUEST", { eventType, assignmentId, sourceTable }, clock, `${titleCase(eventType)} recorded.`);
      return;
    }
    if (event.target.closest("#submitTimeOff")) { submitTimeOff(event.target.closest("#submitTimeOff")); return; }
    if (event.target.closest("#submitShiftChange")) { submitShiftChange(event.target.closest("#submitShiftChange")); }
  });
  ["#dateFrom", "#dateTo", "#statusFilter"].forEach((selector) => $(selector)?.addEventListener("change", () => {
    if (selector === "#statusFilter") renderSchedule();
    else requestRefresh();
  }));
  $("#flightSearchForm")?.addEventListener("submit", (event) => { event.preventDefault(); requestFlightSearch(); });
  $("#briefingDialog")?.addEventListener("click", (event) => {
    if (event.target === $("#briefingDialog")) closeDialog($("#briefingDialog"));
  });
  $("#timeOffForm")?.addEventListener("submit", (event) => event.preventDefault());
  $("#shiftChangeForm")?.addEventListener("submit", (event) => event.preventDefault());

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    const message = event.data || {};
    if (message.source !== PARENT_SOURCE) return;
    const payload = message.payload || {};
    if (message.type === "SKANDI_MASTER_CONFIG") {
      applyMasterConfig(payload);
      return;
    }
    if (message.type === "MYROSTER_FLIGHT_SEARCH_RESULTS") {
      if (payload.requestId && state.flightRequestId && payload.requestId !== state.flightRequestId) return;
      const button = $("#flightSearchButton");
      if (button) button.disabled = false;
      state.flightRequestId = "";
      renderFlightResults(payload.flights);
      const count = Array.isArray(payload.flights) ? payload.flights.length : 0;
      $("#flightSearchStatus").textContent = count
        ? `${count} matching record${count === 1 ? "" : "s"} · ${payload.dateRange?.from || ""} to ${payload.dateRange?.to || ""} · ${payload.sources?.join(" + ") || "ALTEA"}`
        : `No matching records · ${payload.dateRange?.from || ""} to ${payload.dateRange?.to || ""} · searched ${payload.sources?.join(" + ") || "ALTEA"}`;
      return;
    }
    if (message.type === "MYROSTER_BOOTSTRAP") {
      state.boot = payload;
      state.loading = false;
      if (payload.ok === false || payload.authorized === false) {
        showAccessError(errorMessage(payload.reason || "STAFF_ACCESS_DENIED"));
        setSync("Staff access required", "error");
        return;
      }
      render();
      return;
    }
    if (message.type === "MYROSTER_ACTION_OK") {
      const pending = state.pending.get(payload.requestId);
      if (pending) {
        state.pending.delete(payload.requestId);
        if (pending.button) pending.button.disabled = false;
        if (pending.button?.id === "submitTimeOff") { closeDialog($("#timeOffDialog")); $("#timeOffForm").reset(); }
        if (pending.button?.id === "submitShiftChange") { closeDialog($("#shiftChangeDialog")); $("#shiftChangeForm").reset(); state.selectedAssignment = null; }
        showToast(pending.successText || "SKANDI staff record saved.");
      }
      setSync("Connected to SKANDI schedule", "ready");
      return;
    }
    if (message.type === "MYROSTER_ERROR") {
      if (state.flightRequestId && payload.requestId === state.flightRequestId) {
        state.flightRequestId = "";
        if ($("#flightSearchButton")) $("#flightSearchButton").disabled = false;
        $("#flightSearchStatus").textContent = errorMessage(payload.code || payload.message);
      }
      const pending = state.pending.get(payload.requestId);
      if (pending) {
        state.pending.delete(payload.requestId);
        if (pending.button) pending.button.disabled = false;
      }
      const messageText = errorMessage(payload.code || payload.message);
      if (/DESTINATION_ACCESS_REQUIRED|DESTINATION_BASE_REQUIRED|STAFF_AUTH_REQUIRED|STAFF_ACCESS_DENIED/.test(text(payload.code || payload.message))) showAccessError(messageText);
      showToast(messageText, true);
      setSync("Could not save or refresh", "error");
    }
  });

  const today = new Date();
  $("#dateFrom").value = dateInputValue(offsetDate(today, -14));
  $("#dateTo").value = dateInputValue(offsetDate(today, 60));
  $("#flightDateFrom").value = dateInputValue(today);
  $("#flightDateTo").value = dateInputValue(offsetDate(today, 6));
  setSync("Connecting to staff schedule", "loading");
  post("MASTER_CONFIG_REQUEST", { purpose: "ALTEA_LOGO" });
  post("MYROSTER_READY", { from: $("#dateFrom").value, to: $("#dateTo").value });
})();
