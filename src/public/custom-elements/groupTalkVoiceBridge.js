// Public/custom-elements/groupTalkVoiceBridge.js
// Tag name: skandi-grouptalk-voice
//
// LiveKit microphone/audio runtime for GroupTalk.
// This runs as a Wix Custom Element on the published site, not inside the
// sandboxed #htmlGroupTalk iframe.

const LIVEKIT_UMD_URL =
  "https://cdn.jsdelivr.net/npm/livekit-client@2.22.0/dist/livekit-client.umd.min.js";

let liveKitLoaderPromise = null;

function loadLiveKit() {
  if (window.LivekitClient) {
    return Promise.resolve(window.LivekitClient);
  }

  if (liveKitLoaderPromise) {
    return liveKitLoaderPromise;
  }

  liveKitLoaderPromise = new Promise((resolve, reject) => {
    const existing =
      document.querySelector(
        `script[data-skandi-livekit="${LIVEKIT_UMD_URL}"]`
      );

    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          if (window.LivekitClient) {
            resolve(window.LivekitClient);
          } else {
            reject(
              new Error(
                "LIVEKIT_CLIENT_GLOBAL_MISSING"
              )
            );
          }
        },
        { once: true }
      );

      existing.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              "LIVEKIT_CLIENT_LOAD_FAILED"
            )
          ),
        { once: true }
      );

      return;
    }

    const script =
      document.createElement(
        "script"
      );

    script.src =
      LIVEKIT_UMD_URL;

    script.async =
      true;

    script.dataset.skandiLivekit =
      LIVEKIT_UMD_URL;

    script.onload =
      () => {
        if (!window.LivekitClient) {
          reject(
            new Error(
              "LIVEKIT_CLIENT_GLOBAL_MISSING"
            )
          );

          return;
        }

        resolve(
          window.LivekitClient
        );
      };

    script.onerror =
      () =>
        reject(
          new Error(
            "LIVEKIT_CLIENT_LOAD_FAILED"
          )
        );

    document.head.appendChild(
      script
    );
  });

  return liveKitLoaderPromise;
}


function cloneDetail(
  value = {}
) {
  try {
    return JSON.parse(
      JSON.stringify(
        value
      )
    );
  } catch (_) {
    return {};
  }
}


class SkandiGroupTalkVoice
  extends HTMLElement {

  static get observedAttributes() {
    return [
      "command"
    ];
  }


  constructor() {
    super();

    this.room =
      null;

    this.roomName =
      "";

    this.outputDeviceId =
      "";

    this.audioElements =
      new Set();

    this.lastCommandId =
      "";

    this.attachShadow({
      mode:
        "open"
    });

    const style =
      document.createElement(
        "style"
      );

    style.textContent = `
      :host {
        display:block;
        width:1px;
        height:1px;
        overflow:hidden;
        opacity:0.001;
        pointer-events:none;
      }

      #audioHost {
        width:1px;
        height:1px;
        overflow:hidden;
      }
    `;

    this.audioHost =
      document.createElement(
        "div"
      );

    this.audioHost.id =
      "audioHost";

    this.shadowRoot.append(
      style,
      this.audioHost
    );
  }


  connectedCallback() {
    this.emit(
      "voice-state",
      {
        state:
          "ready",
        customElement:
          true
      }
    );
  }


  disconnectedCallback() {
    void this.disconnectRoom(
      "element-disconnected"
    );
  }


  attributeChangedCallback(
    name,
    oldValue,
    newValue
  ) {
    if (
      name !==
        "command" ||
      oldValue ===
        newValue ||
      !newValue
    ) {
      return;
    }

    let command;

    try {
      command =
        JSON.parse(
          newValue
        );
    } catch (_) {
      this.emit(
        "voice-error",
        {
          code:
            "VOICE_COMMAND_INVALID_JSON",
          message:
            "Invalid GroupTalk voice command."
        }
      );

      return;
    }

    if (
      command?.id &&
      command.id ===
        this.lastCommandId
    ) {
      return;
    }

    this.lastCommandId =
      command?.id ||
      "";

    void this.runCommand(
      command
    );
  }


  emit(
    type,
    detail = {}
  ) {
    this.dispatchEvent(
      new CustomEvent(
        type,
        {
          bubbles:
            true,

          composed:
            true,

          detail:
            cloneDetail(
              detail
            )
        }
      )
    );
  }


  async runCommand(
    command = {}
  ) {
    const commandId =
      String(
        command.id ||
        ""
      );

    try {
      switch (
        command.action
      ) {

        case "connect":

          await this.connectRoom(
            command
          );

          this.emit(
            "voice-state",
            {
              commandId,
              state:
                "connected",
              roomName:
                this.roomName,
              microphone:
                Boolean(
                  this.room
                    ?.localParticipant
                    ?.isMicrophoneEnabled
                ),
              audioAlwaysOn:
                true
            }
          );

          return;


        case "permissions": {

          const microphone =
            await this.requestMicrophonePermission();

          this.emit(
            "voice-state",
            {
              commandId,
              state:
                "permissions",
              microphone,
              audioAlwaysOn:
                true
            }
          );

          return;
        }


        case "output-device": {

          const output =
            await this.setOutputDevice(
              command.deviceId ||
              ""
            );

          this.emit(
            "voice-state",
            {
              commandId,
              state:
                "output-device",
              ...output,
              audioAlwaysOn:
                true
            }
          );

          return;
        }


        case "microphone":

          await this.setMicrophone(
            command.enabled ===
            true
          );

          this.emit(
            "voice-state",
            {
              commandId,
              state:
                command.enabled ===
                  true
                  ? "talking"
                  : "listening",
              roomName:
                this.roomName,
              microphone:
                command.enabled ===
                true,
              audioAlwaysOn:
                true
            }
          );

          return;


        case "start-audio":

          await this.startAudio();

          this.emit(
            "voice-state",
            {
              commandId,
              state:
                "audio-started",
              roomName:
                this.roomName,
              audioAlwaysOn:
                true
            }
          );

          return;


        case "disconnect":

          await this.disconnectRoom(
            "requested"
          );

          this.emit(
            "voice-state",
            {
              commandId,
              state:
                "disconnected"
            }
          );

          return;


        default:

          throw new Error(
            "VOICE_COMMAND_NOT_SUPPORTED"
          );
      }

    } catch (error) {

      this.emit(
        "voice-error",
        {
          commandId,
          action:
            command.action ||
            "",
          code:
            error?.name ||
            "VOICE_ACTION_FAILED",
          message:
            String(
              error?.message ||
              error ||
              "Voice action failed."
            )
        }
      );
    }
  }


  async connectRoom({
    livekitUrl,
    token,
    roomName,
    microphone = false
  } = {}) {
    if (
      !livekitUrl ||
      !token ||
      !roomName
    ) {
      throw new Error(
        "VOICE_CONNECT_INPUT_MISSING"
      );
    }

    const LK =
      await loadLiveKit();

    if (
      this.room &&
      this.roomName ===
        roomName
    ) {
      await this.startAudio()
        .catch(
          () => {}
        );

      if (
        microphone
      ) {
        await this.setMicrophone(
          true
        );
      }

      return;
    }

    await this.disconnectRoom(
      ""
    );

    const room =
      new LK.Room({
        adaptiveStream:
          true,
        dynacast:
          true
      });


    room.on(
      LK.RoomEvent.TrackSubscribed,
      (
        track,
        publication,
        participant
      ) => {
        if (
          track?.kind !==
            "audio"
        ) {
          return;
        }

        const element =
          track.attach();

        element.autoplay =
          true;

        element.playsInline =
          true;

        element.muted =
          false;

        element.volume =
          1;

        this.audioElements.add(
          element
        );

        this.audioHost.appendChild(
          element
        );

        void this.applyOutputDevice(
          element
        );

        void element.play()
          .catch(
            () => {}
          );

        this.emit(
          "voice-track",
          {
            state:
              "subscribed",
            participantIdentity:
              participant?.identity ||
              "",
            participantName:
              participant?.name ||
              participant?.identity ||
              "",
            muted:
              false
          }
        );
      }
    );


    room.on(
      LK.RoomEvent.TrackUnsubscribed,
      (
        track,
        publication,
        participant
      ) => {
        try {
          const detached =
            track.detach();

          for (
            const element of
            detached
          ) {
            this.audioElements.delete(
              element
            );

            element.remove();
          }
        } catch (_) {}

        this.emit(
          "voice-track",
          {
            state:
              "unsubscribed",
            participantIdentity:
              participant?.identity ||
              ""
          }
        );
      }
    );


    room.on(
      LK.RoomEvent.ActiveSpeakersChanged,
      (
        speakers
      ) => {
        this.emit(
          "voice-speakers",
          {
            speakers:
              (
                Array.isArray(
                  speakers
                )
                  ? speakers
                  : []
              ).map(
                (
                  participant
                ) => ({
                  identity:
                    participant.identity ||
                    "",
                  name:
                    participant.name ||
                    participant.identity ||
                    "",
                  isLocal:
                    participant.isLocal ===
                    true
                })
              )
          }
        );
      }
    );


    room.on(
      LK.RoomEvent.AudioPlaybackStatusChanged,
      () => {
        this.emit(
          "voice-state",
          {
            state:
              room.canPlaybackAudio
                ? "audio-allowed"
                : "audio-blocked",
            roomName,
            audioAlwaysOn:
              true
          }
        );
      }
    );


    room.on(
      LK.RoomEvent.MediaDevicesError,
      (
        error
      ) => {
        this.emit(
          "voice-error",
          {
            code:
              error?.name ||
              "MEDIA_DEVICE_ERROR",
            message:
              String(
                error?.message ||
                "Microphone device error."
              )
          }
        );
      }
    );


    room.on(
      LK.RoomEvent.Disconnected,
      (
        reason
      ) => {
        this.emit(
          "voice-state",
          {
            state:
              "disconnected",
            roomName,
            reason:
              String(
                reason ||
                ""
              )
          }
        );
      }
    );


    await room.connect(
      livekitUrl,
      token
    );

    this.room =
      room;

    this.roomName =
      roomName;

    await this.startAudio()
      .catch(
        () => {}
      );

    if (
      microphone
    ) {
      await this.setMicrophone(
        true
      );
    }
  }


  async requestMicrophonePermission() {
    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !==
        "function"
    ) {
      throw new Error(
        "MICROPHONE_API_UNAVAILABLE"
      );
    }

    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation:
              true,
            noiseSuppression:
              true,
            autoGainControl:
              true
          },

          video:
            false
        });

    try {
      for (
        const track of
        stream.getTracks()
      ) {
        track.stop();
      }
    } catch (_) {}

    return true;
  }


  async setOutputDevice(
    deviceId =
      ""
  ) {
    this.outputDeviceId =
      String(
        deviceId ||
        ""
      ).trim();

    if (
      !this.outputDeviceId
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

    let applied =
      false;

    for (
      const element of
      this.audioElements
    ) {
      const result =
        await this.applyOutputDevice(
          element
        );

      applied =
        applied ||
        result;
    }

    return {
      selected:
        applied ||
        this.audioElements.size ===
          0,
      mode:
        "selected",
      label:
        "Selected output"
    };
  }


  async applyOutputDevice(
    element
  ) {
    if (
      !element ||
      !this.outputDeviceId ||
      typeof element.setSinkId !==
        "function"
    ) {
      return false;
    }

    try {
      await element.setSinkId(
        this.outputDeviceId
      );

      return true;
    } catch (error) {
      console.warn(
        "[GroupTalk Voice] Output device could not be applied.",
        error
      );

      return false;
    }
  }


  async startAudio() {
    if (
      !this.room
    ) {
      throw new Error(
        "VOICE_ROOM_NOT_CONNECTED"
      );
    }

    if (
      typeof this.room.startAudio ===
        "function"
    ) {
      await this.room.startAudio();
    }

    for (
      const element of
      this.audioElements
    ) {
      try {
        element.muted =
          false;

        element.volume =
          1;

        await this.applyOutputDevice(
          element
        );

        await element.play();
      } catch (_) {}
    }
  }


  async setMicrophone(
    enabled
  ) {
    if (
      !this.room
    ) {
      throw new Error(
        "VOICE_ROOM_NOT_CONNECTED"
      );
    }

    await this.room
      .localParticipant
      .setMicrophoneEnabled(
        enabled ===
        true
      );

    /*
     * Receive audio is always on, including while transmitting.
     */
    try {
      await this.startAudio();
    } catch (_) {}
  }


  async disconnectRoom(
    reason =
      ""
  ) {
    if (
      this.room
    ) {
      try {
        await this.room
          .localParticipant
          .setMicrophoneEnabled(
            false
          );
      } catch (_) {}

      try {
        this.room.disconnect();
      } catch (_) {}
    }

    this.room =
      null;

    this.roomName =
      "";

    for (
      const element of
      this.audioElements
    ) {
      try {
        element.remove();
      } catch (_) {}
    }

    this.audioElements.clear();

    if (
      reason
    ) {
      this.emit(
        "voice-state",
        {
          state:
            "disconnected",
          reason
        }
      );
    }
  }
}


if (
  !customElements.get(
    "skandi-grouptalk-voice"
  )
) {
  customElements.define(
    "skandi-grouptalk-voice",
    SkandiGroupTalkVoice
  );
}
