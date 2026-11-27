# Alexandra public chat

The public master controller owns the Wix HTML component `#skandiAlexandraGlobalEmbed`. The component uses the same `skandi-alexandra-chat.html`, `.css` and `.js` as the Help Center. When the sitewide component is available, the Help Center button and the mobile menu open that conversation.

## Wix Studio installation

1. Sync the tested GitHub code to the SKANDI TRAVELS Wix site. Install the complete standalone `skandi-alexandra-chat.html` from the Wix installation ZIP in the existing `#skandiAlexandraGlobalEmbed`, or create an HTML Embed Code component with that ID if it is absent.
2. Place the component in a dedicated global section. Use **Global Sections → Add to** to include all editable customer-facing pages, including Wix Stores product and cart templates, Club member pages, dynamic destinations, Booking and SKANDI's custom Store checkout. Wix hosts its separate native payment checkout outside the page editor. Include the section in new public page templates. Pin the HTML component **to Page** at the bottom right at all breakpoints and bring it to the front. Keep the section visible and give its layout minimal height. The shared `src/styles/global.css` sets the minimized and expanded iframe sizes. Keep the existing Help Center receiver and component ID.
3. Preview and test Home, Travel Info, the Help Center, a destination, Booking, and a native Stores page on desktop and mobile. Start one chat, switch pages, minimize and reopen it, and check that a draft and the same room survive. Check that the panel stays hidden on RIA INTRA and ALTEA. Publish the site after Wix preview validation and deployment approval.

## Conversation lifecycle

While the shared widget stays mounted, it keeps the active LiveKit connection and receives replies even when minimized. If Wix recreates the widget, the same browser tab restores the open state, draft and recent transcript. The backend uses a signed one-hour ticket to rejoin the original active room and reuses the customer's existing case for a live handoff. An ended room shows a reconnect message and preserves the visible transcript. LiveKit streams are real time, so a full reload can miss a reply that was transmitted while disconnected. The tab cache clears when the active Wix identity changes.

## Reference documents

- [HTML_REF/skandi/Alexandra Global Launcher.md](references/skandi-alexandra-global-launcher-md/README.md)
- [HTML_REF/riaintra/Alexandra Chat.md](references/riaintra-alexandra-chat-md/README.md)
- [HTML_REF/riaintra/Alexandra Global Launcher.md](references/riaintra-alexandra-global-launcher-md/README.md)
