import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

async function config() {
  const [url, key] = await Promise.all([
    getSecret("SUPABASE_URL"),
    getSecret("SUPABASE_SERVICE_ROLE_KEY")
  ]);
  return { url: String(url || "").replace(/\/$/, ""), key: String(key || "") };
}

async function sb(path, options = {}) {
  const { url, key } = await config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || "get",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  if (!response.ok) throw new Error(`Document portal error ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function memberId() {
  try {
    const member = await currentMember.getMember();
    return member?._id || member?.id || "";
  } catch (error) {
    return "";
  }
}

export const listMyBookingDocuments = webMethod(
  Permissions.SiteMember,
  async ({ bookingId } = {}) => {
    const mid = await memberId();
    if (!mid) throw new Error("Sign in required.");

    // The booking/member ownership check should be tied to the canonical booking service.
    // This package intentionally requires the caller to supply a booking ID and filters
    // customer-visible documents; integrate your existing booking authorization here.
    const rows = await sb(
      `document_instances?booking_id=eq.${encodeURIComponent(String(bookingId || ""))}` +
      `&status=not.in.(ARCHIVED,CANCELLED)&order=created_at.desc`
    );

    return {
      success: true,
      bookingId: String(bookingId || ""),
      memberId: mid,
      documents: Array.isArray(rows) ? rows : []
    };
  }
);

export const acknowledgeDocument = webMethod(
  Permissions.SiteMember,
  async ({ documentId } = {}) => {
    const mid = await memberId();
    if (!mid) throw new Error("Sign in required.");

    const rows = await sb(
      `document_instances?id=eq.${encodeURIComponent(String(documentId || ""))}`,
      {
        method: "patch",
        body: {
          acknowledged_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    );

    return { success: true, document: Array.isArray(rows) ? rows[0] : rows };
  }
);
