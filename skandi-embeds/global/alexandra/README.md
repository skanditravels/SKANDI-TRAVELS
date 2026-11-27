# Alexandra public chat

The public master controller owns the Wix HTML component `#skandiAlexandraGlobalEmbed`. The component uses the same `skandi-alexandra-chat.html`, `.css` and `.js` as the Help Center. When the sitewide component is available, the Help Center button and the mobile menu open that conversation.

## Wix Studio installation

1. Sync the tested GitHub code to the SKANDI TRAVELS Wix site. Install the complete standalone `skandi-alexandra-chat.html` from the Wix installation ZIP in the existing `#skandiAlexandraGlobalEmbed`, or create an HTML Embed Code component with that ID if it is absent.
2. Place the component directly in a dedicated global section named **Alexandra Chat**. Use **Global Sections → Add to More Pages** for customer pages and templates that accept it. Include the section in new public templates. My Club Profile, Store checkout and Store order confirmation can use the same chat through their existing universal receivers if Wix refuses the shared section. Wix hosts its separate native payment checkout outside the page editor. Keep the section and component visible at all breakpoints and retain their default positioning. The master applies Wix custom classes to the section and `src/styles/global.css` anchors it in the viewport and resizes the iframe. Keep the existing Help Center receiver and component ID.
3. Preview and test Home, Travel Info, the Help Center, a destination, Booking, and a native Stores page on desktop and mobile. Start one chat, switch pages, minimize and reopen it, and check that a draft and the same room survive. Check that the panel stays hidden on RIA INTRA and ALTEA. Publish the site after Wix preview validation and deployment approval.

## Conversation lifecycle

While the shared widget stays mounted, it keeps the active LiveKit connection and receives replies even when minimized. If Wix recreates the widget, the same browser tab restores the open state, draft and recent transcript. The backend uses a signed one-hour ticket to rejoin the original active room and reuses the customer's existing case for a live handoff. An ended room shows a reconnect message and preserves the visible transcript. LiveKit streams are real time, so a full reload can miss a reply that was transmitted while disconnected. The tab cache clears when the active Wix identity changes.

Alexandra receives text through the existing LiveKit stream and joins without subscribing to media tracks. The widget keeps its support-request form. The launcher and chat header share one portrait made from the existing Alexandra clip with its white backdrop removed. The still version follows the browser’s reduced-motion preference.

The greeting appears once per browser tab session, after a short delay. Clicking it opens the chat, and the X dismisses it. Opening chat before the greeting, dismissing it, or navigating after it appears prevents another greeting in that tab, including after a reload.

## Reference documents

- [HTML_REF/skandi/Alexandra Global Launcher.md](references/skandi-alexandra-global-launcher-md/README.md)
- [HTML_REF/riaintra/Alexandra Chat.md](references/riaintra-alexandra-chat-md/README.md)
- [HTML_REF/riaintra/Alexandra Global Launcher.md](references/riaintra-alexandra-global-launcher-md/README.md)

## Change log

- 2026-11-27 — Wix Preview preserved an unsent draft from Home to Travel Info and showed the opened iframe clipped to its editor size. The containing Wix Section now owns the chat sizing. Wix moves a page-pinned element out of its global section, so keep the HTML component attached to the dedicated section.
- 2026-11-27 — Wix Studio returned an invalid section index for My Club Profile, the custom Store checkout and its order confirmation. These three pages compile the same Alexandra component into their existing receivers. The master accepts chat messages from the registered page component and prefers the global section when it is available.
- 2026-11-27 — Changed the widget to text-only playback, removed its human-chat button and added the frameless portrait and session greeting. The existing `#skandiAlexandraGlobalEmbed` needs the regenerated standalone HTML. The Help Center and other compiled receivers pick up the shared source in the website build.
