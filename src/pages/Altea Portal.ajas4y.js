import wixLocation from 'wix-location';

$w.onReady(function () {
    // Replace '#html1' with the actual ID of your HTML element!
    $w("#html1").onMessage((event) => {
        
        // Check if the message is telling us to navigate
        if (event.data.type === "NAVIGATE") {
            // Use Wix's built-in router to change the page
            wixLocation.to(event.data.path);
        }
        
    });
});
