import { currentMember } from 'wix-members';

// IMPORT YOUR SUPABASE BACKEND FUNCTION HERE
// Example: import { insertReportToSupabase } from "backend/supabaseReports.web";

const HTML_ID = "#helpdeskEmbed"; // IMPORTANT: Change this to your actual HTML element ID in Wix
const CHILD_SOURCE = "SKANDI_EMPLOYEE_HELPDESK";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function asObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function childPayload(message) {
    return {
        ...asObject(message),
        ...asObject(message?.payload)
    };
}

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
                
                // 1. WHEN THE IFRAME LOADS - PASS MEMBER DATA & MANAGER DATA
                case "UI_READY":
                    try {
                        const member = await currentMember.getMember();
                        if (member && member.contactDetails) {
                            
                            // NOTE: Replace these manager variables with how you actually retrieve manager data from your database.
                            // For now, this simulates fetching it from a database query.
                            const mockManagerName = "Director Operations";
                            const mockManagerEmail = "operations@skanditravels.com";

                            postToEmbed(htmlComponent, "MEMBER_DATA", {
                                firstName: member.contactDetails.firstName || "",
                                lastName: member.contactDetails.lastName || "",
                                employeeId: member.profile?.nickname || "",
                                managerName: mockManagerName,
                                managerEmail: mockManagerEmail
                            }, requestId);
                        }
                    } catch (err) {
                        console.warn("No active member session found. Dashboard will require manual entry.", err);
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
