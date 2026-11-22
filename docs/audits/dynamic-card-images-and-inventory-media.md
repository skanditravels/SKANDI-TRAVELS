# Dynamic card images and inventory media audit

Source baseline: main b596f6f1c45baa1922f802ec465fa6563b39cd31, 2026-11-22. A compiled build is not evidence that Wix is published or that the corresponding live bridge works.

The shared public shell checks the currently visible, source-mapped dynamic photo card surfaces after content and visibility changes. The first card keeps its image; later cards with the same normalized source use a neutral fallback while retaining their content and actions. This is not image fingerprinting: independently hosted copies or differently edited versions can still be duplicates. New card structures must be added to the shell selectors. Logos and galleries are intentionally outside the rule. The feature changes compiled GitHub page output; it does not require changing the global receiver.

Inventory media roles are not a universal placement contract:

- PRIMARY: generic inventory projection prefers it, then HERO, then CARD.
- HERO: preferred by specific airline/airport projections and some flight-status views; generic projection ranks it after PRIMARY.
- CARD: destinationContent prefers CARD for hotel, area and excursion cards; tours/activities prioritizes the card flag, then primary/hero flags and role CARD. Generic projection ranks it after PRIMARY/HERO.
- LOGO: airline/airport projection and flight-status carrier use.
- THUMBNAIL: airline projection uses it as icon; flight-status carrier uses it as a fallback after LOGO.
- GALLERY is stored and can appear in hotel galleries: destinationContent includes media of all roles, not just GALLERY. MOBILE, OG, MAP and ROOM are stored roles; no general automatic role-specific site placement was established in the audited projection. The property editor can associate ROOM media with a room package, but that alone does not establish public rendering. MOBILE sets a flag, not a confirmed responsive image switch.
- Home inventory selection uses media sort order rather than these roles; home card management can set its own image. The generic inventory projection can use the same selected image for card and hero. Photo Tag is stored descriptive metadata, not a confirmed page placement rule.

The current build report lists eleven routes as PENDING SOURCE. Existing legacy Wix pages or controllers may still exist; neither their absence nor live availability is established by the build report. Info Control imports four symbols not exported by the current public-content web module, and the separate unregistered Info Center Control imports a missing `runInternalGlobalSearch`. Do not replace those contracts with invented implementations; establish their current Wix owner and intended behavior before repair.
