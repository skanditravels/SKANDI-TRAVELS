import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { email, text } from "../src/backend/SKANDI_CORE/platformValidation.js";

async function loadCore(name, exports, globals) {
  const source = await readFile(new URL(`../src/backend/SKANDI_CORE/${name}.js`, import.meta.url), "utf8");
  return vm.runInNewContext(
    source.replace(/^import\s+[\s\S]*?\s+from\s+"[^"]+";\r?\n/gm, "").replace(/^export /gm, "")
      + "\n({" + exports.join(",") + "})",
    { setTimeout, clearTimeout, email, text, ...globals }
  );
}

const { SkandiError } = await loadCore("platformErrors", ["SkandiError"]);

const custom = {
  displayName: "custom.display-name-dasjabzrwyrxiyzzhoomgz",
  contactEmail: "custom.email-rmsoqabjtblhxdvbiycddqxyzbdre",
  airport: "custom.preferred-departure-airport-cakncye",
  language: "custom.preferred-language-spesyasikspzvwri",
  currency: "custom.preferred-currency-lxphvjopsalkpmlg",
  country: "custom.country-of-residence-kezceuhlmwruxk",
  consent: "custom.marketing-consent-xvqgbufxyjlpjyvoo"
};

async function session(overrides = {}) {
  let saved = {
    _id: "member-example", loginEmail: "login@example.test", loginEmailVerified: true,
    contact: {
      firstName: "Ada", lastName: "Lane", phones: ["+15550100", "+15550101"],
      customFields: {
        [custom.displayName]: { value: "Ada L." }, [custom.contactEmail]: { value: "travel@example.test" },
        [custom.language]: { value: "SV" }, [custom.currency]: { value: "SEK" }, [custom.airport]: { value: "ARN" }
      }
    }
  };
  const changes = [];
  const clone = () => structuredClone(saved);
  const api = await loadCore("customerSession", [
    "getCurrentCustomerMemberCore", "getCustomerMemberFieldsCore", "updateCustomerMemberFieldsCore",
    "getCustomerWixLoyaltyCore", "getCustomerHeaderSessionCore", "updateCustomerEmailPreferencesCore"
  ], {
    SkandiError, auth: { elevate: callback => callback }, elevate: callback => callback,
    currentMember: { getMember: async () => ({ _id: saved._id, loginEmail: saved.loginEmail, contactDetails: clone().contact }) },
    members: {
      getMember: async (id, option) => {
        assert.equal(id, saved._id);
        assert.equal(option.fieldsets[0], "FULL");
        return clone();
      },
      updateMember: async (id, patch) => {
        assert.equal(id, saved._id);
        changes.push(structuredClone(patch));
        saved.contact = {
          ...saved.contact,
          ...patch.contact,
          customFields: { ...saved.contact.customFields, ...patch.contact.customFields }
        };
      },
      deleteMemberPhones: async () => { saved.contact.phones = []; }
    },
    accounts: { getCurrentMemberAccount: async () => ({
      account: { _id: "wix-rewards", points: { balance: 380 }, _createdDate: "2025-01-20", tier: { id: "old-tier", points: 700 } }
    }) },
    programs: { getLoyaltyProgram: async () => ({ loyaltyProgram: { status: "ACTIVE", name: "SKANDI Club", pointDefinition: { customName: "SKANDI Points" } } }) },
    tiers: { getTiersProgram: async () => ({ programSettings: { status: "DISABLED" }, tiers: [] }) },
    emailSubscriptions: {
      queryEmailSubscriptions: async () => ({ subscriptions: [] }),
      upsertEmailSubscription: async ({ subscription }) => ({ subscription })
    },
    ...overrides
  });
  return { api, changes, saved: clone };
}

test("native member fields round trip under the authenticated Wix ID with private custom fields", async () => {
  const { api, changes, saved } = await session();
  const member = await api.getCurrentCustomerMemberCore({ account: true });
  assert.equal(api.getCustomerMemberFieldsCore(member).preferredDepartureAirport, "ARN");
  await api.updateCustomerMemberFieldsCore(member, {
    firstName: "Ada-Marie", preferredDepartureAirport: "JFK", email: "new-travel@example.test",
    countryOfResidence: "US", phone: "+15550102", loginEmail: "changes-are-ignored@example.test"
  });
  const patch = changes[0];
  assert.deepEqual(Object.keys(patch), ["contact"]);
  assert.deepEqual(patch.contact.phones, ["+15550102", "+15550101"]);
  assert.equal(patch.contact.customFields[custom.airport].value, "JFK");
  assert.equal(patch.contact.customFields[custom.contactEmail].value, "new-travel@example.test");
  assert.equal(patch.contact.customFields[custom.country].value, "US");
  assert.equal(saved().contact.customFields[custom.language].value, "SV");
  assert.equal(saved().loginEmail, "login@example.test");
});

test("Wix publishes the points balance and tier settings to the profile and header", async () => {
  const { api } = await session();
  const club = await api.getCustomerWixLoyaltyCore();
  const header = await api.getCustomerHeaderSessionCore();
  assert.equal(club.pointsBalance, 380);
  assert.equal(club.programStatus, "ACTIVE");
  assert.equal(club.tiersEnabled, false);
  assert.equal(club.nextTier, null);
  assert.equal(club.progress, null);
  assert.equal(header.points, club.pointsBalance);
  assert.equal(header.pointsName, "SKANDI Points");
  assert.equal(header.loyaltyAvailable, true);
});

test("loyalty distinguishes missing membership from an unavailable balance", async () => {
  const missing = await session({
    accounts: { getCurrentMemberAccount: async () => { throw Object.assign(new Error(), { status: 404 }); } }
  });
  const unavailable = await session({
    accounts: { getCurrentMemberAccount: async () => { throw Object.assign(new Error(), { status: 503 }); } }
  });
  assert.equal((await missing.api.getCustomerWixLoyaltyCore()).status, "NOT_ENROLLED");
  const failed = await unavailable.api.getCustomerWixLoyaltyCore();
  assert.equal(failed.status, "UNAVAILABLE");
  assert.equal(failed.pointsBalance, null);
});

test("only a confirmed Wix subscription is mirrored to the private member field and the owned travel profile", async () => {
  const writes = [];
  const { api, changes } = await session({
    restRequest: async request => {
      if (request.method === "PATCH") {
        writes.push(request);
        return [{ id: "profile-example", marketing_consent: true }];
      }
      return [{ id: "profile-example", marketing_consent: false }];
    }
  });
  const result = await api.updateCustomerEmailPreferencesCore({ subscribed: true, consentConfirmed: true });
  assert.equal(result.subscribed, true);
  assert.equal(result.accountSynced, true);
  assert.equal(changes[0].contact.customFields[custom.consent].value, "Yes");
  assert.equal(writes[0].query.wix_member_id, "eq.member-example");
  assert.equal(writes[0].query.id, "eq.profile-example");

  const unconfirmed = await session({
    emailSubscriptions: { upsertEmailSubscription: async () => ({}), queryEmailSubscriptions: async () => ({ subscriptions: [] }) }
  });
  await assert.rejects(
    unconfirmed.api.updateCustomerEmailPreferencesCore({ subscribed: true, consentConfirmed: true }),
    { code: "EMAIL_PREFERENCES_SAVE_NOT_CONFIRMED" }
  );
  assert.equal(unconfirmed.changes.length, 0);
});

test("Wix preference codes are mapped to the verified travel record and saved without editing identity", async () => {
  const airport = "11111111-1111-4111-8111-111111111111";
  const language = "22222222-2222-4222-8222-222222222222";
  const profile = { id: "profile-example", member_id: "member-example", wix_member_id: "member-example", payload: {} };
  const member = { loginEmail: "login@example.test", preferredLanguage: "SV" };
  const nativeWrites = [];
  let mirror;
  const core = await loadCore("customerProfile", ["updateCustomerProfileCore"], {
    validatedEmail: email,
    getCustomerMemberFieldsCore: value => value,
    updateCustomerMemberFieldsCore: async (target, changes) => {
      nativeWrites.push(changes);
      return { ...target, ...changes };
    },
    restRequest: async ({ table, query, method, body }) => {
      if (method === "PATCH") {
        assert.equal(query.wix_member_id, "eq.member-example");
        mirror = body;
        return [{ ...profile, ...body }];
      }
      if (table === "customer_profiles") return [profile];
      if (table === "travel_info_airports") return [{ ID: airport, iata: "JFK" }];
      if (table === "languages") return [{ id: language, language_code: "SV", language_name: "Swedish" }];
      return [];
    }
  });
  const context = { memberId: "member-example", email: member.loginEmail, member };
  const result = await core.updateCustomerProfileCore(context, { profile: {
    preferredDepartureAirportId: airport, preferredCurrency: "usd", seatPreference: "aisle", loginEmail: "other@example.test"
  } });
  assert.equal(nativeWrites[0].preferredDepartureAirport, "JFK");
  assert.equal(nativeWrites[0].preferredCurrency, "USD");
  assert.equal(Object.hasOwn(nativeWrites[0], "seatPreference"), false);
  assert.equal(Object.hasOwn(nativeWrites[0], "loginEmail"), false);
  assert.equal(mirror.auth_email, "login@example.test");
  assert.equal(mirror.preferred_language_id, language);
  assert.equal(mirror.preferred_departure_airport_id, airport);
  assert.equal(result.profile.payload.seatPreference, "aisle");
  await assert.rejects(core.updateCustomerProfileCore(context, { profile: { preferredDepartureAirportId: "invalid" } }),
    { code: "ACCOUNT_REFERENCE_INVALID" });
  assert.equal(nativeWrites.length, 1);
});
