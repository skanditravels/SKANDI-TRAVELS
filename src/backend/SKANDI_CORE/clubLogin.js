// Wix is the credential authority. Do not release a session token for a staff identity.
import wixCaptcha from "wix-captcha-backend";
import { authentication } from "wix-members-backend";
import { findAgentByMember } from "backend/SKANDI_CORE/staffAuth";
import { findWixMemberByCorporateEmail } from "backend/SKANDI_CORE/orgStructure";

function failure() {
  const error = new Error("We couldn't sign you in. Please check your details and try again.");
  error.code = "CLUB_LOGIN_UNAVAILABLE";
  return error;
}

export async function loginClubMemberCore(input = {}) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const captchaToken = typeof input.captchaToken === "string" ? input.captchaToken : "";
  if (!email || email.length > 254 || !password || password.length > 256 || !captchaToken) throw failure();
  try {
    await wixCaptcha.authorize(captchaToken);
    const result = await authentication.login(email, password);
    const token = typeof result === "string" ? result : result?.sessionToken || result?.session_token || result?.token;
    if (!token || typeof token !== "string") throw failure();
    const member = await findWixMemberByCorporateEmail(email);
    if (!member || !(member._id || member.id) || String(member.loginEmail || "").trim().toLowerCase() !== email) throw failure();
    if (await findAgentByMember(member)) throw failure();
    return { sessionToken: token };
  } catch (_) {
    throw failure();
  }
}
