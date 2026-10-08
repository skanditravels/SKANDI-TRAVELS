// V12 public checkout boundary. No elevated customer cart or order access.
import { Permissions, webMethod } from "wix-web-module";
import { getStoreCheckoutBootstrapCore, saveStoreCheckoutDetailsCore, setStoreDeliveryMethodCore, applyStoreCouponCore, removeStoreCouponCore, updateStoreCartLineItemCore, removeStoreCartLineItemCore, prepareStorePaymentCore, getStoreOrderConfirmationCore } from "backend/SKANDI_CORE/storeCheckout";

export const getStoreCheckoutBootstrap = webMethod(Permissions.Anyone, input => getStoreCheckoutBootstrapCore(input));
export const saveStoreCheckoutDetails = webMethod(Permissions.Anyone, input => saveStoreCheckoutDetailsCore(input));
export const setStoreDeliveryMethod = webMethod(Permissions.Anyone, input => setStoreDeliveryMethodCore(input));
export const applyStoreCoupon = webMethod(Permissions.Anyone, input => applyStoreCouponCore(input));
export const removeStoreCoupon = webMethod(Permissions.Anyone, input => removeStoreCouponCore(input));
export const updateStoreCartLineItem = webMethod(Permissions.Anyone, input => updateStoreCartLineItemCore(input));
export const removeStoreCartLineItem = webMethod(Permissions.Anyone, input => removeStoreCartLineItemCore(input));
export const prepareStorePayment = webMethod(Permissions.Anyone, input => prepareStorePaymentCore(input));
export const getStoreOrderConfirmation = webMethod(Permissions.Anyone, input => getStoreOrderConfirmationCore(input));
