# INFO / LOG — Flight Status

- Canonical source identity: `/HTML_REF/skandi/Flight Status.md`
- System area: `SKANDI`
- Wix page/controller: `/src/pages/Flight Status.cn7ah.js`
- Customer/internal route: `/travel-info/flight-status`
- Installed HTML element: `#flightStatusEmbed`
- Embed replacement: `/embed/Flight-Status.html` — paste the entire file into the existing `#flightStatusEmbed`. Its complete source is also preserved below.
- Canonical backend chain: `backend/SKANDI_CORE/flightStatus.web.js → flightStatus.js`.
- Authority: Public read only; `AIRLABS_API_KEY` stays in Wix Secrets Manager.
- Status: V12 airport-board repair prepared; STATICALLY VERIFIED / REQUIRES LIVE TEST after Wix publication.
- Last source verification: 2026-10-09 against `skanditravels/SKANDI-TRAVELS`, `main`, commit `ee2b03edf398f1c6270ad1586e56bc24e86f0d73`.
- Intended source only: this package does not publish Wix, mutate GitHub or change Supabase.
- DISPLAY CONTRACT: Airline logo → Flight No. → Departure time / Arrival time → To / From → Terminal → Gate/Belt → Remarks.
- AIRPORT CONTEXT OWNERSHIP: airport-profile/header, terminals, transport, lounges, dining, airport stay, connected SKANDI products, destination continuation and practical airport guidance now live under Travel Info → Airport Information. Flight Status no longer renders the duplicate airport guide below its board.
- STATUS-UI RULE: decorative system-state pills/badges such as LIVE, READY and SYNC are not part of the Flight Status/Travel Info design. Actual flight operational remarks such as BOARDING, DELAYED or CANCELLED remain FIDS data.

## 2026-10-09 — Airport-context move + FIDS recovery

The user-edited current `flightStatus.js` at repository head was not syntactically loadable: template-literal delimiters were missing in the airport context key and two error messages. This replacement restores the complete V12 AirLabs core with the same public export names and action contract, preserves AirLabs v9 search behavior, airport directory/context functions, the existing boarding-window metadata used by the current FIDS, and fixes the module-loading failure. The Flight Status embed also corrects the edited airline-logo interpolation/history-count renderer mistakes and removes its duplicate airport guide. The board itself remains searchable on the Flight Status page.

STATICALLY VERIFIED: JavaScript syntax, core public export names, embed message contracts and HTML structure. REQUIRES LIVE TEST: Wix rebuild/publication, `AIRLABS_API_KEY`, live AirLabs responses and live Supabase airport data.

## Historical INFO / LOG (preserved)

Earlier route, component, controller and status claims below are historical; the current INFO above supersedes conflicting metadata.

# SKANDI Flight Status

**STATUS:** NEEDS REVIEW  
**SLUG:** `/about/flight-status`  
**WIX PAGE:** /src/pages/Flight Status.cn7ah.js  
**AREA:** SKANDI  
**LIVE HTML:** YES  
**ELEMENT:** `#flightStatusEmbed`  
**LAST SYNCED:** 2026-09-18

### HOW TO USE

***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED" STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

## COMMENT SECTION
(START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION)

... END

---

## TECHNICAL INFO / LOG

> **Canonical reference path:** `/HTML_REF/skandi/flight-status.md`  
> **Generated locally:** 2026-09-18  
> **Verification level:** STATICALLY VERIFIED FROM UPLOADED SOURCE SET / REQUIRES LIVE TEST FOR RUNTIME DEPENDENCIES

### Ownership and Dependency Chain

`/HTML_REF/skandi/flight-status.md` → live Wix HTML / `#flightStatusEmbed` → `/src/pages/Flight Status.cn7ah.js` → `backend/SKANDI_CORE/flightStatus.web.js` → `backend/SKANDI_CORE/flightStatus.js` → Supabase / AirLabs.

### Historical repair notes

- 2026-09-18 — HTML_REF candidate generated from the uploaded source set; live Wix/runtime/database/provider verification was not performed.
- 2026-10-07 — V12 complete-chain repair added `/flights` live tracking alongside `/flight` and `/schedules`, response correlation, obsolete-response discard, 60-second refresh, airport-local provider time handling and partial-provider warnings. Airport guides remained on `travel_info_airports` and `inventory_public_entities_v`.
- 2026-10-08 — Missing published Flight Status export diagnosed from revision-1228: the page imported an empty backend proxy module while source exported `handleFlightStatusAction`. Public web methods were moved to direct `Permissions.Anyone` declarations; live rebuild/publication remained required.
- 2026-10-08 — Airport-style FIDS layout implemented with larger airline marks and Airline / Flight No. / Time / To or From / Terminal / Gate / Remarks mapping, directory-enriched airport labels and mobile retention of all seven fields.

## COMPLETE INTENDED HTML

```html
<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1,viewport-fit=cover" name="viewport"/>
<meta content="#f6faff" name="theme-color"/>
<title>Flight Status | SKANDI Travels · B-011.40</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="[https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&amp;family=Roboto+Mono:wght@500;600;700&amp;display=swap](https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800\&amp;family=Roboto+Mono:wght@500;600;700\&amp;display=swap)" rel="stylesheet"/>
<style>
        :root {
            --sk-navy: #022e64;
            --sk-navy-deep: #0b3a7a;
            --sk-navy-black: #04254a;
            --sk-blue: #285ca8;
            --sk-blue-2: #0b5c85;
            --sk-aqua: #5fc7cf;
            --sk-aqua-soft: #d9f1f1;
            --sk-aqua-pale: #eef9fa;
            --sk-ice: #e9eef8;
            --sk-sand: #f2e9dc;
            --sk-porcelain: #f6faff;
            --sk-section: #f3f6f8;
            --sk-white: #fff;
            --sk-graphite: #111827;
            --sk-muted: #667085;
            --sk-body: #526274;
            --sk-border: #dbe3ef;
            --sk-champagne: #d1bc98;
            --sk-danger: #d85f66;
            --sk-warning: #d59a36;
            --sk-success: #2f9170;
            --ease: cubic-bezier(.16, 1, .3, 1);
            --content: 1380px;
            --mx: 72%;
            --my: 18%;
        }
        * {
            box-sizing: border-box
        }
        html {
            scroll-behavior: smooth;
            background: var(--sk-navy)
        }
        body {
            margin: 0;
            min-width: 320px;
            overflow-x: hidden;
            color: var(--sk-graphite);
            background: var(--sk-navy);
            font-family: "Montserrat", system-ui, -apple-system, "Segoe UI", sans-serif;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
        }
        button, input, select {
            font: inherit
        }
        button {
            cursor: pointer
        }
        a {
            color: inherit
        }
        :focus-visible {
            outline: 3px solid rgba(95, 199, 207, .62);
            outline-offset: 3px
        }
        [hidden] {
            display: none !important
        }
        .page {
            position: relative;
            overflow: hidden;
            background: #fff
        }
        .wrap {
            width: min(var(--content), calc(100% - 56px));
            margin-inline: auto
        }
        .sr-only {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important
        }
        /* =========================================================
   HERO SECTION
   ========================================================= */
        .hero {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            min-height: 585px;
            background: radial-gradient(circle at var(--mx) var(--my), rgba(95, 199, 207, .17), transparent 20%),
                radial-gradient(circle at 84% 12%, rgba(40, 92, 168, .08), transparent 19%),
                linear-gradient(180deg, #f8fbff 0%, #edf5ff 58%, #f3f6f8 100%);
        }
        .hero::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: -2;
            pointer-events: none;
            opacity: .30;
            background-image:
                linear-gradient(rgba(11, 58, 122, .052) 1px, transparent 1px),
                linear-gradient(90deg, rgba(11, 58, 122, .052) 1px, transparent 1px),
                linear-gradient(115deg, transparent 0 48%, rgba(2, 46, 100, .045) 49%, transparent 50%);
            background-size: 42px 42px, 42px 42px, 260px 260px;
            mask-image: linear-gradient(180deg, #000, rgba(0, 0, 0, .38) 68%, transparent);
            animation: gridDrift 28s linear infinite;
        }
        @keyframes gridDrift {
            to {
                background-position: 76px 38px, 38px 76px
            }
        }
        /* Seamless faded hero image */
        .hero-image-fade {
            position: absolute;
            inset: 0;
            z-index: -3;
            pointer-events: none;
            background-image:
                linear-gradient(180deg, rgba(248, 251, 255, 0.65) 0%, rgba(237, 245, 255, 0.85) 55%, #f3f6f8 100%),
                url('[https://static.wixstatic.com/media/394052_54b5f789d38c4b0f87678a2f4852c85e~mv2.png](https://static.wixstatic.com/media/394052_54b5f789d38c4b0f87678a2f4852c85e~mv2.png)');
            background-size: cover;
            background-position: center 30%;
            -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 95%);
            mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 95%);
        }
        .terminal-architecture {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
            z-index: 0
        }
        .terminal-glass-lines {
            position: absolute;
            right: -3%;
            top: 0;
            width: 58%;
            height: 100%;
            opacity: .48;
            background:
                linear-gradient(90deg, transparent 0 8%, rgba(2, 46, 100, .08) 8% 8.3%, transparent 8.3% 23%, rgba(2, 46, 100, .06) 23% 23.3%, transparent 23.3% 40%, rgba(2, 46, 100, .07) 40% 40.3%, transparent 40.3% 58%, rgba(2, 46, 100, .055) 58% 58.3%, transparent 58.3%),
                linear-gradient(180deg, rgba(255, 255, 255, .16), rgba(95, 199, 207, .05));
            transform: skewX(-8deg);
            mask-image: linear-gradient(90deg, transparent, #000 24%, #000);
        }
        .terminal-ceiling-lines {
            position: absolute;
            left: 45%;
            right: -15%;
            top: -20%;
            height: 60%;
            opacity: .30;
            transform: perspective(700px) rotateX(62deg) rotateZ(-4deg);
            transform-origin: center top;
            background:
                repeating-linear-gradient(90deg, rgba(2, 46, 100, .09) 0 1px, transparent 1px 44px),
                repeating-linear-gradient(180deg, rgba(2, 46, 100, .075) 0 1px, transparent 1px 38px);
            mask-image: linear-gradient(180deg, #000, transparent);
        }
        .terminal-apron-light {
            position: absolute;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            opacity: .75;
            animation: apronGlow 3.6s ease-in-out infinite alternate;
        }
        .terminal-apron-light.l1 {
            right: 11%;
            top: 23%;
            background: #4a90e2;
            box-shadow: 0 0 8px 4px rgba(74, 144, 226, 0.4)
        }
        .terminal-apron-light.l2 {
            right: 25%;
            top: 36%;
            background: #e74c3c;
            box-shadow: 0 0 12px 6px rgba(231, 76, 60, 0.3);
            animation: strobeRed 2s infinite;
            animation-delay: -1.2s
        }
        .terminal-apron-light.l3 {
            right: 7%;
            top: 58%;
            background: #fdf5e6;
            box-shadow: 0 0 15px 8px rgba(253, 245, 230, 0.2);
            animation-delay: -2.1s
        }
        .terminal-apron-light.l4 {
            right: 39%;
            top: 18%;
            background: #fdf5e6;
            box-shadow: 0 0 15px 8px rgba(253, 245, 230, 0.2);
            animation-delay: -.7s
        }
        @keyframes strobeRed {

            0%,
            10%,
            100% {
                opacity: 0.2;
                transform: scale(0.8)
            }

            5% {
                opacity: 1;
                transform: scale(1.1)
            }
        }
        @keyframes apronGlow {
            to {
                opacity: .30;
                transform: scale(.72)
            }
        }
        .hero-inner {
            position: relative;
            z-index: 3;
            padding: 58px 0 118px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 42px
        }
        .hero-copy {
            max-width: 790px;
            position: relative;
            padding: 26px 0
        }
        .hero-copy::before {
            content: "";
            position: absolute;
            left: -42px;
            top: 10%;
            bottom: 10%;
            width: 4px;
            border-radius: 4px;
            background: linear-gradient(180deg, #5fc7cf, #022e64 60%, transparent);
            opacity: .50
        }
        .eyebrow {
            display: flex;
            align-items: center;
            gap: 11px;
            color: var(--sk-blue);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .18em;
            text-transform: uppercase
        }
        .eyebrow::before {
            content: "";
            width: 38px;
            height: 1px;
            background: linear-gradient(90deg, var(--sk-aqua), transparent)
        }
        .hero h1 {
            margin: 16px 0 18px;
            color: var(--sk-navy);
            font-size: clamp(48px, 6.2vw, 84px);
            font-weight: 550;
            line-height: .91;
            letter-spacing: -.072em;
            text-wrap: balance
        }
        .hero h1 span {
            display: block;
            color: #0b5c85;
            font-weight: 400
        }
        .hero-lede {
            max-width: 720px;
            color: #5d6d7e;
            font-size: clamp(14px, 1.25vw, 18px);
            line-height: 1.75
        }
        .hero-wayfinding {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 24px
        }
        .hero-wayfinding span {
            min-height: 36px;
            display: inline-flex;
            align-items: center;
            gap: 9px;
            padding: 0 13px;
            border-radius: 9px;
            background: #022e64;
            color: #fff;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
            box-shadow: 0 9px 22px rgba(2, 46, 100, .11)
        }
        .hero-wayfinding span:nth-child(2) {
            background: #d9f1f1;
            color: #022e64
        }
        .hero-wayfinding span:nth-child(3) {
            background: #e9eef8;
            color: #022e64
        }
        .hero-wayfinding b {
            font-size: 14px;
            font-weight: 600
        }
        .terminal-location-line {
            display: flex;
            align-items: center;
            gap: 9px;
            flex-wrap: wrap;
            margin-top: 13px;
            color: #738497;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .10em;
            text-transform: uppercase
        }
        .terminal-location-line i {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #5fc7cf
        }
        .terminal-location-icon {
            display: inline-grid;
            place-items: center;
            height: 24px;
            padding: 0 8px;
            border-radius: 5px;
            background: #022e64;
            color: #fff;
            font-family: "Roboto Mono", monospace;
            font-size: 7px;
            letter-spacing: .10em
        }
        .hero-status {
            position: relative;
            overflow: hidden;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            width: min(400px, 33vw)
        }
        .hero-status::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            border-radius: inherit;
            background: linear-gradient(115deg, transparent 0 40%, rgba(255, 255, 255, .36) 50%, transparent 60%);
            background-size: 240% 100%;
            animation: heroPanelSweep 9s ease-in-out infinite
        }
        @keyframes heroPanelSweep {

            0%,
            32% {
                background-position: -140% 0
            }

            72%,
            100% {
                background-position: 170% 0
            }
        }
        .hero-stat {
            position: relative;
            overflow: hidden;
            min-height: 116px;
            padding: 18px;
            border: 1px solid rgba(2, 46, 100, .08);
            border-radius: 22px;
            background: rgba(255, 255, 255, .82);
            backdrop-filter: blur(16px);
            box-shadow: 0 14px 36px rgba(2, 46, 100, .09)
        }
        .hero-stat:nth-child(2) {
            background: linear-gradient(135deg, #022e64, #0b5c85);
            color: #fff
        }
        .hero-stat label {
            display: block;
            color: #6d7d8d;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .14em;
            text-transform: uppercase
        }
        .hero-stat:nth-child(2) label {
            color: #9fc3d4
        }
        .hero-stat strong {
            display: block;
            margin-top: 14px;
            color: var(--sk-navy);
            font-size: 22px;
            line-height: 1.06;
            letter-spacing: -.04em
        }
        .hero-stat:nth-child(2) strong {
            color: #fff
        }
        .live-pill {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            margin-top: 11px;
            color: #497082;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: .08em;
            text-transform: uppercase
        }
        .hero-stat:nth-child(2) .live-pill {
            color: #c9e4e6
        }
        .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--sk-aqua);
            box-shadow: 0 0 0 5px rgba(95, 199, 207, .14), 0 0 12px rgba(95, 199, 207, .48);
            animation: pulse 1.9s ease-in-out infinite
        }
        @keyframes pulse {
            50% {
                opacity: .45;
                transform: scale(.78)
            }
        }
        /* =========================================================
   BOARD & SEARCH SECTION
   ========================================================= */
        .board-section {
            position: relative;
            padding: 14px 0 86px;
            background: #f3f6f8;
            isolation: isolate
        }
        .board-section::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: -2;
            pointer-events: none;
            background:
                radial-gradient(circle at 14% 12%, rgba(95, 199, 207, .10), transparent 18%),
                radial-gradient(circle at 85% 32%, rgba(40, 92, 168, .08), transparent 22%),
                linear-gradient(rgba(2, 46, 100, .022) 1px, transparent 1px),
                linear-gradient(90deg, rgba(2, 46, 100, .022) 1px, transparent 1px);
            background-size: auto, auto, 56px 56px, 56px 56px;
            mask-image: linear-gradient(180deg, #000, rgba(0, 0, 0, .48), transparent 95%)
        }
        .board-section::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: -70px;
            height: 110px;
            pointer-events: none;
            background: linear-gradient(180deg, rgba(243, 246, 248, 0), #f3f6f8 80%)
        }
        .board-heading {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(290px, .48fr);
            gap: 28px;
            align-items: end;
            width: min(1180px, 100%);
            margin: 0 auto 16px
        }
        .board-heading h2 {
            margin-top: 8px;
            color: var(--sk-navy);
            font-size: clamp(30px, 3.8vw, 50px);
            font-weight: 560;
            line-height: .98;
            letter-spacing: -.056em
        }
        .board-heading p {
            color: #677687;
            font-size: 12px;
            line-height: 1.72
        }
        /* Lookup Modes & Controls */
        .lookup-mode-tabs {
            width: min(1160px, calc(100% - 24px));
            margin: 0 auto 9px;
            padding: 5px;
            display: flex;
            gap: 5px;
            border-radius: 13px;
            background: #e9eef8;
            border: 1px solid rgba(2, 46, 100, .06);
            box-shadow: 0 8px 22px rgba(2, 46, 100, .05)
        }
        .lookup-mode {
            min-height: 38px;
            padding: 0 13px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            color: #64788d;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .10em;
            text-transform: uppercase;
            transition: background .18s ease, color .18s ease, transform .18s ease
        }
        .lookup-mode span {
            font-family: "Roboto Mono", monospace;
            font-size: 7px;
            letter-spacing: .06em;
            opacity: .72
        }
        .lookup-mode:hover {
            background: rgba(255, 255, 255, .72);
            color: #022e64
        }
        .lookup-mode.active {
            background: #fff;
            color: #022e64;
            box-shadow: 0 6px 16px rgba(2, 46, 100, .10)
        }
        .airport-controls {
            position: relative;
            z-index: 3;
            width: min(1180px, 100%);
            margin: 0 auto 24px;
            display: grid;
            grid-template-columns: 180px 180px minmax(260px, 1fr) auto auto;
            gap: 8px;
            align-items: stretch;
            padding: 9px;
            border-radius: 18px;
            background: rgba(255, 255, 255, .84);
            border: 1px solid rgba(2, 46, 100, .08);
            backdrop-filter: blur(18px);
            box-shadow: 0 12px 28px rgba(2, 46, 100, .07)
        }
        .airport-controls.mode-airport {
            grid-template-columns: minmax(240px, 1.15fr) 180px minmax(260px, 1fr) auto auto
        }
        .airport-controls.mode-flight {
            grid-template-columns: minmax(260px, 1fr) 180px auto auto
        }
        .airport-controls.mode-route {
            grid-template-columns: minmax(210px, 1fr) minmax(210px, 1fr) 180px auto auto
        }
        .airport-controls.mode-flight #airportBoardToggle, .airport-controls.mode-route #airportBoardToggle {
            display: none
        }
        .airport-controls.mode-flight .lookup-date-control, .airport-controls.mode-route .lookup-date-control {
            min-width: 180px
        }
        .airport-control {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 9px;
            align-items: center;
            min-height: 54px;
            padding: 7px 10px;
            border-radius: 10px;
            background: #fff;
            border: 1px solid rgba(2, 46, 100, .06)
        }
        .control-sign {
            min-width: 34px;
            height: 34px;
            padding: 0 7px;
            display: grid;
            place-items: center;
            border-radius: 6px;
            background: linear-gradient(145deg, #04254a, #0b477e);
            color: #fff;
            font-family: "Roboto Mono", monospace;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: .08em
        }
        .airport-control label {
            display: block;
            color: #788697;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
            margin-bottom: 2px
        }
        .airport-control input {
            width: 100%;
            min-width: 0;
            border: 0;
            background: transparent;
            outline: none;
            padding: 0;
            color: #022e64;
            font-family: "Roboto Mono", monospace;
            font-size: 13px;
            font-weight: 700;
            text-transform: none
        }
        .airport-control input[type="date"] {
            font-size: 11px
        }
        #flightNumber {
            text-transform: uppercase;
            font-family: "Roboto Mono", monospace;
            font-weight: 800;
            letter-spacing: .04em
        }
        #airport, #from, #to {
            font-family: "Roboto Mono", monospace;
            font-weight: 700
        }
        .airport-board-toggle {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            padding: 5px;
            border-radius: 10px;
            background: #f0f4f8
        }
        .airport-toggle {
            min-height: 44px;
            padding: 0 14px;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: #687a8d;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .10em;
            text-transform: uppercase;
            transition: .18s ease
        }
        .airport-toggle span {
            font-size: 13px;
            margin-right: 5px
        }
        .airport-toggle:hover {
            background: rgba(255, 255, 255, .65);
            color: #022e64
        }
        .airport-toggle.active {
            background: #022e64;
            color: #fff;
            box-shadow: 0 8px 18px rgba(2, 46, 100, .16)
        }
        .airport-update,
        .airport-reset {
            border: 0;
            border-radius: 9px;
            min-height: 54px;
            padding: 0 15px;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .10em;
            text-transform: uppercase
        }
        .airport-update {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: linear-gradient(145deg, #04254a, #0b477e);
            color: #fff;
            box-shadow: 0 10px 22px rgba(2, 46, 100, .15);
            transition: transform .18s ease, box-shadow .18s ease
        }
        .airport-update:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 27px rgba(2, 46, 100, .20)
        }
        .airport-update-led {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #67fca9;
            box-shadow: 0 0 9px rgba(103, 252, 169, .62)
        }
        .airport-reset {
            background: #fff;
            color: #647588;
            border: 1px solid rgba(2, 46, 100, .08)
        }
        .airport-reset:hover {
            color: #022e64;
            border-color: rgba(95, 199, 207, .58)
        }
        .airport-clear-btn::before {
            content: "×";
            margin-right: 6px;
            font-size: 12px;
            font-weight: 500
        }
        .airport-notice {
            grid-column: 1/-1;
            margin: 0 !important;
            display: none
        }
        .airport-control-note {
            grid-column: 1/-1;
            padding: 0 5px;
            color: #738396;
            font-size: 8px;
            line-height: 1.4
        }
        .notice {
            position: relative;
            display: none;
            margin-bottom: 12px;
            padding: 11px 13px;
            border-radius: 14px;
            background: rgba(255, 210, 122, .14);
            border: 1px solid rgba(255, 210, 122, .34);
            color: #7a6128;
            font-size: 10px;
            line-height: 1.5
        }
        .notice.error {
            background: rgba(216, 95, 102, .1);
            border-color: rgba(216, 95, 102, .3);
            color: #d85f66
        }
        .notice.is-visible {
            display: block
        }
        /* Search Dropdowns */
        .airport-code-control {
            position: relative;
            z-index: 12
        }
        .airport-code-control>div {
            min-width: 0;
            position: relative
        }
        .airport-code-control input {
            min-width: 250px;
            width: min(34vw, 390px)
        }
        .airport-suggestions {
            position: absolute;
            z-index: 40;
            left: 0;
            right: 0;
            top: calc(100% + 9px);
            display: none;
            overflow: hidden;
            max-height: 310px;
            overflow-y: auto;
            border: 1px solid rgba(2, 46, 100, .12);
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 20px 48px rgba(2, 46, 100, .18);
            padding: 6px
        }
        .airport-suggestions.open {
            display: block
        }
        .airport-suggestion {
            width: 100%;
            min-height: 52px;
            border: 0;
            border-radius: 11px;
            background: transparent;
            padding: 9px 10px;
            display: grid;
            grid-template-columns: 50px minmax(0, 1fr);
            gap: 10px;
            align-items: center;
            text-align: left;
            color: #173747
        }
        .airport-suggestion:hover, .airport-suggestion.active {
            background: #e9eef8
        }
        .airport-suggestion-code {
            font-family: "Roboto Mono", monospace;
            font-size: 15px;
            font-weight: 800;
            color: #022e64
        }
        .airport-suggestion-copy {
            min-width: 0
        }
        .airport-suggestion-copy strong {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 10px
        }
        .airport-suggestion-copy small {
            display: block;
            margin-top: 3px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #718094;
            font-size: 8px
        }
        /* =========================================================
   FIDS HARDWARE SHELL
   ========================================================= */
        .terminal-bay {
            width: min(1240px, 100%);
            margin-inline: auto;
            position: relative;
            padding: 58px 34px 44px;
            border-radius: 34px;
            background: linear-gradient(180deg, rgba(255, 255, 255, .88), rgba(238, 244, 249, .94)), #f3f6f8;
            border: 1px solid rgba(2, 46, 100, .07);
            box-shadow: inset 0 1px rgba(255, 255, 255, .92), 0 30px 80px rgba(2, 46, 100, .12)
        }
        .terminal-bay::before {
            content: "";
            position: absolute;
            left: 24px;
            right: 24px;
            top: 25px;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(2, 46, 100, .08), rgba(95, 199, 207, .26), rgba(2, 46, 100, .08), transparent)
        }
        .terminal-bay::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 34px;
            pointer-events: none;
            opacity: .42;
            background: linear-gradient(90deg, rgba(2, 46, 100, .035) 1px, transparent 1px), linear-gradient(rgba(2, 46, 100, .026) 1px, transparent 1px);
            background-size: 70px 70px;
            mask-image: linear-gradient(180deg, #000 0 22%, transparent 60%)
        }
        .terminal-overhead-signs {
            position: absolute;
            z-index: 4;
            top: 0;
            left: 34px;
            right: 34px;
            display: flex;
            align-items: flex-start;
            gap: 7px;
            transform: translateY(-18px)
        }
        .overhead-sign {
            min-height: 40px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 0 14px;
            border-radius: 8px;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
            box-shadow: 0 12px 24px rgba(2, 46, 100, .14)
        }
        .overhead-sign b {
            font-size: 14px;
            font-weight: 600
        }
        .sign-dark {
            background: #022e64;
            color: #fff
        }
        .sign-aqua {
            background: #d9f1f1;
            color: #022e64
        }
        .sign-light {
            background: #fff;
            color: #022e64;
            border: 1px solid rgba(2, 46, 100, .08)
        }
        .overhead-zone {
            margin-left: auto;
            padding-top: 13px;
            color: #8291a0;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: .16em;
            text-transform: uppercase
        }
        .terminal-floor-reflection {
            position: absolute;
            left: 8%;
            right: 8%;
            bottom: -24px;
            height: 38px;
            background: radial-gradient(ellipse at center, rgba(2, 46, 100, .14), transparent 68%);
            filter: blur(12px);
            pointer-events: none
        }
        .flight-board-shell {
            width: min(1120px, 100%);
            margin-inline: auto;
            padding: 14px;
            border-radius: 24px;
            background: linear-gradient(180deg, rgba(255, 255, 255, .98), rgba(233, 238, 248, .96));
            box-shadow: 0 30px 60px rgba(2, 46, 100, 0.25), 0 40px 100px rgba(0, 0, 0, 0.3), inset 0 3px 0 #fff, inset 0 -2px 10px rgba(2, 46, 100, 0.1);
            border-top: 2px solid #fff;
        }
        .flight-board-shell::after {
            content: "";
            position: absolute;
            inset: 7px;
            border-radius: 19px;
            border: 1px solid rgba(255, 255, 255, .78);
            pointer-events: none
        }
        .board-top {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(280px, .72fr) auto;
            gap: 12px;
            align-items: center;
            margin-bottom: 9px;
            padding: 15px 17px;
            border-radius: 16px;
            background: radial-gradient(circle at 8% 0, rgba(95, 199, 207, .18), transparent 25%), linear-gradient(135deg, #04254a, #0b477e 68%, #126d78);
            color: #fff;
            box-shadow: 0 18px 38px rgba(2, 46, 100, .22)
        }
        .board-brand {
            display: flex;
            align-items: center;
            gap: 11px
        }
        .board-monogram {
            width: 40px;
            height: 40px;
            border-radius: 11px;
            display: grid;
            place-items: center;
            background: rgba(255, 255, 255, .10);
            border: 1px solid rgba(255, 255, 255, .16);
            color: #d9f1f1;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .16em;
            box-shadow: inset 0 1px rgba(255, 255, 255, .12), 0 10px 20px rgba(0, 0, 0, .12)
        }
        .board-brand strong {
            display: block;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -.035em;
            line-height: .96
        }
        .board-brand span {
            display: block;
            margin-top: 4px;
            color: #afd0df;
            font-size: 7px;
            font-weight: 780;
            letter-spacing: .13em;
            text-transform: uppercase
        }
        .board-query {
            min-width: 0;
            padding: 9px 11px;
            border-radius: 10px;
            background: rgba(3, 17, 31, .22);
            border: 1px solid rgba(255, 255, 255, .11);
            backdrop-filter: blur(12px)
        }
        .board-query label {
            display: block;
            color: #8eb2c4;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: .13em;
            text-transform: uppercase
        }
        .board-query strong {
            display: block;
            margin-top: 5px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #eefaf9;
            font-size: 10px;
            letter-spacing: .05em
        }
        .board-live {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 10px;
            background: rgba(255, 255, 255, .08);
            border: 1px solid rgba(255, 255, 255, .12);
            white-space: nowrap
        }
        .board-live span {
            color: #c8dce6;
            font-size: 8px;
            font-weight: 750;
            letter-spacing: .10em;
            text-transform: uppercase
        }
        .board-live strong {
            color: #fff;
            font-size: 9px
        }
        .board-screen {
            position: relative;
            z-index: 2;
            overflow: hidden;
            border-radius: 13px;
            background: radial-gradient(circle at 16% 0, rgba(95, 199, 207, .075), transparent 22%), linear-gradient(180deg, #061525, #04111e 48%, #03101c);
            border: 1px solid rgba(255, 255, 255, .06);
            box-shadow: inset 0 12px 24px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 1px rgba(255, 255, 255, 0.6);
        }
        .board-screen::after {
            content: "";
            position: absolute;
            z-index: 10;
            pointer-events: none;
            top: -18%;
            left: -30%;
            width: 34%;
            height: 150%;
            background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.03) 25%, rgba(255, 255, 255, 0.08) 45%, transparent 50%);
            mask-image: linear-gradient(to bottom, #000 30%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, #000 30%, transparent 100%);
            transform: skewX(-16deg);
            animation: glassSweep 10s ease-in-out infinite;
        }
        @keyframes glassSweep {

            0%,
            35% {
                left: -34%
            }

            76%,
            100% {
                left: 122%
            }
        }
        #hardwareCasing.is-searching .board-screen::before {
            opacity: .55;
            animation: fidsPulse 1.6s ease-in-out infinite alternate
        }
        #hardwareCasing.is-searching .airport-update-led {
            animation: livePulse .72s ease-in-out infinite
        }
        @keyframes fidsPulse {
            to {
                filter: brightness(1.25)
            }
        }
        .board-airport-bar {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 1px;
            min-height: 54px;
            background: rgba(255, 255, 255, .026);
            border-bottom: 1px solid rgba(255, 255, 255, .06)
        }
        .board-airport-bar>div {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 13px;
            border-right: 1px solid rgba(255, 255, 255, .045)
        }
        .board-airport-bar>div:last-child {
            border-right: 0
        }
        .board-airport-bar small {
            color: #66889e;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: .15em;
            text-transform: uppercase
        }
        .board-airport-bar strong {
            color: #fff;
            font-family: "Roboto Mono", monospace;
            font-size: 17px;
            font-weight: 700;
            letter-spacing: .05em
        }
        .board-columns {
            position: relative;
            z-index: 2;
            min-height: 37px;
            border-top: 1px solid rgba(255, 255, 255, .035);
            border-bottom: 1px solid rgba(255, 255, 255, .075);
            background: rgba(255, 255, 255, .035)
        }
        .board-columns > div {
  padding: 12px 14px;
  font-size: 11px; /* Even header typography sizing */
  font-weight: 700;
  letter-spacing: .08em;
  color: #f4ca58;
  text-transform: uppercase;
}
        .board-columns>div:last-child {
            border-right: 0
        }
        .board-scroll {
            position: relative;
            z-index: 2;
            overflow-x: hidden;
            overflow-y: auto;
            padding: 0 8px 8px;
            min-height: 360px;
            max-height: 480px;
            scrollbar-width: thin;
            scrollbar-color: #214560 transparent
        }
        .board-scroll::-webkit-scrollbar {
            width: 5px
        }
        .board-scroll::-webkit-scrollbar-thumb {
            background: #214560;
            border-radius: 999px
        }
        .flip-body {
            min-width: 0;
            display: grid;
            gap: 0
        }
        .board-screen[aria-busy="true"] {
            cursor: progress
        }
        /* FIDS FLIGHT ROWS — Physical Hardware Setup */
        .fids-row {
            position: relative;
            min-height: 64px;
            margin-bottom: 4px;
            border-radius: 8px;
            background: rgba(3, 16, 28, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
            animation: rowEnter .52s var(--ease) both;
            animation-delay: calc(var(--row, 0)*55ms);
            transition: transform .2s ease, background .2s ease, border-color .2s ease;
        }
        .fids-row::before {
            content: "";
            position: absolute;
            left: 0;
            top: 8px;
            bottom: 8px;
            width: 3px;
            border-radius: 2px;
            background: #5fc7cf;
            opacity: 0;
            transition: opacity .2s ease;
        }
        .fids-row:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(95, 199, 207, 0.3);
        }
        .fids-row:hover::before {
            opacity: 0.78
        }
        @keyframes rowEnter {
            from {
                opacity: 0;
                transform: translateY(9px) scale(.994)
            }

            to {
                opacity: 1;
                transform: none
            }
        }
        .fids-cell {
            min-height: 64px;
            padding: 8px 10px;
            display: flex;
            align-items: center;
            border-right: 1px solid rgba(255, 255, 255, .045);
            overflow: hidden
        }
        .fids-cell::before {
  content: attr(data-label);
  flex: 0 0 auto;
  color: #7194a9;
  font-family: "Roboto Mono", monospace;
  font-size: 7px;
  font-weight: 800;
  letter-spacing: .11em;
  text-transform: uppercase;
}
        .fids-cell:last-child {
            border-right: 0
        }
        .fids-time {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 3px
        }
        .fids-time-main {
            color: #fff;
            font-family: "Roboto Mono", monospace;
            font-size: 21px;
            font-weight: 700;
            letter-spacing: .02em
        }
        .fids-time small {
            color: #6f91a5;
            font-family: "Roboto Mono", monospace;
            font-size: 7px;
            font-weight: 700;
            letter-spacing: .08em;
            text-transform: uppercase
        }
        .fids-destination {
            min-width: 0
        }
        .fids-layout {
  display: grid;
  grid-template-columns: 140px 110px 120px minmax(240px, 1fr) 90px 90px 160px;
  align-items: center;
}
        .fids-destination strong {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #f3f8fc;
            font-size: 16px;
            font-weight: 650;
            letter-spacing: -.025em
        }
        .fids-destination small {
            display: block;
            margin-top: 4px;
            color: #6e93a8;
            font-family: "Roboto Mono", monospace;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: .08em
        }
        .fids-flight {
            display: flex;
            align-items: center;
            gap: 8px
        }
        .fids-flight strong {
            color: #f4f8fb;
            font-family: "Roboto Mono", monospace;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: .04em
        }
        .fids-tail {
            width: 42px;
            height: 36px;
            flex: 0 0 auto;
            border-radius: 6px;
            display: grid;
            place-items: center;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 5px 14px rgba(0, 0, 0, .14)
        }
        .fids-tail img {
            max-width: 34px;
            max-height: 24px;
            object-fit: contain
        }
        .fids-tail.fallback {
            background: linear-gradient(145deg, #d9f1f1, #e9eef8);
            color: #022e64;
            font-family: "Roboto Mono", monospace;
            font-weight: 900;
            font-size: 10px
        }
        .fids-carrier-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #90adbd;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: .03em
        }
        .fids-status {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            color: #d9f1f1;
            font-family: "Roboto Mono", monospace;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: .03em
        }
        .fids-status::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 8px;
            background: #67fca9;
            box-shadow: 0 0 9px rgba(103, 252, 169, .40)
        }
        .fids-status.flap-warn {
            color: #ffd27a
        }
        .fids-status.flap-warn::before {
            background: #ffd27a;
            box-shadow: 0 0 9px rgba(255, 210, 122, .35)
        }
        .fids-status.flap-bad {
            color: #ff9292
        }
        .fids-status.flap-bad::before {
            background: #ff7a7a;
            box-shadow: 0 0 9px rgba(255, 122, 122, .40)
        }
        /* =========================================================
          FIDS SPLIT-FLAP TRANSITION SYSTEM
         ========================================================= */
        .fids-layout .is-changing {
  animation: fidsSplitFlapTile 0.48s cubic-bezier(0.23, 1, 0.32, 1) both;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  display: inline-block;
}
        @keyframes fidsSplitFlapTile {
  0% {
    transform: perspective(400px) rotateX(-90deg);
    filter: brightness(0.3);
    opacity: 0.5;
  }
  50% {
    filter: brightness(0.7);
    opacity: 0.9;
  }
  100% {
    transform: perspective(400px) rotateX(0deg);
    filter: brightness(1);
    opacity: 1;
  }
}
        .fids-gate {
            min-width: 54px;
            height: 40px;
            display: grid;
            place-items: center;
            border-radius: 7px;
            background: #d9f1f1;
            color: #022e64;
            font-family: "Roboto Mono", monospace;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: .04em
        }
        .fids-gate.is-changing, .fids-time-main.is-changing, .fids-flight strong.is-changing {
            animation: fidsFieldFlip .58s cubic-bezier(.2, .72, .3, 1)
        }
        @keyframes fidsFieldFlip {
            0% {
                transform: perspective(600px) rotateX(0);
                filter: brightness(1)
            }

            42% {
                transform: perspective(600px) rotateX(-86deg);
                filter: brightness(.55)
            }

            62% {
                transform: perspective(600px) rotateX(16deg);
                filter: brightness(1.28)
            }

            100% {
                transform: perspective(600px) rotateX(0);
                filter: brightness(1)
            }
        }
        .board-message {
            min-height: 265px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            border-radius: 15px;
            background: rgba(255, 255, 255, .015);
            border: 1px solid rgba(255, 255, 255, .04);
            color: #6f90a4;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: .14em;
            text-transform: uppercase
        }
        .board-message-title {
            font-family: "Roboto Mono", monospace;
            letter-spacing: .04em
        }
        .board-message-note {
            color: #5f7a8f;
            font-size: 8px;
            letter-spacing: .10em
        }
        .board-footer {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 18px;
            align-items: center;
            margin-top: 7px;
            padding: 9px 11px;
            border-radius: 11px;
            background: #e9eef8;
            color: #587085;
            font-size: 8px;
            font-weight: 750;
            letter-spacing: .08em;
            text-transform: uppercase
        }
        .board-footer strong {
            color: #022e64
        }
        .status-lamp {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--sk-aqua);
            box-shadow: 0 0 0 5px rgba(95, 199, 207, .12);
            display: inline-block;
            margin-right: 7px;
            vertical-align: middle
        }
        .airport-priority-strip {
            width: min(1100px, 100%);
            margin: 20px auto 0;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            border: 1px solid rgba(2, 46, 100, .07);
            border-radius: 16px;
            overflow: hidden;
            background: rgba(2, 46, 100, .07);
            box-shadow: 0 14px 32px rgba(2, 46, 100, .06)
        }
        .airport-priority-strip>div {
            min-height: 90px;
            padding: 15px 17px;
            background: rgba(255, 255, 255, .94)
        }
        .priority-symbol {
            display: inline-grid;
            place-items: center;
            min-width: 26px;
            height: 22px;
            padding: 0 6px;
            border-radius: 5px;
            background: #e9eef8;
            color: #022e64;
            font-family: "Roboto Mono", monospace;
            font-size: 7px;
            font-weight: 800
        }
        .airport-priority-strip strong {
            display: block;
            margin-top: 10px;
            color: #022e64;
            font-size: 12px;
            letter-spacing: -.02em
        }
        .airport-priority-strip small {
            display: block;
            margin-top: 4px;
            color: #748496;
            font-size: 9px;
            line-height: 1.5
        }
        /* =========================================================
   ANIMATIONS & UTILS
   ========================================================= */
        .reveal {
            opacity: 0;
            transform: translateY(22px) scale(.99)
        }
        .reveal.is-visible {
            opacity: 1;
            transform: none;
            transition: opacity .72s var(--ease), transform .72s var(--ease)
        }
        .hidden {
            display: none !important
        }
        /* =========================================================
   RESPONSIVE BREAKPOINTS (CONSOLIDATED)
   ========================================================= */
        @media(max-width:1100px) {
            .wrap {
                width: min(var(--content), calc(100% - 36px))
            }

            .hero-inner {
                grid-template-columns: 1fr;
                padding: 46px 0 92px;
            }

            .hero-status {
                width: min(560px, 100%)
            }

            .airport-controls.mode-airport,
            .airport-controls.mode-flight,
            .airport-controls.mode-route {
                grid-template-columns: 1fr 1fr
            }

            .airport-controls.mode-airport #airportBoardToggle {
                grid-column: 1/-1
            }

            .airport-controls .airport-update,
            .airport-controls .airport-reset {
                min-height: 48px
            }

            .board-top {
                grid-template-columns: 1fr
            }

            .flight-board-shell {
                width: min(100%, 900px)
            }

            .board-heading {
                width: min(100%, 900px);
                grid-template-columns: 1fr
            }

            .terminal-bay {
                padding: 56px 20px 36px
            }

            .overhead-zone {
                display: none
            }

            .airport-profile-inner {
                grid-template-columns: 1fr
            }

            .airport-profile-facts {
                max-width: 650px
            }

            .context-module {
                grid-column: span 6
            }

            .module-transfer {
                grid-column: span 12
            }

            .commerce-card,
            .destination-card {
                grid-column: span 6
            }

            .context-preview-grid,
            .practical-grid {
                grid-template-columns: 1fr 1fr
            }
        }
        @media(max-width:760px) {
            .wrap {
                width: calc(100% - 24px)
            }

            .hero {
                min-height: 500px
            }

            .hero h1 {
                font-size: clamp(48px, 15vw, 72px)
            }

            .hero-status {
                display: none
            }

            .hero-wayfinding {
                gap: 6px
            }

            .hero-wayfinding span {
                min-height: 32px;
                padding: 0 10px
            }

            .terminal-glass-lines {
                width: 74%;
                opacity: .30
            }

            .hero-copy::before {
                display: none
            }

            .terminal-location-line {
                font-size: 7px
            }

            .lookup-mode-tabs {
                width: 100%;
                overflow-x: auto;
                scrollbar-width: none;
                border-radius: 11px
            }

            .lookup-mode-tabs::-webkit-scrollbar {
                display: none
            }

            .lookup-mode {
                white-space: nowrap;
                flex: 0 0 auto
            }

            .airport-controls.mode-airport,
            .airport-controls.mode-flight,
            .airport-controls.mode-route {
                grid-template-columns: 1fr;
                width: 100%
            }

            .airport-controls.mode-airport #airportBoardToggle {
                grid-column: auto
            }

            .airport-control-note {
                grid-column: auto !important
            }

            .airport-code-control input {
                min-width: 0;
                width: 100%
            }

            .airport-suggestions {
                position: fixed;
                left: 12px;
                right: 12px;
                top: auto;
                bottom: max(12px, env(safe-area-inset-bottom));
                max-height: min(62vh, 520px);
                border-radius: 22px;
                padding: 8px
            }

            .airport-suggestion {
                min-height: 58px
            }

            .board-section {
                padding-top: 8px
            }

            .board-heading h2 {
                font-size: 40px
            }

            .terminal-bay {
                padding: 46px 7px 24px;
                border-radius: 22px
            }

            .terminal-overhead-signs {
                left: 14px;
                right: 14px;
                gap: 5px;
                transform: translateY(-13px)
            }

            .overhead-sign {
                min-height: 32px;
                padding: 0 9px;
                border-radius: 6px;
                font-size: 7px
            }

            .overhead-sign b {
                font-size: 11px
            }

            .flight-board-shell {
                padding: 7px;
                border-radius: 18px
            }

            .board-top {
                grid-template-columns: 1fr;
                padding: 14px;
                border-radius: 16px
            }

            .board-brand strong {
                font-size: 20px
            }

            .board-query {
                display: none
            }

            .board-live {
                justify-self: start;
                width: 100%
            }

            .board-airport-bar {
                grid-template-columns: 1fr 1fr;
                min-height: 48px
            }

            .board-airport-bar>div {
                padding: 10px 12px
            }

            .board-airport-bar strong {
                font-size: 15px
            }

            .airport-clock-display {
                display: none !important
            }

            .fids-layout {
                grid-template-columns: 1fr !important
            }

            .board-columns {
                display: none
            }

            .board-scroll {
                min-height: 0;
                max-height: none;
                overflow: visible;
                padding: 6px
            }

            .fids-row {
                display: grid;
                grid-template-columns: 1fr 1fr !important;
                gap: 0;
                border: 1px solid rgba(255, 255, 255, .06) !important;
                border-radius: 12px !important;
                margin-bottom: 7px !important
            }

            .fids-cell {
                min-height: 49px;
                padding: 10px 11px !important;
                border-right: 0 !important;
                border-bottom: 1px solid rgba(255, 255, 255, .045) !important;
                justify-content: space-between;
                gap: 10px
            }

            .fids-cell::before {
                content: attr(data-label);
                flex: 0 0 auto;
                color: #7194a9;
                font-family: "Roboto Mono", monospace;
                font-size: 7px;
                font-weight: 800;
                letter-spacing: .11em;
                text-transform: uppercase
            }

            .fids-cell:nth-child(3),
            .fids-cell:nth-child(4),
            .fids-cell:nth-child(5) {
                grid-column: 1/-1
            }

            .fids-cell:nth-last-child(-n+2) {
                border-bottom: 0 !important
            }

            .fids-destination {
                text-align: right
            }

            .fids-time {
                align-items: flex-end
            }

            .board-message {
                min-height: 150px
            }

            .board-footer {
                grid-template-columns: 1fr 1fr
            }

            .board-footer>span:nth-child(2) {
                display: none
            }

            .airport-priority-strip {
                grid-template-columns: 1fr;
                margin-top: 14px
            }

            .airport-priority-strip>div {
                min-height: 78px
            }

            .context-welcome {
                padding: 52px 0 70px
            }

            .context-preview-grid,
            .practical-grid {
                grid-template-columns: 1fr
            }

            .context-loading-screen {
                grid-template-columns: 1fr
            }

            .airport-profile {
                min-height: 650px
            }

            .airport-profile-inner {
                min-height: 650px;
                padding: 62px 0 42px
            }

            .airport-profile-code {
                font-size: 96px
            }

            .airport-profile-copy h2 {
                font-size: 42px
            }

            .airport-profile-facts {
                grid-template-columns: 1fr 1fr
            }

            .airport-context-grid {
                grid-template-columns: 1fr;
                padding-top: 50px
            }

            .context-module,
            .module-transfer {
                grid-column: auto;
                min-height: 260px
            }

            .commerce-grid,
            .destination-edit-grid {
                grid-template-columns: 1fr
            }

            .commerce-card,
            .destination-card {
                grid-column: auto
            }

            .destination-edit-head>div {
                display: block
            }

            .destination-edit-code {
                font-size: 92px
            }
        }
        @media(max-width:480px) {
            .board-brand strong {
                font-size: 22px
            }

            .board-footer {
                grid-template-columns: 1fr
            }

            .board-footer>span:nth-child(3) {
                display: none
            }
        }
        @media(max-width:430px) {
            .fids-row {
                grid-template-columns: 1fr !important
            }

            .fids-cell:nth-child(n) {
                grid-column: 1/-1
            }

            .airport-profile-facts {
                grid-template-columns: 1fr
            }
        }
        @media(prefers-reduced-motion:reduce) {

            *,
            *::before,
            *::after {
                animation-duration: .01ms !important;
                animation-iteration-count: 1 !important;
                scroll-behavior: auto !important
            }

            .reveal {
                opacity: 1 !important;
                transform: none !important
            }

            .terminal-apron-light,
            .hero-status::after {
                animation: none !important
            }
        }
        .hero {
            min-height: 0;
            background: #f3f5f8;
            border-bottom: 1px solid #dbe3ec
        }
        .hero::before,
        .hero-copy::before,
        .hero-status::after {
            display: none
        }
        .hero-inner {
            padding: 25px 0 21px;
            gap: 24px;
            flex-wrap: nowrap;
            align-items: center
        }
        .hero-copy {
            padding: 0;
            max-width: 850px
        }
        .hero .eyebrow {
            font-size: 9px;
            letter-spacing: .18em
        }
        .hero h1 {
            margin: 8px 0 7px;
            font-size: 36px;
            line-height: 1.05;
            letter-spacing: -.035em;
            font-weight: 700
        }
        .hero-lede {
            margin: 0;
            font-size: 11px;
            line-height: 1.55;
            max-width: 760px
        }
        .hero-status {
            width: auto;
            display: flex;
            flex-shrink: 0;
            gap: 0;
            overflow: visible
        }
        .hero-stat,
        .hero-stat:nth-child(2) {
            min-height: 0;
            padding: 0 20px;
            background: none;
            color: #022e64;
            border: 0;
            border-left: 1px solid #cdd8e4;
            border-radius: 0;
            box-shadow: none;
            backdrop-filter: none
        }
        .hero-stat:nth-child(2) label {
            color: #6d7d8d
        }
        .hero-stat strong,
        .hero-stat:nth-child(2) strong {
            margin: 7px 0;
            color: #022e64;
            font-family: "Roboto Mono", monospace;
            font-size: 17px;
            white-space: nowrap
        }
        .hero-stat .live-pill,
        .hero-stat:nth-child(2) .live-pill {
            font-size: 8px;
            color: #536b7d
        }
        .board-section {
            padding: 18px 0 32px;
            background: #f3f5f8
        }
        .board-section::before,
        .board-section::after,
        .terminal-floor-reflection {
            display: none
        }
        .board-section .reveal {
            opacity: 1;
            transform: none
        }
        .lookup-mode-tabs {
            width: 100%;
            margin: 0 0 10px;
            gap: 6px;
            justify-content: flex-start
        }
        .lookup-mode {
            border-radius: 5px;
            padding: 9px 14px;
            font-size: 10px;
            min-height: 36px
        }
        .airport-controls, .airport-controls.mode-airport {
            width: 100%;
            margin: 0 0 16px;
            grid-template-columns: minmax(220px, 1fr) 175px minmax(235px, .7fr) auto auto;
            gap: 7px;
            padding: 8px;
            border-radius: 6px;
            background: #fff;
            box-shadow: none;
            backdrop-filter: none;
            border-color: #d6dee8
        }
        .airport-controls.mode-flight {
            grid-template-columns: minmax(220px, 1fr) 175px auto auto
        }
        .airport-controls.mode-route {
            grid-template-columns: minmax(170px, 1fr) minmax(170px, 1fr) 175px auto auto
        }
        .airport-control {
            min-height: 52px;
            border-radius: 4px;
            background: #f5f7fa;
            border-color: #e0e6ee
        }
        .airport-controls .lookup-date-control {
            min-width: 0
        }
        .airport-code-control input {
            min-width: 0;
            width: 100%;
            font-size: 12px
        }
        .airport-control label {
            font-size: 9px;
            letter-spacing: .09em
        }
        .airport-board-toggle, .airport-toggle, .airport-update, .airport-reset {
            border-radius: 4px
        }
        .airport-toggle, .airport-update, .airport-reset {
            font-size: 9px;
            letter-spacing: .06em
        }
        .airport-update, .airport-reset {
            min-height: 52px;
            box-shadow: none
        }
        .airport-update {
            background: #022e64
        }
        .airport-control-note {
            font-size: 9px;
            padding: 1px 3px
        }
        .flight-board-shell {
            position: relative;
            width: 100%;
            padding: 0;
            border: 1px solid #1c3349;
            border-top: 4px solid #f4ca58;
            border-radius: 7px;
            overflow: hidden;
            background: #0a1520;
            box-shadow: 0 14px 32px rgba(2, 25, 49, .12)
        }
        .flight-board-shell::after {
            display: none
        }
        .board-top {
            margin: 0;
            padding: 20px 23px;
            grid-template-columns: minmax(220px, 1fr) minmax(220px, .85fr) auto;
            gap: 20px;
            border-radius: 0;
            background: #022e64;
            box-shadow: none
        }
        .board-brand {
            gap: 14px
        }
        .board-monogram {
            width: 46px;
            height: 46px;
            border: 0;
            border-radius: 3px;
            background: #f4ca58;
            color: #09213d;
            font-size: 34px;
            font-weight: 700;
            box-shadow: none
        }
        .board-brand strong {
            font-size: 28px;
            letter-spacing: .035em;
            font-weight: 700;
            line-height: 1.05
        }
        .board-brand span {
            font-size: 8px;
            letter-spacing: .12em;
            color: #bad0e2
        }
        .board-query {
            padding: 0 0 0 20px;
            border: 0;
            border-left: 1px solid #426589;
            border-radius: 0;
            background: none;
            backdrop-filter: none
        }
        .board-query label {
            font-size: 8px;
            color: #bed0e1
        }
        .board-query strong {
            font-size: 12px;
            line-height: 1.4
        }
        .board-live {
            padding: 10px;
            border-radius: 3px;
            background: #052749;
            border: 1px solid #34516d
        }
        .board-screen {
            border: 0;
            border-radius: 0;
            background: #0c1621;
            box-shadow: none
        }
        .board-screen::before,
        .board-screen::after {
            display: none
        }
        .board-airport-bar {
            grid-template-columns: 1fr 1fr auto;
            min-height: 43px;
            background: #152435;
            border-bottom: 1px solid #2b3b4b
        }
        .board-airport-bar>div {
            padding: 9px 18px;
            gap: 12px
        }
        .board-airport-bar small {
            font-size: 9px;
            letter-spacing: .12em;
            color: #a4bacb
        }
        .board-airport-bar strong {
            font-size: 16px
        }
        .board-columns {
            min-height: 42px;
            background: #1a2a3a;
            border: 0;
            border-bottom: 1px solid #445364
        }
        .board-columns>div {
            padding: 10px 14px;
            font-size: 9px;
            letter-spacing: .09em;
            color: #f4ca58;
            border: 0
        }
        .board-scroll {
            padding: 0;
            min-height: 290px;
            max-height: 600px;
            overflow-x: hidden;
            overflow-y: auto;
            background: #0c1621;
            scrollbar-color: #506579 #152435
        }
        .fids-row {
            min-height: 76px;
            margin: 0;
            border: 0;
            border-bottom: 1px solid #293747;
            border-radius: 0;
            background: #0c1621;
            box-shadow: none;
            animation: none
        }
        .fids-row:nth-child(even) {
            background: #111f2d
        }
        .fids-row:hover {
            transform: none;
            background: #1c3043;
            border-color: #395169
        }
        .fids-row::before {
            display: none
        }
        .fids-cell {
            min-height: 76px;
            padding: 10px 14px;
            border-right: 0;
            overflow: hidden
        }
        .fids-carrier {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            min-width: 0;
            width: 100%
        }
        .fids-tail {
            width: 108px;
            height: 44px;
            border-radius: 3px;
            background: #fff;
            box-shadow: none;
            padding: 5px;
            position: relative
        }
        .fids-tail.logo-dark:not(.fallback) {
            background: #022e64;
            border: 1px solid #416186
        }
        .fids-tail img {
            display: block;
            max-width: 98px;
            max-height: 34px;
            width: 100%;
            height: 100%;
            object-fit: contain
        }
        .fids-tail.fallback {
            font-size: 20px;
            background: #dce8ef;
            color: #022e64
        }
        .fids-carrier-name {
            display: block;
            max-width: 110px;
            font-size: 8px;
            color: #b3c6d5;
            line-height: 1.2
        }
        .fids-flight strong {
            font-size: 18px;
            color: #f4ca58;
            letter-spacing: .015em
        }
        .fids-time-main {
            font-size: 25px;
            color: #fff;
            letter-spacing: 0
        }
        .fids-time small {
            font-size: 9px;
            color: #bac8d3;
            letter-spacing: 0
        }
        .fids-destination strong {
            overflow: visible;
            white-space: normal;
            font-size: 18px;
            font-weight: 650;
            line-height: 1.35;
            letter-spacing: .012em;
            overflow-wrap: anywhere;
            color: #f5f8fa
        }
        .fids-destination strong span {
            color: #a7c3d6;
            font-size: 13px;
            white-space: nowrap
        }
        .fids-terminal {
            font-family: "Roboto Mono", monospace;
            font-size: 18px;
            color: #fff;
            font-weight: 700;
            overflow-wrap: anywhere
        }
        .fids-gate {
            min-width: 48px;
            width: auto;
            max-width: 100%;
            height: auto;
            min-height: 36px;
            padding: 5px;
            border-radius: 2px;
            background: #f4ca58;
            color: #102336;
            font-size: 18px;
            overflow-wrap: anywhere
        }
        .fids-status {
            font-size: 11px;
            font-weight: 700;
            line-height: 1.5;
            letter-spacing: .015em;
            overflow-wrap: anywhere
        }
        .fids-status::before {
            width: 5px;
            height: 5px;
            min-width: 5px;
            margin-right: 7px;
            box-shadow: none
        }
        .fids-status.flap-warn {
            color: #f4ca58
        }
        .fids-status.flap-bad {
            color: #ff9b9b
        }
        .fids-status.is-changing, .fids-terminal.is-changing {
            animation: fidsFieldFlip .58s ease
        }
        .board-message {
            min-height: 275px;
            margin: 0;
            border: 0;
            border-radius: 0;
            padding: 30px;
            text-align: center;
            background: transparent;
            gap: 12px
        }
        .board-message-title {
            font-size: 17px;
            color: #f4ca58;
            line-height: 1.4
        }
        .board-message-note {
            font-size: 11px;
            color: #a7bacb;
            line-height: 1.7;
            letter-spacing: .03em;
            max-width: 540px
        }
        .board-footer {
            margin: 0;
            padding: 12px 18px;
            border-radius: 0;
            background: #172a3b;
            color: #b5c6d4;
            font-size: 9px;
            letter-spacing: .025em;
            gap: 15px;
            border-top: 1px solid #354758
        }
        .board-footer strong {
            color: #f3f7fa
        }
        .airport-priority-strip {
            width: min(var(--content), calc(100% - 56px));
            margin: 18px auto 0;
            gap: 10px
        }
        .airport-priority-strip>div {
            padding: 12px;
            border-radius: 4px;
            box-shadow: none
        }
        .airport-priority-strip strong {
            font-size: 10px
        }
        .airport-priority-strip small {
            font-size: 9px;
            line-height: 1.5
        }
        @media(max-width:1100px) {
            .hero-inner {
                padding: 20px 0
            }

            .hero h1 {
                font-size: 31px
            }

            .hero-stat:nth-child(2) {
                display: none
            }

            .fids-layout {
                grid-template-columns: 122px 92px 128px minmax(170px, 1fr) 72px 72px 136px
            }

            .fids-cell,
            .board-columns>div {
                padding-left: 10px;
                padding-right: 10px
            }

            .fids-tail {
                width: 100px;
                height: 42px
            }

            .fids-tail img {
                max-width: 90px;
                max-height: 32px
            }

            .fids-destination strong {
                font-size: 16px
            }

            .fids-flight strong {
                font-size: 16px
            }

            .fids-time-main {
                font-size: 23px
            }

            .airport-controls.mode-airport {
                grid-template-columns: minmax(230px, 1fr) 170px auto auto
            }

            .airport-controls.mode-airport #airportBoardToggle {
                grid-column: 1/3;
                grid-row: 2
            }

            .airport-controls.mode-airport .airport-update {
                grid-column: 3;
                grid-row: 2
            }

            .airport-controls.mode-airport .airport-reset {
                grid-column: 4;
                grid-row: 2
            }

            .airport-controls.mode-airport .lookup-date-control {
                grid-column: 3/5
            }

            .airport-controls.mode-airport .airport-code-control {
                grid-column: 1/3
            }

            .airport-control-note {
                grid-column: 1/-1
            }

            .board-top {
                grid-template-columns: 1fr auto
            }

            .board-query {
                display: none
            }
        }
        @media(max-width:900px) {
            .wrap {
                width: calc(100% - 24px)
            }

            .hero-inner {
                gap: 12px
            }

            .hero h1 {
                font-size: 28px
            }

            .hero-stat {
                padding: 0 0 0 12px
            }

            .hero-stat strong {
                font-size: 14px
            }

            .hero-status {
                display: flex
            }

            .hero-lede {
                font-size: 10px
            }

            .hero .eyebrow {
                font-size: 8px
            }

            .board-section {
                padding-top: 12px
            }

            .lookup-mode-tabs {
                width: 100%;
                display: flex;
                gap: 5px
            }

            .lookup-mode {
                padding: 8px 10px;
                font-size: 9px
            }

            .airport-controls.mode-airport {
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 74px 58px
            }

            .airport-controls.mode-flight {
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 74px 58px
            }

            .airport-controls.mode-flight .lookup-field {
                grid-column: 1/3
            }

            .airport-controls.mode-flight .lookup-date-control {
                grid-column: 3/5
            }

            .airport-controls.mode-flight .airport-update {
                grid-column: 1/4
            }

            .airport-controls.mode-flight .airport-reset {
                grid-column: 4
            }

            .airport-controls.mode-route {
                grid-template-columns: 1fr 1fr
            }

            .airport-controls.mode-route .lookup-date-control {
                grid-column: 1/-1
            }

            .airport-controls.mode-route .airport-update,
            .airport-controls.mode-route .airport-reset {
                grid-column: auto
            }

            .airport-notice,
            .airport-control-note {
                grid-column: 1/-1 !important
            }

            .airport-control,
            .airport-update,
            .airport-reset {
                min-height: 46px
            }

            .airport-toggle {
                min-height: 40px;
                padding: 0 8px;
                font-size: 9px
            }

            .airport-control {
                padding: 7px
            }

            .control-sign {
                display: none
            }

            .airport-control {
                grid-template-columns: minmax(0, 1fr)
            }

            .airport-control input[type="date"] {
                font-size: 10px
            }

            .airport-controls .airport-update,
            .airport-controls .airport-reset {
                padding: 0 8px;
                font-size: 8px
            }

            .board-top {
                padding: 15px;
                gap: 10px;
                grid-template-columns: 1fr auto
            }

            .board-brand strong {
                font-size: 23px
            }

            .board-monogram {
                width: 38px;
                height: 38px;
                font-size: 29px
            }

            .board-brand span {
                font-size: 7px
            }

            .board-live {
                width: auto;
                justify-self: end;
                padding: 8px;
                gap: 5px
            }

            .board-live span {
                font-size: 7px
            }

            .board-live strong {
                font-size: 8px
            }

            .board-airport-bar {
                grid-template-columns: 1fr 1fr
            }

            .airport-clock-display {
                display: none !important
            }

            .board-airport-bar>div {
                padding: 10px 13px
            }

            .board-airport-bar small {
                font-size: 8px
            }

            .board-airport-bar strong {
                font-size: 13px
            }

            .board-columns {
                display: none
            }

            .board-scroll {
                max-height: none;
                min-height: 220px;
                overflow: visible;
                padding: 0
            }

            .fids-row {
                display: grid;
                grid-template-columns: 112px minmax(70px, 1fr) minmax(115px, 1.35fr) !important;
                grid-template-areas: "airline flight time" "place place place" "terminal gate remarks";
                gap: 0;
                margin: 0 !important;
                border: 0 !important;
                border-bottom: 2px solid #405363 !important;
                border-radius: 0 !important
            }

            .fids-row .fids-cell {
                grid-column: auto;
                min-height: 60px;
                padding: 10px 12px !important;
                border: 0 !important;
                justify-content: flex-start;
                align-items: flex-start;
                flex-direction: column;
                gap: 5px
            }

            .fids-cell::before {
                display: block;
                font-size: 8px;
                color: #9cb6c9;
                letter-spacing: .065em;
                content: attr(data-label)
            }

            .fids-row .cell-airline {
                grid-area: airline
            }

            .fids-row .cell-flight {
                grid-area: flight
            }

            .fids-row .cell-time {
                grid-area: time;
                align-items: flex-end
            }

            .fids-row .cell-place {
                grid-area: place;
                border-top: 1px solid #293747 !important;
                border-bottom: 1px solid #293747 !important;
                min-height: 58px
            }

            .fids-row .cell-terminal {
                grid-area: terminal
            }

            .fids-row .cell-gate {
                grid-area: gate
            }

            .fids-row .cell-remarks {
                grid-area: remarks
            }

            .fids-tail {
                width: 90px;
                height: 40px
            }

            .fids-tail img {
                max-width: 80px;
                max-height: 30px
            }

            .fids-carrier-name {
                max-width: 90px
            }

            .fids-destination {
                text-align: left
            }

            .fids-destination strong {
                font-size: 18px
            }

            .fids-time {
                align-items: flex-end
            }

            .fids-terminal,
            .fids-gate {
                font-size: 17px
            }

            .fids-status {
                font-size: 10px;
                min-height: 30px
            }

            .fids-gate {
                min-height: 30px
            }

            .board-footer {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 8px;
                font-size: 8px
            }

            .board-footer>span:nth-child(1) {
                grid-column: 1/-1
            }

            .board-footer>span:nth-child(2),
            .board-footer>span:nth-child(3) {
                display: block
            }

            .airport-priority-strip {
                width: calc(100% - 24px);
                grid-template-columns: 1fr;
                margin-top: 14px
            }
        }
        @media(max-width:480px) {
            .hero-inner {
                align-items: flex-start;
                padding: 18px 0
            }
            .hero h1 {
                font-size: 25px
            }
            .hero-copy {
                min-width: 0
            }
            .hero-lede {
                max-width: 220px
            }
            .hero-stat label {
                font-size: 7px
            }
            .hero-stat strong {
                font-size: 11px
            }
            .hero-stat .live-pill {
                font-size: 7px
            }
            .lookup-mode {
                padding: 7px 8px;
                font-size: 8px;
                flex: 1
            }
            .lookup-mode span {
                display: none
            }
            .board-brand strong {
                font-size: 20px
            }
            .board-brand span {
                font-size: 6px
            }
            .board-monogram {
                width: 32px;
                height: 34px;
                font-size: 26px
            }
            .board-brand {
                gap: 9px
            }
            .board-live>span:not(.live-dot) {
                display: none
            }
            .board-top {
                padding: 13px 10px
            }
            .fids-row {
                grid-template-columns: 102px minmax(60px, 1fr) minmax(105px, 1.3fr) !important
            }
            .fids-row .fids-cell {
                padding: 9px 9px !important
            }
            .fids-cell::before {
                font-size: 7px
            }
            .fids-tail {
                width: 82px;
                height: 38px
            }
            .fids-tail img {
                max-width: 72px;
                max-height: 28px
            }
            .fids-carrier-name {
                max-width: 82px
            }
            .fids-flight strong {
                font-size: 15px
            }
            .fids-time-main {
                font-size: 21px
            }
            .fids-destination strong {
                font-size: 16px
            }
            .fids-status {
                font-size: 9px
            }
        }
    </style>
<style id="skandiNoSystemStatePills">.live-pill,.board-live,[data-system-state-pill]{display:none!important}.board-footer{border-radius:10px}.board-footer strong:empty{display:none}</style></head>
<body>
<div class="page">
<section aria-label="Flight information" class="hero" id="hero">
<div class="wrap hero-inner">
<div class="hero-copy">
<div class="eyebrow">SKANDI TRAVELS · TRAVEL INFO</div>
<h1>Flight information</h1>
<p class="hero-lede" id="boardMeta">Departures, arrivals and flight tracking.</p>
</div>
<div class="hero-status">
<div class="hero-stat">
<label>Airport time</label><strong id="utcClock">--:--:-- UTC</strong>

</div>
<div class="hero-stat">
<label>Current board</label><strong id="boardSubMode">Departures</strong>

</div>
</div>
</div>
</section>
<section class="board-section">
<div class="wrap">
<div aria-label="Flight status search type" class="lookup-mode-tabs reveal" role="tablist">
<button aria-selected="true" class="lookup-mode active" data-lookup-mode="airport" role="tab" type="button"><span>APT</span> Airport board</button>
<button aria-selected="false" class="lookup-mode" data-lookup-mode="flight" role="tab" type="button"><span>FLT</span> Flight number</button>
<button aria-selected="false" class="lookup-mode" data-lookup-mode="route" role="tab" type="button"><span>RTE</span> Route</button>
</div>
<div aria-label="Flight status controls" class="airport-controls reveal">
<div class="airport-control airport-code-control lookup-field" data-mode-field="airport" id="fieldAirport">
<span class="control-sign">APT</span>
<div>
<label for="airport">Airport</label>
<input aria-autocomplete="list" aria-controls="airportSuggestions" aria-expanded="false" autocomplete="off" id="airport" inputmode="search" placeholder="Search airport, city or IATA" role="combobox"/>
<div aria-label="Airport suggestions" class="airport-suggestions" id="airportSuggestions" role="listbox"></div>
</div>
</div>
<div class="airport-control lookup-field hidden" data-mode-field="flight" id="fieldFlight">
<span class="control-sign">FLT</span>
<div>
<label for="flightNumber">Flight number</label>
<input autocomplete="off" id="flightNumber" inputmode="text" maxlength="16" placeholder="SK904"/>
</div>
</div>
<div class="airport-control airport-code-control lookup-field hidden" data-mode-field="route" id="fieldFrom">
<span class="control-sign">FROM</span>
<div>
<label for="from">From</label>
<input aria-autocomplete="list" aria-controls="fromSuggestions" aria-expanded="false" autocomplete="off" id="from" inputmode="search" placeholder="Airport, city or IATA" role="combobox"/>
<div aria-label="Origin airport suggestions" class="airport-suggestions" id="fromSuggestions" role="listbox"></div>
</div>
</div>
<div class="airport-control airport-code-control lookup-field hidden" data-mode-field="route" id="fieldTo">
<span class="control-sign">TO</span>
<div>
<label for="to">To</label>
<input aria-autocomplete="list" aria-controls="toSuggestions" aria-expanded="false" autocomplete="off" id="to" inputmode="search" placeholder="Airport, city or IATA" role="combobox"/>
<div aria-label="Destination airport suggestions" class="airport-suggestions" id="toSuggestions" role="listbox"></div>
</div>
</div>
<div class="airport-control lookup-date-control">
<span class="control-sign">DATE</span>
<div>
<label for="date">Travel date</label>
<input id="date" type="date"/>
</div>
</div>
<div aria-label="Board type" class="airport-board-toggle" id="airportBoardToggle" role="group">
<button class="airport-toggle active" data-board-view="departures" type="button"><span>↑</span> Departures</button>
<button class="airport-toggle" data-board-view="arrivals" type="button"><span>↓</span> Arrivals</button>
</div>
<select aria-label="Board type" class="sr-only" id="boardType">
<option selected="" value="departures">Departures</option>
<option value="arrivals">Arrivals</option>
</select>
<button class="airport-update" id="searchBtn" type="button"><span class="airport-update-led"></span> Show board</button>
<button aria-label="Reset search" class="airport-reset airport-clear-btn" id="clearBtn" type="button">Clear</button>
<div aria-live="polite" class="notice airport-notice" id="notice" role="status"></div>
<span class="airport-control-note" id="dateHint">Available dates are loading…</span>
<span class="sr-only" id="boardMode">Airport Board</span>
<span class="sr-only" id="dateWindow">Loading dates…</span>
</div>
<div class="flight-board-shell" id="hardwareCasing">
<div class="board-top">
<div class="board-brand">
<div aria-hidden="true" class="board-monogram" id="boardDirectionIcon">↗</div>
<div>
<strong id="railTitle">DEPARTURES</strong>
<span>Passenger Flight Information Display</span>
</div>
</div>
<div class="board-query">
<label id="queryLabel">Airport board</label>
<strong id="querySummary">Select an airport to load the board</strong>
</div>

</div>
<div aria-label="Airport flight information display" class="board-screen" role="table">
<div class="board-airport-bar">
<div class="airport-code-display"><small id="screenPrimaryLabel">AIRPORT</small><strong id="screenAirport">---</strong></div>
<div class="airport-date-display"><small>DATE</small><strong id="screenDate">---</strong></div>
<div class="airport-clock-display"><small id="boardClockLabel">UTC</small><strong id="boardClockEcho">--:--:--</strong></div>
</div>
<div class="board-columns fids-layout" role="row">
<div role="columnheader">Airline</div>
<div role="columnheader">Flight No.</div>
<div id="timeHeader" role="columnheader">Departure time</div>
<div id="placeHeader" role="columnheader">To</div>
<div role="columnheader">Terminal</div>
<div role="columnheader">Gate</div>
<div role="columnheader">Remarks</div>
</div>
<div class="board-scroll">
<div class="flip-body" id="rows" role="rowgroup">
<div class="board-message">Preparing airport board…</div>
</div>
</div>
</div>
<div class="board-footer"><span>Passenger flight information</span><span><strong id="updatedAt"></strong></span><span><span id="resultScopeLabel">Airport view</span> · <strong id="resultCount"></strong></span></div>
</div>
<div aria-hidden="true" class="terminal-floor-reflection"></div>
</div>

</section>

</div>
<script>
        (function() {
            const SOURCE = "SKANDI_FLIGHT_STATUS";
            const PARENT_SOURCE = "SKANDI_WIX_PARENT";
            let currentMode = "airport";
            let clockTimer = 0;
            let searchTimer = 0;
            let searchSerial = 0,
                pendingSearch = "",
                lastQuery = "",
                refreshTimer = 0;
            let contextTimer = 0;
            const SEARCH_TIMEOUT_MS = 25000;
            const CONTEXT_TIMEOUT_MS = 15000;
            let airportTimezone = "UTC";
            let activeAirportContext = null;
            let contextRequestSerial = 0;
            let pendingContext = null;
            let airportDirectory = [];
            let selectedAirportIata = "";
            let selectedFromIata = "";
            let selectedToIata = "";
            const suggestionIndex = {
                airport: -1,
                from: -1,
                to: -1
            };
            let activeSuggestionIndex = -1;
            let lastFlightItems = [];
            let lastFlightMeta = {};
            let codeshareTick = false;
            window.setInterval(() => {
                codeshareTick = !codeshareTick;
                if (lastFlightItems && lastFlightItems.length) {
                    refreshVisibleFidsRows();
                }
            }, 3500);

            const airportContextCache = new Map();
            const fidsValueCache = new Map();

            const el = (id) => document.getElementById(id);
            const escapeHtml = (value) => String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
            const fields = {
                airport: document.querySelector("#airport"),
                from: document.querySelector("#from"),
                to: document.querySelector("#to"),
                flightNumber: document.querySelector("#flightNumber")
            };

            function safeUrl(value) {
                try {
                    const url = new URL(String(value || "").trim());
                    return url.protocol === "https:" ? url.href : "";
                } catch (_) {
                    return ""
                }
            }

            function calculateCustomStatus(item, rulesMeta, isArrivals) {
  const statusStr = String(item.status || "").toLowerCase();
  
  // Hard rule overrides take priority
  if (statusStr === "cancelled") return { text: "CANCELLED", cls: "flap-bad" };
  if (statusStr === "diverted") return { text: "DIVERTED", cls: "flap-bad" };
  if (statusStr === "landed") return { text: "ARRIVED", cls: "flap-ok" };
  
  const side = isArrivals ? item.arrival : item.departure;
  if (!side) return { text: "ON TIME", cls: "flap-ok" };

  // If a delay integer exists and is greater than zero
  if (side.delay && Number(side.delay) > 0) {
    return { text: "DELAYED " + side.delay + "M", cls: "flap-warn" };
  }

  // If the telemetry stream reports active airborne tracking status
  if (statusStr === "en-route" || statusStr === "active") {
    return { text: isArrivals ? "EN ROUTE" : "DEPARTED", cls: "flap-ok" };
  }

  // Calculate live clock windows for scheduled upcoming operations
  if (!side.scheduled) return { text: "ON TIME", cls: "flap-ok" };
  
  const scheduledTime = new Date(side.scheduled);
  const currentTime = new Date(); // Browser system time tracking clock

  if (Number.isNaN(scheduledTime.getTime())) return { text: "ON TIME", cls: "flap-ok" };

  // Calculate absolute left window time duration metric in minutes
  const deltaMinutes = (scheduledTime - currentTime) / (1000 * 60);

  const activeCarrier = (item.cs_airline_iata && codeshareTick) ? item.cs_airline_iata : item.airlineIata;
  const rules = rulesMeta || {};
  const rule = rules[activeCarrier] || rules["DEFAULT"] || { boarding_window: 40, final_call_window: 15 };

  // If the flight is past takeoff but has no airborne signal yet, keep it as dynamic wayfinding status
  if (deltaMinutes <= 0) {
    return { text: isArrivals ? "EXPECTING" : "GATE CLOSED", cls: "flap-ok" };
  }
  if (deltaMinutes <= rule.final_call_window) {
    return { text: "FINAL CALL", cls: "flap-warn" };
  }
  if (deltaMinutes <= rule.boarding_window) {
    return { text: "BOARDING", cls: "flap-warn" };
  }

  return { text: "ON TIME", cls: "flap-ok" };
}


            function parseMaybeJson(value) {
                if (value == null || value === "") return null;
                if (typeof value === "object") return value;
                try {
                    return JSON.parse(String(value))
                } catch (_) {
                    return value
                }
            }

            function normalizeList(value) {
                if (value == null || value === "") return [];
                const parsed = parseMaybeJson(value);
                const list = Array.isArray(parsed) ? parsed : [parsed];
                return list.flatMap(entry => {
                    const next = parseMaybeJson(entry);
                    return Array.isArray(next) ? next : [next];
                }).filter(Boolean);
            }

            function objectFrom(value) {
                const parsed = parseMaybeJson(value);
                return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
            }

            function textValue(value, fallback = "") {
                if (value == null) return fallback;
                if (typeof value === "string" || typeof value === "number") return String(value);
                return fallback;
            }

            function validHex(value) {
                const v = String(value || "").trim();
                return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "";
            }

            function contextPathAction(kind, item) {
                const source = item && typeof item === "object" ? item : {};
                post("FLIGHT_STATUS_AIRPORT_ACTION", {
                    kind,
                    airportIata: activeAirportContext?.airport?.iata || resolveAirportIata(),
                    item: {
                        publicId: textValue(source.publicId),
                        entityType: textValue(source.entityType),
                        slug: textValue(source.slug),
                        destinationSlug: textValue(source.destinationSlug)
                    }
                });
            }

            function post(type, payload) {
                window.parent.postMessage({
                    source: SOURCE,
                    type,
                    payload: payload || {},
                    timestamp: new Date().toISOString()
                }, "*");
            }

            function isoDate(d) {
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                return local.toISOString().slice(0, 10);
            }

            function setDateLimits() {
                const todayLive = isoDate(new Date());

                // AirLabs /schedules owns the current live schedule window and does not
                // accept a date query parameter. Keep one current display date only.
                el("date").min = todayLive;
                el("date").max = todayLive;
                el("date").value = todayLive;
                el("date").disabled = true;

                el("dateHint").textContent = `Current schedule · ${todayLive} · Refreshes every 60 seconds`;
                if (el("dateWindow")) el("dateWindow").textContent = todayLive;
            }

            function setMode(mode = "airport") {
                currentMode = ["airport", "flight", "route"].includes(mode) ? mode : "airport";
                document.querySelectorAll("[data-lookup-mode]").forEach(button => {
                    const active = button.dataset.lookupMode === currentMode;
                    button.classList.toggle("active", active);
                    button.setAttribute("aria-selected", String(active));
                });
                document.querySelectorAll("[data-mode-field]").forEach(node => node.classList.toggle("hidden", node.dataset.modeField !== currentMode));
                const controls = el("searchBtn")?.closest(".airport-controls");
                if (controls) {
                    controls.classList.remove("mode-airport", "mode-flight", "mode-route");
                    controls.classList.add(`mode-${currentMode}`);
                }
                if (currentMode !== "airport") {
                    el("boardType").value = "departures";
                    closeAllAirportSuggestions();
                }
                const labels = {
                    airport: "Airport Board",
                    flight: "Flight Number",
                    route: "Route"
                };
                if (el("boardMode")) el("boardMode").textContent = labels[currentMode];
                if (el("queryLabel")) el("queryLabel").textContent = currentMode === "airport" ? "Airport board" : currentMode === "flight" ? "Flight lookup" : "Route lookup";
                if (el("screenPrimaryLabel")) el("screenPrimaryLabel").textContent = currentMode === "airport" ? "AIRPORT" : currentMode === "flight" ? "FLIGHT" : "ROUTE";
                if (el("resultScopeLabel")) el("resultScopeLabel").textContent = currentMode === "airport" ? "Airport view" : currentMode === "flight" ? "Flight view" : "Route view";
                const meta = currentMode === "airport" ?
                    "Select an airport to load departures or arrivals and unlock its airport guide." :
                    currentMode === "flight" ?
                    "Enter an airline flight number to check the latest returned status for the selected date." :
                    "Enter at least an origin or destination airport to review flights on that route.";
                el("boardMeta").textContent = meta;
                if (el("querySummary")) el("querySummary").textContent = currentMode === "airport" ? "Select an airport to load the board" : currentMode === "flight" ? "Enter a flight number" : "Enter a route";
                updateBoardType();
                setNotice("");
            }

            function cleanIata(value) {
                return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
            }

            function airportSearchText(value) {
                return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            }

            function selectedIataFor(fieldId) {
                if (fieldId === "airport") return selectedAirportIata;
                if (fieldId === "from") return selectedFromIata;
                if (fieldId === "to") return selectedToIata;
                return "";
            }

            function setSelectedIata(fieldId, value) {
                const code = cleanIata(value);
                if (fieldId === "airport") selectedAirportIata = code;
                if (fieldId === "from") selectedFromIata = code;
                if (fieldId === "to") selectedToIata = code;
                const input = el(fieldId);
                if (input) input.dataset.selectedIata = code;
            }

            function resolveAirportField(fieldId) {
                const selected = selectedIataFor(fieldId);
                if (selected) return selected;
                const input = el(fieldId);
                const raw = String(input?.value || "").trim();
                if (!raw) return "";
                const exact = cleanIata(raw);
                if (/^[A-Z0-9]{3,4}$/.test(exact) && raw.replace(/[^A-Za-z0-9]/g, "").length <= 4) return exact;
                const needle = airportSearchText(raw);
                const match = airportDirectory.find(item => {
                    const values = [item.iata, item.icao, item.title, item.city, item.country].map(airportSearchText);
                    return values.some(value => value === needle);
                });
                return cleanIata(match?.iata);
            }

            function airportLabel(item) {
                return [item?.city, item?.country].filter(Boolean).join(" · ");
            }

            function suggestionHost(fieldId) {
                return el(`${fieldId}Suggestions`)
            }

            function closeAirportSuggestions(fieldId = "airport") {
                const host = suggestionHost(fieldId);
                if (host) {
                    host.classList.remove("open");
                    host.innerHTML = "";
                }
                const input = el(fieldId);
                if (input) input.setAttribute("aria-expanded", "false");
                suggestionIndex[fieldId] = -1;
                if (fieldId === "airport") activeSuggestionIndex = -1;
            }

            function closeAllAirportSuggestions() {
                ["airport", "from", "to"].forEach(closeAirportSuggestions)
            }

            function selectAirport(item, {
                searchNow = false,
                fieldId = "airport"
            } = {}) {
                if (!item?.iata) return;
                const code = cleanIata(item.iata);
                setSelectedIata(fieldId, code);
                const input = el(fieldId);
                if (input) input.value = code;
                closeAirportSuggestions(fieldId);
                if (searchNow) search();
            }

            function airportMatches(query) {
                const needle = airportSearchText(query);
                if (!needle) return airportDirectory.slice(0, 8);
                return airportDirectory.filter(item => {
                    const hay = [item.iata, item.icao, item.title, item.city, item.country].map(airportSearchText).join(" ");
                    return hay.includes(needle);
                }).slice(0, 8);
            }

            function renderAirportSuggestions(query, fieldId = "airport") {
                const host = suggestionHost(fieldId);
                const input = el(fieldId);
                if (!host || !input || !airportDirectory.length) {
                    closeAirportSuggestions(fieldId);
                    return;
                }
                const matches = airportMatches(query);
                if (!matches.length) {
                    closeAirportSuggestions(fieldId);
                    return;
                }
                let index = suggestionIndex[fieldId];
                index = Math.min(Math.max(index, 0), matches.length - 1);
                suggestionIndex[fieldId] = index;
                if (fieldId === "airport") activeSuggestionIndex = index;
                host.innerHTML = matches.map((item, i) => `<button type="button" class="airport-suggestion ${i===index?"active":""}" role="option" aria-selected="${i===index}" data-airport-index="${i}"><span class="airport-suggestion-code">${escapeHtml(item.iata)}</span><span class="airport-suggestion-copy"><strong>${escapeHtml(item.title||item.iata)}</strong><small>${escapeHtml(airportLabel(item))}</small></span></button>`).join("");
                host.classList.add("open");
                input.setAttribute("aria-expanded", "true");
                host.querySelectorAll("[data-airport-index]").forEach(button => button.addEventListener("click", () => {
                    const item = matches[Number(button.dataset.airportIndex)];
                    selectAirport(item, {
                        searchNow: false,
                        fieldId
                    });
                }));
            }

            function values() {
                const base = {
                    mode: currentMode,
                    date: el("date").value,
                    clientToday: isoDate(new Date()),
                    boardType: el("boardType").value
                };
                if (currentMode === "airport") return {
                    ...base,
                    airport: resolveAirportField("airport")
                };
                if (currentMode === "flight") return {
                    ...base,
                    flightNumber: String(el("flightNumber")?.value || "").trim().toUpperCase().replace(/\s+/g, "")
                };
                return {
                    ...base,
                    from: resolveAirportField("from"),
                    to: resolveAirportField("to")
                };
            }

            function validate(v) {
                if (!v.date) return "Please select a travel date.";
                const selected = new Date(v.date + "T12:00:00");
                const min = new Date(el("date").min + "T00:00:00");
                const max = new Date(el("date").max + "T23:59:59");
                if (selected < min || selected > max) return "That date is outside the available search window.";
                if (v.mode === "airport" && !v.airport) return "Select an airport from the list or enter a valid IATA code.";
                if (v.mode === "flight" && !v.flightNumber) return "Enter a flight number, for example SK904.";
                if (v.mode === "route" && !v.from && !v.to) return "Enter at least a From or To airport.";
                return "";
            }

            function setNotice(message, isError) {
                const notice = el("notice");
                if (!message) {
                    notice.style.display = "none";
                    notice.textContent = "";
                    return;
                }
                notice.className = isError ? "notice error" : "notice ok";
                notice.textContent = message;
                notice.style.display = "block";
            }

            function setStatusLabels(syncText, resultText) {
                if (syncText != null) {
                    if (el("updatedAt")) el("updatedAt").textContent = syncText;
                    if (el("updatedAtHero")) el("updatedAtHero").textContent = syncText;
                }
                if (resultText != null) {
                    if (el("resultCount")) el("resultCount").textContent = resultText;
                    if (el("resultCountHero")) el("resultCountHero").textContent = resultText;
                }
            }

            function setBoardBusy(isBusy) {
                const button = el("searchBtn");
                if (!button) return;
                button.disabled = Boolean(isBusy);
                button.classList.toggle("is-busy", Boolean(isBusy));
                button.innerHTML = isBusy ?
                    '<span class="airport-update-led"></span> Updating…' :
                    '<span class="airport-update-led"></span> Show board';
            }

            function clearSearchTimeout() {
                if (searchTimer) {
                    window.clearTimeout(searchTimer);
                    searchTimer = 0;
                }
            }

            function clearContextTimeout() {
                if (contextTimer) {
                    window.clearTimeout(contextTimer);
                    contextTimer = 0;
                }
            }

            function clearRequestTimeouts() {
                pendingSearch = "";
                lastQuery = "";
                searchSerial++;
                clearSearchTimeout();
                clearContextTimeout();
            }

            function hasReadySearch() {
                const v = values();
                if (currentMode === "airport") return Boolean(v.airport);
                if (currentMode === "flight") return Boolean(v.flightNumber);
                return Boolean(v.from || v.to);
            }

            function armSearchTimeout() {
                clearSearchTimeout();
                searchTimer = window.setTimeout(() => {
                    searchTimer = 0;
                    pendingSearch = "";
                    setBoardBusy(false);
                    el("hardwareCasing")?.classList.remove("is-searching");
                    el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");
                    setBoardMessage("UPDATE TIMED OUT", "The flight feed did not answer in time. Please try again.", "flap-warn");
                    setStatusLabels("Update Timed Out", "Retry");
                    if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                    setNotice("The flight feed took too long to respond. Please try again.", true);
                }, SEARCH_TIMEOUT_MS);
            }

            function armContextTimeout(code, serial, key) {
                clearContextTimeout();
                contextTimer = window.setTimeout(() => {
                    contextTimer = 0;
                    if (!pendingContext || pendingContext.serial !== serial || pendingContext.key !== key) return;
                    pendingContext = null;
                    if (!activeAirportContext) setContextState("welcome");
                    document.body.classList.remove("has-airport-selection");
                    setNotice(`Airport guide for ${code} is taking longer than expected. The flight board can still be used.`, false);
                }, CONTEXT_TIMEOUT_MS);
            }

            function search() {
                clearSearchTimeout();
                setDateLimits();
                const v = values();
                const error = validate(v);
                if (error) {
                    setNotice(error, true);
                    return;
                }
                setNotice("");
                closeAllAirportSuggestions();
                if (v.mode === "airport") {
                    setSelectedIata("airport", v.airport);
                    /* Airport guide moved to Travel Info / Airport Information. */
                } else {
                    activeAirportContext = null;
                    pendingContext = null;
                    airportTimezone = "UTC";
                    document.body.classList.remove("has-airport-selection", "has-airport-context");
                    setContextState("welcome");
                }
                if (v.mode === "route") {
                    if (v.from) setSelectedIata("from", v.from);
                    if (v.to) setSelectedIata("to", v.to);
                }
                setBoardBusy(true);
                el("hardwareCasing")?.classList.add("is-searching");
                el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "true");
                setStatusLabels("Updating", "");
                el("querySummary").textContent = describeQuery(v);
                if (el("screenAirport")) {
                    el("screenAirport").textContent = v.mode === "airport" ? (v.airport || "---") : v.mode === "flight" ? (v.flightNumber || "---") : `${v.from||"ANY"}→${v.to||"ANY"}`;
                }
                if (el("screenDate")) el("screenDate").textContent = v.date || "---";
                if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                setBoardMessage("UPDATING FIDS", "Loading the latest available flight information", "flap-warn", true);
                armSearchTimeout();
                pendingSearch = String(++searchSerial);
                lastQuery = JSON.stringify(v);
                post("FLIGHT_STATUS_SEARCH", {
                    ...v,
                    requestId: pendingSearch
                });
            }

            function fmtDate(value) {
                if (!value) return "";
                const d = new Date(value);
                if (Number.isNaN(d.getTime())) return String(value).slice(0, 9);
                const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}`;
            }

            function fmtTime(value) {
                if (!value) return "";
                const raw = String(value).trim();
                if (/^\d{2}:\d{2}(?::\d{2})?$/.test(raw)) return raw.slice(0, 5);
                const localIso = raw.match(/T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?[+-]\d{2}:?\d{2}$/);
                if (localIso) return localIso[1];
                const d = new Date(raw);
                if (Number.isNaN(d.getTime())) return raw.slice(0, 5);
                try {
                    return new Intl.DateTimeFormat("en-GB", {
                        timeZone: "UTC",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                    }).format(d)
                } catch (_) {
                    return new Intl.DateTimeFormat("en-GB", {
                        timeZone: "UTC",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                    }).format(d)
                }
            }

            function statusColorClass(status) {
                const s = String(status || "").toLowerCase();
                if (s.includes("delay") || s.includes("incident") || s.includes("divert") || s.includes("estimated") || s.includes("board")) return "flap-warn";
                if (s.includes("cancel")) return "flap-bad";
                return "flap-ok";
            }

            const KNOWN_AIRLINE_LOGOS = Object.freeze({
                AS: "https://static.wixstatic.com/shapes/394052_6535b791dd404055903a12f5350d61c3.svg",
                AA: "https://static.wixstatic.com/shapes/394052_47809f4547c04f6eb7e098c5602ff57c.svg",
                PG: "https://static.wixstatic.com/shapes/394052_3627db92f99544d8bc42c98e684ce5d4.svg",
                BA: "https://static.wixstatic.com/shapes/394052_85c56f21c63c42d2b5fba0273ee3b0a6.svg",
                DL: "https://static.wixstatic.com/shapes/394052_4f692ba92b43482292d87d1c6b7df036.svg",
                AY: "https://static.wixstatic.com/shapes/394052_97cf9b3a9a884781b3186ededecd7b45.svg",
                F9: "https://static.wixstatic.com/shapes/394052_cca48f82a42043d79743561a784e92c8.svg",
                IB: "https://static.wixstatic.com/shapes/394052_3726a2f12dcd44ab8dea7085713902b9.svg",
                FI: "https://static.wixstatic.com/shapes/394052_e09b3c2f6dfd4ca3a87497e34f538c53.svg",
                B6: "https://static.wixstatic.com/shapes/394052_d0e052d862be40cba0231eae50b4b5dd.svg",
                KL: "https://static.wixstatic.com/shapes/394052_0c2eaf7331a147648b444fdb12329073.svg",
                LH: "https://static.wixstatic.com/shapes/394052_76a1dce4673a429d86b4d816faf88b6d.svg",
                N0: "https://static.wixstatic.com/shapes/394052_2c0b19b3399a4938a36e4dd7d8820c91.svg",
                Z0: "https://static.wixstatic.com/shapes/394052_2c0b19b3399a4938a36e4dd7d8820c91.svg",
                DY: "https://static.wixstatic.com/shapes/394052_05f76b5094374d11951f14a93fa1ea88.svg",
                D8: "https://static.wixstatic.com/shapes/394052_05f76b5094374d11951f14a93fa1ea88.svg",
                SK: "https://static.wixstatic.com/shapes/394052_bfbc7fc4f8b74360bf5398ac8d12a280.svg",
                LX: "https://static.wixstatic.com/shapes/394052_69b2702a5c434d03a9aa0182c430979e.svg",
                TG: "https://static.wixstatic.com/shapes/394052_c370132e76c64a29befdfd67496234fe.svg",
                UA: "https://static.wixstatic.com/shapes/394052_6002f849a3574cd4827d4ba1c3d339ef.svg"
            });

            function airlineCode(item) {
                const explicit = String(item?.airlineIata || "").trim().toUpperCase();
                if (explicit) return explicit;
                const flight = String(item?.flightIata || "").trim().toUpperCase();
                const match = flight.match(/^([A-Z0-9]{2})/);
                return match ? match[1] : "";
            }

            function airlineLogo(item) {
                const direct = safeUrl(item?.airlineLogoUrl);
                if (direct) return direct;
                return KNOWN_AIRLINE_LOGOS[airlineCode(item)] || "";
            }

            function createFlaps(str, exactLength = 0, statusClass = "") {
                const raw = String(str || "").trim().toUpperCase();
                const visible = exactLength ? raw.substring(0, exactLength) : raw;
                const safe = escapeHtml(visible || "—");
                return `<span class="message-flip ${statusClass}">${safe}</span>`;
            }

            function cacheChanged(key, value) {
                if (!key) return false;
                const next = String(value || "");
                const previous = fidsValueCache.get(key);
                fidsValueCache.set(key, next);
                return previous !== undefined && previous !== next;
            }

            function flightKey(item) {
                return String(item?.id || item?.flightIata || "FLIGHT") + "|" + String(item?.departure?.scheduled || item?.arrival?.scheduled || "");
            }

            function createTimeDisplay(item, arrivals, key) {
                const side = arrivals ? item?.arrival : item?.departure;
                const scheduled = side?.scheduledLocal || fmtTime(side?.scheduled) || "—";
                const latest = side?.actualLocal || side?.estimatedLocal || fmtTime(side?.actual || side?.estimated) || scheduled;
                const changed = cacheChanged(`${key}:time`, latest);
                const moved = scheduled && latest && scheduled !== latest;
                const arrival = item?.arrival;
                const arrivalTime = arrival?.actualLocal || arrival?.estimatedLocal || arrival?.scheduledLocal || fmtTime(arrival?.actual || arrival?.estimated || arrival?.scheduled) || "—";
                return `<div class="fids-time"><strong class="fids-time-main ${changed?"is-changing":""}">${escapeHtml(latest)}</strong>${moved?`<small>Sched ${escapeHtml(scheduled)}</small>`:""}${currentMode!=="airport"?`<small>Arr ${escapeHtml(arrivalTime)}</small>`:""}</div>`;
            }

            function createFlightDisplay(item, key) {
                const value = String(item?.flightIata || item?.flightIcao || "—").replace(/\s+/g, "").toUpperCase();
                const changed = cacheChanged(`${key}:flight`, value);
                return `<div class="fids-flight"><strong class="${changed?"is-changing":""}">${escapeHtml(value)}</strong></div>`;
            }

            function destinationLabel(side) {
                const code = String(side?.iata || side?.icao || "").trim().toUpperCase();
                const directory = airportDirectory.find(a => (code && a.iata === code) || (side?.icao && a.icao === side.icao));
                const city = String(side?.city || directory?.city || "").trim();
                const supplied = String(side?.airport || "").trim();
                const fullName = (supplied && supplied.toUpperCase() !== code ? supplied : String(directory?.title || "")).trim();
                let name = fullName.replace(/\s*\([A-Z0-9]{3,4}\)\s*$/i, "").replace(/\bInternational\b|\bAirport\b/gi, "").replace(/\s+/g, " ").trim();
                if (city && name.toLowerCase().startsWith(city.toLowerCase())) name = name.slice(city.length).replace(/^[\s/–—-]+/, "");
                const place = [city, name].filter(Boolean).join(" / ").toUpperCase();
                return {
                    place: place || code || "—",
                    code: place ? code : "",
                    title: [city, fullName, code].filter(Boolean).join(" · ")
                };
            }

            function createDestinationDisplay(side) {
                const label = destinationLabel(side);
                return `<div class="fids-destination" title="${escapeHtml(label.title)}"><strong>${escapeHtml(label.place)}${label.code?` <span>(${escapeHtml(label.code)})</span>`:""}</strong></div>`;
            }

            function createStatusDisplay(status, key) {
                const value = String(status || "Unknown").trim().replace(/[_-]+/g, " ").toUpperCase();
                const cls = statusColorClass(value);
                const changed = cacheChanged(`${key}:status`, value);
                return `<span class="fids-status ${cls} ${changed?"is-changing":""}">${escapeHtml(value)}</span>`;
            }

            function createGateDisplay(gate, key) {
                const value = String(gate || "—").trim().toUpperCase();
                const changed = cacheChanged(`${key}:gate`, value);
                return `<span class="fids-gate ${changed?"is-changing":""}">${escapeHtml(value)}</span>`;
            }

            function createTerminalDisplay(terminal, key) {
                const raw = String(terminal ?? "").trim().toUpperCase();
                const short = raw.replace(/^TERMINAL\s*/i, "");
                const value = /^[0-9]+[A-Z]?$/.test(short) || /^[A-SU-Z]$/.test(short) ? `T${short}` : (short || "—");
                const changed = cacheChanged(`${key}:terminal`, value);
                return `<span class="fids-terminal ${changed?"is-changing":""}">${escapeHtml(value)}</span>`;
            }

            function createLogoFlaps(item) {
                const airlineName = String(item?.airlineName || airlineCode(item) || "Airline");
                const src = airlineLogo(item);
                // These existing Wix assets contain white marks and need a dark display tile.
                const darkLogo = src === KNOWN_AIRLINE_LOGOS[airlineCode(item)] && ["AS", "DL", "F9", "B6", "LH", "DY", "D8", "SK", "LX", "UA"].includes(airlineCode(item));
                const fallback = (airlineCode(item) || airlineName.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "--");
                return `<div class="fids-carrier" title="${escapeHtml(airlineName)}"><span class="fids-tail ${src?"":"fallback"} ${darkLogo?"logo-dark":""}"><span class="fids-logo-fallback" ${src?"hidden":""}>${escapeHtml(fallback)}</span>${src?`<img src="${escapeHtml(src)}" alt="${escapeHtml(airlineName)}" decoding="async">`:""}</span><span class="fids-carrier-name">${escapeHtml(airlineName)}</span></div>`;
            }

            function describeQuery(v) {
                if (v.mode === "flight") return `${v.flightNumber||"FLIGHT"} · ${v.date||""}`;
                if (v.mode === "route") return `${v.from||"ANY"} → ${v.to||"ANY"} · ${v.date||""}`;
                return `${v.airport||"AIRPORT"} · ${(v.boardType||"departures").toUpperCase()} · ${v.date||""}`;
            }

            function setBoardMessage(title, note = "", statusClass = "", radar = false) {
                const rows = el("rows");
                if (!rows) return;
                rows.innerHTML = `<div class="board-message ${statusClass==="flap-bad"?"error":""}">
      ${radar?`<div class="search-radar" aria-hidden="true"></div>`:""}
      <strong class="board-message-title ${statusClass}">${escapeHtml(title)}</strong>
      ${note?`<div class="board-message-note">${escapeHtml(note)}</div>`:""}
    </div>`;
            }

            function renderIdleBoard() {
                setBoardMessage("FLIGHT INFORMATION", "Choose an airport and select Show board.", "flap-ok");
                if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
            }

            // Global toggle flag for historical records visibility
let showHistoricalFlights = false;

function render(items, meta) {
  lastFlightItems = Array.isArray(items) ? items : [];
  lastFlightMeta = meta && typeof meta === "object" ? meta : {};
  const rows = el("rows");
  setBoardBusy(false);
  el("hardwareCasing")?.classList.remove("is-searching");
  el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");

  

  if (!items || !items.length) {
    setBoardMessage("NO FLIGHTS FOUND", currentMode === "airport" ? "No flights were returned for this airport board." : currentMode === "flight" ? "No matching flight was returned for this date." : "No flights were returned for this route and date.", "flap-warn");
    el("boardMeta").textContent = meta?.message || "No flights matched the selected airport board.";
    setStatusLabels(meta?.partial ? "Partial update" : "Updated", "0 Flights");
    setNotice(meta?.note || "", false);
    return;
  }

  const arrivals = currentMode === "airport" && el("boardType").value === "arrivals";
  const nowTime = new Date();

  // 1. Sort all incoming items in perfect chronological sequence
  const sorted = [...items].sort((a, b) => {
    const av = arrivals ? (a?.arrival?.scheduled || a?.arrival?.estimated) : (a?.departure?.scheduled || a?.departure?.estimated);
    const bv = arrivals ? (b?.arrival?.scheduled || b?.arrival?.estimated) : (b?.departure?.scheduled || b?.departure?.estimated);
    return new Date(av || 0) - new Date(bv || 0);
  });

  // 2. Separate rows into previous history vs upcoming schedules
  const previousFlights = [];
  const upcomingFlights = [];

  sorted.forEach(item => {
    const side = arrivals ? item.arrival : item.departure;
    const flightTime = new Date(side?.scheduled || side?.estimated);
    
    // If the scheduled takeoff/landing was more than 15 minutes ago, classify as historical record
    if (flightTime && (nowTime - flightTime) > (15 * 60 * 1000)) {
      previousFlights.push(item);
    } else {
      upcomingFlights.push(item);
    }
  });

  // 3. Row template compilation mapping closure
  const mapRowHtml = (item, rowIndex) => {
    const key = flightKey(item);
    const side = arrivals ? item.arrival : item.departure;
    const destination = arrivals ? item.departure : item.arrival;
    
    const hasCodeshare = !!(item.operatingFlightIata || item.operatingAirlineIata);
    const displayAsCodeshare = hasCodeshare && codeshareTick;
    
    const activeAirline = displayAsCodeshare ? item.operatingAirlineIata : item.airlineIata;
    const activeFlightNo = displayAsCodeshare ? item.operatingFlightIata : item.flightIata;
    
    const rules = lastFlightMeta.boardingRules || {};
    const carrierName = rules[activeAirline]?.name || item.airlineName || activeAirline;
    const logoUrl = KNOWN_AIRLINE_LOGOS[activeAirline] || "";

    // Safely fetch city tracking values out of the schema models without duplication loops
    const targetCity = destination?.city || "";
    const targetIata = destination?.iata || "";
    const cleanDestinationLabel = targetCity ? `${targetCity.toUpperCase()} <span>(${targetIata.toUpperCase()})</span>` : targetIata.toUpperCase();

    // Fallback parser logic path to prevent —:— display errors on live telemetry streams
    const timeDisplayValue = side?.scheduledLocal || fmtTime(side?.scheduled) || "—:—";

    // 4. Custom Reference Boarding Status evaluation
    let statusText = "ON TIME";
    let statusClass = "flap-ok";
    const statusStr = String(item.status || "").toLowerCase();

    const flightTime = new Date(side?.scheduled || side?.estimated);
    const isPastFlight = flightTime && (nowTime - flightTime) > (15 * 60 * 1000);

    if (isPastFlight) {
      if (statusStr === "cancelled") {
        statusText = "CANCELLED";
        statusClass = "flap-bad";
      } else {
        const completionTime = side?.actualLocal || side?.estimatedLocal || timeDisplayValue;
        statusText = arrivals ? `ARRIVED ${completionTime}` : `DEPARTED ${completionTime}`;
        statusClass = "flap-ok";
      }
    } else {
      const calculatedStatus = calculateCustomStatus(item, lastFlightMeta.boardingRules, arrivals);
      statusText = calculatedStatus.text;
      statusClass = calculatedStatus.cls;
    }

    const gateValue = side?.gate || "—";
    const baggageBelt = item.arrival?.baggage || "—";
    const activeFacilityText = arrivals ? baggageBelt : gateValue;
    const compactMobileLabel = arrivals ? "Belt" : "Gate";

    return `
      <div class="fids-row fids-layout" role="row" style="--row:${rowIndex}" data-flight-key="${escapeHtml(key)}">
        <div class="fids-cell cell-airline" role="cell">
          <div class="fids-carrier" title="${escapeHtml(carrierName)}">
            <span class="fids-tail ${logoUrl ? "" : "fallback"} ${logoUrl ? "logo-dark" : ""} is-changing">
              <span class="fids-logo-fallback" ${logoUrl ? "hidden" : ""}>${escapeHtml(activeAirline)}</span>
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(carrierName)}" decoding="async">` : ""}
            </span>
            <span class="fids-carrier-name">${escapeHtml(carrierName)}</span>
          </div>
        </div>
        <div class="fids-cell cell-flight" role="cell">
          <div class="fids-flight"><strong class="is-changing">${escapeHtml(activeFlightNo)}</strong></div>
        </div>
        <div class="fids-cell cell-time" role="cell">
          <div class="fids-time">
            <strong class="fids-time-main">${escapeHtml(timeDisplayValue)}</strong>
          </div>
        </div>
        <div class="fids-cell cell-place" role="cell">
          <div class="fids-destination"><strong>${cleanDestinationLabel}</strong></div>
        </div>
        <div class="fids-cell cell-terminal" role="cell">
          <span class="fids-terminal">${escapeHtml(side?.terminal || "—")}</span>
        </div>
        <div class="fids-cell cell-gate" data-label="${compactMobileLabel}" role="cell">
          <span class="fids-gate is-changing">${escapeHtml(activeFacilityText)}</span>
        </div>
        <div class="fids-cell cell-remarks" role="cell">
          <span class="fids-status ${statusClass} is-changing">${escapeHtml(statusText)}</span>
        </div>
      </div>
    `;
  };

  // 5. Assemble layout arrays with interactive history toggle row button
  let finalHtmlOutput = "";
  
  if (previousFlights.length > 0) {
    finalHtmlOutput += `
      <div class="fids-history-toggle-row">
        <button type="button" class="fids-history-btn" id="toggleHistoryBtn">
          ${showHistoricalFlights ? "↑ Hide completed flights" : `↓ See previous flights (\\${previousFlights.length})`}
        </button>
      </div>
    `;
    
    if (showHistoricalFlights) {
      finalHtmlOutput += previousFlights.map((item, idx) => mapRowHtml(item, idx)).join("");
    }
  }

  finalHtmlOutput += upcomingFlights.map((item, idx) => mapRowHtml(item, previousFlights.length + idx)).join("");
  rows.innerHTML = finalHtmlOutput;

  // 6. Bind event listener for the historical disclosure row toggle element
  const toggleBtn = el("toggleHistoryBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      showHistoricalFlights = !showHistoricalFlights;
      const scrollBox = rows.closest(".board-scroll");
      const currentScroll = scrollBox ? scrollBox.scrollTop : 0;
      
      render(lastFlightItems, lastFlightMeta);
      
      if (scrollBox && showHistoricalFlights) {
        scrollBox.scrollTop = currentScroll;
      }
    });
  }

  rows.querySelectorAll(".fids-tail img").forEach(img => img.addEventListener("error", () => {
    img.hidden = true; img.parentElement.classList.add("fallback"); img.parentElement.querySelector(".fids-logo-fallback").hidden = false;
  }, { once: true }));
  
  el("boardMeta").textContent = meta?.message || `Displaying ${sorted.length} flights`;
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: airportTimezone || "UTC", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(meta?.searchedAt || Date.now()));
  setStatusLabels(`Updated ${now}`, `${sorted.length} ${sorted.length === 1 ? "Flight" : "Flights"}`);
  if (el("boardStatusEcho")) el("boardStatusEcho").textContent = meta?.partial ? "PARTIAL" : "UPDATED";
  setNotice(meta?.note || "", false);
}


            function setContextState(state, iata = "") {
                el("contextWelcome")?.classList.toggle("hidden", state !== "welcome");
                el("contextLoading")?.classList.toggle("hidden", state !== "loading");
                el("contextContent")?.classList.toggle("hidden", state !== "content");
                if (el("loadingAirportCode")) el("loadingAirportCode").textContent = iata || "---";
            }

            function contextKey(iata, searchValues = {}) {
                const code = cleanIata(iata);
                const date = searchValues.date || el("date")?.value || "";
                const boardType = searchValues.boardType || el("boardType")?.value || "departures";
                return `${code}|${date}|${boardType}`;
            }

            function requestAirportContext(iata, searchValues = {}) {
                const code = cleanIata(iata);
                if (!code) return;
                const key = contextKey(code, searchValues);
                const cached = airportContextCache.get(key);
                if (cached && Date.now() - cached._cachedAt < 120000) {
                    clearContextTimeout();
                    contextRequestSerial++;
                    pendingContext = null;
                    renderAirportContext(cached);
                    return;
                }
                const serial = ++contextRequestSerial;
                pendingContext = {
                    serial,
                    key,
                    iata: code
                };
                setContextState("loading", code);
                armContextTimeout(code, serial, key);
                document.body.classList.add("has-airport-selection");
                post("FLIGHT_STATUS_AIRPORT_CONTEXT_REQUEST", {
                    iata: code,
                    date: searchValues.date || el("date")?.value || "",
                    boardType: searchValues.boardType || el("boardType")?.value || "departures",
                    language: "EN",
                    requestSerial: serial,
                    contextKey: key
                });
            }

            function mediaUrlFromAirport(airport) {
                const direct = safeUrl(airport?.heroImageUrl || airport?.image_url || airport?.imageUrl);
                if (direct) return direct;
                const media = normalizeList(airport?.media_assets || airport?.mediaAssets);
                const primary = media.find(x => x && typeof x === "object" && (x.isHero || x.isPrimary || x.role === "PRIMARY")) || media[0];
                return safeUrl(primary?.url);
            }

            function normalizeAirportContext(payload) {
                const source = payload && typeof payload === "object" ? payload : {};
                const airport = source.airport && typeof source.airport === "object" ? source.airport : source;
                const commerce = source.commerce && typeof source.commerce === "object" ? source.commerce : {};
                const quickFacts = normalizeList(airport.quickFacts || airport.quickFactsJson);
                const terminals = normalizeList(airport.terminals || airport.terminalsJson);
                const transport = normalizeList(airport.transport || airport.transportJson);
                const foodDrinks = normalizeList(airport.foodDrinks || airport.foodDrinksJson);
                const destinationAds = normalizeList(airport.destinationAds || airport.destinationAdsJson);
                const lostFound = normalizeList(airport.lostFound || airport.lostFoundJson);
                const loungesObj = objectFrom(airport.lounges);
                const lounges = Array.isArray(loungesObj.lounges) ? loungesObj.lounges : normalizeList(airport.lounges);
                const airportHotel = objectFrom(airport.airportHotel || airport.airportHotels);
                return {
                    airport: {
                        ...airport,
                        iata: cleanIata(airport.iata || airport.iata_code || airport.code),
                        title: textValue(airport.title || airport.airport_name || airport.name),
                        city: textValue(airport.city || airport.locationCity),
                        country: textValue(airport.country || airport.countryName),
                        summary: textValue(airport.summary || airport.information || airport.body),
                        timezone: textValue(airport.timezone, "UTC"),
                        website: safeUrl(airport.website),
                        contactUrl: safeUrl(airport.contactUrl),
                        heroImageUrl: mediaUrlFromAirport(airport),
                        logoUrl: safeUrl(airport.logoUrl || airport.logoIconUrl || airport.airport_logo),
                        primaryColor: validHex(airport.primaryColor),
                        accentColor: validHex(airport.accentColor),
                        distanceToCityCenterKm: airport.distanceToCityCenterKm,
                        lastReviewed: airport.lastReviewed,
                        quickFacts,
                        terminals,
                        transport,
                        lounges,
                        foodDrinks,
                        airportHotel,
                        destinationAds,
                        lostFound
                    },
                    commerce: {
                        transferOffers: normalizeList(commerce.transferOffers || commerce.transfers),
                        hotels: normalizeList(commerce.hotels),
                        destinations: normalizeList(commerce.destinations),
                        tours: normalizeList(commerce.tours || commerce.activities)
                    }
                };
            }

            function listItem(title, detail = "") {
                return `<div class="context-list-item"><strong>${escapeHtml(title||"")}</strong>${detail?`<span>${escapeHtml(detail)}</span>`:""}</div>`;
            }

            function renderSimpleList(hostId, items, titleKeys, detailKeys, emptyText) {
                const host = el(hostId);
                if (!host) return 0;
                const rows = (items || []).slice(0, 5).map(item => {
                    if (typeof item === "string") return listItem(item);
                    const title = titleKeys.map(k => item?.[k]).find(Boolean) || "";
                    const detail = detailKeys.map(k => item?.[k]).find(Boolean) || "";
                    return title ? listItem(title, detail) : "";
                }).filter(Boolean);
                host.innerHTML = rows.length ? rows.join("") : `<p class="context-empty">${escapeHtml(emptyText)}</p>`;
                return rows.length;
            }

            function renderTransfer(offers, airport) {
                const module = el("moduleTransfer"),
                    host = el("transferContent");
                if (!module || !host) return;
                const offer = (offers || [])[0];
                if (!offer) {
                    module.classList.add("hidden");
                    host.innerHTML = "";
                    return;
                }
                module.classList.remove("hidden");
                const title = textValue(offer.title || offer.name, "SKANDI Transfer");
                const detail = textValue(offer.summary || offer.description || offer.destination || offer.meetingPoint || "Continue from arrivals with a SKANDI transfer option linked to this airport.");
                const amount = Number(offer.price ?? offer.publicPrice);
                const currency = textValue(offer.currency);
                const price = Number.isFinite(amount) && amount > 0 ? `<div class="transfer-price">${escapeHtml(currency)} ${escapeHtml(amount.toFixed(0))}<small> from</small></div>` : "";
                el("transferTitle").textContent = title;
                host.innerHTML = `${price}<p>${escapeHtml(detail)}</p><button class="transfer-cta" type="button" id="transferCta">View SKANDI Transfer →</button>`;
                el("transferCta")?.addEventListener("click", () => contextPathAction("TRANSFER", offer));
            }

            function contextCard(item, kind) {
                const image = safeUrl(item?.imageUrl || item?.heroImageUrl || item?.image || item?.media?.[0]?.url);
                const title = textValue(item?.title || item?.name, kind);
                const summary = textValue(item?.summary || item?.description || item?.subtitle || "");
                return `<article class="commerce-card ${image?"has-media":"no-media"}">
      ${image?`<div class="commerce-card-media" style="background-image:url('${escapeHtml(image)}')"></div>`:""}
      <div class="commerce-card-copy"><small>${escapeHtml(kind)}</small><h3>${escapeHtml(title)}</h3>${summary?`<p>${escapeHtml(summary)}</p>`:""}<button type="button" data-commerce-kind="${escapeHtml(kind)}" data-commerce-id="${escapeHtml(item?.id||item?.publicId||item?.slug||title)}">Explore →</button></div>
    </article>`;
            }

            function destinationCard(item, kind) {
                const title = textValue(item?.title || item?.name, kind);
                const summary = textValue(item?.summary || item?.description || item?.subtitle || "");
                return `<article class="destination-card"><small>${escapeHtml(kind)}</small><h3>${escapeHtml(title)}</h3>${summary?`<p>${escapeHtml(summary)}</p>`:""}<button type="button" data-destination-kind="${escapeHtml(kind)}" data-destination-id="${escapeHtml(item?.id||item?.publicId||item?.slug||title)}">Discover →</button></article>`;
            }

            function renderAirportContext(payload) {
                const context = normalizeAirportContext(payload);
                const airport = context.airport;
                if (!airport.iata) return;
                activeAirportContext = context;
                const key = payload?.contextKey || contextKey(airport.iata, payload?.meta || {});
                airportContextCache.set(key, {
                    ...payload,
                    _cachedAt: Date.now()
                });
                if (airportContextCache.size > 30) airportContextCache.delete(airportContextCache.keys().next().value);
                airportTimezone = airport.timezone || "UTC";
                selectedAirportIata = airport.iata;
                el("airport").dataset.selectedIata = airport.iata;
                setContextState("content", airport.iata);
                document.body.classList.add("has-airport-context");

                if (el("airport") && el("airport").value !== airport.iata) el("airport").value = airport.iata;
                if (el("screenAirport")) el("screenAirport").textContent = airport.iata;
                if (el("contextAirportCode")) el("contextAirportCode").textContent = airport.iata;
                if (el("destinationAirportCode")) el("destinationAirportCode").textContent = airport.iata;
                if (el("contextAirportEyebrow")) el("contextAirportEyebrow").textContent = [airport.city, airport.country].filter(Boolean).join(" · ") || "Airport guide";
                if (el("contextAirportTitle")) el("contextAirportTitle").textContent = airport.title || airport.iata;
                if (el("contextAirportSummary")) el("contextAirportSummary").textContent = airport.summary || `Passenger guide for ${airport.iata}.`;
                if (el("destinationEditTitle")) el("destinationEditTitle").textContent = airport.city ? `Continue into ${airport.city}.` : `Continue beyond ${airport.iata}.`;
                if (el("practicalHeading")) el("practicalHeading").textContent = `Useful at ${airport.iata}.`;

                const profile = el("airportProfile");
                if (profile) {
                    if (airport.primaryColor) profile.style.setProperty("--airport-primary", airport.primaryColor);
                    if (airport.accentColor) profile.style.setProperty("--airport-accent", airport.accentColor);
                }
                const media = el("airportProfileMedia");
                if (media) media.style.backgroundImage = airport.heroImageUrl ? `url('${airport.heroImageUrl}')` : "";

                const actions = [];
                if (airport.website) actions.push(`<a class="context-action primary" href="${escapeHtml(airport.website)}" target="_blank" rel="noopener noreferrer">Official airport site ↗</a>`);
                if (airport.contactUrl) actions.push(`<a class="context-action" href="${escapeHtml(airport.contactUrl)}" target="_blank" rel="noopener noreferrer">Airport contact ↗</a>`);
                el("contextAirportActions").innerHTML = actions.join("");

                const facts = [];
                facts.push(["IATA", airport.iata]);
                if (airport.city) facts.push(["City", airport.city]);
                if (airport.country) facts.push(["Country", airport.country]);
                if (airport.distanceToCityCenterKm != null && airport.distanceToCityCenterKm !== "") facts.push(["City center", `${airport.distanceToCityCenterKm} km`]);
                airport.quickFacts.forEach(item => {
                    const obj = typeof item === "object" ? item : {
                        label: "",
                        value: item
                    };
                    if (obj.label && obj.value) facts.push([obj.label, obj.value]);
                });
                el("contextQuickFacts").innerHTML = facts.slice(0, 6).map(([label, value]) => `<div class="profile-fact"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join("");

                const terminalCount = renderSimpleList("terminalContent", airport.terminals, ["terminal", "name", "title"], ["notes", "description"], "");
                const transportCount = renderSimpleList("transportContent", airport.transport, ["mode", "name", "title"], ["notes", "description"], "");
                const diningCount = renderSimpleList("diningContent", airport.foodDrinks, ["name", "title", "venue"], ["location", "notes", "description"], "");
                const loungeCount = renderSimpleList("loungeContent", airport.lounges, ["name", "title"], ["location", "access", "description"], "");
                el("moduleTerminals")?.classList.toggle("hidden", !terminalCount);
                el("moduleTransport")?.classList.toggle("hidden", !transportCount);
                el("moduleDining")?.classList.toggle("hidden", !diningCount);
                el("moduleLounges")?.classList.toggle("hidden", !loungeCount);

                const hotel = airport.airportHotel;
                const hotelHost = el("airportHotelContent");
                if (hotelHost) {
                    if (Object.keys(hotel).length) {
                        const amenities = normalizeList(hotel.amenities).slice(0, 3).map(String).join(" · ");
                        hotelHost.innerHTML = listItem(hotel.hotel || hotel.name || "Airport hotel", [hotel.location, amenities].filter(Boolean).join(" · "));
                    } else hotelHost.innerHTML = "";
                    el("moduleAirportHotel")?.classList.toggle("hidden", !Object.keys(hotel).length);
                }

                renderTransfer(context.commerce.transferOffers, airport);

                const commerceItems = [
                    ...context.commerce.hotels.map(x => ({
                        item: x,
                        kind: "Hotel"
                    })),
                    ...context.commerce.tours.map(x => ({
                        item: x,
                        kind: "Experience"
                    }))
                ].slice(0, 6);
                const commerce = el("airportCommerce"),
                    grid = el("commerceGrid");
                if (commerce && grid) {
                    commerce.classList.toggle("hidden", !commerceItems.length);
                    grid.innerHTML = commerceItems.map(x => contextCard(x.item, x.kind)).join("");
                    grid.querySelectorAll("[data-commerce-kind]").forEach(button => button.addEventListener("click", () => {
                        const all = commerceItems.map(x => x.item);
                        const item = all.find(x => String(x?.id || x?.publicId || x?.slug || x?.title || x?.name) === button.dataset.commerceId) || null;
                        contextPathAction(button.dataset.commerceKind.toUpperCase(), item);
                    }));
                }

                const destinationItems = [
                    ...airport.destinationAds.map(x => ({
                        item: x,
                        kind: "Destination"
                    })),
                    ...context.commerce.destinations.map(x => ({
                        item: x,
                        kind: "Destination"
                    }))
                ].slice(0, 6);
                const destSection = el("airportDestinationEdit"),
                    destGrid = el("destinationEditGrid");
                if (destSection && destGrid) {
                    destSection.classList.toggle("hidden", !destinationItems.length);
                    destGrid.innerHTML = destinationItems.map(x => destinationCard(x.item, x.kind)).join("");
                    destGrid.querySelectorAll("[data-destination-kind]").forEach(button => button.addEventListener("click", () => {
                        const all = destinationItems.map(x => x.item);
                        const item = all.find(x => String(x?.id || x?.publicId || x?.slug || x?.title || x?.name) === button.dataset.destinationId) || null;
                        contextPathAction("DESTINATION", item);
                    }));
                }

                const practical = [];
                if (airport.distanceToCityCenterKm != null && airport.distanceToCityCenterKm !== "") practical.push(["City center", `${airport.distanceToCityCenterKm} km from the airport.`]);
                if (terminalCount) practical.push(["Terminal planning", `${terminalCount} terminal ${terminalCount===1?"section":"sections"} in this airport guide.`]);
                if (transportCount) practical.push(["Ground transport", `${transportCount} documented way${transportCount===1?"":"s"} to continue from the airport.`]);
                if (loungeCount) practical.push(["Lounges", `${loungeCount} lounge ${loungeCount===1?"option":"options"} in this airport guide.`]);
                if (diningCount) practical.push(["Food & drink", `${diningCount} dining ${diningCount===1?"recommendation":"recommendations"} in this airport guide.`]);
                if (airport.website) practical.push(["Official airport site", "Use the airport’s official site for final operational instructions and local notices."]);
                el("practicalGrid").innerHTML = practical.map(([title, copy]) => `<article class="practical-card"><span>${escapeHtml(airport.iata)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`).join("");
                el("airportPractical")?.classList.toggle("hidden", !practical.length);

                updateClock();
            }

            window.addEventListener("message", function(event) {
                if (event.source !== window.parent) return;
                const data = event.data || {};
                if (data.source !== PARENT_SOURCE) return;

                if (data.type === "FLIGHT_STATUS_RESULTS") {
                    const payload = data.payload || {};
                    if (!pendingSearch || String(payload.requestId) !== pendingSearch) return;
                    pendingSearch = "";
                    clearSearchTimeout();
                    if (payload.airportContext) renderAirportContext(payload.airportContext);
                    render(payload.items || [], payload.meta || {});
                    return;
                }

                if (data.type === "FLIGHT_STATUS_AIRPORTS_RESULTS") {
                    const payload = data.payload || {};
                    airportDirectory = normalizeList(payload.items).map(item => ({
                        iata: cleanIata(item?.iata),
                        icao: textValue(item?.icao),
                        title: textValue(item?.title),
                        city: textValue(item?.city),
                        country: textValue(item?.country),
                        timezone: textValue(item?.timezone),
                        logoUrl: safeUrl(item?.logoUrl)
                    })).filter(item => item.iata);
                    if (!pendingSearch && lastFlightItems.length && el("rows").querySelector(".fids-row")) {
                        const arrivals = currentMode === "airport" && el("boardType").value === "arrivals";
                        el("rows").querySelectorAll(".fids-row").forEach(row => {
                            const item = lastFlightItems.find(item => flightKey(item) === row.dataset.flightKey);
                            if (item) row.querySelector(".cell-place").innerHTML = createDestinationDisplay(arrivals ? item.departure : item.arrival);
                        });
                    }
                    const focused = document.activeElement?.id;
                    if (["airport", "from", "to"].includes(focused)) {
                        suggestionIndex[focused] = 0;
                        renderAirportSuggestions(el(focused).value, focused);
                    }
                    return;
                }

                if (data.type === "FLIGHT_STATUS_AIRPORTS_ERROR") {
                    setNotice("Airport suggestions are unavailable. Enter a 3-letter IATA or 4-letter ICAO code to search.", true);
                    return;
                }

                if (data.type === "FLIGHT_STATUS_AIRPORT_CONTEXT_RESULTS") {
                    const payload = data.payload || {};
                    const serial = Number(payload.requestSerial || 0);
                    const key = textValue(payload.contextKey);
                    if (!pendingContext || serial !== pendingContext.serial) return;
                    if (key !== pendingContext.key || currentMode !== "airport") return;
                    clearContextTimeout();
                    pendingContext = null;
                    renderAirportContext(payload);
                    return;
                }

                if (data.type === "FLIGHT_STATUS_AIRPORT_CONTEXT_ERROR") {
                    const payload = data.payload || {};
                    const serial = Number(payload.requestSerial || 0);
                    if (!pendingContext || serial !== pendingContext.serial) return;
                    clearContextTimeout();
                    pendingContext = null;
                    if (!activeAirportContext) setContextState("welcome");
                    if (payload.message) setNotice(payload.message, false);
                    return;
                }

                if (data.type === "FLIGHT_STATUS_HOST_READY") {
                    post("FLIGHT_STATUS_AIRPORTS_REQUEST", {});
                    return;
                }

                if (data.type === "FLIGHT_STATUS_ERROR") {
                    const payload = data.payload || {};
                    if (!pendingSearch || String(payload.requestId) !== pendingSearch) return;
                    pendingSearch = "";
                    clearSearchTimeout();
                    setBoardBusy(false);
                    el("hardwareCasing")?.classList.remove("is-searching");
                    el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");
                    setNotice(payload.message || "Flight information is temporarily unavailable.", true);
                    setBoardMessage("BOARD UNAVAILABLE", "Please try updating the FIDS again shortly.", "flap-bad");
                    setStatusLabels("Update failed", "");
                    if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                }
            });

            function updateBoardType() {
  const type = el("boardType")?.value || "departures";
  const arrivals = currentMode === "airport" && type === "arrivals";
  
  // FIXED: Correctly grab the individual column element by index to prevent crashes
  const columns = document.querySelectorAll(".board-columns > div");
  if (columns && columns.length >= 6) {
    // Index 5 targets the 6th header column: Gate / Belt
    columns[5].textContent = arrivals ? "Belt" : "Gate";
  }
  
  // Keep the rest of your standard updateBoardType logic here...
  let label = "Departures";
  if (currentMode === "airport") label = type === "arrivals" ? "Arrivals" : "Departures";
  else if (currentMode === "flight") label = "Flight status";
  else if (currentMode === "route") label = "Route status";
  if (el("boardSubMode")) el("boardSubMode").textContent = label;
  if (el("railTitle")) el("railTitle").textContent = label.toUpperCase();
  
  if (el("timeHeader")) el("timeHeader").textContent = currentMode !== "airport" ? "Departure / Arrival" : arrivals ? "Arrival time" : "Departure time";
  if (el("placeHeader")) el("placeHeader").textContent = arrivals ? "From" : "To";
  if (el("boardDirectionIcon")) el("boardDirectionIcon").textContent = arrivals ? "↘" : "↗";
  document.querySelectorAll("[data-board-view]").forEach(btn => btn.classList.toggle("active", currentMode === "airport" && btn.dataset.boardView === type));
  if (el("commerceHeading")) el("commerceHeading").textContent = type === "arrivals" ? "From arrivals into the next part of the trip." : "Make the time before departure work harder.";
  document.body.classList.toggle("context-arrivals", currentMode === "airport" && type === "arrivals");
  document.body.classList.toggle("context-departures", currentMode !== "airport" || type !== "arrivals");
}

  



            function updateClock() {
                const now = new Date();
                let value = "";
                try {
                    value = new Intl.DateTimeFormat("en-GB", {
                        timeZone: airportTimezone || "UTC",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                    }).format(now);
                } catch (_) {
                    airportTimezone = "UTC";
                    value = new Intl.DateTimeFormat("en-GB", {
                        timeZone: "UTC",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                    }).format(now);
                }
                if (el("utcClock")) el("utcClock").textContent = `${value} ${airportTimezone==="UTC"?"UTC":"LOCAL"}`;
                if (el("boardClockEcho")) el("boardClockEcho").textContent = value;
                if (el("boardClockLabel")) el("boardClockLabel").textContent = airportTimezone === "UTC" ? "UTC" : "LOCAL";
            }

            function installPointerLight() {
                if (!window.matchMedia?.("(pointer:fine)")?.matches) return;
                document.addEventListener("pointermove", event => {
                    document.documentElement.style.setProperty("--mx", `${(event.clientX/window.innerWidth*100).toFixed(1)}%`);
                    document.documentElement.style.setProperty("--my", `${(event.clientY/window.innerHeight*100).toFixed(1)}%`);
                }, {
                    passive: true
                });
            }

            function installReveal() {
                const nodes = [...document.querySelectorAll(".reveal")];
                if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || !("IntersectionObserver" in window)) {
                    nodes.forEach(node => node.classList.add("is-visible"));
                    return;
                }
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    });
                }, {
                    threshold: .10,
                    rootMargin: "0px 0px -6% 0px"
                });
                nodes.forEach(node => observer.observe(node));
                window.addEventListener("pagehide", () => observer.disconnect(), {
                    once: true
                });
            }
            function refreshVisibleFidsRows() {
  const rowsContainer = el("rows");
  if (!rowsContainer || !lastFlightItems || !lastFlightItems.length) return;
  
  // Re-run the layout generator engine using the current flight state data sets
  // This smoothly reapplies the .is-changing animations as the frames toggle
  const targetScrollTop = el("rows").closest(".board-scroll")?.scrollTop || 0;
  
  render(lastFlightItems, lastFlightMeta);
  
  // Preserve user position inside the scroll box container during background flip ticks
  const scrollBox = el("rows").closest(".board-scroll");
  if (scrollBox) scrollBox.scrollTop = targetScrollTop;
}


            document.querySelectorAll("[data-lookup-mode]").forEach(button => {
                button.addEventListener("click", () => {
                    if (button.dataset.lookupMode === currentMode) return;
                    clearRequestTimeouts();
                    contextRequestSerial++;
                    setMode(button.dataset.lookupMode);
                    setBoardBusy(false);
                    el("hardwareCasing")?.classList.remove("is-searching");
                    el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");
                    setBoardMessage("FLIGHT INFORMATION", currentMode === "airport" ? "Choose an airport and select Show board." : currentMode === "flight" ? "Enter a flight number and date." : "Enter a route and date.", "flap-ok");
                    setStatusLabels("", "");
                    el("screenAirport").textContent = "---";
                    activeAirportContext = null;
                    pendingContext = null;
                    airportTimezone = "UTC";
                    document.body.classList.remove("has-airport-selection", "has-airport-context");
                    setContextState("welcome");
                    if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                });
            });

            document.querySelectorAll("[data-board-view]").forEach((button) => {
                button.addEventListener("click", () => {
                    el("boardType").value = button.dataset.boardView;
                    updateBoardType();
                    const v = values();
                    if ((currentMode === "airport" && v.airport) || (currentMode === "flight" && v.flightNumber) || (currentMode === "route" && (v.from || v.to))) search();
                });
            });

            el("boardType").addEventListener("change", updateBoardType);
            el("searchBtn").addEventListener("click", search);
            el("clearBtn").addEventListener("click", function() {
                clearRequestTimeouts();
                contextRequestSerial++;
                ["airport", "from", "to", "flightNumber"].forEach(id => {
                    if (el(id)) {
                        el(id).value = "";
                        el(id).dataset.selectedIata = "";
                    }
                });
                selectedAirportIata = "";
                selectedFromIata = "";
                selectedToIata = "";
                closeAllAirportSuggestions();
                setBoardBusy(false);
                el("hardwareCasing")?.classList.remove("is-searching");
                el("rows")?.closest(".board-screen")?.setAttribute("aria-busy", "false");
                setBoardMessage("FLIGHT INFORMATION", currentMode === "airport" ? "Choose an airport and select Show board." : currentMode === "flight" ? "Enter a flight number and date." : "Enter a route and date.", "flap-ok");
                setNotice("");
                setStatusLabels("", "");
                el("querySummary").textContent = currentMode === "airport" ? "Select an airport to load the board" : currentMode === "flight" ? "Enter a flight number" : "Enter a route";
                el("screenAirport").textContent = "---";
                el("screenDate").textContent = el("date").value || "---";
                activeAirportContext = null;
                pendingContext = null;
                airportTimezone = "UTC";
                document.body.classList.remove("has-airport-selection", "has-airport-context");
                setContextState("welcome");
                if (el("boardStatusEcho")) el("boardStatusEcho").textContent = "";
                updateBoardType();
            });

            function bindAirportPicker(fieldId) {
                const input = el(fieldId);
                if (!input) return;
                input.addEventListener("input", () => {
                    setSelectedIata(fieldId, "");
                    suggestionIndex[fieldId] = 0;
                    renderAirportSuggestions(input.value, fieldId);
                });
                input.addEventListener("focus", () => {
                    closeAllAirportSuggestions();
                    if (airportDirectory.length) {
                        suggestionIndex[fieldId] = 0;
                        renderAirportSuggestions(input.value, fieldId)
                    } else post("FLIGHT_STATUS_AIRPORTS_REQUEST", {});
                });
                input.addEventListener("keydown", event => {
                    const host = suggestionHost(fieldId);
                    const open = host?.classList.contains("open");
                    if (event.key === "ArrowDown" && open) {
                        event.preventDefault();
                        suggestionIndex[fieldId]++;
                        renderAirportSuggestions(input.value, fieldId);
                        return
                    }
                    if (event.key === "ArrowUp" && open) {
                        event.preventDefault();
                        suggestionIndex[fieldId] = Math.max(0, suggestionIndex[fieldId] - 1);
                        renderAirportSuggestions(input.value, fieldId);
                        return
                    }
                    if (event.key === "Escape") {
                        closeAirportSuggestions(fieldId);
                        return
                    }
                    if (event.key === "Enter") {
                        if (open) {
                            const matches = airportMatches(input.value);
                            const index = Math.min(Math.max(suggestionIndex[fieldId], 0), matches.length - 1);
                            const item = matches[index];
                            if (item) {
                                event.preventDefault();
                                selectAirport(item, {
                                    searchNow: false,
                                    fieldId
                                });
                                return
                            }
                        }
                        search();
                    }
                });
            }
            ["airport", "from", "to"].forEach(bindAirportPicker);
            el("flightNumber")?.addEventListener("keydown", event => {
                if (event.key === "Enter") search()
            });
            document.addEventListener("pointerdown", event => {
                if (!event.target.closest(".airport-code-control")) closeAllAirportSuggestions()
            }, {
                passive: true
            });

            el("date").addEventListener("change", () => {
                if (el("screenDate")) el("screenDate").textContent = el("date").value || "---";
                if (hasReadySearch()) search();
            });

            setDateLimits();
            setMode("airport");
            setContextState("welcome");
            updateBoardType();
            updateClock();
            if (el("screenDate")) el("screenDate").textContent = el("date").value || "---";
            clockTimer = window.setInterval(updateClock, 1000);
            installPointerLight();
            installReveal();
            setBoardMessage("FLIGHT INFORMATION", "Choose an airport and select Show board.", "flap-ok");
            window.addEventListener("pagehide", () => {
                window.clearInterval(clockTimer);
                window.clearInterval(refreshTimer);
                clearRequestTimeouts();
            }, {
                once: true
            });
            post("FLIGHT_STATUS_READY", {
                version: "V12"
            });
            post("FLIGHT_STATUS_AIRPORTS_REQUEST", {});
            refreshTimer = window.setInterval(() => {
                if (document.visibilityState === "hidden" || pendingSearch || !lastQuery) return;
                if (JSON.stringify(values()) === lastQuery) search();
            }, 60000);
        })();
    </script>
</body>
</html>
```
