// backend/routers.js
import { ok, notFound } from 'wix-router';
// Import whatever backend function you currently use to fetch SKANDI travel data
import { getDestinationData } from 'backend/FINAL/destinationDetailService.web'; 
import { getcCountryData } from 'backend/FINAL/countryDestinationService.web';

export async function destinations_Router(request) {
    // request.path breaks down the URL after the prefix.
    // For /destinations/thailand/phuket:
    const country = request.path[0];     // "thailand"
    const destination = request.path[1]; // "phuket"

    if (!country || !destination) {
        return notFound();
    }

    try {
        // Fetch the specific data for Phuket, Thailand
        const destData = await getDestinationData(country, destination);

        if (destData) {
            // Route to your specific page in the editor and pass the data.
            // Replace "destinations-page" with the actual router page name in Wix.
            return ok("destinations-page", destData);
        } else {
            return notFound();
        }
    } catch (error) {
        console.error("Router error:", error);
        return notFound();
    }
}
