import { currentMember } from 'wix-members';

// IMPORT YOUR SUPABASE BACKEND FUNCTION HERE
// Example: import { insertReportToSupabase } from "backend/supabaseReports.web";

const HTML_ID = "#helpdeskEmbed"; // IMPORTANT: Change this to your actual HTML element ID
const CHILD_SOURCE = "SKANDI_EMPLOYEE_HELPDESK";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

// Helper to safely parse objects
function asObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

// Helper to flatten the payload
function childPayload(message) {
    return {
        ...asObject(message),
        ...asObject(message?.payload)
    };
}

// Helper to securely send messages back to the HTML iframe
function postToEmbed(html, type, payload = {}, requestId = "") {
    html.postMessage({
        source: PARENT_SOURCE,
        type,
        requestId,
        payload: {
            ...asObject(payload),
            requestId
        }
    });
}

$w.onReady(function () {
    let htmlComponent;

    try {
        htmlComponent = $w(HTML_ID);
    } catch (error) {
        console.error(`[Employee HelpDesk] Missing HTML component ${HTML_ID}.`, error);
        return;
    }

    htmlComponent.onMessage(async (event) => {
        const message = asObject(event.data);

        // Ensure the message comes from our specific Employee Helpdesk
        if (message.source !== CHILD_SOURCE) {
            return;
        }

        const payload = childPayload(message);
        const requestId = String(message.requestId || payload.requestId || "");

        try {
            switch (message.type) {
                
                // 1. WHEN THE IFRAME LOADS
                case "UI_READY":
                    // Automatically grab the logged-in Wix Member's identity
                    try {
                        const member = await currentMember.getMember();
                        if (member && member.contactDetails) {
                            postToEmbed(htmlComponent, "MEMBER_DATA", {
                                firstName: member.contactDetails.firstName || "",
                                lastName: member.contactDetails.lastName || "",
                                employeeId: member.profile?.nickname || "" // Use your preferred ID field
                            }, requestId);
                        }
                    } catch (err) {
                        console.warn("No active member session found. Form will require manual entry.", err);
                    }
                    break;

                // 2. WHEN THE EMPLOYEE CLICKS SUBMIT
                case "SUBMIT_REPORT":
                    console.log(`Transmitting case ${payload.caseNumber} to Supabase...`);
                    
                    // --- CALL YOUR SUPABASE BACKEND FUNCTION HERE ---
                    // const dbResult = await insertReportToSupabase(payload);
                    
                    // --- MOCK DATABASE DELAY (Remove when connecting backend) ---
                    const dbResult = await new Promise((resolve) => {
                        setTimeout(() => resolve({ success: true }), 1200);
                    });
                    // ------------------------------------------------------------

                    if (!dbResult || !dbResult.success) {
                        throw new Error("Failed to insert record into Supabase database.");
                    }

                    // Tell the iframe the transmission succeeded so it shows the Success Card
                    postToEmbed(
                        htmlComponent,
                        "REPORT_SUBMIT_SUCCESS",
                        { caseData: payload },
                        requestId
                    );
                    break;

                default:
                    console.warn(`[Employee HelpDesk] Unhandled action type: ${message.type}`);
                    break;
            }
        } catch (error) {
            console.error(`[Employee HelpDesk] ${message.type || "Unknown action"} failed.`, error);

            // Tell the iframe the transmission failed so it displays the error text
            postToEmbed(
                htmlComponent,
                "REPORT_SUBMIT_ERROR",
                { message: error.message || "Database action failed." },
                requestId
            );
        }
    });
});
