const EMBED_ID = "#legalHubEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_HUB";

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage((event) => {
    const message = event.data || {};
    if (message.source && message.source !== HTML_SOURCE) return;

    if (message.type === "LEGAL_HUB_HEIGHT") {
      const height = Number(message.payload?.height || 0);
      if (Number.isFinite(height) && height > 0) {
        embed.height = Math.max(600, Math.min(14000, Math.ceil(height)));
      }
    }
  });
});
