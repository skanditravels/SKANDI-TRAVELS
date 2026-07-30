import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "src/backend/customerHeader.web";

// --- Configuration & Constants ---
const HEADER_EMBED = "#skandiCustomerHeaderEmbed"; 
const FOOTER_EMBED = "#skandiCustomerFooterEmbed";

const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const INTERNAL_PREFIXES = ["/riaintra", "/_functions"];

// --- Helper Functions ---
function safeEl(id) {
  try { return $w(id); } catch (error) { return null; }
}

function currentPathString() {
  const path = wixLocationFrontend.path || [];
  return "/" + path.join("/");
}

function isInternalPage() {
  const path = currentPathString();
  return INTERNAL_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + "/"));
}

function postToEmbed(embed, type, payload = {}) {
  if (!embed) return;
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function closeCustomerHeaderPanels(header) {
  postToEmbed(header, "CLOSE_CUSTOMER_HEADER_PANELS", {});
}

async function sendHeaderState(header) {
  try {
    const member = await currentMember.getMember();

    if (!member) {
      postToEmbed(header, "CUSTOMER_HEADER_STATE", { loggedIn: false, menu: [] });
      return;
    }

    const payload = await getCustomerHeaderSession();
    postToEmbed(header, "CUSTOMER_HEADER_STATE", payload);
  } catch (error) {
    postToEmbed(header, "CUSTOMER_HEADER_STATE", { loggedIn: false, menu: [] });
  }
}

// --- Message Handlers ---

async function handleHeaderMessage(header, message = {}) {
  if (message.source !== HEADER_SOURCE) return;
  const payload = message.payload || {};

  switch (message.type) {
    case "HEADER_READY":
      await sendHeaderState(header);
      break;
    case "HEADER_NAVIGATE":
      closeCustomerHeaderPanels(header);
      if (message.path || payload.path) wixLocationFrontend.to(message.path || payload.path);
      break;
    case "HEADER_SEARCH":
      closeCustomerHeaderPanels(header);
      wixLocationFrontend.to("/home?focus=search");
      break;
    case "HEADER_LOGIN":
      closeCustomerHeaderPanels(header);
      await authentication.promptLogin();
      await sendHeaderState(header);
      break;
    case "HEADER_LOGOUT":
      closeCustomerHeaderPanels(header);
      await authentication.logout();
      wixLocationFrontend.to("/home");
      break;
      
    // --- New Inline Form Auth Handling ---
    case "HEADER_LOGIN_SUBMIT":
      authentication.login(message.email, message.password)
        .then(() => {
          // Refresh page upon successful inline login
          wixLocationFrontend.to(wixLocationFrontend.url); 
        })
        .catch((error) => {
          console.error("Login failed:", error);
          // Send error message back to the HTML component directly
          header.postMessage({ type: "HOME_ERROR", message: "Invalid email or password. Please try again." });
        });
      break;
    case "HEADER_FORGOT_PASSWORD":
      closeCustomerHeaderPanels(header);
      authentication.promptForgotPassword();
      break;
      
    default:
      break;
  }
}

async function handleFooterMessage(footer, message = {}) {
  if (message.source !== FOOTER_SOURCE) return;
  const payload = message.payload || {};
  const path = message.path || payload.path || "";
  const header = safeEl(HEADER_EMBED);

  switch (message.type) {
    case "FOOTER_READY":
      postToEmbed(footer, "CUSTOMER_FOOTER_STATE", { ready: true });
      break;
    case "FOOTER_NAVIGATE":
      closeCustomerHeaderPanels(header);
      if (path) wixLocationFrontend.to(path);
      break;
    case "FOOTER_STAFF_LOGIN":
      closeCustomerHeaderPanels(header);
      wixLocationFrontend.to("/riaintra");
      break;
    case "FOOTER_NEWSLETTER_SIGNUP": {
      const email = String(message.email || payload.email || "").trim();
      if (!email) {
        postToEmbed(footer, "FOOTER_NEWSLETTER_RESULT", { ok: false, message: "Please enter your email address." });
        return;
      }
      const result = await subscribeCustomerNewsletter({ email, source: payload.source || "Footer" });
      postToEmbed(footer, "FOOTER_NEWSLETTER_RESULT", result);
      break;
    }
    default:
      break;
  }
}

// --- Main Page Ready Execution ---
$w.onReady(async function () {
  const header = safeEl(HEADER_EMBED);
  const footer = safeEl(FOOTER_EMBED);
  const riaintraHeader = safeEl("#riaintraHeader");
  const alteaHeader = safeEl("#alteaHeader");
  const htmlDropdown = safeEl("#htmlDropdown");
  const adminMenu = safeEl("#adminMenu");

  // 1. Hide/Show Customer Header based on URL
  if (isInternalPage()) {
    try { header?.hide(); } catch (error) {}
    try { footer?.hide(); } catch (error) {}
  } else {
    try { header?.show(); } catch (error) {}
    try { footer?.show(); } catch (error) {}
  }

  // 2. Customer Header & Footer Listeners
  if (header) {
    header.onMessage((event) => handleHeaderMessage(header, event.data));
  }
  
  if (footer) {
    footer.onMessage((event) => handleFooterMessage(footer, event.data));
  }

  // 3. riaintra Header Listener
  if (riaintraHeader) {
    riaintraHeader.onMessage(async (event) => {
      const message = event.data || {};
      if (message.type === 'UI_READY') {
        try {
          const member = await currentMember.getMember();
          if (member) {
            riaintraHeader.postMessage({
              type: 'MEMBER_DATA',
              payload: {
                firstName: member.contactDetails?.firstName || "Traveller",
                lastName: member.contactDetails?.lastName || "",
                email: member.loginEmail || "",
                photo: member.profile?.profilePhoto?.url || ""
              }
            });
          } else {
            riaintraHeader.postMessage({ type: 'GUEST_DATA' });
          }
        } catch (error) {
          console.error("Error fetching member", error);
        }
      }
    });
  }

  // 4. Altea Global Header Listener
  if (alteaHeader) {
    alteaHeader.onMessage((event) => {
      const message = event.data;
      if (message.source === "SKANDI_GLOBAL_HEADER" && message.type === "ALTEA_NAVIGATE") {
        wixLocationFrontend.to(message.payload.path);
      }
      if (message.source === "SKANDI_GLOBAL_HEADER" && message.type === "TOGGLE_admin_MENU") {
        if (adminMenu) {
          adminMenu.hidden ? adminMenu.show("fade", { duration: 150 }) : adminMenu.hide("fade", { duration: 150 });
        }
      }
    });
  }

  // 5. Admin Dropdown Listener
  if (htmlDropdown) {
    htmlDropdown.onMessage((event) => {
        if (event.data.type === 'CLOSE_admin_MENU') {
            htmlDropdown.hide("fade", { duration: 150 });
        }
        if (event.data.type === 'NAVIGATE') {
            const targetPath = event.data.path; 
            htmlDropdown.hide("fade", { duration: 150 }).then(() => {
                wixLocationFrontend.to(targetPath);
            });
        }
    });
  }

  // 6. Global Auth Setup & Initialization
  authentication.onLogin(async () => {
    if (header) await sendHeaderState(header);
  });

  setTimeout(() => {
    if (header) sendHeaderState(header);
  }, 450);
});
