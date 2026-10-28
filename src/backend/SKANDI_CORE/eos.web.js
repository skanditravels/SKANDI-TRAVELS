// Wix web-method boundary for the authenticated EOS mobile/tablet app.
import { Permissions, webMethod } from "@wix/web-methods";
import { getEosBootstrapCore, searchEosFlightsCore, searchEosStationsCore, createEosClockEventCore, submitEosOpsActionCore } from "backend/SKANDI_CORE/eos";
function publicError(error) {
  const code=String(error?.code||error?.message||"EOS_FAILED").toUpperCase().replace(/[^A-Z0-9_]/g,"_").slice(0,100);
  const messages={STAFF_AUTH_REQUIRED:"Sign in to RIAINTRA to use EOS.",STAFF_ACCESS_DENIED:"Your SKANDI staff access could not be confirmed.",EOS_ACCESS_DENIED:"EOS is available to authorized ALTEA operations and destination staff.",EOS_STAFF_ID_REQUIRED:"Your staff profile is missing its SKANDI employee identifier.",EOS_FLIGHT_SEARCH_TERM_REQUIRED:"Enter at least two characters to search flights.",EOS_FLIGHT_RANGE_INVALID:"Choose a valid flight search date range of up to 14 days.",EOS_STATION_SEARCH_TERM_REQUIRED:"Enter at least two characters to search stations.",EOS_CLOCK_EVENT_INVALID:"Choose a valid duty and clock action.",EOS_ASSIGNMENT_NOT_FOUND:"That duty is no longer available on your roster.",EOS_ACTION_INVALID:"Choose an OPS action and add a short description."};
  const out=new Error(messages[code]||"EOS could not synchronize with ALTEA. Refresh or contact OPS Control.");out.name="EosError";out.code=code;out.publicMessage=out.message;return out;
}
async function call(handler,input){try{return await handler(input||{});}catch(error){throw publicError(error);}}
export const getEosBootstrap=webMethod(Permissions.SiteMember,input=>call(getEosBootstrapCore,input));
export const searchEosFlights=webMethod(Permissions.SiteMember,input=>call(searchEosFlightsCore,input));
export const searchEosStations=webMethod(Permissions.SiteMember,input=>call(searchEosStationsCore,input));
export const createEosClockEvent=webMethod(Permissions.SiteMember,input=>call(createEosClockEventCore,input));
export const submitEosOpsAction=webMethod(Permissions.SiteMember,input=>call(submitEosOpsActionCore,input));
