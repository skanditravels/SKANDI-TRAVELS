// /src/backend/SKANDI_CORE/customerSession.web.js
// SKANDI Backend Base 1.0 — customer header/footer web-method boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getCustomerHeaderSessionCore,
  getCustomerEmailPreferencesCore,
  updateCustomerEmailPreferencesCore,
  subscribeCustomerNewsletterCore
} from "backend/SKANDI_CORE/customerSession";

export const getCustomerHeaderSession = webMethod(
  Permissions.SiteMember,
  getCustomerHeaderSessionCore
);

export const getCustomerEmailPreferences = webMethod(
  Permissions.SiteMember,
  getCustomerEmailPreferencesCore
);

export const updateCustomerEmailPreferences = webMethod(
  Permissions.SiteMember,
  updateCustomerEmailPreferencesCore
);

export const subscribeCustomerNewsletter = webMethod(
  Permissions.Anyone,
  subscribeCustomerNewsletterCore
);
