// /src/backend/SKANDI_CORE/cruises.web.js
// SKANDI Cruises — B-011.44 public facade.
// Public methods read the canonical Travel Info cruise catalogue only.
// Provider synchronization remains internal to cruises.js and is not exposed to anonymous callers.
// V12 transport repair: direct webMethod declarations keep Wix frontend proxy generation stable.

import { Permissions, webMethod } from "@wix/web-methods";
import { getCruisesBootstrapCore, refreshCruisesCore } from "backend/SKANDI_CORE/cruises.js";

function safeError(error) {
  return {
    code: String(error?.code || "CRUISES_ERROR").slice(0, 120),
    message: String(error?.publicMessage || error?.message || "Cruise information could not be loaded.").slice(0, 700)
  };
}

async function publicCall(handler, input = {}) {
  try {
    return { ok: true, data: await handler(input || {}) };
  } catch (error) {
    return { ok: false, error: safeError(error) };
  }
}

export const getCruisesBootstrap = webMethod(
  Permissions.Anyone,
  async (input = {}) => publicCall(getCruisesBootstrapCore, input)
);

export const refreshCruises = webMethod(
  Permissions.Anyone,
  async (input = {}) => publicCall(refreshCruisesCore, input)
);
