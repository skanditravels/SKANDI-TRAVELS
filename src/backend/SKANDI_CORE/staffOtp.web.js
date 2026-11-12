// RIAINTRA device verification: public web-method boundary.
import { Permissions, webMethod } from "wix-web-module";
import {
  issueStaffDeviceTokenCore,
  authenticateStaffWithDeviceTrustCore,
  verifyStaffOtpAndTrustDeviceCore
} from "backend/SKANDI_CORE/staffOtp";

export const issueStaffDeviceToken = webMethod(Permissions.Anyone, issueStaffDeviceTokenCore);
export const authenticateStaffWithDeviceTrust = webMethod(Permissions.Anyone, authenticateStaffWithDeviceTrustCore);
export const verifyStaffOtpAndTrustDevice = webMethod(Permissions.Anyone, verifyStaffOtpAndTrustDeviceCore);
