import { Permissions, webMethod } from "wix-web-module";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";
import { createHash, randomUUID } from "crypto";
import { requireCustomerContext } from "backend/core/authContext";
import {
  createCase,
  listCustomerCases,
  listAgentCases,
  getAgentCase,
  replyAgentCase,
  updateAgentCase
} from "backend/domains/support/service";

const getSecretValue = elevate(secrets.getSecretValue);

const REQUIRED_SECRET_NAMES = {
  token: "CHATWOOT_API_ACCESS_TOKEN",
  accountId: "CHATWOOT_ACCOUNT_ID",
  inboxId: "CHATWOOT_INBOX_ID"
};
const OPTIONAL_BASE_URL_SECRET = "CHATWOOT_BASE_URL";
const DEFAULT_CHATWOOT_BASE_URL = "https://app.chatwoot.com";

const ALLOWED_CATEGORIES = new Set([
  "order_management",
  "shipping_delivery",
  "returns_exchanges",
  "refunds_credits",
  "payments_checkout",
  "product_information",
  "damaged_wrong_missing",
  "warranty_repairs",
  "promotions_gift_cards",
  "account_security",
  "privacy_data",
  "technical_accessibility",
  "business_bulk",
  "feedback_other"
]);

function clean(value, maxLength = 500) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value) {
  return clean(value, 254).toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function secretText(response) {
  if (typeof response === "string") return response;
  return clean(
    response?.value ||
      response?.secretValue ||
      response?.secret?.value ||
      "",
    5000
  );
}

async function requiredSecret(name) {
  try {
    const value = secretText(await getSecretValue(name));
    if (!value) throw new Error(`Secret ${name} is empty.`);
    return value;
  } catch (error) {
    console.error(`Missing or unreadable secret: ${name}`, error);
    throw new Error(
      "Customer service is temporarily unavailable. Please try again later."
    );
  }
}

async function optionalSecret(name, fallback = "") {
  try {
    return secretText(await getSecretValue(name)) || fallback;
  } catch (error) {
    return fallback;
  }
}

function normalizeBaseUrl(value) {
  const url = clean(value || DEFAULT_CHATWOOT_BASE_URL, 500).replace(/\/+$/, "");
  if (!/^https:\/\//i.test(url)) {
    throw new Error("Chatwoot base URL must use HTTPS.");
  }
  return url;
}

async function configuration() {
  const [token, accountIdText, inboxIdText, baseUrlText] = await Promise.all([
    requiredSecret(REQUIRED_SECRET_NAMES.token),
    requiredSecret(REQUIRED_SECRET_NAMES.accountId),
    requiredSecret(REQUIRED_SECRET_NAMES.inboxId),
    optionalSecret(OPTIONAL_BASE_URL_SECRET, DEFAULT_CHATWOOT_BASE_URL)
  ]);

  const accountId = Number(accountIdText);
  const inboxId = Number(inboxIdText);

  if (!Number.isInteger(accountId) || !Number.isInteger(inboxId)) {
    console.error("Chatwoot account or inbox secret is not numeric.");
    throw new Error(
      "Customer service is temporarily unavailable. Please try again later."
    );
  }

  return {
    token,
    accountId,
    inboxId,
    baseUrl: normalizeBaseUrl(baseUrlText)
  };
}

async function chatwootRequest(config, path, { method = "GET", body } = {}) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      api_access_token: config.token
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  const rawText = await response.text();
  let data = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch (error) {
      data = { message: rawText };
    }
  }

  if (!response.ok) {
    const detail =
      data?.message ||
      data?.description ||
      data?.error ||
      data?.errors?.[0]?.message ||
      `Chatwoot request failed with status ${response.status}.`;
    const error = new Error(detail);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

function stableIdentifier(email) {
  return `skandi-store-${createHash("sha256")
    .update(email)
    .digest("hex")
    .slice(0, 32)}`;
}

function contactFromCreateResponse(response = {}) {
  return response.payload?.[0] || response.contact || response;
}

function contactInboxSource(contact = {}, inboxId) {
  const inbox = (contact.contact_inboxes || contact.contactInboxes || []).find(
    (entry) => Number(entry.inbox?.id || entry.inboxId) === Number(inboxId)
  );
  return clean(inbox?.source_id || inbox?.sourceId, 300);
}

async function searchContactByEmail(config, email) {
  const response = await chatwootRequest(
    config,
    `/api/v1/accounts/${config.accountId}/contacts/search?q=${encodeURIComponent(
      email
    )}`
  );

  return (response.payload || []).find(
    (contact) => normalizeEmail(contact.email) === email
  );
}

async function createContact(config, input) {
  const response = await chatwootRequest(
    config,
    `/api/v1/accounts/${config.accountId}/contacts`,
    {
      method: "POST",
      body: {
        inbox_id: config.inboxId,
        name: input.fullName,
        email: input.email,
        phone_number: input.phone || undefined,
        identifier: stableIdentifier(input.email),
        blocked: false,
        additional_attributes: {
          source: "SKANDI The Store",
          country: input.countryOfResidence || undefined,
          preferred_contact: input.preferredContact || undefined
        },
        custom_attributes: {}
      }
    }
  );

  return contactFromCreateResponse(response);
}

async function updateContact(config, contact, input) {
  try {
    await chatwootRequest(
      config,
      `/api/v1/accounts/${config.accountId}/contacts/${contact.id}`,
      {
        method: "PUT",
        body: {
          name: input.fullName,
          email: input.email,
          phone_number: input.phone || undefined,
          identifier: contact.identifier || stableIdentifier(input.email),
          blocked: false,
          additional_attributes: {
            ...(contact.additional_attributes || {}),
            source: "SKANDI The Store",
            country: input.countryOfResidence || undefined,
            preferred_contact: input.preferredContact || undefined
          },
          custom_attributes: contact.custom_attributes || {}
        }
      }
    );
  } catch (error) {
    console.warn("Existing Chatwoot contact could not be updated.", error);
  }
}

async function ensureContactInbox(config, contact) {
  const existingSource = contactInboxSource(contact, config.inboxId);
  if (existingSource) return existingSource;

  const sourceId = `${stableIdentifier(contact.email || String(contact.id))}-${Date.now()}`;
  const response = await chatwootRequest(
    config,
    `/api/v1/accounts/${config.accountId}/contacts/${contact.id}/contact_inboxes`,
    {
      method: "POST",
      body: {
        inbox_id: config.inboxId,
        source_id: sourceId
      }
    }
  );

  return clean(response.source_id || response.sourceId || sourceId, 300);
}

async function findOrCreateContact(config, input) {
  const existing = await searchContactByEmail(config, input.email);

  if (existing) {
    await updateContact(config, existing, input);
    const sourceId = await ensureContactInbox(config, existing);
    return { contact: existing, sourceId };
  }

  const created = await createContact(config, input);
  if (!created?.id) {
    throw new Error("Customer contact could not be created.");
  }

  const sourceId = await ensureContactInbox(config, created);
  return { contact: created, sourceId };
}

function line(label, value) {
  const normalized = clean(value, 2000);
  return normalized ? `**${label}:** ${normalized}` : "";
}

function section(title, rows) {
  const content = rows.filter(Boolean);
  return content.length ? [`\n### ${title}`, ...content] : [];
}

function buildMessage(input) {
  const lines = [
    `# ${input.subject}`,
    input.message,
    ...section("Customer", [
      line("Name", input.fullName),
      line("Email", input.email),
      line("Phone", input.phone),
      line("Country of residence", input.countryOfResidence),
      line("Preferred contact", input.preferredContact)
    ]),
    ...section("Request", [
      line("Category", input.category),
      line("Topic", input.subCategory),
      line("Priority", input.priority || "Low")
    ]),
    ...section("Order", [
      line("Has order", input.hasOrder),
      line("Purchase channel", input.purchaseChannel),
      line("Order number", input.orderNumber),
      line("Order email", input.orderEmail),
      line("Order date", input.orderDate),
      line("Order total", input.orderTotal)
    ]),
    ...section("Delivery", [
      line("Carrier", input.carrier),
      line("Tracking number", input.trackingNumber),
      line("Expected delivery", input.expectedDeliveryDate),
      line("Delivery postal code", input.deliveryPostcode)
    ]),
    ...section("Return or resolution", [
      line("Return number", input.returnNumber),
      line("Return sent", input.returnSentDate),
      line("Item condition", input.itemCondition),
      line("Requested resolution", input.requestedResolution)
    ]),
    ...section("Payment", [
      line("Payment method", input.paymentMethod),
      line("Transaction date", input.transactionDate),
      line("Transaction amount", input.transactionAmount),
      line("Payment last four", input.paymentLast4),
      line("Payment error", input.paymentError)
    ]),
    ...section("Product", [
      line("Product", input.productName),
      line("SKU", input.productSku),
      line("Quantity", input.productQuantity),
      line("Date received", input.dateReceived)
    ]),
    ...section("Promotion or gift card", [
      line("Promotion code", input.promotionCode),
      line("Promotion name", input.promotionName),
      line("Gift card last four", input.giftCardLast4),
      line("Expected discount", input.expectedDiscount)
    ]),
    ...section("Technical details", [
      line("Device", input.deviceType),
      line("Browser", input.browser),
      line("Page", input.pageUrl),
      line("Error", input.technicalError)
    ]),
    ...section("Business order", [
      line("Company", input.companyName),
      line("Tax ID", input.companyTaxId),
      line("Quantity", input.bulkQuantity),
      line("Required by", input.requiredByDate)
    ]),
    ...section("Attachments", [
      line("Files", (input.attachedFileNames || []).join(", ")),
      line("Uploaded file links", (input.attachedFileUrls || []).join("\n"))
    ])
  ];

  return lines.filter(Boolean).join("\n").slice(0, 30000);
}

function validateInput(raw = {}) {
  const input = {
    firstName: clean(raw.firstName, 100),
    lastName: clean(raw.lastName, 100),
    fullName: clean(
      raw.fullName || `${raw.firstName || ""} ${raw.lastName || ""}`,
      200
    ),
    email: normalizeEmail(raw.email),
    phone: clean(raw.phone, 80),
    countryOfResidence: clean(raw.countryOfResidence, 120),
    preferredContact: clean(raw.preferredContact, 40),
    hasOrder: clean(raw.hasOrder, 20),
    purchaseChannel: clean(raw.purchaseChannel, 80),
    orderNumber: clean(raw.orderNumber, 100),
    orderEmail: normalizeEmail(raw.orderEmail),
    orderDate: clean(raw.orderDate, 30),
    orderTotal: clean(raw.orderTotal, 60),
    category: clean(raw.category, 80),
    subCategory: clean(raw.subCategory, 160),
    subject: clean(raw.subject, 180),
    message: clean(raw.message, 10000),
    carrier: clean(raw.carrier, 100),
    trackingNumber: clean(raw.trackingNumber, 160),
    expectedDeliveryDate: clean(raw.expectedDeliveryDate, 30),
    deliveryPostcode: clean(raw.deliveryPostcode, 40),
    returnNumber: clean(raw.returnNumber, 120),
    returnSentDate: clean(raw.returnSentDate, 30),
    itemCondition: clean(raw.itemCondition, 120),
    requestedResolution: clean(raw.requestedResolution, 120),
    paymentMethod: clean(raw.paymentMethod, 100),
    transactionDate: clean(raw.transactionDate, 30),
    transactionAmount: clean(raw.transactionAmount, 60),
    paymentLast4: clean(raw.paymentLast4, 4).replace(/\D/g, ""),
    paymentError: clean(raw.paymentError, 1000),
    productName: clean(raw.productName, 200),
    productSku: clean(raw.productSku, 100),
    productQuantity: clean(raw.productQuantity, 20),
    dateReceived: clean(raw.dateReceived, 30),
    promotionCode: clean(raw.promotionCode, 100),
    promotionName: clean(raw.promotionName, 160),
    giftCardLast4: clean(raw.giftCardLast4, 4).replace(/\D/g, ""),
    expectedDiscount: clean(raw.expectedDiscount, 80),
    deviceType: clean(raw.deviceType, 100),
    browser: clean(raw.browser, 160),
    pageUrl: clean(raw.pageUrl, 1000),
    technicalError: clean(raw.technicalError, 2000),
    companyName: clean(raw.companyName, 200),
    companyTaxId: clean(raw.companyTaxId, 100),
    bulkQuantity: clean(raw.bulkQuantity, 30),
    requiredByDate: clean(raw.requiredByDate, 30),
    attachedFileNames: (Array.isArray(raw.attachedFileNames)
      ? raw.attachedFileNames
      : []
    )
      .slice(0, 3)
      .map((value) => clean(value, 240)),
    attachedFileUrls: (Array.isArray(raw.attachedFileUrls)
      ? raw.attachedFileUrls
      : []
    )
      .slice(0, 3)
      .map((value) => clean(value, 2000)),
    priority: clean(raw.priority || "Low", 20),
    source: clean(raw.source || "store-customer-service", 80)
  };

  if (!input.fullName) throw new Error("Enter your name.");
  if (!validEmail(input.email)) throw new Error("Enter a valid email address.");
  if (!input.category || !ALLOWED_CATEGORIES.has(input.category)) {
    throw new Error("Select a valid support category.");
  }
  if (!input.subCategory) throw new Error("Select a support topic.");
  if (input.subject.length < 3) throw new Error("Enter a subject.");
  if (input.message.length < 10) {
    throw new Error("Describe the issue in more detail.");
  }

  return input;
}
export const createCustomerSupportCase = webMethod(
  Permissions.SiteMember,
  async function ({ input = {} } = {}) {
    const ctx = await requireCustomerContext();
    return createCase(ctx, input);
  }
);

export const createPublicSupportCase = webMethod(
  Permissions.Anyone,
  async ({ input: rawInput = {} } = {}) => {
    const input = validateInput(rawInput);
    const config = await configuration();

    try {
      const { contact, sourceId } = await findOrCreateContact(config, input);
      const conversationResponse = await chatwootRequest(
        config,
        `/api/v1/accounts/${config.accountId}/conversations`,
        {
          method: "POST",
          body: {
            source_id: sourceId,
            inbox_id: config.inboxId,
            contact_id: contact.id,
            status: "open",
            additional_attributes: {
              source: "SKANDI The Store",
              submitted_at: new Date().toISOString(),
              order_number: input.orderNumber || undefined
            },
            custom_attributes: {}
          }
        }
      );

      const conversation =
        conversationResponse.conversation || conversationResponse;
      const conversationId =
        conversation.id || conversation.conversation_id;

      if (!conversationId) {
        throw new Error("Support conversation could not be created.");
      }

      await chatwootRequest(
        config,
        `/api/v1/accounts/${config.accountId}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: {
            content: buildMessage(input),
            message_type: "incoming",
            private: false,
            content_type: "text",
            content_attributes: {
              source: input.source,
              submission_id: randomUUID()
            }
          }
        }
      );

      const referenceNumber =
        conversation.display_id ||
        conversation.displayId ||
        conversationId;

      return {
        id: conversationId,
        caseId: conversationId,
        ticketNumber: String(referenceNumber),
        caseNumber: `SK-${String(referenceNumber).padStart(6, "0")}`,
        reference: `SK-${String(referenceNumber).padStart(6, "0")}`,
        status: conversation.status || "open",
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Chatwoot support case creation failed.", {
        message: error?.message,
        status: error?.status,
        payload: error?.payload
      });
      throw new Error(
        "Your request could not be submitted. Please try again shortly."
      );
    }
  }
);
export const listCustomerSupportCases = webMethod(
  Permissions.SiteMember,
  async function () {
    const ctx = await requireCustomerContext();
    return listCustomerCases(ctx);
  }
);

export const listAgentSupportCases = webMethod(
  Permissions.SiteMember,
  async function (filters = {}) {
    const ctx = await requireCustomerContext();
    return listAgentCases(ctx, filters);
  }
);

export const getAgentSupportCase = webMethod(
  Permissions.SiteMember,
  async function ({ caseId } = {}) {
    const ctx = await requireCustomerContext();
    return getAgentCase(ctx, caseId);
  }
);

export const replyAgentSupportCase = webMethod(
  Permissions.SiteMember,
  async function ({ caseId, content } = {}) {
    const ctx = await requireCustomerContext();
    return replyAgentCase(ctx, { caseId, content });
  }
);

export const updateAgentSupportCase = webMethod(
  Permissions.SiteMember,
  async function ({ caseId, updates = {} } = {}) {
    const ctx = await requireCustomerContext();
    return updateAgentCase(ctx, { caseId, updates });
  }
);