import wixWindowFrontend from "wix-window-frontend";
import { getCustomerAuthPopup } from "public/siteMap";

function openPopup(key, context = {}) {
  const popup = getCustomerAuthPopup(key);
  if (!popup?.name) {
    throw new Error(`The SKANDI customer authentication popup "${key}" is not configured.`);
  }
  const data = context && typeof context === "object" ? context : {};
  return wixWindowFrontend.openLightbox(popup.name, data);
}

export function openCustomerLogin(context = {}) {
  return openPopup("login", context);
}

export function openCustomerResetPassword(context = {}) {
  return openPopup("resetPassword", context);
}
