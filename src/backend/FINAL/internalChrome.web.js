// backend/FINAL/internalChrome.web.js
import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { restRequest } from "backend/RIA/supabaseServer.js";

const LINKS = [
  { title:"Dashboard", type:"APP", path:"/riaintra/staff-portal", summary:"RIAINTRA staff dashboard" },
  { title:"SuccessFactors", type:"APP", path:"/riaintra/success-factors", summary:"People, HR and employee services" },
  { title:"ALTEA", type:"APP", path:"/riaintra/success-factors/altea", summary:"ALTEA operations workspace" },
  { title:"GroupTalk", type:"APP", path:"/riaintra/success-factors/altea/grouptalk", summary:"Live operations voice, location and helpdesk" },
  { title:"DocuNet", type:"APP", path:"/riaintra/success-factors/altea/docunet", summary:"Controlled operational documents" },
  { title:"Mail", type:"APP", path:"/riaintra/success-factors/altea/mail", summary:"Internal mail" },
  { title:"Uniform Center", type:"APP", path:"/riaintra/success-factors/uniform", summary:"Uniform ordering and policy" },
  { title:"Inventory Control", type:"ADMIN", path:"/riaintra/success-factors/altea/inventory-control", summary:"Operational inventory control" }
];

function clean(v,max=300){return String(v??"").trim().slice(0,max)}
function lower(v){return clean(v).toLowerCase()}
function first(rows){return Array.isArray(rows)&&rows.length?rows[0]:null}

async function staff() {
  let member = null;
  try { member = await currentMember.getMember({ fieldsets:["FULL"] }); } catch (_) {}
  const memberId = clean(member?._id || member?.id, 160);
  const email = lower(
    member?.loginEmail ||
    member?.contactDetails?.emails?.[0] ||
    member?.profile?.email ||
    ""
  );

  let row = null;
  if (memberId) {
    row = first(await restRequest({
      table:"agent_users",
      query:{select:"*",wix_member_id:`eq.${memberId}`,limit:1}
    }));
    if (!row) {
      row = first(await restRequest({
        table:"agent_users",
        query:{select:"*",member_id:`eq.${memberId}`,limit:1}
      }));
    }
  }

  if (!row && email) {
    row = first(await restRequest({
      table:"agent_users",
      query:{select:"*",corporate_email_address:`ilike.${email}`,limit:1}
    }));
    if (!row) {
      row = first(await restRequest({
        table:"agent_users",
        query:{select:"*",email:`ilike.${email}`,limit:1}
      }));
    }
  }

  if (!row || row.active !== true || row.authorized !== true || row.portal_access !== true) {
    throw new Error("STAFF_ACCESS_DENIED");
  }

  return row;
}

function matches(item,q){
  const haystack=[item.title,item.type,item.path,item.summary].join(" ").toLowerCase();
  return haystack.includes(q);
}

export const runInternalGlobalSearch = webMethod(
  Permissions.SiteMember,
  async (query = "") => {
    await staff();
    const q = lower(
      typeof query === "object" ? query?.query : query
    );

    if (!q) return { results: [], items: [] };

    const results = LINKS.filter((item)=>matches(item,q)).slice(0,25);
    return { results, items: results, query: q };
  }
);
