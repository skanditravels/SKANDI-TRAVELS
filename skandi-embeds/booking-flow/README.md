# Booking component sources

The eight original HTML_REF Booking payloads are split into HTML/CSS/JavaScript under `components/`: offer, extras, transfer, apis, seats, payment, confirmation and documents. Each HTML file keeps its stylesheet/script order and any external library references.

`src/pages/Booking.e8twe.js` still owns eight Wix HTML components. The root triplet remains pending because combining these independent components would require a separate verified controller migration. Do not replace all eight components with the universal receiver.

The merged single-embed payload in `HTML_REF/skandi/Booking/README.md` is split under `html-ref/` and marked `SOURCE CONFLICT`. It is retained for review only; its `#bookingEmbed` claim does not match the current eight-component controller. It is not a build input or Wix installation target.
