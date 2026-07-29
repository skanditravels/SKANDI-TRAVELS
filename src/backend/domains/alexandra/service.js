import { createCustomerCase } from "src/backend/domains/support/service";

export async function handleCustomerAlexandraMessage(payload = {}) {
  const supportCase = await createCustomerCase({
    subject: "Alexandra request from My Profile",
    category: "Alexandra",
    priority: "Normal",
    message: payload.message,
    source: "my-profile",
    page: payload.page || "my-profile",
    tab: payload.tab || "",
    payload
  });

  return {
    ok: true,
    caseId: supportCase.caseId,
    message: "Thanks — Alexandra has received your message. A SKANDI agent will follow up shortly."
  };
}
