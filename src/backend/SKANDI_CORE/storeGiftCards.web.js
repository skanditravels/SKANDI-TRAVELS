// V12 Store Gift Cards public facade.
// Visitor/member cart and order ownership stay in the caller context.

import { Permissions, webMethod } from "wix-web-module";
import {
  getStoreGiftCardCatalogCore,
  addStoreGiftCardToCurrentCartCore,
  finalizeStoreGiftCardsCore
} from "backend/SKANDI_CORE/storeGiftCards";

function publicError(error, fallback) {
  return {
    ok: false,
    code: error?.code || "STORE_GIFT_CARD_ERROR",
    message: error?.publicMessage || fallback
  };
}

export const getStoreGiftCardCatalog = webMethod(
  Permissions.Anyone,
  async () => {
    try { return await getStoreGiftCardCatalogCore(); }
    catch (error) { return publicError(error, "Gift cards are temporarily unavailable."); }
  }
);

export const addStoreGiftCardToCurrentCart = webMethod(
  Permissions.Anyone,
  async (payload = {}) => {
    try { return await addStoreGiftCardToCurrentCartCore(payload); }
    catch (error) { return publicError(error, "The gift card could not be added to your bag."); }
  }
);

export const finalizeStoreGiftCards = webMethod(
  Permissions.Anyone,
  async (payload = {}) => {
    try { return await finalizeStoreGiftCardsCore(payload); }
    catch (error) { return publicError(error, "Gift card fulfillment could not be completed."); }
  }
);
