// /src/backend/SKANDI_CORE/clubPublic.web.js
// SKANDI Club — B-011.1 public frontend boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import { getSkandiClubPublicPayloadCore } from "backend/SKANDI_CORE/clubPublic";

export const getSkandiClubPublicPayload = webMethod(
  Permissions.Anyone,
  () => getSkandiClubPublicPayloadCore()
);
