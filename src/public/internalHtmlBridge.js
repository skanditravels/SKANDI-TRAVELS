// public/internalHtmlBridge.js
const MAX_MESSAGE_BYTES = 250_000;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function reply(embed, message) {
  if (!embed || typeof embed.postMessage !== "function") return;

  embed.postMessage({
    source: "SKANDI_WIX_PARENT",
    version: 1,
    ...message
  });
}

export function bindInternalHtmlBridge({
  embed,
  allowedSources,
  allowedTypes,
  handle,
  toError
}) {
  if (!embed || typeof embed.onMessage !== "function") {
    throw new Error("INTERNAL_HTML_BRIDGE_REQUIRES_HTML_COMPONENT");
  }

  embed.onMessage(async (event) => {
    const message = event?.data;

    if (!isPlainObject(message)) return;

    let size = 0;
    try {
      size = JSON.stringify(message).length;
    } catch (_) {
      return;
    }

    if (size > MAX_MESSAGE_BYTES) return;
    if (!allowedSources?.has(message.source)) return;
    if (!allowedTypes?.has(message.type)) return;
    if (
      message.payload !== undefined &&
      !isPlainObject(message.payload)
    ) {
      return;
    }

    try {
      const output = await handle({
        type: message.type,
        payload: message.payload || {}
      });

      const replies = Array.isArray(output) ? output : [output];

      for (const item of replies) {
        if (
          isPlainObject(item) &&
          typeof item.type === "string"
        ) {
          reply(embed, {
            type: item.type,
            payload: item.payload || {}
          });
        }
      }
    } catch (_) {
      const errorReply =
        typeof toError === "function"
          ? toError(message)
          : {
              type: "INTERNAL_ERROR",
              payload: { code: "ACTION_FAILED" }
            };

      reply(embed, errorReply);
    }
  });
}
