// /src/pages/Payroll.rzo0a.js
// V12 Payroll bridge — listener-first, single-flight bootstrap. Payroll consumes SuccessFactors-owned HR/jurisdiction master data but does not overwrite it.
import wixLocation from "wix-location";
import { createPayrollPeriod,createPayrollProviderExport,createPayrollRunFromPeriod,finalizePayrollRun,getPayrollWorkspace,markPayrollProviderExportSent,savePayrollAdjustment,savePayrollEmployeeProfile,savePayrollRunLine } from "backend/SKANDI_CORE/payroll.web";
const EMBED_ID="#payrollStaffEmbed",CHILD_SOURCE="SKANDI_ZALARIS_PAYROLL",PARENT_SOURCE="SKANDI_WIX_PARENT";let bootstrapPromise=null;
function send(embed,type,payload={}){embed.postMessage({source:PARENT_SOURCE,type,payload,timestamp:new Date().toISOString()});}
function internalPath(value){const path=String(value||"").trim();return path==="/riaintra"||path.startsWith("/riaintra/")?path:"";}
async function bootstrap(embed,force=false){if(bootstrapPromise&&!force)return bootstrapPromise;bootstrapPromise=(async()=>{const workspace=await getPayrollWorkspace();send(embed,"PAYROLL_WORKSPACE",workspace);return workspace;})().finally(()=>{bootstrapPromise=null});return bootstrapPromise;}
$w.onReady(function(){const embed=$w(EMBED_ID);embed.onMessage(async event=>{const message=event.data||{};if(message.source&&message.source!==CHILD_SOURCE)return;const type=String(message.type||""),payload=message.payload||{};try{
  if(type==="PAYROLL_READY"||type==="PAYROLL_REFRESH"){await bootstrap(embed,type==="PAYROLL_REFRESH");return;}
  if(type==="PAYROLL_NAVIGATE"){const path=internalPath(payload.path);if(path)wixLocation.to(path);return;}
  const actions={PAYROLL_SAVE_PROFILE:()=>savePayrollEmployeeProfile(payload),PAYROLL_CREATE_PERIOD:()=>createPayrollPeriod(payload),PAYROLL_CREATE_RUN:()=>createPayrollRunFromPeriod(payload),PAYROLL_SAVE_RUN_LINE:()=>savePayrollRunLine(payload),PAYROLL_SAVE_ADJUSTMENT:()=>savePayrollAdjustment(payload),PAYROLL_FINALIZE_RUN:()=>finalizePayrollRun(payload),PAYROLL_CREATE_EXPORT:()=>createPayrollProviderExport(payload),PAYROLL_MARK_EXPORT_SENT:()=>markPayrollProviderExportSent(payload)};
  if(actions[type]){const result=await actions[type]();if(type==="PAYROLL_CREATE_EXPORT"&&result?.csv){send(embed,"PAYROLL_EXPORT_READY",result);return;}send(embed,"PAYROLL_WORKSPACE",result);}
}catch(error){send(embed,"PAYROLL_ERROR",{action:type,code:error?.code||"PAYROLL_ACTION_FAILED",message:error?.message||"The Payroll action could not be completed."});}});
send(embed,"PAYROLL_HOST_READY",{version:"V12-2026.10.13",successFactorsOwnership:"READ_ONLY_MASTER"});bootstrap(embed).catch(error=>send(embed,"PAYROLL_ERROR",{action:"PAYROLL_BOOTSTRAP",code:error?.code||"PAYROLL_BOOTSTRAP_FAILED",message:error?.message||"Payroll could not synchronize."}));});
