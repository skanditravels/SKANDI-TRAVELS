const MAX_MESSAGE_BYTES = 250_000;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function reply(embed, message) {
  embed.postMessage({
    source: 'SKANDI_WIX_PARENT',
    version: 1,
    ...message,
  });
}

/**
 * Attach this to an existing Wix HTML Component.
 * `handle` returns one reply object or an array of reply objects.
 */
export function bindInternalHtmlBridge({
  embed,
  allowedSources,
  allowedTypes,
  handle,
  toError,
}) {
  embed.onMessage(async (event) => {
    const message = event?.data;
    if (!isPlainObject(message)) return;
    if (JSON.stringify(message).length > MAX_MESSAGE_BYTES) return;
    if (!allowedSources.has(message.source)) return;
    if (!allowedTypes.has(message.type)) return;
    if (message.payload !== undefined && !isPlainObject(message.payload)) return;

    try {
      const output = await handle({ type: message.type, payload: message.payload || {} });
      const replies = Array.isArray(output) ? output : [output];
      for (const item of replies) {
        if (isPlainObject(item) && typeof item.type === 'string') {
          reply(embed, { type: item.type, payload: item.payload || {} });
        }
      }
    } catch (_) {
      // Browser receives a stable error code, never a stack trace or secret.
      reply(embed, toError(message));
    }
  });
}