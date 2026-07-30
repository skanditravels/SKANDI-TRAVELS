import { sql } from '@wix/data-sql'; // or your preferred Postgres adapter/NPM module
import wixUsersBackend from 'wix-users-backend';

export async function getAgentProfile() {
    try {
        // Get the currently logged in Wix User ID
        const currentUser = wixUsersBackend.currentUser;
        const wixId = currentUser.id;

        // Execute your PostgreSQL query to find the agent matching this Wix login
        // Replace this syntax with your specific database connector logic
        const queryResult = await sql(`
            SELECT first_name, last_name, sk_id, profile_image_url 
            FROM AgentUsers 
            WHERE wix_user_id = '${wixId}' 
            LIMIT 1
        `);

        if (queryResult.rows.length > 0) {
            const agent = queryResult.rows[0];
            return {
                first_name: agent.first_name,
                last_name: agent.last_name,
                skID: agent.sk_id,
                image_url: agent.profile_image_url
            };
        } else {
            throw new Error("Agent profile not found in PostgreSQL");
        }

    } catch (error) {
        console.error("Database query failed:", error);
        // Return fallback data if the DB fails to connect
        return {
            first_name: "Agent",
            last_name: "Profile",
            skID: "ERROR",
            image_url: ""
        };
    }
}
