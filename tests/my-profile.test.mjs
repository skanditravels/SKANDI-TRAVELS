import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { setImmediate } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import { inventory } from "../scripts/lib/inventory.mjs";
import { compilePage } from "../scripts/lib/compile.mjs";
import { isSafeInternalRoute } from "../src/public/siteMap.js";

const require = createRequire(new URL("../scripts/package.json", import.meta.url));
const { JSDOM } = require("jsdom");
const root = fileURLToPath(new URL("..", import.meta.url));
const { rows } = await inventory(root);
const html = await compilePage(root, rows.find(row => row.key === "myProfile"));
const controller = (await readFile(new URL("../src/pages/My Club Profile.u4k31.js", import.meta.url), "utf8"))
  .replace(/^import\s+[\s\S]*?\s+from\s+"[^"]+";\r?\n/gm, "");
const travelerId = "22222222-2222-4222-8222-222222222222";
const trip = { id: "test-booking", bookingReference: "SK1234", departureDate: "2099-04-20", status: "CONFIRMED" };

function memberData() {
  return {
    ok: true,
    profile: {
      id: "test-member", firstName: "Ada", lastName: "Lane", email: "ada@example.test",
      preferredDepartureAirportId: "retired-airport", payload: { seatPreference: "aisle" }
    },
    club: { enrolled: true, tier: { name: "Silver" }, pointsBalance: 200 },
    trips: { upcoming: [trip], history: [], carts: [] },
    references: { airports: [{ id: "current-airport", iata: "ARN", name: "Arlanda" }] },
    travelers: [],
    documents: [{ id: "test-document", bookingId: trip.id, definition_name: "Travel confirmation", status: "ISSUED" }]
  };
}

function setup(t, { query = {}, handlers = {} } = {}) {
  const dom = new JSDOM(html, {
    url: "https://embed.example.test/profile.html", runScripts: "outside-only", pretendToBeVisual: true
  });
  const window = dom.window;
  const sent = [];
  const replies = [];
  const navigations = [];
  const message = (type, payload) => window.dispatchEvent(new window.MessageEvent("message", {
    source: window, data: { source: "SKANDI_WIX_PARENT", type, payload }
  }));
  let inbound;
  let onChange;
  let bootstrapCalls = 0;
  let startupTimeout;
  const data = memberData();
  const location = {
    query, onChange: callback => { onChange = callback; },
    queryParams: { add: values => { Object.assign(location.query, values); onChange(); } },
    to: path => navigations.push(path)
  };
  const embed = {
    onMessage: callback => { inbound = callback; },
    postMessage: reply => {
      replies.push(reply);
      queueMicrotask(() => message(reply.type, reply.payload));
    }
  };
  const $w = id => {
    assert.equal(id, "#htmlMyProfile");
    return embed;
  };
  $w.onReady = handler => handler();
  const timers = new Set();
  t.after(() => {
    for (const timer of timers) clearTimeout(timer);
    window.close();
  });
  vm.runInNewContext(controller, {
    $w, wixLocationFrontend: location, isSafeInternalRoute, URL, console,
    setTimeout: (callback, delay) => {
      const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
      timers.add(timer);
      return timer;
    },
    clearTimeout,
    getCustomerProfileBootstrap: async () => {
      bootstrapCalls++;
      return structuredClone(await (handlers.bootstrap ? handlers.bootstrap(data) : data));
    },
    ...handlers
  });
  window.Element.prototype.scrollIntoView = function () {};
  const browserTimeout = window.setTimeout.bind(window);
  const browserClearTimeout = window.clearTimeout.bind(window);
  window.setTimeout = (handler, delay, ...args) => {
    if (delay === 28000) {
      startupTimeout = handler;
      return 28000;
    }
    return browserTimeout(handler, delay, ...args);
  };
  window.clearTimeout = id => {
    if (id === 28000) startupTimeout = null;
    else browserClearTimeout(id);
  };
  window.postMessage = data => {
    sent.push(data);
    queueMicrotask(() => inbound({ data }));
  };
  window.eval(window.document.querySelector('script[data-skandi-part="my-profile"]').textContent);
  const find = selector => window.document.querySelector(selector);
  const select = page => {
    const control = find("#profileSectionSelect");
    control.value = page;
    control.dispatchEvent(new window.Event("change", { bubbles: true }));
  };
  return {
    window, find, select, data, sent, replies, navigations, message,
    current: () => find(".view.active").dataset.page,
    retryTimeout: () => startupTimeout(),
    bootstraps: () => bootstrapCalls
  };
}

test("the profile opens a legacy trip link, shows one greeting, and keeps the active section on refresh", async t => {
  const site = setup(t, { query: { tab: "trips" } });
  await setImmediate();
  assert.equal(site.current(), "trips-upcoming");
  assert.equal(site.find("#profileMasthead").hidden, false);
  assert.match(site.find("#greetingLine").textContent, /Ada/);
  assert.match(site.find("#clubView h2").textContent, /Club Overview/);
  assert.equal(site.window.document.querySelectorAll("#greetingLine").length, 1);
  assert.equal(site.find("#profileSectionSelect").options.length, 14);
  assert.equal(site.bootstraps(), 1);
  assert.ok(site.sent.every(message => message.type !== "CUSTOMER_DOCUMENT_CENTER_READY"));

  site.select("profile-saved");
  assert.equal(site.current(), "profile-saved");
  assert.equal(site.find('[data-view="saved"]').getAttribute("aria-current"), "page");
  site.message("MY_PROFILE_DATA", { ...site.data, requestedSection: "club", requestedView: "overview" });
  assert.equal(site.current(), "profile-saved");
});

test("a missing bootstrap can be retried from the account page", async t => {
  let finish;
  const site = setup(t, {
    query: { section: "profile", view: "travelers" },
    handlers: { bootstrap: () => new Promise(resolve => { finish = resolve; }) }
  });
  await setImmediate();
  site.retryTimeout();
  assert.match(site.find("#profileLoadMessage").textContent, /longer than expected/);
  assert.equal(site.find("#profileRetry").hidden, false);
  site.find("#profileRetry").click();
  finish(site.data);
  await setImmediate();
  assert.equal(site.find("#profileLoadState").hidden, true);
  assert.equal(site.current(), "profile-travelers");
  assert.equal(site.bootstraps(), 1);
});

test("contact and travel forms submit only their fields and refresh once after each confirmed save", async t => {
  const submitted = [];
  let site;
  site = setup(t, {
    query: { section: "profile", view: "details" },
    handlers: {
      getCustomerEmailPreferences: async () => ({ ok: true, subscribed: false }),
      updateCustomerProfile: async ({ profile }) => {
        submitted.push(structuredClone(profile));
        site.data.profile = { ...site.data.profile, ...profile };
        return { ok: true, profile: site.data.profile };
      }
    }
  });
  await setImmediate();
  const contact = site.find("#contactForm");
  contact.elements.firstName.value = "Ada-Marie";
  contact.requestSubmit();
  await setImmediate();
  assert.deepEqual(Object.keys(submitted[0]), ["firstName", "lastName", "displayName", "email", "phone"]);
  assert.match(contact.querySelector(".form-status").textContent, /Contact details saved/);
  assert.equal(site.current(), "profile-details");
  assert.equal(site.bootstraps(), 2);
  site.select("account-settings");
  await setImmediate();
  const preferences = site.find("#profileForm");
  assert.equal(preferences.elements.preferredDepartureAirportId.value, "retired-airport");
  preferences.elements.seatPreference.value = "window";
  preferences.requestSubmit();
  await setImmediate();
  assert.equal(submitted[1].seatPreference, "window");
  assert.equal(Object.hasOwn(submitted[1], "preferredDepartureAirportId"), false);
  assert.equal(Object.hasOwn(submitted[1], "email"), false);
  assert.match(preferences.querySelector(".form-status").textContent, /Travel preferences saved/);
  assert.equal(site.current(), "account-settings");
  assert.equal(site.bootstraps(), 3);
});

test("the traveler form validates names and saves through the existing profile handler", async t => {
  let site;
  site = setup(t, {
    query: { section: "profile", view: "travelers" },
    handlers: {
      saveCustomerTraveler: async ({ traveler }) => {
        assert.equal(traveler.firstName, "Grace");
        assert.equal(traveler.lastName, "Lee");
        const row = { ...traveler, id: travelerId };
        site.data.travelers.push(row);
        return { ok: true, traveler: row };
      }
    }
  });
  await setImmediate();
  site.find("#addTraveler").click();
  const form = site.find("#travelerForm");
  form.requestSubmit();
  assert.ok(!site.sent.some(message => message.type === "MY_PROFILE_SAVE_TRAVELER"));
  form.elements.firstName.value = "Grace";
  form.elements.lastName.value = "Lee";
  site.find("#saveTravelerModal").click();
  await setImmediate();
  assert.match(site.find("#travelerGrid").textContent, /Grace Lee/);
  assert.equal(site.find("#modalShade").classList.contains("open"), false);
  assert.equal(site.bootstraps(), 2);
});

test("support opens the member’s linked trip and presents documents as clickable links", async t => {
  const site = setup(t, {
    query: { section: "support", view: "cases" },
    handlers: {
      getCustomerSupportBootstrap: async () => ({ workflows: [] }),
      listCustomerSupportCases: async () => ({ cases: [{ caseId: "test-case", subject: "My trip" }] }),
      getCustomerSupportCase: async () => ({ case: { caseId: "test-case", bookingRef: "sk1234" }, messages: [] }),
      getCustomerBookingDetail: async ({ bookingId }) => {
        assert.equal(bookingId, trip.id);
        return { ok: true, booking: trip };
      },
      getCustomerDocument: async () => ({
        ok: true, document: { id: "test-document", fileUrl: "https://files.example.test/trip.pdf" }
      })
    }
  });
  await setImmediate();
  site.find('[data-support-case="test-case"]').click();
  await setImmediate();
  assert.equal(site.find("#supportDuffel").hidden, false);
  site.find("#supportDuffel").click();
  await setImmediate();
  assert.equal(site.current(), "trips-upcoming");
  assert.equal(site.navigations.length, 0);
  site.find("[data-open-doc]").click();
  await setImmediate();
  assert.equal(site.find("#bookingDocumentStatus a").href, "https://files.example.test/trip.pdf");
  assert.equal(site.find("#bookingDocumentStatus a").target, "_blank");
});

test("saving a partial traveler record preserves stored details and rejects unconfirmed writes", async () => {
  const member = { id: "member-profile", member_id: "test-member", wix_member_id: "test-member" };
  const traveler = { id: travelerId, first_name: "Grace", middle_name: "Ann", last_name: "Lee",
    passport_country_id: "old-country", traveler_type: "Companion", payload: { existing: true } };
  let available = true;
  const patches = [];
  const raw = await readFile(new URL("../src/backend/SKANDI_CORE/customerProfile.js", import.meta.url), "utf8");
  const module = raw.replace(/^import\s+[\s\S]*?\s+from\s+"[^"]+";\r?\n/gm, "").replace(/^export /gm, "");
  const core = vm.runInNewContext(module + "\n({saveCustomerTravelerCore,updateCustomerProfileCore})", {
    restRequest: async ({ table, method, query, body }) => {
      if (method === "PATCH") {
        patches.push({ table, query, body });
        return available && table === "customer_travelers" ? [{ ...traveler, ...body }] : [];
      }
      return table === "customer_profiles" ? [member] : [traveler];
    }
  });
  const context = { memberId: member.member_id };
  const response = await core.saveCustomerTravelerCore(context, { traveler: { id: travelerId, phone: "555-0100" } });
  assert.equal(response.traveler.middleName, "Ann");
  assert.equal(response.traveler.passportCountryId, "old-country");
  assert.equal(patches[0].query.member_id, "eq.test-member");
  assert.deepEqual(Object.keys(patches[0].body).sort(), ["phone", "updated_at"]);
  available = false;
  await assert.rejects(core.saveCustomerTravelerCore(context, { traveler: { id: travelerId, phone: "555-0100" } }),
    { code: "TRAVELER_SAVE_NOT_CONFIRMED" });
  await assert.rejects(core.updateCustomerProfileCore(context, { profile: { firstName: "Ada" } }),
    { code: "PROFILE_SAVE_NOT_CONFIRMED" });
});
