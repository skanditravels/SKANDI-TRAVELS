import { processIncomingClaim } from 'backend/claimProcessor';

$w.onReady(function () {
  
  // Listen for the data package coming from your HTML form iFrame
  $w('#customer-service-form').onMessage(async (event) => {
    const msg = event.data;

    // Verify the message source matches your form template identifier
    if (msg.source === "higberg-general-policy-acknowledgment-form" && msg.type === "submit") {
      const data = msg.payload; // Contains all data points from your HTML form

      // Optional: If you have a separate Wix loader banner/button outside the frame
      // you can control them here.

      // Restructure the data to match your backend's expected 'submissionPayload' format
      const submissionPayload = {
        airline: data.airline,
        issue: data.issueType,
        status: data.membershipStatus,
        firstName: data.firstName,
        lastName: data.lastName,
        userMessage: data.incidentDescription,
        dynamicData: {}
      };

      // Loop through all potential dynamic fields sent from the HTML script
      const allDynamicFields = [
        "flightNumber", "delayDuration", "bookingReference", "ticketNumber",
        "pirNumber", "damageReportId", "originalItinerary", "alternateItinerary",
        "cancellationReason", "contactPhone", "contactEmail"
      ];

      allDynamicFields.forEach((fieldKey) => {
        // Only include the field in dynamicData if the user actually typed something into it
        if (data[fieldKey] && data[fieldKey].trim !== "") {
          submissionPayload.dynamicData[fieldKey] = data[fieldKey];
        }
      });

      try {
        // Hand the clean payload over to your backend claim processor
        const result = await processIncomingClaim(submissionPayload);

        if (result.success) {
          console.log("Claim successfully routed. ID:", result.claimId);

          // Hide your HTML form component and show your Wix success elements
          $w('#customer-service-form').hide();
          
          if ($w('#successMessageBanner')) {
            $w('#successMessageBanner').show();
          }

          if (result.autoApproved && $w('#successHeadline')) {
            $w('#successHeadline').text = "Claim Automatically Approved!";
          }
        } else {
          console.error("Submission rejected by backend:", result.error);
        }
      } catch (error) {
        console.error("Submission failed entirely:", error);
      }
    }
  });
});
