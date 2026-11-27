(() => {
  "use strict";
  const SOURCE = "SKANDI_SUPPORT_CHAT", PARENT = "SKANDI_WIX_PARENT";
  const ALEX_TOPIC = "lk.chat", HUMAN_TOPIC = "skandi.support.chat";
  const GREETING = {
    EN: ["Hi, can I help you?", "Dismiss Alexandra’s greeting"],
    SV: ["Hej, kan jag hjälpa dig?", "Stäng Alexandras hälsning"],
    NO: ["Hei, kan jeg hjelpe deg?", "Lukk Alexandras hilsen"],
    DA: ["Hej, kan jeg hjælpe dig?", "Luk Alexandras hilsen"],
    FI: ["Hei, voinko auttaa?", "Sulje Alexandran tervehdys"]
  };
  const $ = id => document.getElementById(id);
  const clean = (value, length = 30000) => String(value ?? "").trim().slice(0, length);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const instance = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const host = $("launcher").parentElement;
  const portrait = $("alexandraPortrait"), portraitImage = $("alexandraPortraitImage");
  let portraitReady = portraitImage.complete && portraitImage.naturalWidth > 0;
  let boot = {}, mode = "ALEXANDRA", caseId = "", pagePath = "/about/support";
  let transcript = [], room = null, roomSession = null, roomEpoch = 0, connecting = false;
  let active = false, configured = false, loggedIn = false, humanPending = false, sending = false, lastSend = "", open = false;
  let connectionRequested = false, panelFocusTimer;

  function updatePortrait() {
    const destination = open ? $("avatarSlot") : $("launcher");
    if (portrait.parentElement !== destination) destination.prepend(portrait);
    const showPortrait = portraitReady && (!open || mode === "ALEXANDRA");
    portrait.hidden = !showPortrait;
    $("launcherFallback").hidden = portraitReady;
    $("avatarFallback").hidden = open && showPortrait;
  }
  portraitImage.addEventListener("load", () => { portraitReady = true; updatePortrait(); });
  portraitImage.addEventListener("error", () => { portraitReady = false; updatePortrait(); });
  updatePortrait();

  function post(type, payload = {}) {
    window.parent.postMessage({ source: SOURCE, type, requestId: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, payload: { ...payload, instance } }, "*");
  }
  function snapshot() {
    if (active) post("SUPPORT_CHAT_SNAPSHOT", { messages: transcript.slice(-18), draft: $("input").value });
  }
  function setViewport() {
    const height = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
    host.style.setProperty("--vvh", `${Math.round(height)}px`);
  }
  setViewport();
  window.addEventListener("resize", setViewport);
  window.visualViewport?.addEventListener("resize", setViewport);
  window.visualViewport?.addEventListener("scroll", setViewport);
  window.addEventListener("pagehide", snapshot);

  function setPanel(show, focus = false) {
    open = show;
    $("panel").classList.toggle("open", show);
    $("launcher").classList.toggle("hidden", show);
    $("launcher").setAttribute("aria-expanded", String(show));
    if (show) $("alexandraGreeting").hidden = true;
    updatePortrait();
    clearTimeout(panelFocusTimer);
    if (show) {
      setViewport();
      if (focus) panelFocusTimer = setTimeout(() => $("input").focus(), 80);
    } else $("input").blur();
  }
  function disconnect() {
    roomEpoch++;
    const previous = room;
    room = null;
    roomSession = null;
    connecting = false;
    sending = false;
    try { Promise.resolve(previous?.disconnect()).catch(() => {}); } catch (_) {}
  }
  function commandState() {
    const disabled = humanPending || mode === "QUEUED" || mode === "CLOSED";
    $("input").disabled = disabled;
    $("sendBtn").disabled = disabled || sending || connecting || connectionRequested;
  }
  function presence(value) { $("presenceText").textContent = value; }
  function setMode(value) {
    mode = value;
    const human = value !== "ALEXANDRA";
    $("agentName").textContent = human ? "SKANDI Customer Service" : "Alexandra";
    $("agentRole").textContent = human ? "Human SKANDI Customer Service Agent" : "Digital Customer Service Agent";
    $("avatarFallback").textContent = human ? "S" : "A";
    updatePortrait();
    presence(humanPending ? "Connecting…" : value === "QUEUED" ? "In queue" : value === "CLOSED" ? "Ended" : room?.state === "connected" ? "Online" : "Ready");
    commandState();
  }
  function render(kind, content, name = "") {
    const element = document.createElement("div");
    element.className = `msg ${kind}`;
    element.innerHTML = (name ? `<strong>${esc(name)}</strong>` : "") + esc(content);
    $("messages").appendChild(element);
    requestAnimationFrame(() => { $("messages").scrollTop = $("messages").scrollHeight; });
  }
  function system(text) { if (text) render("system", text); }
  function renderMessage(item) {
    render(item.role === "user" ? "mine" : "remote", item.content, { user: "You", assistant: "Alexandra", agent: "SKANDI Customer Service" }[item.role]);
  }
  function message(role, content) {
    const text = clean(content);
    if (!text) return;
    const item = { role, content: text };
    transcript.push(item);
    if (transcript.length > 60) transcript.shift();
    renderMessage(item);
    snapshot();
  }

  function applyBoot(payload) {
    boot = payload;
    loggedIn = Boolean(payload.loggedIn || payload.profile?.memberId);
    const profile = payload.profile || {};
    if (!$("contactName").value) $("contactName").value = clean(profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(" "), 200);
    if (!$("contactEmail").value) $("contactEmail").value = clean(profile.email, 254);
    const category = $("category").value, topic = $("topic").value;
    $("category").innerHTML = (payload.workflows || []).map(workflow => `<option value="${esc(workflow.key)}">${esc(workflow.title || workflow.key)}</option>`).join("") || '<option value="general">General Support</option>';
    if ([...$("category").options].some(option => option.value === category)) $("category").value = category;
    updateTopics();
    if ([...$("topic").options].some(option => option.value === topic)) $("topic").value = topic;
  }
  function workflow() { return (boot.workflows || []).find(item => item.key === $("category").value); }
  function updateTopics() {
    $("topic").innerHTML = (workflow()?.topics || [{ key: "general-question", title: "General Question" }])
      .map(item => `<option value="${esc(item.key)}">${esc(item.title || item.key)}</option>`).join("");
    $("baggageFields").classList.toggle("hidden", $("category").value !== "baggage");
    updatePir();
  }
  function updatePir() {
    const no = $("hasPir").value === "no";
    $("pirWrap").classList.toggle("hidden", $("hasPir").value !== "yes");
    $("formNotice").textContent = no ? workflow()?.guidance?.noPir || "A SKANDI support case does not replace the formal baggage report/PIR required by the operating airline or airport baggage service." : "";
    $("formNotice").classList.toggle("hidden", !no);
  }
  function openForm(prefill = {}) {
    $("formSheet").classList.add("open");
    if (prefill.category) { $("category").value = prefill.category; updateTopics(); }
    if (prefill.subject) $("subject").value = prefill.subject;
    if (prefill.message) $("description").value = prefill.message;
  }

  async function connectRoom(session, nextMode) {
    const person = nextMode === "HUMAN" ? "Customer Service" : "Alexandra";
    connectionRequested = false;
    if (roomSession?.roomName && roomSession.roomName === session?.roomName && (connecting || room?.state === "connected" || room?.state === "reconnecting")) {
      commandState();
      return;
    }
    if (!session?.url || !session?.token || !window.LivekitClient) {
      presence("Connection unavailable");
      system(`${person} could not connect. Please try again.`);
      commandState();
      return;
    }
    disconnect();
    const epoch = roomEpoch;
    const { Room, RoomEvent } = window.LivekitClient;
    const nextRoom = new Room({ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: false });
    room = nextRoom;
    roomSession = session;
    connecting = true;
    setMode(nextMode);
    presence("Connecting…");
    const isCurrent = () => epoch === roomEpoch && room === nextRoom;
    const topic = nextMode === "ALEXANDRA" ? session.transcriptionTopic || "lk.transcription" : session.textTopic || HUMAN_TOPIC;
    nextRoom.registerTextStreamHandler(topic, async (reader, participant) => {
      if (participant?.identity === nextRoom.localParticipant?.identity) return;
      try {
        const text = await reader.readAll();
        if (isCurrent() && active) message(nextMode === "ALEXANDRA" ? "assistant" : "agent", text);
      } catch (_) {}
    });
    nextRoom.on(RoomEvent.Reconnecting, () => { if (isCurrent()) presence("Reconnecting…"); });
    nextRoom.on(RoomEvent.Reconnected, () => { if (isCurrent()) presence("Online"); });
    nextRoom.on(RoomEvent.Disconnected, () => {
      if (!isCurrent()) return;
      presence("Disconnected");
      if (active && open) system(`${person} disconnected. Your messages are still here.`);
    });
    if (nextMode === "ALEXANDRA") {
      nextRoom.registerRpcMethod("open_support_form", async data => {
        if (isCurrent() && active) openForm(rpcPayload(data));
        return JSON.stringify({ ok: isCurrent() && active });
      });
      nextRoom.registerRpcMethod("start_human_chat", async data => {
        if (isCurrent() && active) startHuman(rpcPayload(data));
        return JSON.stringify({ ok: isCurrent() && active });
      });
    }
    try {
      await nextRoom.connect(session.url, session.token, { autoSubscribe: false });
      if (isCurrent()) presence("Online");
      else await nextRoom.disconnect();
    } catch (_) {
      if (isCurrent()) {
        presence("Connection unavailable");
        system(`${person} could not connect. Please try again.`);
      }
    } finally {
      if (isCurrent()) { connecting = false; commandState(); }
    }
  }
  function rpcPayload(data) {
    try { return JSON.parse(data?.payload || "{}"); }
    catch (_) { return {}; }
  }
  function requestConnection() {
    if (connectionRequested || connecting || room?.state === "reconnecting") return;
    connectionRequested = true;
    presence("Connecting…");
    commandState();
    post("SUPPORT_CHAT_START_ALEXANDRA", { reconnect: Boolean(roomSession) });
  }
  function startHuman(details = {}) {
    if (humanPending || mode !== "ALEXANDRA") return;
    if (details.caseId && (details.livekitSession || details.status === "queued")) {
      void applyHandoff({ ...details, status: details.livekitSession ? "live" : "queued" });
      return;
    }
    if (!loggedIn) {
      system("Sign in to your SKANDI account to contact a live agent. You can still submit a support request here.");
      return;
    }
    humanPending = true;
    setMode("HANDOFF_PENDING");
    system("Connecting you with SKANDI Customer Service. Your messages will be passed along.");
    post("SUPPORT_CHAT_START_HUMAN", { caseId, reason: details.reason, summary: details.summary, transcript: transcript.slice(-60).map(item => ({ role: { user: "customer", assistant: "alexandra", agent: "human-agent" }[item.role], text: item.content })) });
  }
  async function applyHandoff(payload) {
    caseId = clean(payload.caseId, 160) || caseId;
    humanPending = false;
    if (payload.status === "live" && payload.livekitSession) {
      if (!payload.resume) system(payload.message || "A SKANDI Customer Service agent can now join this conversation.");
      await connectRoom(payload.livekitSession, "HUMAN");
      return;
    }
    disconnect();
    setMode(payload.status === "closed" ? "CLOSED" : "QUEUED");
    system(payload.message || "Your request is in the Customer Service queue.");
  }

  async function send() {
    const input = $("input"), text = clean(input.value);
    if (!active || !text || sending || humanPending || mode === "QUEUED" || mode === "CLOSED") return;
    if (mode === "HUMAN" && caseId) {
      sending = true;
      lastSend = text;
      commandState();
      post("SUPPORT_CHAT_HUMAN_MESSAGE", { caseId, content: text });
      return;
    }
    if (mode !== "ALEXANDRA") return;
    if (room?.state !== "connected") {
      snapshot();
      requestConnection();
      return;
    }
    sending = true;
    commandState();
    const epoch = roomEpoch;
    try {
      await room.localParticipant.sendText(text, { topic: roomSession?.textTopic || ALEX_TOPIC });
      if (epoch !== roomEpoch) return;
      if (clean(input.value) === text) input.value = "";
      message("user", text);
    } catch (_) {
      if (epoch === roomEpoch) system("The message could not be sent. It is still in the text box.");
    } finally {
      if (epoch === roomEpoch) { sending = false; commandState(); }
    }
  }
  async function humanMessageSaved(payload) {
    sending = false;
    const text = clean(payload.sentMessage?.content || payload.sentMessage?.body || lastSend);
    if (text && clean($("input").value) === lastSend) $("input").value = "";
    lastSend = "";
    message("user", text);
    const session = payload.livekitSession || roomSession;
    if (session && room?.state !== "connected") await connectRoom(session, "HUMAN");
    if (text && room?.state === "connected") {
      try {
        await room.localParticipant.sendText(text, { topic: session?.textTopic || HUMAN_TOPIC, attributes: { caseId, messageId: String(payload.sentMessage?.messageId || payload.sentMessage?.id || ""), senderType: "customer" } });
      } catch (_) { system("Your message was saved to the support case."); }
    }
    commandState();
  }
  function formPayload() {
    const fullName = clean($("contactName").value, 200), names = fullName.split(/\s+/);
    const bookingRef = clean($("bookingRef").value, 80);
    return {
      firstName: names[0] || "", lastName: names.slice(1).join(" "), fullName, email: clean($("contactEmail").value, 254),
      category: $("category").value, subCategory: $("topic").value, bookingRef, pnr: bookingRef,
      subject: clean($("subject").value, 240), message: clean($("description").value, 12000),
      hasPir: $("hasPir").value, pirNumber: clean($("pirNumber").value, 80), bagTag: clean($("bagTag").value, 80),
      bagType: clean($("bagType").value, 120), bagColor: clean($("bagColor").value, 120), bagBrand: clean($("bagBrand").value, 300),
      source: "support-chat-form", sourcePage: pagePath
    };
  }

  function applyHost(payload) {
    configured = true;
    active = payload.active === true;
    pagePath = payload.pagePath || pagePath;
    host.classList.toggle("sitewide", payload.global === true);
    host.hidden = !active;
    if (typeof payload.open === "boolean") setPanel(active && payload.open);
    const language = clean(payload.language, 16).toUpperCase().split("-")[0];
    const [greeting, dismiss] = GREETING[language] || GREETING.EN;
    $("greetingOpen").textContent = greeting;
    $("greetingDismiss").setAttribute("aria-label", dismiss);
    $("alexandraGreeting").hidden = !active || open || payload.greeting !== true;
  }
  function restore(payload) {
    applyHost(payload);
    if (!active) return;
    transcript = Array.isArray(payload.messages) ? payload.messages.slice(-18) : [];
    $("messages").replaceChildren();
    transcript.forEach(renderMessage);
    $("input").value = payload.draft || "";
    caseId = clean(payload.caseId, 160);
    if (payload.human && payload.human.status !== "live") void applyHandoff({ ...payload.human, caseId });
    else if (payload.human?.status === "live" && !room) setMode("HUMAN");
    if (payload.expired) system("The live session ended. Your messages are here. Try sending again to start a new connection.");
  }
  function forceClose() {
    active = false;
    connectionRequested = false;
    sending = false;
    humanPending = false;
    lastSend = "";
    disconnect();
    caseId = "";
    transcript = [];
    loggedIn = false;
    boot = {};
    $("messages").replaceChildren();
    for (const input of host.querySelectorAll(".composer textarea, .sheet input, .sheet textarea, .sheet select")) input.value = "";
    $("formSheet").classList.remove("open");
    setMode("ALEXANDRA");
    setPanel(false);
    $("alexandraGreeting").hidden = true;
    host.hidden = true;
  }

  function openChat() {
    if (!active) return;
    setPanel(true, true);
    post("SUPPORT_CHAT_PANEL_OPEN");
    if ((mode === "ALEXANDRA" || mode === "HUMAN") && (!room || room.state === "disconnected")) requestConnection();
  }
  $("launcher").onclick = openChat;
  $("greetingOpen").onclick = openChat;
  $("greetingDismiss").onclick = () => {
    $("alexandraGreeting").hidden = true;
    post("SUPPORT_CHAT_GREETING_DISMISS");
    $("launcher").focus();
  };
  $("closeBtn").onclick = () => {
    snapshot();
    setPanel(false);
    post("SUPPORT_CHAT_PANEL_CLOSE");
    $("launcher").focus();
  };
  $("sendBtn").onclick = () => { void send(); };
  $("input").onkeydown = event => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); void send(); } };
  $("input").oninput = event => {
    event.target.style.height = "42px";
    event.target.style.height = Math.min(event.target.scrollHeight, 112) + "px";
    snapshot();
  };
  $("formBtn").onclick = () => openForm();
  $("formClose").onclick = () => $("formSheet").classList.remove("open");
  $("category").onchange = updateTopics;
  $("hasPir").onchange = updatePir;
  $("submitForm").onclick = () => {
    const input = formPayload();
    if (!input.fullName || !input.email || !input.subject || !input.message) {
      $("formNotice").textContent = !input.fullName || !input.email ? "Enter your name and email so Customer Service can reply." : "Subject and description are required.";
      $("formNotice").classList.remove("hidden");
      return;
    }
    post("SUPPORT_CHAT_SUBMIT_FORM", { input });
  };

  const ready = () => post("SUPPORT_CHAT_READY", { integrated: true, greetingSupported: true });
  window.addEventListener("message", event => {
    const msg = event.data || {}, payload = msg.payload || {};
    if (event.source !== window.parent || msg.source !== PARENT || (payload.instance && payload.instance !== instance)) return;
    switch (msg.type) {
      case "SUPPORT_CHAT_PING": ready(); break;
      case "SUPPORT_CHAT_HOST_STATE": applyHost(payload); break;
      case "SUPPORT_CHAT_RESTORE": restore(payload); break;
      case "SUPPORT_CHAT_FORCE_CLOSE": forceClose(); break;
      case "SUPPORT_CHAT_BOOTSTRAP":
        // The published Help Center may still be on its prior Wix controller during rollout.
        if (!configured && !payload.instance) applyHost({ active: true });
        if (active) applyBoot(payload);
        break;
      case "SUPPORT_CHAT_OPEN":
        if (!active) return;
        if (payload.open !== false) setPanel(true);
        if (payload.mode === "FORM") openForm(payload.formPrefill);
        else if (payload.mode === "HANDOFF_PENDING") { humanPending = true; setMode("HANDOFF_PENDING"); }
        else if (payload.alexandraSession) void connectRoom(payload.alexandraSession, "ALEXANDRA");
        break;
      case "SUPPORT_CHAT_HUMAN_HANDOFF": if (active) void applyHandoff(payload); break;
      case "SUPPORT_CHAT_HUMAN_MESSAGE_SAVED": if (active) void humanMessageSaved(payload); break;
      case "SUPPORT_CHAT_CASE_CREATED":
        if (!active) return;
        caseId = clean(payload.caseId, 160) || caseId;
        $("formSheet").classList.remove("open");
        system(payload.caseRef ? `Support request ${payload.caseRef} was created.` : "Your support request was created.");
        break;
      case "SUPPORT_CHAT_ERROR":
        if (!active) return;
        connectionRequested = false;
        sending = false;
        lastSend = "";
        if (humanPending) { humanPending = false; setMode("ALEXANDRA"); }
        if (payload.action === "connect") presence("Connection unavailable");
        commandState();
        system(payload.message || "Support action failed.");
        break;
    }
  });
  ready();
  for (const delay of [900, 2600]) setTimeout(() => { if (!configured) ready(); }, delay);
})();
