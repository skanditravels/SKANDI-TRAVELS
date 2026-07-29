import { getPublicLegalHubPayload } from "src/backend/LEGAL/legalPolicyService.web";

const EMBED_ID = "#legalHubEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_HUB";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
    $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

async function load() {
    try {
        send("LEGAL_HUB_DATA", await getPublicLegalHubPayload());
    } catch (error) {
        send("LEGAL_ERROR", { message: "Legal information is temporarily unavailable." });
    }
}

$w.onReady(function () {
    const embed = $w(EMBED_ID);
    embed.onMessage(async (event) => {
        const msg = event.data || {};
        if (msg.source && msg.source !== HTML_SOURCE) return;
        if (msg.type === "LEGAL_HUB_READY" || msg.type === "LEGAL_HUB_REFRESH") await load();
    });
    load();
});
