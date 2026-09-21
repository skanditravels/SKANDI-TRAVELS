// /src/backend/SKANDI_CORE/cruises.web.js
// SKANDI Cruises — B-011.44 public facade.
// Public methods read the canonical Travel Info cruise catalogue only.
// Provider synchronization remains internal to cruises.js and is not exposed to anonymous callers.

import { Permissions, webMethod } from "@wix/web-methods";
import { getCruisesBootstrapCore, refreshCruisesCore } from "backend/SKANDI_CORE/cruises.js";

function safeError(error) {
  return {
    code: String(error?.code || "CRUISES_ERROR").slice(0, 120),
    message: String(error?.publicMessage || error?.message || "Cruise information could not be loaded.").slice(0, 700)
  };
}

function publicCall(handler) {
  return webMethod(Permissions.Anyone, async (input = {}) => {
    try {
      return { ok: true, data: await handler(input || {}) };
    } catch (error) {
      return { ok: false, error: safeError(error) };
    }
  });
}

export const getCruisesBootstrap = publicCall(getCruisesBootstrapCore);
export const refreshCruises = publicCall(refreshCruisesCore);
