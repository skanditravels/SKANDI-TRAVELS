// Temporary backend-only diagnostic. Remove after the approved synthetic test.
import { customTrigger } from "@wix/automations";
import { auth } from "@wix/essentials";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";

export async function verifyGuestConfirmationDiagnostic() {
  const secret = await elevate(secrets.getSecretValue)("SKANDI_BOOKING_CONFIRMATION_TRIGGER_ID");
  const triggerId = typeof secret === "string" ? secret : secret?.value ?? secret?.secretValue ?? secret?.secret?.value;
  const payload = {
    bookingId: "TEST-ONLY-VELO-FIXED-NO-RESERVATION",
    bookingReference: "TEST-ONLY-VELO-FIXED-NO-RESERVATION",
    supplierReference: "TEST-ONLY",
    customerEmail: "contact@skanditravels.com",
    productType: "TEST FLIGHT ONLY",
    confirmationDate: "2026-11-09T22:30:00Z",
    bookingDate: "2026-11-09",
    flightDetails: "TEST ONLY: Stockholm (ARN) to New York (JFK); fictional flight. No reservation exists.",
    travelerDetails: "TEST TRAVELER — fictional guest, not an actual passenger",
    hotelDetails: "Not part of this test",
    carDetails: "Not part of this test",
    seatDetails: "No confirmed seat assignment recorded",
    extrasDetails: "No extra services recorded",
    transferDetails: "No transfer selected",
    totalAmount: "TEST ONLY — USD 0.00, no payment taken",
    currency: "USD",
    paymentStatus: "TEST ONLY — no charge or payment",
    cancellationTerms: "TEST ONLY — no purchase or cancellation applies",
    manageBookingUrl: "https://www.skanditravels.com/about/support",
    documentCenterUrl: "https://www.skanditravels.com/about/support",
    confirmationSource: "SKANDI_TEST_ONLY_NO_BOOKING"
  };
  await auth.elevate(customTrigger.runTrigger)({ triggerId, payload });
  return { submitted: true, reference: payload.bookingReference };
}
