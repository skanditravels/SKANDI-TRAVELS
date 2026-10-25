// V12 ALTEA payment-integrity regression; zero network calls or payment mutations.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const core = readFileSync(new URL("../src/backend/SKANDI_CORE/reservations.js", import.meta.url), "utf8");
const embed = readFileSync(new URL("../HTML_REF/altea/Reservations.md", import.meta.url), "utf8");

test("ALTEA agent cannot create a booking as paid without Stripe", () => {
  assert.match(core, /if\(input\.paymentStatus!==undefined&&lower\(input\.paymentStatus,80\)!=="unpaid"\)throw new Error\("PAYMENT_STATUS_CONTROLLED_BY_STRIPE"\)/);
  assert.match(core, /payment_status:"unpaid"/);
});

test("ALTEA booking update rejects client supplied payment status", () => {
  assert.match(core, /if\(p\.paymentStatus!==undefined\)throw new Error\("PAYMENT_STATUS_CONTROLLED_BY_STRIPE"\)/);
  assert.doesNotMatch(core, /db\.payment_status=lower\(p\.paymentStatus/);
});

test("ALTEA general notes cannot impersonate Stripe capture", () => {
  assert.match(core, /PAYMENT_EVENT_REQUIRES_PROVIDER_VERIFICATION/);
});

test("ALTEA checkout neither collects PAN/CVC nor marks anything paid", () => {
  const anchor = embed.indexOf("function openSkandiCheckout() {");
  const end = embed.indexOf("  function renderPackageBuilder(){", anchor);
  assert.ok(anchor > 0 && end > anchor);
  const checkout = embed.slice(anchor, end);
  assert.match(checkout, /Payment verification required/);
  assert.doesNotMatch(checkout, /motoCardFrame|checkoutFop|PAYMENT_SUCCESS|paymentStatus:\s*"PAID"|Charge & Confirm|placeholder="Card number"/);
});
