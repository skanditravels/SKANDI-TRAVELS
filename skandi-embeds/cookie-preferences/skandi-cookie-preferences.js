
"use strict";
(() => {
  const SOURCE = "SKANDI_COOKIE_PREFERENCES";
  const PARENT = "SKANDI_WIX_PARENT";
  const gpc = navigator.globalPrivacyControl === true;
  const ids = ["functional","analytics","advertising","dataToThirdParty"];
  const byId = id => document.getElementById(id);
  let busy = false;

  function post(type, payload = {}) { window.parent.postMessage({ source:SOURCE, type, payload, timestamp:new Date().toISOString() }, "*"); }
  function measure() { post("SKANDI_CONTENT_RESIZE", { height:Math.ceil(document.documentElement.scrollHeight + 8) }); }
  function setBusy(value, text = "") {
    busy = value;
    ["save","reject","accept",...ids].forEach(id => { const el=byId(id); if (el) el.disabled = value || (id === "dataToThirdParty" && gpc); });
    byId("status").textContent = text;
  }
  function policyFromUi() {
    return {
      essential:true,
      functional:byId("functional").checked,
      analytics:byId("analytics").checked,
      advertising:byId("advertising").checked,
      dataToThirdParty:gpc ? false : byId("dataToThirdParty").checked
    };
  }
  function renderState(data = {}) {
    const p = data.policy || {};
    byId("functional").checked = p.functional === true;
    byId("analytics").checked = p.analytics === true;
    byId("advertising").checked = p.advertising === true;
    byId("dataToThirdParty").checked = gpc ? false : p.dataToThirdParty === true;
    byId("dataToThirdParty").disabled = gpc;
    byId("gpcState").textContent = gpc ? "Global Privacy Control detected — sharing locked off" : "Controlled separately";
    const created = data.createdDate ? new Date(data.createdDate) : null;
    const when = created && !Number.isNaN(created.getTime()) ? created.toLocaleString() : "";
    byId("summary").innerHTML = data.defaultPolicy === true
      ? "<strong>No explicit choice is stored yet.</strong> Review the categories below and save your preferences."
      : `<strong>Your current preference is active.</strong>${when ? ` Last changed ${when}.` : ""}`;
    setBusy(false, "");
    measure();
  }
  function submit(type, policy) {
    if (busy) return;
    setBusy(true, "Saving your privacy preferences…");
    post(type, { policy, gpc });
  }

  byId("save").addEventListener("click", () => submit("SKANDI_CONSENT_SAVE", policyFromUi()));
  byId("reject").addEventListener("click", () => submit("SKANDI_CONSENT_REJECT_OPTIONAL", null));
  byId("accept").addEventListener("click", () => submit("SKANDI_CONSENT_ACCEPT_ALL", null));
  document.addEventListener("click", event => { const path=event.target.closest("[data-path]")?.getAttribute("data-path"); if(path) post("SKANDI_CONSENT_NAVIGATE",{path}); });

  window.addEventListener("message", event => {
    let msg=event.data;
    if(typeof msg === "string"){try{msg=JSON.parse(msg)}catch(_){return}}
    if(!msg || msg.source !== PARENT) return;
    if(msg.type === "SKANDI_CONSENT_STATE") renderState(msg.payload || {});
    if(msg.type === "SKANDI_CONSENT_SAVED") {
      if(msg.payload?.ok){ byId("status").textContent="Preferences saved. They apply fully after the next page load."; post("SKANDI_CONSENT_REQUEST",{gpc}); }
      else setBusy(false,msg.payload?.message || "We could not save your preferences. Please try again.");
    }
  });

  if(gpc){byId("gpcState").textContent="Global Privacy Control detected — sharing locked off";byId("dataToThirdParty").disabled=true}
  new ResizeObserver(measure).observe(document.body);
  window.addEventListener("load",measure);
  post("MASTER_CONFIG_REQUEST",{context:"cookie-preferences"});
  post("SKANDI_CONSENT_REQUEST",{gpc});
  setTimeout(()=>post("SKANDI_CONSENT_REQUEST",{gpc}),300);
})();
