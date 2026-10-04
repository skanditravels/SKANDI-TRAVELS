import wixLocation from "wix-location";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";

import { handleUniformAction } from "backend/SKANDI_CORE/uniform.web";

const HTML_ID = "#uniformCenterEmbed";
const CHILD_SOURCE = "SKANDI_UNIFORM_EMPLOYEE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";

function postFlat(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    ...(payload || {}),
    timestamp: new Date().toISOString()
  });
}

async function requirePortalSession() {
  const session = await getStaffPortalSession().catch(() => null);

  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }

  return session;
}

let bootstrapPromise = null;

async function bootstrap(html) {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const portalSession = await requirePortalSession();

    if (!portalSession) {
      return;
    }

    const result = await handleUniformAction({ type: "UNIFORM_EMPLOYEE_BOOTSTRAP" });
    postFlat(html, result.responseType, result.ok ? { payload: result.payload } : result.payload);
  })();

  try {
    await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || "";
    const payload = msg.payload || {};

    if (source !== CHILD_SOURCE) {
      return;
    }

    try {
      if (
        type === "UNIFORM_EMPLOYEE_READY" ||
        type === "UNIFORM_EMPLOYEE_BOOTSTRAP"
      ) {
        await bootstrap(html);
        return;
      }

      if (type === "UNIFORM_EMPLOYEE_SUBMIT_ORDER") {
        const result = await handleUniformAction({
          type: "UNIFORM_EMPLOYEE_SUBMIT_ORDER",
          payload: {
            items: msg.items || payload.items || [],
            note: msg.note || payload.note || ""
          }
        });

        postFlat(
          html,
          result.responseType,
          result.ok ? { payload: result.payload } : result.payload
        );
        return;
      }

      if (type === "UNIFORM_EMPLOYEE_ACK_POLICY") {
        const result = await handleUniformAction({
          type: "UNIFORM_EMPLOYEE_ACK_POLICY",
          payload: {
            policyId: msg.policyId || payload.policyId || "",
            policyVersion: msg.policyVersion || payload.policyVersion || ""
          }
        });

        postFlat(
          html,
          result.responseType,
          result.ok ? { payload: result.payload } : result.payload
        );
        return;
      }

      if (type === "UNIFORM_EMPLOYEE_NAVIGATE") {
        const path =
          msg.path ||
          payload.path ||
          "";

        if (
          path.startsWith("/riaintra") ||
          path.startsWith("/altea")
        ) {
          wixLocation.to(path);
        }
      }
    } catch (error) {
      postFlat(
        html,
        "UNIFORM_EMPLOYEE_ERROR",
        {
          message:
            error.message ||
            "Uniform Center action failed."
        }
      );
    }
  });

  // Do not depend on the iframe READY event. The HTML iframe can finish
  // loading before Velo has attached onMessage(), which would otherwise
  // lose the only startup handshake.
  bootstrap(html).catch((error) => {
    postFlat(
      html,
      "UNIFORM_EMPLOYEE_ERROR",
      {
        message:
          error?.message ||
          "Uniform Center could not synchronize."
      }
    );
  });
});
Displaying Uniform Center.lukfc.js.
