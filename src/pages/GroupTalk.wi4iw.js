// Page: /riaintra/success-factors/altea/grouptalk
// HTML Component: #htmlGroupTalk
// Custom Element: #groupTalkVoiceBridge
//
// Supabase backend = single staff authorization gate.
// Supabase Realtime = realtime signaling/presence.
// Wix Window API = geolocation.
// Wix Custom Element + LiveKit = microphone/audio.
// The GroupTalk visual HTML stays headerless.

import wixLocation from "wix-location";
import wixWindowFrontend from "wix-window-frontend";

import {
  getGroupTalkBootstrap,
  getGroupTalkRealtimeConfig,
  updateGroupTalkPresence,
  getGroupTalkPresence,
  createLiveKitToken,
  triggerGroupTalkEvent,
  getPhoneBook,
  sendLocationPing,
  getLiveLocations,
  createGroupTalkTicket,
  getGroupTalkTickets,
  replyToGroupTalkTicket,
  searchGroupTalkHistory,
  adminSaveGroup,
  adminSetMembership,
  getTicketCategories,
  saveTicketCategory,
  deleteTicketCategory,
  getGroupTalkDiagnostics
} from "backend/GROUPTALK/grouptalk.web";


const HTML_ID =
  "#htmlGroupTalk";

const VOICE_ID =
  "#groupTalkVoiceBridge";

const GROUPTALK_SOURCE =
  "GROUPTALK_HTML";

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const LOGIN_PATH =
  "/riaintra";


const AUTH_ERRORS =
  new Set([
    "WIX_MEMBER_SESSION_REQUIRED",
    "GROUPTALK_STAFF_NOT_FOUND",
    "GROUPTALK_STAFF_INACTIVE",
    "GROUPTALK_STAFF_NOT_AUTHORIZED",
    "GROUPTALK_STAFF_BLOCKED",
    "GROUPTALK_ACCESS_DISABLED"
  ]);


let html =
  null;

let voice =
  null;

let bootstrapPromise =
  null;

let locationTimer =
  null;

let locationGroupId =
  "";

let locationBusy =
  false;

const voiceCallbacks =
  new Map();


function safeElement(
  selector
) {
  try {
    return $w(
      selector
    );
  } catch (_) {
    return null;
  }
}


function messageOf(
  error,
  fallback =
    "GroupTalk action failed."
) {
  const message =
    String(
      error?.message ||
      error ||
      ""
    ).trim();

  return (
    message &&
    message.length <=
      260
  )
    ? message
    : fallback;
}


function errorCode(
  error
) {
  const direct =
    String(
      error?.code ||
      ""
    ).trim();

  if (
    direct &&
    direct !==
      "SUPABASE_HTTP_ERROR"
  ) {
    return direct;
  }

  return String(
    error?.message ||
    error ||
    ""
  )
    .trim()
    .split(
      ":"
    )[0];
}


function requestId(
  prefix =
    "REQ"
) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}


function allowedInternalPath(
  path
) {
  const value =
    String(
      path ||
      ""
    ).trim();

  return (
    value ===
      "/" ||
    value ===
      LOGIN_PATH ||
    value.startsWith(
      "/riaintra"
    ) ||
    value.startsWith(
      "/altea"
    )
  );
}


function post(
  type,
  payload = {}
) {
  if (
    !html ||
    typeof html.postMessage !==
      "function"
  ) {
    console.error(
      "[GroupTalk] #htmlGroupTalk must be an HTML Component."
    );

    return false;
  }

  try {
    html.postMessage({
      source:
        PARENT_SOURCE,

      type,

      payload,

      timestamp:
        new Date()
          .toISOString()
    });

    return true;

  } catch (error) {

    console.error(
      `[GroupTalk] postMessage failed: ${type}`,
      error
    );

    return false;
  }
}


/* ==========================================================================
   BOOTSTRAP / DIAGNOSTICS
   ========================================================================== */

async function bootstrap(
  force =
    false
) {
  if (
    bootstrapPromise &&
    !force
  ) {
    return bootstrapPromise;
  }

  bootstrapPromise =
    (async () => {
      const result =
        await getGroupTalkBootstrap();

      if (
        !result?.ok
      ) {
        throw new Error(
          result?.message ||
          "GROUPTALK_BOOTSTRAP_FAILED"
        );
      }

      post(
        "GT_BOOTSTRAP",
        result
      );

      return result;
    })();

  try {
    return await bootstrapPromise;

  } catch (error) {

    const code =
      errorCode(
        error
      );

    post(
      "GT_ERROR",
      {
        action:
          "BOOTSTRAP",

        code,

        message:
          messageOf(
            error,
            "GroupTalk could not initialize."
          )
      }
    );

    if (
      AUTH_ERRORS.has(
        code
      )
    ) {
      wixLocation.to(
        LOGIN_PATH
      );
    }

    throw error;

  } finally {

    bootstrapPromise =
      null;
  }
}


async function pushDiagnostics() {
  try {
    const diagnostics =
      await getGroupTalkDiagnostics();

    console.info(
      "[GroupTalk] Diagnostics",
      diagnostics
    );

    post(
      "GT_DIAGNOSTICS",
      diagnostics
    );

  } catch (error) {

    console.warn(
      "[GroupTalk] Diagnostics unavailable.",
      error
    );
  }
}


/* ==========================================================================
   GEOLOCATION - OUTSIDE THE HTML IFRAME
   ========================================================================== */

function stopLocationSharing({
  notify =
    true
} = {}) {
  if (
    locationTimer
  ) {
    clearInterval(
      locationTimer
    );

    locationTimer =
      null;
  }

  const oldGroupId =
    locationGroupId;

  locationGroupId =
    "";

  locationBusy =
    false;

  if (
    notify
  ) {
    post(
      "LOCATION_SHARING_STATE",
      {
        active:
          false,

        groupId:
          oldGroupId
      }
    );
  }
}


async function currentLocationWithTimeout(
  timeoutMs =
    12_000
) {
  let timer =
    null;

  try {
    return await Promise.race([
      wixWindowFrontend
        .getCurrentGeolocation(),

      new Promise(
        (
          resolve,
          reject
        ) => {
          timer =
            setTimeout(
              () =>
                reject(
                  new Error(
                    "LOCATION_TIMEOUT"
                  )
                ),
              timeoutMs
            );
        }
      )
    ]);

  } finally {

    if (
      timer
    ) {
      clearTimeout(
        timer
      );
    }
  }
}


async function pingCurrentLocation() {
  if (
    !locationGroupId ||
    locationBusy
  ) {
    return;
  }

  locationBusy =
    true;

  const groupId =
    locationGroupId;

  try {
    const position =
      await currentLocationWithTimeout();

    const coords =
      position?.coords ||
      {};

    const latitude =
      Number(
        coords.latitude
      );

    const longitude =
      Number(
        coords.longitude
      );

    if (
      !Number.isFinite(
        latitude
      ) ||
      !Number.isFinite(
        longitude
      )
    ) {
      throw new Error(
        "LOCATION_COORDINATES_INVALID"
      );
    }

    const result =
      await sendLocationPing({
        groupId,

        latitude,

        longitude,

        accuracy:
          coords.accuracy,

        heading:
          coords.heading,

        speed:
          coords.speed,

        timestamp:
          position?.timestamp ||
          Date.now()
      });

    post(
      "LOCATION_PING_RESULT",
      result ||
      {
        ok:
          true
      }
    );

  } catch (error) {

    const message =
      messageOf(
        error,
        "Location permission was denied or unavailable."
      );

    console.warn(
      "[GroupTalk] Location update failed.",
      error
    );

    post(
      "LOCATION_SHARING_STATE",
      {
        active:
          false,

        groupId,

        error:
          true,

        message
      }
    );

    stopLocationSharing({
      notify:
        false
    });

  } finally {

    locationBusy =
      false;
  }
}


async function startLocationSharing(
  groupId
) {
  const value =
    String(
      groupId ||
      ""
    ).trim();

  if (
    !value
  ) {
    throw new Error(
      "GROUPTALK_GROUP_REQUIRED_FOR_LOCATION"
    );
  }

  stopLocationSharing({
    notify:
      false
  });

  locationGroupId =
    value;

  await pingCurrentLocation();

  if (
    !locationGroupId
  ) {
    return;
  }

  locationTimer =
    setInterval(
      () => {
        void pingCurrentLocation();
      },
      8_000
    );

  post(
    "LOCATION_SHARING_STATE",
    {
      active:
        true,

      groupId:
        locationGroupId
    }
  );
}


/* ==========================================================================
   LIVEKIT CUSTOM ELEMENT
   ========================================================================== */

function eventDetail(
  event
) {
  return (
    event?.detail ||
    event?.data ||
    event ||
    {}
  );
}


function isWixCustomElement(
  element
) {
  return Boolean(
    element &&
    typeof element.on ===
      "function" &&
    typeof element.setAttribute ===
      "function"
  );
}


function customElementCandidates() {
  try {
    const elements =
      $w(
        "CustomElement"
      );

    return Array.isArray(
      elements
    )
      ? elements.filter(
          isWixCustomElement
        )
      : [];
  } catch (error) {
    console.warn(
      "[GroupTalk] Could not enumerate Wix Custom Elements.",
      error
    );

    return [];
  }
}


function describeElement(
  element
) {
  if (!element) {
    return null;
  }

  return {
    id:
      element.id ||
      "",

    type:
      element.type ||
      "unknown",

    hasOn:
      typeof element.on ===
      "function",

    hasSetAttribute:
      typeof element.setAttribute ===
      "function"
  };
}


function resolveVoiceBridge() {
  const direct =
    safeElement(
      VOICE_ID
    );

  if (
    isWixCustomElement(
      direct
    )
  ) {
    return direct;
  }


  const candidates =
    customElementCandidates();


  /*
   * If the ID currently points to a surrounding Box/Container but there is
   * exactly one Custom Element on the GroupTalk page, use that Custom Element.
   */
  if (
    candidates.length ===
    1
  ) {
    console.warn(
      "[GroupTalk] #groupTalkVoiceBridge points to the wrong Wix element. " +
      "Using the only Custom Element found on the page instead.",
      {
        configured:
          describeElement(
            direct
          ),

        resolved:
          describeElement(
            candidates[0]
          )
      }
    );

    return candidates[0];
  }


  /*
   * Prefer a Custom Element whose Wix ID clearly looks like the voice bridge.
   */
  const named =
    candidates.find(
      (candidate) =>
        /grouptalk.*voice|voice.*grouptalk/i.test(
          String(
            candidate?.id ||
            ""
          )
        )
    );

  if (
    named
  ) {
    console.warn(
      "[GroupTalk] Using a detected GroupTalk voice Custom Element.",
      {
        configured:
          describeElement(
            direct
          ),

        resolved:
          describeElement(
            named
          )
      }
    );

    return named;
  }


  console.error(
    "[GroupTalk] LiveKit voice bridge is not connected to a Wix Custom Element.",
    {
      configuredSelector:
        VOICE_ID,

      configuredElement:
        describeElement(
          direct
        ),

      detectedCustomElements:
        candidates.map(
          describeElement
        ),

      requiredTagName:
        "skandi-grouptalk-voice",

      requiredSource:
        "public/custom-elements/groupTalkVoiceBridge.js"
    }
  );

  return null;
}


function wireVoiceBridge() {
  voice =
    resolveVoiceBridge();

  if (
    !voice
  ) {
    return;
  }


  voice.on(
    "voice-state",
    (
      event
    ) => {
      const detail =
        eventDetail(
          event
        );

      const callback =
        detail?.commandId
          ? voiceCallbacks.get(
              detail.commandId
            )
          : null;

      if (
        callback
      ) {
        voiceCallbacks.delete(
          detail.commandId
        );

        callback.resolve(
          detail
        );
      }

      post(
        "VOICE_STATE",
        detail
      );
    }
  );


  voice.on(
    "voice-error",
    (
      event
    ) => {
      const detail =
        eventDetail(
          event
        );

      const callback =
        detail?.commandId
          ? voiceCallbacks.get(
              detail.commandId
            )
          : null;

      if (
        callback
      ) {
        voiceCallbacks.delete(
          detail.commandId
        );

        callback.reject(
          new Error(
            detail.message ||
            detail.code ||
            "VOICE_ACTION_FAILED"
          )
        );
      }

      post(
        "VOICE_ERROR",
        detail
      );
    }
  );


  voice.on(
    "voice-speakers",
    (
      event
    ) => {
      post(
        "VOICE_SPEAKERS",
        eventDetail(
          event
        )
      );
    }
  );


  voice.on(
    "voice-track",
    (
      event
    ) => {
      post(
        "VOICE_TRACK",
        eventDetail(
          event
        )
      );
    }
  );
}


function voiceCommand(
  command,
  {
    wait =
      true,
    timeoutMs =
      18_000
  } = {}
) {
  if (
    !voice ||
    typeof voice.setAttribute !==
      "function"
  ) {
    return Promise.reject(
      new Error(
        "GROUPTALK_VOICE_CUSTOM_ELEMENT_NOT_CONNECTED"
      )
    );
  }

  const id =
    command.id ||
    requestId(
      "VOICE"
    );

  const data = {
    ...command,
    id
  };

  if (
    !wait
  ) {
    voice.setAttribute(
      "command",
      JSON.stringify(
        data
      )
    );

    return Promise.resolve({
      commandId:
        id,
      accepted:
        true
    });
  }

  return new Promise(
    (
      resolve,
      reject
    ) => {
      const timer =
        setTimeout(
          () => {
            voiceCallbacks.delete(
              id
            );

            reject(
              new Error(
                "VOICE_COMMAND_TIMEOUT"
              )
            );
          },
          timeoutMs
        );

      voiceCallbacks.set(
        id,
        {
          resolve:
            (
              value
            ) => {
              clearTimeout(
                timer
              );

              resolve(
                value
              );
            },

          reject:
            (
              error
            ) => {
              clearTimeout(
                timer
              );

              reject(
                error
              );
            }
        }
      );

      voice.setAttribute(
        "command",
        JSON.stringify(
          data
        )
      );
    }
  );
}


async function connectVoice(
  payload = {}
) {
  const token =
    await createLiveKitToken({
      groupId:
        payload.groupId,

      sessionKey:
        payload.sessionKey ||
        ""
    });

  if (
    !token?.ok
  ) {
    throw new Error(
      token?.message ||
      "LIVEKIT_TOKEN_FAILED"
    );
  }

  const result =
    await voiceCommand({
      action:
        "connect",

      livekitUrl:
        token.livekitUrl,

      token:
        token.token,

      roomName:
        token.roomName ||
        token.room,

      microphone:
        payload.microphone ===
        true
    });

  return {
    ok:
      true,

    ...result,

    roomName:
      token.roomName ||
      token.room,

    identity:
      token.identity ||
      ""
  };
}



async function requestVoiceMicrophonePermission() {
  const result =
    await voiceCommand({
      action:
        "permissions"
    });

  return {
    granted:
      result?.microphone ===
      true,

    message:
      result?.microphone ===
      true
        ? "Allowed"
        : (
            result?.message ||
            "Microphone unavailable"
          )
  };
}


async function configureVoiceOutput(
  deviceId =
    ""
) {
  const value =
    String(
      deviceId ||
      ""
    ).trim();

  if (
    !value
  ) {
    return {
      selected:
        false,

      mode:
        "default",

      label:
        "System default"
    };
  }

  const result =
    await voiceCommand({
      action:
        "output-device",

      deviceId:
        value
    });

  return {
    selected:
      result?.selected ===
      true,

    mode:
      result?.selected ===
      true
        ? "selected"
        : "default",

    label:
      result?.label ||
      (
        result?.selected ===
        true
          ? "Selected output"
          : "System default"
      )
  };
}


async function requestLocationPermissionOnce() {
  try {
    const position =
      await currentLocationWithTimeout(
        15_000
      );

    const latitude =
      Number(
        position?.coords?.latitude
      );

    const longitude =
      Number(
        position?.coords?.longitude
      );

    if (
      !Number.isFinite(
        latitude
      ) ||
      !Number.isFinite(
        longitude
      )
    ) {
      throw new Error(
        "LOCATION_COORDINATES_INVALID"
      );
    }

    return {
      granted:
        true,

      message:
        "Allowed"
    };

  } catch (error) {

    return {
      granted:
        false,

      message:
        messageOf(
          error,
          "Location not allowed"
        )
    };
  }
}


async function requestDeviceAccess(
  payload = {}
) {
  const [
    microphoneResult,
    locationResult
  ] =
    await Promise.allSettled([
      requestVoiceMicrophonePermission(),
      requestLocationPermissionOnce()
    ]);


  let speaker = {
    selected:
      false,

    mode:
      "default",

    label:
      "System default"
  };


  if (
    payload.speakerDeviceId
  ) {
    try {
      speaker =
        await configureVoiceOutput(
          payload.speakerDeviceId
        );
    } catch (error) {
      console.warn(
        "[GroupTalk] Selected output device could not be applied. Using system default.",
        error
      );
    }
  }


  /*
   * Connect the receive side with microphone OFF. This also primes LiveKit
   * audio playback. Receive audio is intentionally always enabled.
   */
  if (
    payload.groupId
  ) {
    try {
      await connectVoice({
        groupId:
          payload.groupId,

        microphone:
          false
      });

      await voiceCommand(
        {
          action:
            "start-audio"
        },
        {
          wait:
            false
        }
      );

    } catch (error) {
      console.warn(
        "[GroupTalk] Receive-audio preload warning.",
        error
      );
    }
  }


  const microphone =
    microphoneResult.status ===
      "fulfilled"
      ? microphoneResult.value
      : {
          granted:
            false,

          message:
            messageOf(
              microphoneResult.reason,
              "Microphone not allowed"
            )
        };


  const location =
    locationResult.status ===
      "fulfilled"
      ? locationResult.value
      : {
          granted:
            false,

          message:
            messageOf(
              locationResult.reason,
              "Location not allowed"
            )
        };


  return {
    ok:
      true,

    microphone,

    speaker,

    location
  };
}


/* ==========================================================================
   HTML EVENT CONTRACT
   ========================================================================== */

async function handleGroupTalkMessage(
  type,
  payload
) {
  switch (
    type
  ) {

    case "GT_READY":

      await Promise.all([
        bootstrap(),
        pushDiagnostics()
      ]);

      return;


    case "GT_REFRESH":

      await bootstrap(
        true
      );

      return;


    case "SUPABASE_REALTIME_CONFIG_REQUEST": {

      const result =
        await getGroupTalkRealtimeConfig({
          groupId:
            payload.groupId
        });

      post(
        "SUPABASE_REALTIME_CONFIG_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "SUPABASE_PRESENCE_UPDATE": {

      const result =
        await updateGroupTalkPresence({
          groupId:
            payload.groupId,

          sessionKey:
            payload.sessionKey,

          status:
            payload.status,

          heartbeat:
            payload.heartbeat ===
            true
        });

      post(
        "SUPABASE_PRESENCE_UPDATE_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "SUPABASE_PRESENCE_REQUEST": {

      const result =
        await getGroupTalkPresence({
          groupId:
            payload.groupId
        });

      post(
        "SUPABASE_PRESENCE_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "DEVICE_ACCESS_REQUEST": {

      const result =
        await requestDeviceAccess(
          payload
        );

      post(
        "DEVICE_ACCESS_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...result
        }
      );

      return;
    }


    case "VOICE_CONNECT_REQUEST": {

      const result =
        await connectVoice(
          payload
        );

      post(
        "VOICE_CONNECT_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...result
        }
      );

      return;
    }


    case "VOICE_MIC_REQUEST": {

      const result =
        await voiceCommand({
          action:
            "microphone",

          enabled:
            payload.enabled ===
            true
        });

      post(
        "VOICE_MIC_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ok:
            true,

          ...result
        }
      );

      return;
    }


    case "VOICE_DISCONNECT":

      await voiceCommand(
        {
          action:
            "disconnect"
        },
        {
          wait:
            false
        }
      );

      return;


    case "LIVEKIT_TOKEN_REQUEST": {

      const result =
        await createLiveKitToken({
          groupId:
            payload.groupId,

          sessionKey:
            payload.sessionKey ||
            ""
        });

      post(
        "LIVEKIT_TOKEN_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "PTT_EVENT": {

      const result =
        await triggerGroupTalkEvent(
          payload
        );

      post(
        "PTT_EVENT_RESULT",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "PHONEBOOK_REQUEST": {

      const result =
        await getPhoneBook(
          payload
        );

      post(
        "PHONEBOOK_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "LOCATION_SHARING_START":

      await startLocationSharing(
        payload.groupId
      );

      return;


    case "LOCATION_SHARING_STOP":

      stopLocationSharing();

      return;


    case "LOCATION_PING": {

      const result =
        await sendLocationPing(
          payload
        );

      post(
        "LOCATION_PING_RESULT",
        result ||
        {}
      );

      return;
    }


    case "LIVE_LOCATIONS_REQUEST": {

      const result =
        await getLiveLocations(
          payload
        );

      post(
        "LIVE_LOCATIONS_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "TICKET_CREATE": {

      const result =
        await createGroupTalkTicket(
          payload
        );

      post(
        "TICKET_CREATE_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "TICKET_LIST_REQUEST": {

      const result =
        await getGroupTalkTickets(
          payload
        );

      post(
        "TICKET_LIST_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "TICKET_REPLY": {

      const result =
        await replyToGroupTalkTicket(
          payload
        );

      post(
        "TICKET_REPLY_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "HISTORY_SEARCH_REQUEST": {

      const result =
        await searchGroupTalkHistory(
          payload
        );

      post(
        "HISTORY_SEARCH_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "TICKET_CATEGORY_LIST_REQUEST": {

      const result =
        await getTicketCategories();

      post(
        "TICKET_CATEGORY_LIST_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "TICKET_CATEGORY_SAVE": {

      const result =
        await saveTicketCategory(
          payload
        );

      post(
        "TICKET_CATEGORY_SAVE_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "TICKET_CATEGORY_DELETE": {

      const result =
        await deleteTicketCategory(
          payload
        );

      post(
        "TICKET_CATEGORY_DELETE_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      return;
    }


    case "ADMIN_SAVE_GROUP": {

      const result =
        await adminSaveGroup(
          payload
        );

      post(
        "ADMIN_SAVE_GROUP_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      await bootstrap(
        true
      );

      return;
    }


    case "ADMIN_SET_MEMBERSHIP": {

      const result =
        await adminSetMembership(
          payload
        );

      post(
        "ADMIN_SET_MEMBERSHIP_RESPONSE",
        {
          requestId:
            payload.requestId ||
            "",

          ...(
            result ||
            {}
          )
        }
      );

      await bootstrap(
        true
      );

      return;
    }


    case "GT_NAVIGATE":

      if (
        allowedInternalPath(
          payload.path
        )
      ) {
        wixLocation.to(
          payload.path
        );
      }

      return;


    default:

      console.info(
        "[GroupTalk] Unhandled HTML message:",
        type
      );
  }
}


/* ==========================================================================
   INIT
   ========================================================================== */

$w.onReady(
  function () {
    /*
     * GroupTalk uses browser-only APIs: HTML messaging, geolocation and the
     * LiveKit Custom Element. Avoid starting those during Wix SSR.
     */
    if (
      wixWindowFrontend.rendering?.env &&
      wixWindowFrontend.rendering.env !== "browser"
    ) {
      return;
    }

    html =
      safeElement(
        HTML_ID
      );

    if (
      !html ||
      typeof html.onMessage !==
        "function" ||
      typeof html.postMessage !==
        "function"
    ) {
      console.error(
        "[GroupTalk] #htmlGroupTalk must be the HTML Component itself, not a section or box."
      );

      return;
    }


    wireVoiceBridge();


    html.onMessage(
      async (
        event
      ) => {
        const incoming =
          event?.data ||
          {};

        if (
          incoming.source !==
          GROUPTALK_SOURCE
        ) {
          return;
        }

        const type =
          incoming.type ||
          incoming.event ||
          incoming.action ||
          "";

        const payload =
          incoming.payload ||
          {};

        try {
          await handleGroupTalkMessage(
            type,
            payload
          );

        } catch (error) {

          const code =
            errorCode(
              error
            );

          const text =
            messageOf(
              error
            );

          console.error(
            `[GroupTalk] ${type || "UNKNOWN"} failed.`,
            error
          );

          if (
            type ===
            "SUPABASE_REALTIME_CONFIG_REQUEST"
          ) {
            post(
              "SUPABASE_REALTIME_CONFIG_RESPONSE",
              {
                requestId:
                  payload.requestId ||
                  "",

                ok:
                  false,

                code,

                message:
                  text
              }
            );

            return;
          }


          if (
            type ===
            "VOICE_CONNECT_REQUEST"
          ) {
            post(
              "VOICE_CONNECT_RESPONSE",
              {
                requestId:
                  payload.requestId ||
                  "",

                ok:
                  false,

                code,

                message:
                  text
              }
            );

            return;
          }


          post(
            "GT_ERROR",
            {
              requestId:
                payload.requestId ||
                "",

              action:
                type,

              code,

              message:
                text
            }
          );


          if (
            AUTH_ERRORS.has(
              code
            )
          ) {
            wixLocation.to(
              LOGIN_PATH
            );
          }
        }
      }
    );


    void bootstrap()
      .then(
        () =>
          pushDiagnostics()
      )
      .catch(
        () => {}
      );
  }
);
