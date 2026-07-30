import { webMethod, Permissions } from "wix-web-module";
import { requireCustomerContext } from "backend/core/authContext";

export const getCustomerHeaderSession = webMethod(
  Permissions.Anyone,
  async function () {
    try {
      const ctx = await requireCustomerContext();

      return {
        loggedIn: true,
        memberId: ctx.memberId,
        wixMemberId: ctx.wixMemberId,
        email: ctx.email,
        displayName: ctx.profile?.display_name || ctx.member?.nickname || "Member",
        points: 0,
        tierKey: "member",
        tierName: ctx.profile?.is_loyalty_member ? "Member" : "",
        menu: []
      };
    } catch (error) {
      return {
        loggedIn: false,
        displayName: "",
        points: 0,
        tierKey: "",
        tierName: "",
        menu: []
      };
    }
  }
);

export const subscribeCustomerNewsletter = webMethod(
  Permissions.Anyone,
  async function (payload = {}) {
    return {
      ok: true,
      message: "Newsletter signup received.",
      email: payload.email || ""
    };
  }
);