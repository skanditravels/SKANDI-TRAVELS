// Wix owns the public chat host and the browser-tab conversation.
import { session } from 'wix-storage-frontend';
import { currentMember } from 'wix-members-frontend';
import {
  startAlexandraLiveKitSession,
  getCustomerSupportBootstrap,
  createCustomerSupportCase,
  getCustomerSupportCase,
  requestCustomerHumanHandoff,
  addCustomerLiveSupportMessage
} from 'backend/SKANDI_CORE/customerSupport.web';
import { SITE_MAP, isSafeInternalRoute } from 'public/siteMap';

export const ALEXANDRA_GLOBAL_PANEL_ID = '#skandiAlexandraGlobalEmbed';
const LEGACY_LAUNCHER_ID = '#skandiAlexandraLauncherEmbed';
const CHAT_SOURCE = 'SKANDI_SUPPORT_CHAT';
const STORAGE_KEY = 'skandi_alexandra_livekit_chat_v12';
const LEGACY_KEY = 'skandi_alexandra_wix_ai_chat_v127';
const LOCALES = { EN: 'en-US', SV: 'sv-SE', NO: 'nb-NO', DA: 'da-DK', FI: 'fi-FI' };
const AVATAR = {
  avatarAssetKey: 'alexandra-support-avatar',
  avatarVideoUrl: 'https://video.wixstatic.com/video/394052_b44198f20fc44baa90b3fc03d87602ea/1080p/mp4/file.mp4',
  playbackRate: 0.75,
  displayName: 'Alexandra',
  role: 'SKANDI Digital Customer Service Assistant',
  provider: 'LiveKit'
};
const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
let bridge;

function conversation(value = {}) {
  const messages = Array.isArray(value.messages) ? value.messages : [];
  const human = object(value.human);
  return {
    open: value.open === true,
    messages: messages.slice(-18).filter(item => ['user', 'assistant', 'agent'].includes(item?.role))
      .map(item => ({ role: item.role, content: clean(item.content, 1700) })).filter(item => item.content),
    draft: String(value.draft ?? '').slice(0, 2000),
    caseId: clean(value.caseId, 160),
    resumeTicket: clean(value.resumeTicket, 1550),
    expired: value.expired === true,
    human: ['live', 'queued', 'closed'].includes(human.status) ? { status: human.status, message: clean(human.message, 500) } : null
  };
}

function readSaved() {
  try {
    const saved = JSON.parse(session.getItem(STORAGE_KEY) || 'null');
    if (saved?.memberId) return saved;
    const legacy = saved || JSON.parse(session.getItem(LEGACY_KEY) || '{}');
    return { memberId: session.getItem(STORAGE_KEY + '_identity'), ...conversation(legacy), open: false };
  } catch (_) { return {}; }
}

function save(memberId, state) {
  try {
    // Store only the bounded transcript and the scoped resume ticket in this tab.
    // LiveKit join JWTs and customer/agent connection credentials stay in memory.
    const snapshot = { memberId, ...conversation(state) };
    let json = JSON.stringify(snapshot);
    // Leave room in Wix's 50 KB session store for the site's other state.
    while (json.length > 9000 && snapshot.messages.length) {
      snapshot.messages.shift();
      json = JSON.stringify(snapshot);
    }
    session.setItem(STORAGE_KEY, json);
    session.removeItem(STORAGE_KEY + '_identity');
    session.removeItem(LEGACY_KEY);
  } catch (_) { console.warn('[Alexandra] Browser-tab state could not be saved.'); }
}

function post(host, type, payload = {}, requestId = '') {
  try {
    host?.element.postMessage({ source: 'SKANDI_WIX_PARENT', type, requestId, payload: { ...payload, instance: host.instance, requestId } });
  } catch (_) { /* Wix may be replacing the component during navigation. */ }
}

function widgetVisibility(element, visible, expanded = false) {
  try {
    // Wix supports custom CSS classes on Sections. The iframe itself has a fixed editor size.
    const section = element.parent;
    if (section?.type === '$w.Section' && section.customClassList) {
      section.customClassList.add('skandi-alexandra-host');
      if (expanded) section.customClassList.add('skandi-alexandra-host-open');
      else section.customClassList.remove('skandi-alexandra-host-open');
    }
  } catch (_) {}
  try {
    const update = visible ? element.show() : element.hide();
    Promise.resolve(update).catch(() => {});
  } catch (_) {}
}

export function bindAlexandraGlobal({ wixSelector, navigate, enabled, settings, initialPath = '' }) {
  if (bridge) {
    bridge.onRouteChange(initialPath);
    return bridge;
  }

  const hosts = new Map();
  const bound = new WeakSet();
  let path = initialPath, currentHost, panelElement, state = conversation(), memberId, bootstrap, profilePromise;
  let generation = 0, launch, alexandraRoom, humanRoom, pendingOpen;
  const allowed = () => enabled() && isSafeInternalRoute(path) && !/^\/(?:riaintra|altea|intra|staff|admin|_functions)(?:\/|$)/i.test(path);
  const commit = updates => {
    state = conversation({ ...state, ...updates });
    if (memberId && allowed()) save(memberId, state);
  };

  function widgetContext(host, restore = false) {
    const ui = { active: host === currentHost, global: host.global, pagePath: path };
    if (restore && ui.active) {
      const { open, messages, draft, caseId, human, expired } = state;
      post(host, 'SUPPORT_CHAT_RESTORE', { ...ui, open, messages, draft, caseId, human, expired });
    } else post(host, 'SUPPORT_CHAT_HOST_STATE', ui);
  }

  function updateSize() {
    if (currentHost?.global) widgetVisibility(currentHost.element, allowed(), state.open);
  }

  function selectHost() {
    const next = allowed() ? hosts.get('global') || (path === SITE_MAP.support ? hosts.get('help') : null) : null;
    if (next === currentHost) return false;
    const previous = currentHost;
    currentHost = next;
    if (previous) widgetContext(previous);
    if (next && memberId) {
      updateSize();
      widgetContext(next, true);
    }
    return Boolean(next);
  }

  function clear() {
    ++generation;
    launch = null;
    alexandraRoom = null;
    humanRoom = null;
    pendingOpen = null;
    bootstrap = null;
    state = conversation();
    try { session.removeItem(STORAGE_KEY);session.removeItem(LEGACY_KEY);session.removeItem(STORAGE_KEY + '_identity'); } catch (_) {}
    for (const host of hosts.values()) post(host, 'SUPPORT_CHAT_FORCE_CLOSE');
    updateSize();
  }

  async function refreshIdentity() {
    if (profilePromise) return profilePromise;
    const pending = (async () => {
      let id = 'guest';
      try { id = clean((await currentMember.getMember())?._id, 120) || 'guest'; } catch (_) {}
      if (memberId === id) return;
      const previous = memberId;
      const saved = previous ? {} : readSaved();
      if (previous || (saved.memberId && saved.memberId !== id)) clear();
      memberId = id;
      if (saved.memberId === id) state = conversation(saved);
      const selected = selectHost();
      if (currentHost && !selected) {
        updateSize();
        widgetContext(currentHost, true);
      }
    })();
    profilePromise = pending;
    try { await pending; } finally { if (profilePromise === pending) profilePromise = null; }
  }

  async function pushBootstrap(host, requestId) {
    const requestGeneration = generation;
    const pending = bootstrap ||= Promise.resolve().then(() => getCustomerSupportBootstrap());
    let data;
    try { data = await pending; }
    catch (_) { if (bootstrap === pending) bootstrap = null; data = {}; }
    if (requestGeneration === generation && host === currentHost && allowed()) {
      post(host, 'SUPPORT_CHAT_BOOTSTRAP', { ...object(data), loggedIn: memberId !== 'guest', alexandra: { ...AVATAR, ...object(data?.alexandra) }, pagePath: path }, requestId);
    }
  }

  function chatError(requestId, message, action = '') {
    if (allowed()) post(currentHost, 'SUPPORT_CHAT_ERROR', { message, action }, requestId);
  }

  function publishRoom(host, session, type, requestId) {
    if (host !== currentHost || !allowed()) return;
    if (type === 'HUMAN') {
      post(host, 'SUPPORT_CHAT_HUMAN_HANDOFF', { ...state.human, caseId: state.caseId, livekitSession: session, resume: true }, requestId);
      return;
    }
    const { resumeTicket, ...room } = session;
    post(host, 'SUPPORT_CHAT_OPEN', { mode: 'ALEXANDRA_LIVEKIT', alexandraSession: room, open: state.open, loggedIn: memberId !== 'guest' }, requestId);
  }

  async function connect(host, requestId = '', retry = false) {
    if (!host || launch || !allowed()) return;
    if (state.human && state.human.status !== 'live') return;
    if (state.expired && !retry) return;
    const selectedGeneration = generation;
    const pending = (async () => {
      try {
        if (state.human?.status === 'live') {
          const room = humanRoom?.expires > Date.now() && !retry ? humanRoom.session :
            (await getCustomerSupportCase({ caseId: state.caseId, resumeLiveChat: true }))?.livekitSession;
          if (selectedGeneration !== generation || !allowed()) return;
          if (!room) {
            commit({ human: { status: 'closed', message: 'This live chat has ended. You can follow up in your support case.' } });
            publishRoom(currentHost, null, 'HUMAN', requestId);
            return;
          }
          humanRoom = { session: room, expires: Date.now() + 14 * 60 * 1000 };
          publishRoom(currentHost, room, 'HUMAN', requestId);
          return;
        }

        if (alexandraRoom?.expires > Date.now() && alexandraRoom.instance === host.instance && !retry) {
          publishRoom(currentHost, alexandraRoom.session, 'ALEXANDRA', requestId);
          return;
        }
        const siteSettings = settings();
        const resumeTicket = state.resumeTicket;
        const result = await startAlexandraLiveKitSession({
          locale: siteSettings.locale || LOCALES[siteSettings.language],
          currency: siteSettings.currency,
          pagePath: path,
          ...(resumeTicket ? { resumeTicket } : {})
        });
        if (selectedGeneration !== generation || !allowed()) return;
        if (result?.code === 'ALEXANDRA_SESSION_ENDED') {
          alexandraRoom = null;
          commit({ resumeTicket: '', expired: true });
          chatError(requestId, 'The live session ended. Your messages are here. Try sending again to start a new connection.', 'connect');
          return;
        }
        const room = object(result?.session);
        if (!result?.ok || !room.sessionId || !room.url || !room.token || !room.roomName) throw new Error('Unconfirmed LiveKit session');
        alexandraRoom = { session: room, expires: Date.now() + 14 * 60 * 1000, instance: currentHost?.instance };
        commit({ resumeTicket: room.resumeTicket, expired: false });
        publishRoom(currentHost, room, 'ALEXANDRA', requestId);
      } catch (_) {
        if (selectedGeneration === generation) chatError(requestId, 'Chat could not connect. Your messages are still here. Please try again.', 'connect');
      }
    })();
    launch = pending;
    try { await pending; } finally { if (launch === pending) launch = null; }
  }

  async function open({ mode = 'ALEXANDRA', payload = {}, requestId = '', retry = false } = {}) {
    if (!allowed()) return false;
    await refreshIdentity();
    if (!allowed()) return false;
    if (!currentHost) {
      if (!panelElement && path !== SITE_MAP.support) return false;
      pendingOpen = { mode, payload, requestId, retry };
      return true;
    }
    const host = currentHost, openGeneration = generation;
    commit({ open: true });
    updateSize();
    post(host, 'SUPPORT_CHAT_HOST_STATE', { active: true, open: true, global: host.global, pagePath: path }, requestId);
    if (mode === 'FORM') {
      await pushBootstrap(host, requestId);
      if (openGeneration === generation && host === currentHost) post(host, 'SUPPORT_CHAT_OPEN', { mode, formPrefill: payload }, requestId);
    } else if (mode === 'HUMAN') {
      await pushBootstrap(host, requestId);
      if (openGeneration !== generation || host !== currentHost) return true;
      if (state.human) await connect(host, requestId);
      else {
        post(host, 'SUPPORT_CHAT_OPEN', { mode: 'HANDOFF_PENDING' }, requestId);
        await runAction('SUPPORT_CHAT_START_HUMAN', payload, requestId);
      }
    } else {
      void pushBootstrap(host, requestId);
      await connect(host, requestId, retry);
    }
    return true;
  }

  function restoreConnection(host) {
    if (state.open) return open();
    if (state.resumeTicket || state.human?.status === 'live') return connect(host);
  }

  async function runAction(type, payload, requestId) {
    const started = generation;
    let response, result;
    try {
      if (type === 'SUPPORT_CHAT_START_HUMAN') {
        result = await requestCustomerHumanHandoff({
          caseId: state.caseId || clean(payload.caseId, 160),
          input: { ...object(payload.input), source: 'alexandra-live-chat', sourcePage: path },
          reason: clean(payload.reason || 'Customer requested a human agent.', 2000),
          summary: clean(payload.summary, 6000),
          collectedFields: object(payload.collectedFields),
          transcript: Array.isArray(payload.transcript) ? payload.transcript.slice(-60) : clean(payload.transcript, 12000)
        });
        response = 'SUPPORT_CHAT_HUMAN_HANDOFF';
      } else if (type === 'SUPPORT_CHAT_HUMAN_MESSAGE') {
        result = await addCustomerLiveSupportMessage({ caseId: state.caseId, content: clean(payload.content, 12000) });
        response = 'SUPPORT_CHAT_HUMAN_MESSAGE_SAVED';
      } else {
        result = await createCustomerSupportCase({ input: { ...object(payload.input), source: 'alexandra-widget', sourceChannel: 'ALEXANDRA_LIVEKIT', sourcePage: path } });
        response = 'SUPPORT_CHAT_CASE_CREATED';
      }
      if (started !== generation || !allowed()) return;
      if (type === 'SUPPORT_CHAT_START_HUMAN') {
        if (!result?.caseId || !['live', 'queued'].includes(result.status)) throw new Error('Unconfirmed human handoff');
        commit({ caseId: result.caseId, human: result, resumeTicket: '' });
        alexandraRoom = null;
      } else if (type === 'SUPPORT_CHAT_SUBMIT_FORM' && result?.caseId && !state.human) {
        commit({ caseId: result.caseId });
      }
      if (result?.livekitSession) humanRoom = { session: result.livekitSession, expires: Date.now() + 14 * 60 * 1000 };
      post(currentHost, response, object(result), requestId);
      if (response === 'SUPPORT_CHAT_CASE_CREATED' && path === SITE_MAP.support) {
        post(hosts.get('help'), 'PUBLIC_SUPPORT_CASE_CREATED', object(result), requestId);
      }
    } catch (_) {
      if (started === generation) {
        const message = type === 'SUPPORT_CHAT_START_HUMAN' && memberId === 'guest'
          ? 'Sign in to your SKANDI account to contact a live agent.'
          : 'Customer Service could not complete that action. Please try again.';
        chatError(requestId, message, type);
      }
    }
  }

  async function handle(element, message, global) {
    if (!allowed() || message.source !== CHAT_SOURCE) return;
    const payload = object(message.payload);
    const key = global ? 'global' : 'help';
    const instance = clean(payload.instance, 90);
    let host = hosts.get(key);
    if (message.type === 'SUPPORT_CHAT_READY') {
      if (!global && path !== SITE_MAP.support) return;
      let newWidget = false;
      if (!host || host.instance !== instance || host.element !== element) {
        host = { element, instance, global };
        hosts.set(key, host);
        newWidget = true;
      }
      await refreshIdentity();
      if (!allowed() || hosts.get(key) !== host) return;
      const changed = selectHost();
      if (host !== currentHost) {
        widgetContext(host);
        return;
      }
      if (pendingOpen) {
        const pending = pendingOpen;
        pendingOpen = null;
        await open(pending);
      } else if (changed || newWidget) {
        await restoreConnection(host);
        if (!instance) await pushBootstrap(host, message.requestId);
      }
      else {
        widgetContext(host);
        if (!instance) await pushBootstrap(host, message.requestId);
      }
      return;
    }
    if (host !== currentHost || host.element !== element || host.instance !== instance) return;
    const requestId = clean(payload.requestId || message.requestId, 120);
    switch (message.type) {
      case 'SUPPORT_CHAT_START_ALEXANDRA':
        await open({ requestId, retry: payload.reconnect === true || state.expired });
        break;
      case 'SUPPORT_CHAT_SNAPSHOT':
        commit({ messages: payload.messages, draft: payload.draft });
        break;
      case 'SUPPORT_CHAT_PANEL_CLOSE':
        commit({ open: false });
        updateSize();
        break;
      case 'SUPPORT_CHAT_PANEL_OPEN':
        commit({ open: true });
        updateSize();
        break;
      case 'SUPPORT_CHAT_START_HUMAN':
      case 'SUPPORT_CHAT_HUMAN_MESSAGE':
      case 'SUPPORT_CHAT_SUBMIT_FORM':
        await runAction(message.type, payload, requestId);
        break;
      case 'SUPPORT_CHAT_NAVIGATE':
        if (isSafeInternalRoute(payload.path)) navigate(payload.path);
        break;
    }
  }

  function onRouteChange(nextPath) {
    path = nextPath || '/';
    let panel;
    try {
      const old = wixSelector(LEGACY_LAUNCHER_ID);
      if (old) Promise.resolve(old.hide()).catch(() => {});
    } catch (_) {}
    try { panel = wixSelector(ALEXANDRA_GLOBAL_PANEL_ID); } catch (_) {}
    panelElement = panel && typeof panel.onMessage === 'function' ? panel : null;
    if (!panel || typeof panel.onMessage !== 'function') hosts.delete('global');
    else if (!bound.has(panel)) {
      bound.add(panel);
      panel.onMessage(event => handle(panel, object(event?.data), true));
    }
    if (!allowed()) {
      for (const host of hosts.values()) post(host, 'SUPPORT_CHAT_FORCE_CLOSE');
      hosts.clear();
      currentHost = null;
      pendingOpen = null;
      launch = null;
      alexandraRoom = null;
      humanRoom = null;
      ++generation;
      if (panel) widgetVisibility(panel, false);
      return;
    }
    if (path !== SITE_MAP.support) hosts.delete('help');
    const changed = selectHost();
    if (changed) void restoreConnection(currentHost);
    else if (currentHost) widgetContext(currentHost);
    // An existing frame may survive Wix navigation. Request its current instance,
    // without disconnecting it or triggering a new provider dispatch.
    if (panel) {
      widgetVisibility(panel, true, currentHost?.global && state.open);
      post({ element: panel }, 'SUPPORT_CHAT_PING');
    }
  }

  bridge = {
    onRouteChange, open, clear, refreshIdentity,
    handleSupportMessage: (embed, message) => handle(embed, message, false),
    reportSupportCase(result, requestId) {
      if (!allowed() || path !== SITE_MAP.support || !result?.caseId || state.human) return;
      commit({ caseId: result.caseId });
      post(currentHost, 'SUPPORT_CHAT_CASE_CREATED', result, requestId);
    },
    async openFromMobile(requestId) {
      if (!allowed()) return;
      if (!(await open({ requestId }))) {
        commit({ open: true });
        navigate(SITE_MAP.support);
      }
    }
  };
  onRouteChange(initialPath);
  return bridge;
}

export function getAlexandraGlobal() { return bridge; }
