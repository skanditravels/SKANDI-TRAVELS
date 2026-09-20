// SKANDI Uniform Control 
// Page: /riaintra/success-factors/uniform/uniform-control

.import { 
    getUniformBootstrap, 
    saveUniformItem, 
    archiveUniformItem, 
    saveUniformCategory, 
    saveUniformRule, 
    saveUniformPolicy, 
    adjustUniformWallet, 
    orderAction 
    // Add your specific asset functions here if needed
} from 'backend/SKANDI_CORE/uniform';
import wixLocation from 'wix-location';

const SOURCE = "SKANDI_WIX_PARENT";

$w.onReady(function () {
    const iframe = $w("#uniformControlEmbed");

    iframe.onMessage(async (event) => {
        const data = event.data || {};
        
        // Ignore messages not from our specific React app
        if (data.source !== "SKANDI_UNIFORM_ADMIN") return;

        const { type, payload, requestId } = data;

        try {
            switch (type) {
                // 1. Initial Load & Refresh
                case "UNIFORM_ADMIN_READY":
                case "UNIFORM_ADMIN_BOOTSTRAP": {
                    const query = payload?.query || "";
                    
                    // Fetch master data payload from backend
                    const bootstrapData = await getUniformBootstrap(query);
                    
                    iframe.postMessage({
                        source: SOURCE,
                        type: "UNIFORM_ADMIN_BOOTSTRAP_RESULT",
                        payload: bootstrapData 
                    });
                    break;
                }

                // 2. Catalog Mutations
                case "UNIFORM_ADMIN_SAVE_ITEM": {
                    const result = await saveUniformItem(payload.item);
                    sendSuccess(iframe, type, result, requestId);
                    break;
                }
                case "UNIFORM_ADMIN_ARCHIVE_ITEM": {
                    const result = await archiveUniformItem(payload.itemId, payload.reason);
                    sendSuccess(iframe, type, result, requestId);
                    break;
                }

                // 3. Settings & Policies
                case "UNIFORM_ADMIN_SAVE_CATEGORY": {
                    const result = await saveUniformCategory(payload.category);
                    sendSuccess(iframe, type, result, requestId);
                    break;
                }
                case "UNIFORM_ADMIN_SAVE_RULE": {
                    const result = await saveUniformRule(payload.rule);
                    sendSuccess(iframe, type, result, requestId);
                    break;
                }
                case "UNIFORM_ADMIN_SAVE_POLICY": {
                    const result = await saveUniformPolicy(payload.policy);
                    sendSuccess(iframe, type, result, requestId);
                    break;
                }

                // 4. Operations & Fulfillment
                case "UNIFORM_ADMIN_ADJUST_WALLET": {
                    const result = await adjustUniformWallet(payload);
                    sendSuccess(iframe, type, result, requestId);
                    break;
                }
                case "UNIFORM_ADMIN_ORDER_ACTION": {
                    const result = await orderAction(payload.orderId, payload.action, payload.note);
                    sendSuccess(iframe, type, result, requestId);
                    break;
                }

                // 5. Navigation overrides
                case "UNIFORM_ADMIN_NAVIGATE": {
                    if (payload.path) wixLocation.to(payload.path);
                    break;
                }

                default:
                    console.warn(`[Uniform ERP] Unhandled event type: ${type}`);
            }
        } catch (err) {
            console.error(`[Uniform ERP] Action failed: ${type}`, err);
            sendError(iframe, err.message, requestId);
        }
    });
});

/**
 * Maps the React incoming request type to the specific success type it listens for.
 * By default, mutations await "UNIFORM_ADMIN_SAVED".
 */
function sendSuccess(iframe, originalType, resultPayload, requestId) {
    let successType = 'UNIFORM_ADMIN_SAVED';
    
    // Override for specific asset requests if implementing media uploads
    if (originalType === 'UNIFORM_ADMIN_ASSET_PREPARE_UPLOAD') successType = 'UNIFORM_ADMIN_ASSET_UPLOAD_PREPARED';
    if (originalType === 'UNIFORM_ADMIN_ASSET_FINALIZE_UPLOAD') successType = 'UNIFORM_ADMIN_ASSET_UPLOAD_FINALIZED';
    if (originalType === 'UNIFORM_ADMIN_ASSET_LIST') successType = 'UNIFORM_ADMIN_ASSET_LIST_RESULT';

    iframe.postMessage({
        source: SOURCE,
        type: successType,
        payload: resultPayload || {},
        requestId: requestId
    });
}

/**
 * Catches backend errors and releases the React loading spinner with an error banner.
 */
function sendError(iframe, message, requestId) {
    iframe.postMessage({
        source: SOURCE,
        type: "UNIFORM_ADMIN_ERROR",
        message: message || "An unknown error occurred on the Wix backend.",
        requestId: requestId
    });
}
