# SKANDI Newsroom

> Current document: `skandi-embeds/newsroom/README.md`. Original reference: `HTML_REF/skandi/News Room.md`.


## INFO / LOG

- **Status:** V12 repair prepared — STATICALLY VERIFIED / REQUIRES LIVE TEST
- **System:** SKANDI
- **Route:** `/about/news-room`
- **Wix page:** `News Room.vn46g`
- **HTML component:** `#newsroomEmbed`
- **Child source:** `SKANDI_PUBLIC_NEWSROOM`
- **Repository baseline:** `skanditravels/SKANDI-TRAVELS` main `4163618a81fed71d7114ac55d3fa003421f145b0`
- **Prepared:** 2026-10-13

### V12 repair

Upgraded to a newsroom/newswire visual hierarchy inspired by current airline press centres: lead release, chronological press grid, media resources, media contacts and subscription. Existing Newsroom data/messages are unchanged.

### Verification boundary

Source contracts and syntax are checked locally. Wix publication, Supabase/RLS, staff/member session state and provider behavior require live testing after replacement and publication.

---


- 2026-10-28 UTC — Updated `skandi-embeds/newsroom/skandi-newsroom.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **SKANDI Newsroom** (`/about/news-room`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

### 2026-11-27 — Press release presentation

The article opens with its type, publication date, headline and excerpt. Montserrat and a narrower reading column carry through the body. The featured media, cards and article hero fit their images within the available space.

- `skandi-embeds/newsroom/skandi-newsroom.css` sets responsive type, reading width and image fit.
- `skandi-embeds/newsroom/skandi-newsroom.js` assembles the article header from the existing Media Control fields.

Commit both source files to the repository and run **SKANDI Website Builder** on `main` after review and merge. The installed `#newsroomEmbed` receiver loads the resulting `dist/newsroom/index.html`. Edit release copy and select the editorial photo in **Media Control → Newsroom → Press Releases**.

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
# 2026-11-03: Wix page name synchronization

The published Wix UI identifies page `vn46g` as `Newsroom`. Its existing controller is now `src/pages/Newsroom.vn46g.js`; the controller body and component contract were preserved. Earlier references below retain their historical names.

