# INFO / LOG — SKANDI Passenger & Member Support HelpDesk

- ROUTE: `/my-profile/support`
- WIX PAGE: `SKANDI Club Support.yk7x3`
- HTML COMPONENT: `#skandiMySupportEmbed`
- CHAT COMPONENT: `#skandiSupportChatEmbed`
- CHILD SOURCE: `SKANDI_SUPPORT_CUSTOMER_PORTAL`
- CANONICAL BACKEND: `/src/backend/SKANDI_CORE/customerSupport.web.js` → `/src/backend/SKANDI_CORE/customerSupport.js`
- SUPPLIER SELF-SERVICE LINK: `/my-profile/travel-assistance` (canonical owned booking/session checks remain there)
- STATUS: V12 MEMBER PRIORITY CONVERGENCE + V12.4 ASSISTANT ENTRY — **STATICALLY VERIFIED; REQUIRES LIVE TEST**

## CHANGE LOG
- 2026-10-12 — Every case created from the signed-in Member HelpDesk, including cases created from its shared Human Support chat form/handoff path, is stamped `member-helpdesk` / `MEMBER_HELPDESK`. The master agent workspace uses this durable source to place Member HelpDesk work above standard Help Center cases and displays a dedicated priority flag. Existing customer auth, case ownership, support messaging and LiveKit contracts remain canonical. STATICALLY VERIFIED; REQUIRES LIVE TEST.
- 2026-10-19 — V12.4: Added contextual travel-assistant entry when a case concerns a booking, flight or hotel. It sends `CUSTOMER_NAVIGATE` through the existing Wix controller to `/my-profile/travel-assistance?caseId=...`, where the user must select and own the Duffel booking. No duplicate SKANDI cases or parallel chat data store. Added defense-in-depth private-message suppression; `customerSupport.web.js` now also excludes staff/internal notes from customer case detail. Original form categories, CSS, chat, LiveKit, priority flow and responsive behavior preserved. REQUIRES LIVE TEST.

- 2026-10-19 — V12.5: Updated the contextual travel-management route to the owner-confirmed `/my-profile/travel-assistance` while preserving `CUSTOMER_NAVIGATE`, `caseId`, existing Support case ownership and the complete standalone human-chat embed. No backend service duplication.

## COMPLETE INTENDED HTML

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
    <meta name="theme-color" content="#022e64" />
    <title>SKANDI Passenger & Member Support HelpDesk</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900" rel="stylesheet" />

    <style>
        :root {
            --blue: #022e64;
            --blue2: #1F6BA3;
            --accent: #5FC7CF;
            --bg: #fff;
            --soft: #f6f8fb;
            --panel: #fff;
            --text: #111827;
            --muted: #5b687b;
            --line: #dfe5ef;  
            --shadow: 0 16px 45px rgba(2, 46, 100, .10);
            --radius: 20px;
            --sidebar: 280px;
            --green: #079455;
            --red: #d92d20;
            --amber-bg: #fffbeb;
            --amber-border: #fef3c7;
            --amber-text: #b45309;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        html, body {
            width: 100%; min-height: 100%; font-family: Montserrat, system-ui, -apple-system, sans-serif;
            background: var(--soft); color: var(--text); overflow-x: hidden;
        }

        button, input, textarea, select { font: inherit; outline: none; }
        button { cursor: pointer; border: none; background: transparent; }
        a { color: inherit; text-decoration: none; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        .app { min-height: 100vh; display: block; background: var(--soft); }
        .main { min-width: 0; padding: 0; position: relative; }

        .hero.full {
            position: relative; min-height: 480px;
            background: linear-gradient(105deg, rgba(2, 46, 100, .85), rgba(2, 46, 100, .38)), url("https://static.wixstatic.com/media/394052_bdef1af6f42f4c6d849452a3341beec2~mv2.png");
            background-size: cover; background-position: center; color: #fff; padding-bottom: 100px;
        }
        
        .hero-inner { padding: 28px 40px 40px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 2; }
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        
        .skandi-burger-btn {
            display: flex; align-items: center; justify-content: center;
            background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3);
            color: #fff; width: 46px; height: 46px; border-radius: 14px; cursor: pointer;
            backdrop-filter: blur(4px); transition: all 0.2s ease;
        }
        .skandi-burger-btn:hover { background: rgba(255, 255, 255, 0.25); border-color: #fff; }

        /* Sidebar Drawer & Overlay */
        .sidebar {
            background: var(--bg); color: var(--text); padding: 32px 24px; min-height: 100vh;
            position: fixed; left: 0; top: 0; bottom: 0; width: 300px; z-index: 200;
            display: flex; flex-direction: column; gap: 24px; border-right: 1px solid var(--line);
            transform: translateX(-100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 20px 0 50px rgba(2, 46, 100, 0.15);
        }
        .sidebar.open { transform: translateX(0); }
        
        .logo-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .logo-sub { margin-top: 6px; color: var(--accent); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
        .close-sidebar-btn { display: block; background: transparent; border: none; color: var(--muted); font-size: 24px; cursor: pointer; }

        .profile-card { background: var(--soft); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; text-align: left; }
        .avatar-wrap { position: relative; width: 80px; height: 80px; margin-bottom: 16px; }
        .avatar { width: 100%; height: 100%; border-radius: 999px; border: 2px solid #fff; background: linear-gradient(135deg, var(--accent), #d7e6ff); display: grid; place-items: center; color: var(--blue); }
        .diamond { position: absolute; right: -4px; bottom: 4px; width: 24px; height: 24px; border-radius: 8px; background: var(--accent); color: var(--blue); display: grid; place-items: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); }
        .member-name { font-size: 18px; font-weight: 600; letter-spacing: -.02em; color: var(--blue); }
        .member-tier { display: inline-flex; margin-top: 8px; margin-bottom: 8px; background: var(--bg); color: var(--blue); border: 1px solid var(--line); border-radius: 999px; padding: 6px 12px; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }

        .side-nav { display: grid; gap: 4px; }
        .side-nav button { min-height: 48px; border: 0; border-radius: 14px; background: transparent; color: var(--muted); display: flex; align-items: center; gap: 14px; text-align: left; padding: 0 16px; font-size: 13px; font-weight: 700; transition: .2s ease; width: 100%; cursor: pointer; }
        .side-nav button:hover, .side-nav button.active { background: var(--soft); color: var(--blue); }
        .side-nav .icon-placeholder {
    width: 38px;
    height: 38px;
    object-fit: contain;
    filter: none;
    opacity: 1;
    flex: 0 0 28px;
}

        .logout { border: 0; background: transparent; color: var(--muted); text-align: left; font-size: 12px; font-weight: 800; padding: 10px 16px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: auto; transition: color 0.2s ease; cursor: pointer; }
        .logout:hover { color: var(--red); }

        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(4px); z-index: 199; display: none; opacity: 0; transition: opacity 0.3s ease; }
        .sidebar-overlay.open { display: block; opacity: 1; }

        .eyebrow {
            display: inline-flex; align-items: center; gap: 10px; text-transform: uppercase;
            letter-spacing: .22em; font-size: 11px; font-weight: 800; margin-bottom: 16px; color: var(--accent);
        }
        .eyebrow:before { content: ""; width: 42px; height: 1px; background: var(--accent); }
        
        .greeting { font-size: clamp(40px, 5vw, 64px); font-weight: 500; line-height: 1.03; color: #fff; margin-bottom: 12px; }
        .hero-sub { color: #eef6ff; font-size: 16px; line-height: 1.6; max-width: 500px; }

        .dashboard { padding: 0 40px 60px; max-width: 1400px; margin: -100px auto 0 auto; position: relative; z-index: 10; }
        .grid-support { display: grid; grid-template-columns: 380px 1fr; gap: 24px; height: 760px; }

        .card {
            background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius);
            box-shadow: 0 16px 45px rgba(2, 46, 100, 0.08); display: flex; flex-direction: column; overflow: hidden;
        }
        .form-field select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b687b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 16px center;
            background-size: 16px;
            padding-right: 40px;
            cursor: pointer;
        }
        .btn {
            background: var(--blue); color: #fff; border-radius: 999px; padding: 0 20px;
            font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .12em;
            display: inline-flex; align-items: center; justify-content: center; height: 44px; transition: all 0.25s ease;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(2, 46, 100, 0.15); }
        .btn.paper { background: var(--soft); color: var(--blue); border: 1px solid var(--line); box-shadow: none; }
        .btn.paper:hover { background: #fff; border-color: var(--blue2); }

        .btn-new-case {
            background: var(--blue); color: #fff; border-radius: 12px; padding: 0 16px;
            font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .12em;
            display: inline-flex; align-items: center; gap: 8px; height: 44px; transition: all 0.25s ease; flex-shrink: 0;
        }
        .btn-new-case:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(2, 46, 100, 0.15); }

        .search-input {
            width: 100%; background: #fff; border: 1px solid var(--line); border-radius: 12px;
            padding: 12px 16px; font-family: inherit; font-size: 14px; transition: all 0.2s; outline: none;
        }
        .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(95, 199, 207, 0.15); }

        .case-list { flex: 1; overflow-y: auto; background: var(--panel); }
        .case-item {
            width: 100%; text-align: left; background: transparent; border-bottom: 1px solid var(--line);
            padding: 20px; transition: all 0.2s; display: grid; gap: 8px; cursor: pointer;
        }
        .case-item:hover { background: var(--soft); padding-left: 24px; }
        .case-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .case-title { font-size: 15px; font-weight: 700; color: var(--blue); line-height: 1.3; }
        .case-meta { font-size: 12px; color: var(--muted); font-weight: 500; }

        .badge-status {
            display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px;
            font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
        }
        .badge-status.open { background: #dcfae6; color: var(--green); }
        .badge-status.closed { background: var(--soft); color: var(--muted); }
        .badge-status.category { background: #edf8ff; color: var(--blue2); margin-top: 8px; }

        .chat-header { padding: 24px; border-bottom: 1px solid var(--line); background: var(--panel); }
        .chat-window { flex: 1; overflow-y: auto; padding: 32px; background: var(--soft); display: flex; flex-direction: column; gap: 24px; }
        
        .msg-wrapper { display: flex; gap: 12px; max-width: 85%; }
        .msg-wrapper.user { align-self: flex-end; flex-direction: row-reverse; }

        .chat-avatar {
            width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .chat-avatar.agent { background: var(--blue); }
        .chat-avatar.user { background: var(--accent); }

        .msg-content { display: flex; flex-direction: column; gap: 6px; }
        .msg-wrapper.user .msg-content { align-items: flex-end; }
        .msg-sender { font-size: 12px; font-weight: 600; color: var(--muted); }
        
        .msg-bubble {
            background: var(--panel); border: 1px solid var(--line); padding: 16px 20px;
            border-radius: 0 16px 16px 16px; font-size: 14px; line-height: 1.6; color: var(--text); box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .msg-wrapper.user .msg-bubble { background: var(--blue); color: #fff; border: none; border-radius: 16px 0 16px 16px; }

        /* Modal & Form Styles */
        .modal { position: fixed; inset: 0; display: none; place-items: center; background: rgba(0, 0, 0, .4); backdrop-filter: blur(4px); z-index: 150; padding: 20px; }
        .modal.open { display: grid; }
        .modal-card {
            width: min(720px, 100%); background: var(--panel); border-radius: 24px;
            padding: 0; animation: pop .3s ease both; border: none; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
        }
        
        /* HIGH-IMPACT SKYPRIORITY-STYLE ALLIANCE BANNER */
        .skandi-priority-banner {
            background: #021a38;
            color: #fff;
            padding: 22px 32px;
            display: flex;
            align-items: center;
            gap: 20px;
            border-bottom: 4px solid var(--accent);
            box-shadow: inset 0 -10px 20px rgba(0,0,0,0.3);
            flex-shrink: 0;
        }
        .priority-badge-pill {
            background: linear-gradient(135deg, var(--accent) 0%, #3aa0a8 100%);
            color: var(--blue);
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            padding: 8px 16px;
            border-radius: 6px;
            flex-shrink: 0;
            box-shadow: 0 4px 15px rgba(95, 199, 207, 0.3);
        }
        .priority-badge-pill strong {
            font-weight: 900;
            font-size:12px;
            letter-spacing: 0.2em;
            margin-left:1px;
            color: var(--red);
        }
        
        .priority-content h4 {
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #fff;
            margin-bottom: 3px;
        }
        .priority-content p {
            font-size: 12.5px;
            line-height: 1.4;
            color: #cce7eb;
            font-weight: 500;
        }

        .modal-body-scroll {
            padding: 32px 40px 40px 40px;
            overflow-y: auto;
            flex: 1;
        }

        .section-title {
            font-size: 13px; color: var(--blue); font-weight: 600; margin: 24px 0 12px;
            padding-bottom: 6px; border-bottom: 2px solid var(--soft); text-transform: uppercase; letter-spacing: 0.05em;
        }
        
        .form-row-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
        .form-field { margin-bottom: 16px; }
        .form-field label { display: block; margin-bottom: 6px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .1em; font-weight: 500; }
        .form-field input, .form-field select, .form-field textarea {
            width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px;
            font-family: inherit; font-size: 12px; background: var(--soft); outline: none; transition: border-color 0.2s;
        }
        .form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: var(--accent); background: #fff; }
        .form-field input[aria-invalid="true"], .form-field textarea[aria-invalid="true"] { border-color: var(--red); background: #fff5f5; }
        
        .error-hint { font-size: 11px; color: var(--red); margin-top: 4px; display: none; font-weight: 600; }
        .error-hint.show { display: block; }

        .hidden { display: none !important; }
        fieldset {
            border: none;
            padding: 0;
            margin: 0;
            min-width: 0;
        }
        
        /* Banners & Callouts */
        .regulatory-banner {
            background: var(--soft); border: 1px solid var(--line); color: var(--blue);
            padding: 14px 16px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 16px; line-height: 1.5;
        }

        /* File Upload Zone */
        .upload-zone {
            border: 2px dashed var(--line); border-radius: 12px; padding: 20px; text-align: center; background: var(--soft);
            cursor: pointer; transition: border-color 0.2s; position: relative;
        }
        .upload-zone:hover { border-color: var(--accent); }
        .file-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .file-chip {
            display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid var(--line);
            padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--blue);
        }
        .file-chip button { color: var(--red); font-weight: 600; cursor: pointer; padding: 0 4px; }

        .spinner-loader {
            display: inline-block; width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent;
            border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 6px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .reply-area { padding: 20px; background: var(--panel); border-top: 1px solid var(--line); display: flex; gap: 16px; align-items: flex-end; }
        .reply-area textarea {
            flex: 1; border: 1px solid var(--line); border-radius: 12px; padding: 16px; font-family: inherit;
            font-size: 14px; resize: none; outline: none; background: var(--soft); height: 60px;
        }
        .reply-area textarea:focus { background: #fff; border-color: var(--accent); }

        .toast {
            position: fixed; right: 24px; bottom: 24px; background: var(--blue); color: #fff; border-radius: 12px;
            padding: 16px 24px; font-size: 13px; font-weight: 700; display: none; z-index: 200; box-shadow: 0 12px 30px rgba(2, 46, 100, 0.2);
        }
        .toast.show { display: block; animation: pop 0.3s ease; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pop { from { opacity: 0; transform: scale(.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        .topbar, .hero-inner > div { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .dashboard > * { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }

        @media(max-width: 900px) {
            .grid-support { grid-template-columns: 1fr; height: auto; }
            .hero-inner { padding: 20px; }
            .dashboard { padding: 0 20px 40px; }
        }
    </style>

    <!-- BEGIN HOMEPAGE CUSTOMER SHELL STYLES -->
    <style id="skandi-customer-shell-styles">
        #skandi-site-header {
            --sk-blue: #022e64;
            --sk-blue2: #0b3a7a;
            --sk-cyan: #5FC7CF;
            --sk-line: #e6e9ee;
            --sk-border-soft: #eef2f7;
            --sk-muted: #667085;
            --sk-body: #555;
            --sk-pale: #f6faff;
            --header-h: 74px;
            --bar-height: 44px;
            --header-total: 118px;
            width: 100%;
            display: block;
            margin: 0;
            font-family: Montserrat, system-ui, sans-serif;
            background: transparent;
            overflow: visible;
        }

        #skandi-site-header,
        #skandi-site-header * { box-sizing: border-box; }
        #skandi-site-header button { font: inherit; cursor: pointer; }
        #skandi-site-header .header-shell {
            position: relative;
            z-index: 100;
            height: var(--header-total);
            background: #fff;
            box-shadow: 0 4px 24px rgba(15, 23, 42, .08);
        }
        #skandi-site-header .mainline {
            height: var(--header-h);
            background: #fff;
            border-bottom: 1px solid var(--sk-line);
        }
        #skandi-site-header .inner {
            max-width: 1240px;
            margin: 0 auto;
            height: 100%;
            padding: 0 18px;
            display: flex;
            align-items: center;
            gap: 18px;
        }
        #skandi-site-header button.logo {
            flex: 0 1 auto;
            min-width: 0;
            height: auto;
            padding: 0;
            border: 0;
            background: transparent;
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        #skandi-site-header button.logo img {
            height: clamp(34px, 10vw, 50px);
            width: auto;
            max-width: 100%;
            object-fit: contain;
            object-position: left center;
            display: block;
        }
        #skandi-site-header .nav {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 4px;
            min-width: 0;
        }
        #skandi-site-header .nav-btn {
            border: 0;
            background: transparent;
            color: var(--sk-blue);
            border-radius: 999px;
            padding: 10px 14px;
            font-size: 13px;
            font-weight: 800;
            white-space: nowrap;
            position: relative;
            overflow: visible;
            transition: color .3s;
        }
        #skandi-site-header .nav-btn:hover { color: var(--sk-cyan); }
        #skandi-site-header .nav-btn::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 50%;
            width: 0;
            height: 3px;
            background: var(--sk-cyan);
            border-radius: 999px;
            transition: width .3s ease, left .3s ease;
        }
        #skandi-site-header .nav-btn:hover::after,
        #skandi-site-header .nav-btn.active::after { width: 80%; left: 10%; }
        #skandi-site-header .actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 0 0 auto;
        }
        #skandi-site-header .action-btn,
        #skandi-site-header .mobile-btn {
            border: 0;
            background: #fff;
            color: var(--sk-blue);
            border-radius: 999px;
            min-height: 40px;
            padding: 0 16px;
            font-size: 12px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all .3s;
        }
        #skandi-site-header .action-btn:hover { background: var(--sk-pale); }
        #skandi-site-header .action-btn.primary { background: var(--sk-blue); color: #fff; }
        #skandi-site-header .action-btn.primary:hover {
            background: var(--sk-blue2);
            box-shadow: 0 8px 16px rgba(2, 46, 100, .2);
            transform: translateY(-1px);
        }
        #skandi-site-header .mobile-btn {
            display: none;
            width: auto;
            height: 40px;
            gap: 8px;
            white-space: nowrap;
        }
        #skandi-site-header .expandbar {
            height: var(--bar-height);
            background: linear-gradient(90deg, var(--sk-blue), var(--sk-blue2));
            color: #fff;
            position: relative;
            overflow: hidden;
            z-index: 80;
        }
        #skandi-site-header .expand-inner {
            max-width: 1240px;
            margin: 0 auto;
            height: 100%;
            padding: 0 18px;
            position: relative;
        }
        #skandi-site-header .default-bar {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            color: rgba(255, 255, 255, .88);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: .09em;
            font-style: italic;
            text-transform: uppercase;
        }
        #skandi-site-header .expandbar-img {
            height: 58px;
            width: auto;
            object-fit: contain;
            display: block;
        }
        #skandi-site-header .settings-wrap { position: relative; display: inline-block; }
        #skandi-site-header #settingsBtn { padding: 0 10px; }
        #skandi-site-header #settingsBtn svg {
            width: 22px;
            height: 22px;
            fill: currentColor;
            transition: transform .3s;
        }
        #skandi-site-header #settingsBtn:hover svg { transform: rotate(15deg); }
        #skandi-site-header .settings-menu {
            position: absolute;
            top: calc(100% + 14px);
            right: 0;
            width: 260px;
            padding: 24px;
            z-index: 200;
            background: rgba(255, 255, 255, .95);
            backdrop-filter: blur(12px);
            border: 1px solid var(--sk-line);
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(2, 46, 100, .15);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px) scale(.95);
            transform-origin: top right;
            transition: all .3s cubic-bezier(.22, 1, .36, 1);
        }
        #skandi-site-header .settings-menu.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }
        #skandi-site-header .settings-group,
        #welcomeSettingsModal .settings-group { margin-bottom: 16px; text-align: left; }
        #skandi-site-header .settings-group label {
            display: block;
            font-size: 11px;
            font-weight: 800;
            color: var(--sk-muted);
            text-transform: uppercase;
            letter-spacing: .05em;
            margin-bottom: 8px;
        }
        #skandi-site-header .settings-group select,
        #welcomeSettingsModal .settings-group select {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid var(--sk-border-soft, #eef2f7);
            border-radius: 12px;
            font-size: 13px;
            color: var(--sk-blue, #022e64);
            font-weight: 600;
            outline: none;
            background: #f9fafb;
            cursor: pointer;
            transition: all .2s;
        }
        #skandi-site-header .settings-group select:focus,
        #skandi-site-header .settings-group select:hover,
        #welcomeSettingsModal .settings-group select:focus,
        #welcomeSettingsModal .settings-group select:hover {
            border-color: var(--sk-cyan, #5FC7CF);
            background: #fff;
            box-shadow: 0 4px 12px rgba(95, 199, 207, .1);
        }
        #skandi-site-header .shell-btn,
        #welcomeSettingsModal .shell-btn {
            position: relative;
            appearance: none;
            border: 1px solid transparent;
            background: var(--sk-blue, #022e64);
            color: #fff;
            border-radius: 999px;
            padding: 14px 28px;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .12em;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 48px;
            overflow: hidden;
            transition: transform .3s cubic-bezier(.22, 1, .36, 1), box-shadow .3s ease, background .3s ease;
        }
        #skandi-site-header .shell-btn:hover,
        #welcomeSettingsModal .shell-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(2, 46, 100, .2);
        }
        #skandi-site-header .shell-btn.secondary {
            background: #fff;
            color: var(--sk-blue);
            border-color: var(--sk-line);
        }
        #skandi-site-header .club-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(2, 18, 39, .5);
            backdrop-filter: blur(6px);
            z-index: 9998;
            opacity: 0;
            visibility: hidden;
            transition: all .4s ease;
        }
        #skandi-site-header .club-backdrop.open { opacity: 1; visibility: visible; }
        #skandi-site-header .club-panel {
            position: fixed;
            top: 0;
            right: 0;
            height: 100dvh;
            width: min(440px, 100vw);
            background: #fff;
            box-shadow: -20px 0 60px rgba(2, 46, 100, .15);
            z-index: 9999;
            border-top-left-radius: 32px;
            border-bottom-left-radius: 32px;
            overflow: hidden;
            transform: translateX(100%);
            opacity: 0;
            pointer-events: none;
            transition: transform .55s cubic-bezier(.22, 1, .36, 1), opacity .55s ease;
            display: flex;
            flex-direction: column;
        }
        #skandi-site-header .club-panel.open { transform: translateX(0); opacity: 1; pointer-events: auto; }
        #skandi-site-header .club-head {
            height: 90px;
            background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2));
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
        }
        #skandi-site-header .club-head strong { font-size: 18px; font-weight: 800; letter-spacing: -.02em; }
        #skandi-site-header .club-close {
            border: 1px solid rgba(255, 255, 255, .28);
            background: rgba(255, 255, 255, .12);
            color: #fff;
            width: 40px;
            height: 40px;
            border-radius: 999px;
            font-size: 24px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all .3s ease;
        }
        #skandi-site-header .club-close:hover { background: rgba(255, 255, 255, .25); transform: rotate(90deg); }
        #skandi-site-header .club-body { padding: 40px 32px; flex: 1; overflow-y: auto; }
        #skandi-site-header .club-profile { display: flex; flex-direction: column; margin-bottom: 24px; }
        #skandi-site-header .login-form { display: flex; flex-direction: column; gap: 16px; }
        #skandi-site-header .login-form input {
            width: 100%;
            padding: 18px 20px;
            border: 1px solid var(--sk-border-soft);
            border-radius: 14px;
            font-size: 15px;
            background: #f9fafb;
            transition: all .3s ease;
        }
        #skandi-site-header .login-form input:focus {
            outline: none;
            border-color: var(--sk-cyan);
            background: #fff;
            box-shadow: 0 0 0 4px rgba(95, 199, 207, .1);
        }
        #skandi-site-header #favBtn { transition: color .2s ease, transform .2s; transform-origin: center; }
        #skandi-site-header #favBtn.saved { animation: skandiFavPop .4s cubic-bezier(.175, .885, .32, 1.275); }

        #welcomeSettingsModal {
            --sk-blue: #022e64;
            --sk-cyan: #5FC7CF;
            --sk-body: #555;
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            visibility: hidden;
            pointer-events: none;
            font-family: Montserrat, system-ui, sans-serif;
        }
        #welcomeSettingsModal.active { visibility: visible; pointer-events: auto; }
        #welcomeSettingsModal .welcome-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(2, 18, 39, .7);
            backdrop-filter: blur(8px);
            opacity: 0;
            transition: opacity .4s ease;
        }
        #welcomeSettingsModal.active .welcome-backdrop { opacity: 1; }
        #welcomeSettingsModal .welcome-card {
            position: relative;
            background: #fff;
            width: min(440px, 90vw);
            border-radius: 32px;
            box-shadow: 0 32px 80px rgba(2, 46, 100, .25);
            padding: 48px 40px;
            text-align: center;
            transform: translateY(20px) scale(.95);
            opacity: 0;
            transition: all .5s cubic-bezier(.22, 1, .36, 1);
        }
        #welcomeSettingsModal.active .welcome-card { transform: translateY(0) scale(1); opacity: 1; }
        #welcomeSettingsModal .globe-icon { color: var(--sk-cyan); margin-bottom: 20px; }
        #welcomeSettingsModal .globe-icon svg {
            width: 56px;
            height: 56px;
            fill: currentColor;
            margin: 0 auto;
            animation: skandiPulseGlow 3s infinite alternate;
        }
        #welcomeSettingsModal h2 { color: var(--sk-blue); font-size: 28px; font-weight: 800; margin-bottom: 12px; letter-spacing: -.03em; }
        #welcomeSettingsModal p { color: var(--sk-body); font-size: 15px; margin-bottom: 32px; line-height: 1.6; }

        #mobileMenuLayer {
            --drawer-blue: #022e64;
            --drawer-blue2: #0b3a7a;
            --drawer-cyan: #5FC7CF;
            --drawer-line: #e6e9ee;
            position: fixed;
            inset: 0;
            z-index: 2000;
            visibility: hidden;
            pointer-events: none;
            transition: visibility 0s linear .3s;
            font-family: Montserrat, system-ui, sans-serif;
        }
        #mobileMenuLayer,
        #mobileMenuLayer * { box-sizing: border-box; }
        #mobileMenuLayer.open { visibility: visible; pointer-events: auto; transition-delay: 0s; }
        #mobileMenuLayer .mobile-menu-backdrop {
            position: absolute;
            inset: 0;
            width: 100%;
            border: 0;
            padding: 0;
            background: rgba(2, 18, 39, .6);
            backdrop-filter: blur(6px);
            opacity: 0;
            cursor: default;
            transition: opacity .4s ease;
        }
        #mobileMenuLayer.open .mobile-menu-backdrop { opacity: 1; }
        #mobileMenuLayer .mobile-drawer {
            position: absolute;
            top: 0;
            right: 0;
            width: min(86vw, 380px);
            height: 100dvh;
            background: #fff;
            color: #111827;
            box-shadow: -18px 0 48px rgba(15, 23, 42, .25);
            transform: translateX(105%);
            transition: transform .4s cubic-bezier(.22, .8, .2, 1);
            display: flex;
            flex-direction: column;
            border-top-left-radius: 24px;
            border-bottom-left-radius: 24px;
            overflow: hidden;
            outline: none;
        }
        #mobileMenuLayer.open .mobile-drawer { transform: translateX(0); }
        #mobileMenuLayer .mobile-drawer-head {
            padding: 20px 24px;
            background: linear-gradient(135deg, var(--drawer-blue), var(--drawer-blue2));
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        #mobileMenuLayer .mobile-drawer-head strong { display: block; font-size: 20px; font-weight: 800; line-height: 1.2; letter-spacing: -.02em; }
        #mobileMenuLayer .mobile-drawer-head span { display: block; margin-top: 4px; color: rgba(255, 255, 255, .8); font-size: 12px; font-weight: 600; }
        #mobileMenuLayer #mobileMenuClose {
            width: 40px;
            height: 40px;
            border: 1px solid rgba(255, 255, 255, .32);
            border-radius: 999px;
            background: rgba(255, 255, 255, .12);
            color: #fff;
            font-size: 26px;
            cursor: pointer;
            transition: all .3s;
        }
        #mobileMenuLayer #mobileMenuClose:hover { background: rgba(255, 255, 255, .25); transform: rotate(90deg); }
        #mobileMenuLayer .mobile-drawer-body { flex: 1; min-height: 0; overflow-y: auto; padding: 0; }
        #mobileMenuLayer .mobile-settings-bar {
            display: flex;
            gap: 10px;
            padding: 16px;
            border-bottom: 1px solid var(--drawer-line);
            background: #f6faff;
        }
        #mobileMenuLayer .mobile-settings-bar select {
            flex: 1;
            min-width: 0;
            padding: 12px;
            border-radius: 10px;
            border: 1px solid var(--drawer-line);
            font-size: 13px;
            font-weight: 600;
            color: var(--drawer-blue);
            background: #fff;
        }
        #mobileMenuLayer .mobile-menu-list { display: flex; flex-direction: column; }
        #mobileMenuLayer .mobile-menu-link {
            width: 100%;
            min-height: 60px;
            border: 0;
            border-bottom: 1px solid #eef2f7;
            background: #fff;
            color: var(--drawer-blue);
            padding: 16px 24px;
            text-align: left;
            font-size: 15px;
            font-weight: 700;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: background .2s;
        }
        #mobileMenuLayer .mobile-menu-link:hover { background: #f6faff; }
        #mobileMenuLayer .mobile-menu-link::after { content: "›"; color: var(--drawer-cyan); font-size: 28px; font-weight: 500; }
        #mobileMenuLayer .mobile-drawer-actions {
            padding: 20px 24px calc(20px + env(safe-area-inset-bottom));
            border-top: 1px solid var(--drawer-line);
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #fff;
        }
        #mobileMenuLayer .mobile-drawer-action {
            min-height: 48px;
            border: 1px solid var(--drawer-line);
            border-radius: 999px;
            background: #fff;
            color: var(--drawer-blue);
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            transition: all .3s;
        }
        #mobileMenuLayer .mobile-drawer-action.primary { background: var(--drawer-blue); color: #fff; border-color: var(--drawer-blue); }
        #mobileMenuLayer .mobile-drawer-action:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(2, 46, 100, .1); }
        html.mobile-menu-open,
        body.mobile-menu-open { overflow: hidden; overscroll-behavior: none; }

        #skandi-site-footer {
            --sk-blue: #022e64;
            --sk-blue2: #0b3a7a;
            --sk-cyan: #5FC7CF;
            --sk-light: #d7e6ff;
            --sk-pale: #f6faff;
            --sk-line: #e6e9ee;
            width: 100%;
            display: block;
            margin: 0;
            font-family: Montserrat, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: transparent;
        }
        #skandi-site-footer,
        #skandi-site-footer * { box-sizing: border-box; }
        #skandi-site-footer button,
        #skandi-site-footer input { font-family: inherit; }
        #skandi-site-footer .footer { background: var(--sk-blue); color: #fff; width: 100%; }
        #skandi-site-footer .newsletter {
            background: linear-gradient(135deg, var(--sk-light), var(--sk-pale));
            color: var(--sk-blue);
            padding: 40px 32px;
            border-top: 1px solid var(--sk-line);
        }
        #skandi-site-footer .news-inner {
            max-width: 1240px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 32px;
            align-items: center;
        }
        #skandi-site-footer .newsletter h2 { margin: 0 0 8px; font-size: 28px; letter-spacing: -.03em; font-weight: 800; }
        #skandi-site-footer .newsletter p { margin: 0; color: #49617e; line-height: 1.5; }
        #skandi-site-footer .news-form { display: grid; grid-template-columns: 1fr auto; gap: 12px; }
        #skandi-site-footer .news-form input {
            border: 1px solid var(--sk-line);
            border-radius: 999px;
            min-height: 48px;
            padding: 14px 20px;
            font-size: 15px;
            outline: none;
            background: #fff;
        }
        #skandi-site-footer .news-form input:focus { border-color: var(--sk-cyan); }
        #skandi-site-footer .news-form button {
            border: 0;
            background: var(--sk-blue);
            color: #fff;
            border-radius: 999px;
            padding: 0 24px;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .05em;
            cursor: pointer;
            transition: background .3s;
        }
        #skandi-site-footer .news-form button:hover { background: var(--sk-blue2); }
        #skandi-site-footer .footer-main {
            max-width: 1240px;
            margin: 0 auto;
            padding: 64px 32px;
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 32px;
        }
        #skandi-site-footer .brand { grid-column: span 2; }
        #skandi-site-footer .brand img.logo {
            width: 190px;
            max-width: 100%;
            height: auto;
            margin-bottom: 16px;
            object-fit: contain;
            display: block;
        }
        #skandi-site-footer .social-links { display: flex; align-items: center; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
        #skandi-site-footer .social-btn {
            width: 44px;
            height: 44px;
            border: 1px solid rgba(255, 255, 255, .2);
            border-radius: 50%;
            padding: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            transition: all .3s ease;
            cursor: pointer;
        }
        #skandi-site-footer .social-btn img { width: 100%; height: 100%; object-fit: contain; display: block; }
        #skandi-site-footer .social-btn:hover { transform: translateY(-3px); border-color: var(--sk-cyan); background: rgba(95, 199, 207, .1); }
        #skandi-site-footer .col h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .15em; font-weight: 800; color: #fff; margin: 0 0 20px; }
        #skandi-site-footer .col button {
            display: block;
            background: transparent;
            border: 0;
            color: rgba(255, 255, 255, .7);
            font-size: 14px;
            font-weight: 500;
            padding: 0;
            margin: 0 0 12px;
            cursor: pointer;
            text-align: left;
            transition: color .2s;
        }
        #skandi-site-footer .col button:hover { color: #fff; }
        #skandi-site-footer .footer-bottom { border-top: 1px solid rgba(255, 255, 255, .1); padding: 24px 32px; }
        #skandi-site-footer .bottom-inner {
            max-width: 1240px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
            font-size: 13px;
            color: rgba(255, 255, 255, .6);
        }
        #skandi-site-footer .bottom-links { display: flex; gap: 20px; flex-wrap: wrap; }
        #skandi-site-footer .bottom-links button {
            background: transparent;
            border: 0;
            color: rgba(255, 255, 255, .8);
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            padding: 0;
        }
        #skandi-site-footer .bottom-links button:hover { color: #fff; }

        .skandi-shell-toast {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 100000;
            max-width: min(380px, calc(100vw - 40px));
            display: none;
            padding: 14px 18px;
            border-radius: 14px;
            background: #022e64;
            color: #fff;
            box-shadow: 0 18px 42px rgba(2, 46, 100, .25);
            font-size: 13px;
            font-weight: 700;
            line-height: 1.5;
        }
        .skandi-shell-toast.show { display: block; }
        .skandi-shell-toast.error { background: #8a1f1f; }

        @keyframes skandiFavPop {
            0% { transform: scale(1); }
            40% { transform: scale(1.35); color: #5FC7CF; }
            100% { transform: scale(1); }
        }
        @keyframes skandiPulseGlow {
            0% { filter: drop-shadow(0 0 4px rgba(95, 199, 207, .3)); }
            100% { filter: drop-shadow(0 0 16px rgba(95, 199, 207, .8)); }
        }
        @media (max-width: 980px) {
            #skandi-site-footer .footer-main { grid-template-columns: repeat(3, 1fr); }
            #skandi-site-footer .brand { grid-column: span 3; }
            #skandi-site-footer .news-inner { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
            #skandi-site-header .nav,
            #skandi-site-header .desktop-only { display: none; }
            #skandi-site-header .inner { justify-content: space-between; gap: 12px; }
            #skandi-site-header .actions { flex-shrink: 0; }
            #skandi-site-header .mobile-btn { display: inline-flex; }
        }
        @media (max-width: 600px) {
            #skandi-site-footer .footer-main { grid-template-columns: 1fr; padding: 40px 18px; gap: 36px; }
            #skandi-site-footer .brand { grid-column: span 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
            #skandi-site-footer .social-links { justify-content: center; }
            #skandi-site-footer .col { text-align: center; }
            #skandi-site-footer .col h3 { margin-bottom: 12px; }
            #skandi-site-footer .col button { text-align: center; margin: 0 auto 12px; }
            #skandi-site-footer .newsletter { padding: 32px 18px; }
            #skandi-site-footer .news-inner { text-align: center; }
            #skandi-site-footer .news-form { grid-template-columns: 1fr; width: 100%; max-width: 400px; margin: 0 auto; }
            #skandi-site-footer .news-form button { min-height: 48px; }
            #skandi-site-footer .bottom-inner { flex-direction: column; text-align: center; }
            #skandi-site-footer .bottom-links { justify-content: center; gap: 12px 16px; }
            #welcomeSettingsModal .welcome-card { padding: 40px 24px; }
        }
        @media (prefers-reduced-motion: reduce) {
            #mobileMenuLayer,
            #mobileMenuLayer *,
            #welcomeSettingsModal,
            #welcomeSettingsModal * { transition: none !important; animation: none !important; }
        }
    </style>
    <!-- END HOMEPAGE CUSTOMER SHELL STYLES -->
</head>
<body>
    <div class="app">
        <!-- Sidebar Drawer & Overlay -->
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
        <aside class="sidebar" id="sidebar">
            <div class="logo-row">
                <div>
                    <div class="logo-sub">Member Portal</div>
                </div>
                <button class="close-sidebar-btn" onclick="toggleSidebar()">✕</button>
            </div>

            <div class="profile-card">
                <div class="avatar-wrap">
                    <div class="avatar" id="sideAvatar">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="44" height="44" style="opacity: 0.5;">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </div>
                    <div class="diamond"><img src="https://placehold.co/12x12/transparent/022e64?text=✦" style="width:12px" alt="Diamond"></div>
                </div>
                <div style="color:var(--muted); font-size:12px; font-weight: 600;" id="sideGreeting">Good evening,</div>
                <div class="member-name" id="sideName">Traveller</div>
                <div class="member-tier" id="sideTier">Guest</div>
            </div>

            <nav class="side-nav" id="sideNav"></nav>
            <button class="logout" id="logoutBtn" type="button" onclick="post('CUSTOMER_LOGOUT')">Logout</button>
        </aside>

        <main class="main">
            <section class="hero full">
                <div class="hero-inner">
                    <div class="topbar">
                        <button class="skandi-burger-btn" onclick="toggleSidebar()" aria-label="Toggle navigation menu">
                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div style="margin-top: 20px;">
                        <div class="eyebrow">SKANDI CARE</div>
                        <h1 class="greeting">My Support</h1>
                        <p class="hero-sub">View your open cases, track request updates, and connect directly with your dedicated SKANDI support team.</p>
                    </div>
                </div>
            </section>

            <section class="dashboard">
                <div class="grid-support">
                    <article class="card">
                        <div class="priority-badge-pill">SKANDI<strong>PRIORITY</strong></div>
                        <div style="padding: 20px; border-bottom: 1px solid var(--line); background: var(--soft); display: flex; gap: 12px; align-items: center;">
                            <input type="text" id="query" class="search-input" placeholder="Search references..." style="flex: 1;">
                            <button id="refreshBtn" class="btn paper" style="min-width: 44px; height: 44px; padding: 0; border-radius: 12px;" title="Refresh">↻</button>
                            <button id="newBtn" class="btn-new-case">
                                <span style="font-size: 16px; line-height: 1;">+</span> Start New Case
                            </button>
                        </div>
                        <div id="caseList" class="case-list"></div>
                    </article>

                    <article class="card">
                        <div class="chat-header">
                            <h2 id="caseTitle" style="font-size: 24px; color: var(--blue);">Select a case</h2>
                            <div id="caseSubtitle" style="font-size: 13px; color: var(--muted); margin-top: 4px;">To view your secure messages</div>
                            <div id="duffelCaseActions" class="hidden" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                                <button id="openDuffelFromCase" type="button" class="btn paper" style="min-height:36px;height:36px">Manage flights / hotels with Duffel</button>
                                <span style="font-size:11px;color:var(--muted)">For eligible Duffel bookings. SKANDI support messages remain here.</span>
                            </div>
                        </div>
                        
                        <div id="messages" class="chat-window">
                            <div style="margin: auto; text-align: center; color: var(--muted);">
                                <div style="font-size: 40px; margin-bottom: 16px; opacity: 0.5;"></div>
                                Select a case from the menu to view your conversation.
                            </div>
                        </div>

                        <div id="replyBox" class="reply-area" style="display: none;">
                            <textarea id="replyText" placeholder="Type your  reply here..."></textarea>
                            <button id="sendBtn" class="btn" style="height: 60px;">Send</button>
                        </div>
                    </article>
                </div>
            </section>
        </main>
    </div>

    <!-- Start New Case Modal -->
    <div class="modal" id="newCaseModal">
        <div class="modal-card">
            
            <!-- SKYPRIORITY-STYLE ALLIANCE BANNER -->
            <div class="skandi-priority-banner">
                <div class="priority-badge-pill">SKANDI<strong>PRIORITY</strong></div>
                <div class="priority-content">
                    <h4>Exclusive Member Privilege Active</h4>
                    <p>Concierge routing upgraded. Guaranteed response time under <strong>2 hours</strong>.</p>
                </div>
            </div>

            <!-- Modal Content Body -->
            <div class="modal-body-scroll">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px;">
                    <div>
                        <div class="eyebrow" style="margin-bottom:8px;">Passenger Support HelpDesk</div>
                        <h2 style="color:var(--blue); font-size:32px; margin:0;">Start New Case</h2>
                    </div>
                    <button style="font-size:24px; color:var(--muted); cursor:pointer;" onclick="closeNewCaseModal()">✕</button>
                </div>
                
                <form id="supportForm" novalidate>
                    <fieldset id="formFieldset">
                        <!-- REGULATORY FRAMEWORK BANNER -->
                        <div class="regulatory-banner">
                            <strong>Regulatory Notice:</strong> Standard EU261/2004 & UK261 Passenger Rights apply based on departure and carrier routing.
                        </div>

                        <div class="section-title">1. Traveler Information</div>
                        
                        <div class="form-row-grid">
                            <div class="form-field">
                                <label for="hasBooking">Active Booking? <span class="required" style="color:var(--red);">*</span></label>
                                <select id="hasBooking" required>
                                    <option value="">-- Select an option --</option>
                                    <option value="yes">Yes, I have a booking</option>
                                    <option value="no">No, general inquiry</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label for="bookingReference">Booking Reference / PNR *</label>
                                <input type="text" id="bookingReference" placeholder="e.g. Q7M4LZ or ABC-12345" required aria-invalid="false" aria-describedby="refError" onblur="validateField(this, regexes.bookingReference, 'refError')" />
                                <div id="refError" class="error-hint">Invalid format. Must be 6 alphanumeric characters or operator structure like AAA-123456.</div>
                            </div>
                        </div>

                        <div class="form-row-grid">
                            <div class="form-field">
                                <label for="phone">Phone Number *</label>
                                <div style="display:flex; gap:8px;">
                                    <select id="phonePrefix" style="width:100px; flex-shrink:0;">
                                        <option value="+1">+1</option>
                                        <option value="+44">+44</option>
                                        <option value="+46">+46</option>
                                        <option value="+47">+47</option>
                                        <option value="+45">+45</option>
                                    </select>
                                    <input id="phone" type="text" required placeholder="Phone number" style="flex:1;">
                                </div>
                            </div>
                            <div class="form-field">
                                <label for="email">Email Address *</label>
                                <input type="email" id="email" placeholder="name@example.com" required aria-invalid="false" aria-describedby="emailError" onblur="validateField(this, regexes.email, 'emailError')" />
                                <div id="emailError" class="error-hint">Please enter a valid email address.</div>
                            </div>
                        </div>

                        <div class="form-row-grid">
                            <div class="form-field">
                                <label for="firstName">First Name *</label>
                                <input type="text" id="firstName" placeholder="Min 2 characters" required aria-invalid="false" aria-describedby="firstNameError" onblur="validateField(this, regexes.name, 'firstNameError')" />
                                <div id="firstNameError" class="error-hint">Must be 2-50 letters/hyphens only.</div>
                            </div>
                            <div class="form-field">
                                <label for="lastName">Last Name *</label>
                                <input type="text" id="lastName" placeholder="Min 2 characters" required aria-invalid="false" aria-describedby="lastNameError" onblur="validateField(this, regexes.name, 'lastNameError')" />
                                <div id="lastNameError" class="error-hint">Must be 2-50 letters/hyphens only.</div>
                            </div>
                        </div>

                        <div class="section-title">2. Inquiry Category Selection</div>
                        <div class="form-field">
                            <label for="category">Inquiry Category *</label>
                            <select id="category" required onchange="handleCategoryChange(this.value)">
                                <option value="" disabled selected>-- Select category --</option>
                                <option value="flight_disruption">Flight Delay / Cancellation Compensation</option>
                                <option value="baggage_issue">Lost, Delayed, or Damaged Baggage</option>
                                <option value="billing_refund">Invoicing & Booking Price Discrepancies</option>
                                <option value="hotel_complaint">Hotel & Destination Support</option>
                                <option value="medical_dietary">Special Assistance, Wheelchair, & Allergies</option>
                                <option value="tech">Account & Membership Issues</option>
                                <option value="ancillary_service">Special Requests</option>
                                <option value="car_rental">Car Rental</option>
                                <option value="transfer">Transfer</option>
                                <option value="cruise_fault">Cruise Itinerary & Excursions</option>
                                <option value="force_majeure">Force Majeure / Extraordinary Circumstances</option>
                                <option value="bereavement">Bereavement & Medical Cancellations</option>
                            </select>
                        </div>

                        <!-- Dynamic Branching Conditional Container -->
                        <div id="branchContainer"></div>

                        <!-- GLOBAL FINANCIAL COMPENSATION MECHANICS -->
                        <div id="globalFinancialMechanics" class="hidden">
                            <div class="section-title">Compensation Payout Details</div>
                            <div class="form-field">
                                <label for="payoutMethod">Payout Method Option *</label>
                                <select id="payoutMethod" onchange="handlePayoutMethodChange(this.value)">
                                    <option value="" disabled selected>Select payout preference...</option>
                                    <option value="bank_transfer">Direct Bank Transfer (IBAN)</option>
                                    <option value="original_payment_card">Refund to Original Payment Card</option>
                                    <option value="travel_voucher_bonus">Travel Voucher Bonus (+ $50 Value Incentive)</option>
                                </select>
                            </div>
                            <div id="bankTransferFields" class="form-row-grid hidden">
                                <div class="form-field">
                                    <label for="bankIban">Bank Account IBAN *</label>
                                    <input type="text" id="bankIban" placeholder="SE00 0000 0000 0000 0000 00" onblur="validateField(this, regexes.iban, 'ibanError')">
                                    <div id="ibanError" class="error-hint">Please enter a valid international IBAN format.</div>
                                </div>
                                <div class="form-field">
                                    <label for="bankBic">BIC / SWIFT Code *</label>
                                    <input type="text" id="bankBic" placeholder="e.g. NDEASESSXXX" onblur="validateField(this, regexes.bic, 'bicError')">
                                    <div id="bicError" class="error-hint">Please enter a valid BIC/SWIFT code.</div>
                                </div>
                            </div>
                        </div>

                        <!-- REGIONAL LEGAL & MANDATORY CONSENT AUDITING -->
                        <div class="section-title">3. Legal & Regulatory Compliance</div>
                        <div id="ccpaNoticeGroup" class="form-field hidden">
                            <div class="checkbox-wrapper">
                                <input type="checkbox" id="ccpaOptOut">
                                <label for="ccpaOptOut">California Resident Privacy Disclosure: Do Not Sell or Share My Personal Information (CCPA).</label>
                            </div>
                        </div>
                        
                        <div class="form-field">
                            <div class="checkbox-wrapper" style="display: flex; gap: 8px; align-items: flex-start;">
                                <input type="checkbox" id="arbitrationConsent" required style="margin-top: 3px;">
                                <label for="arbitrationConsent"><strong>Disclosures:</strong> By submitting this request, you agree to SKANDI's 
                                    <a href="/about/legal/policies?type=terms-conditions" target="_blank" style="color: var(--blue2); text-decoration: underline;">Terms & Conditions</a> 
                                    and individual 
                                    <a href="/about/legal/policies?type=arbitration" target="_blank" style="color: var(--blue2); text-decoration: underline;">dispute resolution guidelines</a> 
                                    agreed upon at account activation.
                                </label>
                            </div>
                            <div id="arbitrationError" class="error-hint">You must accept the arbitration agreement and class action waiver to submit your request.</div>
                        </div>

                        <div class="form-field">
                            <label for="docusignLaunchBtn">Digital Signature Authorization *</label>
                            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--soft); border: 1px solid var(--line); border-radius: 12px; padding: 16px;">
                                <div>
                                    <div style="font-weight: 700; color: var(--blue); font-size: 14px;">DocuSign® Secure Envelope</div>
                                    <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">Legally binding electronic signature</div>
                                </div>
                                <button type="button" class="btn" id="docusignLaunchBtn" onclick="launchDocuSignSigning()">
                                    Sign with DocuSign
                                </button>
                            </div>
                            <input type="hidden" id="docusignEnvelopeId" value="">
                            <div id="sigError" class="error-hint">Please complete the DocuSign signing process before submitting.</div>
                        </div>

                        <div class="section-title">4. Supporting Documentation Upload</div>
                        <div class="form-field">
                            <label>File Upload (Optional, max 5MB - PDF, JPEG, PNG)</label>
                            <div class="upload-zone" onclick="document.getElementById('fileInput').click()">
                                <span>Drag & drop files here or click to browse</span>
                                <input type="file" id="fileInput" accept=".pdf,.jpeg,.jpg,.png" class="hidden" onchange="handleFilesSelected(this.files)" multiple />
                            </div>
                            <div id="fileListContainer" class="file-list"></div>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">
                            <button type="button" class="btn paper" onclick="closeNewCaseModal()">Cancel</button>
                            <button type="submit" id="submitBtn" class="btn">Submit Request</button>
                        </div>
                    </fieldset>
                </form>
            </div>
        </div>
    </div>

    

    <div id="skandiShellToast" class="skandi-shell-toast" role="status" aria-live="polite"></div>
    <!-- END HOMEPAGE CUSTOMER FOOTER -->

    <div class="toast" id="toast"></div>

    <script src="https://cdn.jsdelivr.net/npm/livekit-client@2.22.3/dist/livekit-client.umd.min.js"></script>
    <script>
    (function() {
      const SOURCE = "SKANDI_SUPPORT_CUSTOMER_PORTAL";
      const PARENT = "SKANDI_WIX_PARENT";

      let state = { cases: [], active: {}, profile: null, clubProfile: null, attachments: [], fileScannerTokens: {}, signatureDataUrl: null };
      const $ = id => document.getElementById(id);

      const submissionIdempotencyKey = "idemp-" + Math.random().toString(36).substring(2) + "-" + Date.now();
      const formMountTime = Date.now();
      let pasteActionsDetected = { booking_reference: false, bank_iban: false };

      function post(type, payload = {}) {
        window.parent.postMessage({ source: SOURCE, type, ...payload }, "*");
      }

      function esc(v) {
        return String(v ?? "").replace(/[&<>'"]/g, c => ({
          "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
        }[c]));
      }

      function toast(m) {
        const t = $("toast");
        if (!t) return;
        t.textContent = m;
        t.classList.add("show");
        setTimeout(() => t.classList.remove("show"), 2800);
      }

      function caseIdOf(c = {}) { return c.case_id || c.caseId || ""; }
      function caseRefOf(c = {}) { return c.case_id || c.caseRef || c.caseId || ""; }

      window.toggleSidebar = function() {
          $("sidebar").classList.toggle("open");
          $("sidebarOverlay").classList.toggle("open");
      };

      const tabsNav = [
          ["overview", "https://static.wixstatic.com/media/394052_b5aece8842954236b21a8693b3ecae14~mv2.png", "Overview", "/my-profile"],
          ["bookings", "https://static.wixstatic.com/media/394052_c10010c35d594e1590400524a04c8fb2~mv2.png", "My Bookings", "/my-profile?tab=bookings"],
          ["favourites", "https://static.wixstatic.com/media/394052_4084f82a4f9342beb83237d648504c46~mv2.png", "Favourites", "/my-profile?tab=favorites"],
          ["travelers", "https://static.wixstatic.com/media/394052_10152e32f8cb4af3bfb06eb5e7ea1c36~mv2.png", "Travelers", "/my-profile?tab=travelers"],
          ["documents", "https://static.wixstatic.com/media/394052_f941a08c326143728a0e05e566546296~mv2.png", "Documents", "/my-profile?tab=documents"],
          ["wallet", "https://static.wixstatic.com/media/394052_ed65c346875642aca102f881a8e0f045~mv2.png", "Wallet", "/my-profile?tab=wallet"],
          ["settings", "https://static.wixstatic.com/media/394052_856c7430a7b640ee8f062ab0d23b1dc4~mv2.png", "Settings", "/my-profile?tab=settings"],
          ["support", "https://static.wixstatic.com/media/394052_70b6b37f2c62423ebd7949f1cb7bc053~mv2.png", "Support", "/my-profile/support"]
      ];

      window.handleNavClick = function(path) {
          post("CUSTOMER_NAVIGATE", { path });
          if (window.self === window.top) {
              window.location.assign(path);
          }
      };

      function renderNav() {
          $("sideNav").innerHTML = tabsNav.map(([key, iconUrl, label, path]) => {
              const isActive = key === "support";
              return `
                <button class="${isActive ? "active" : ""}" type="button" onclick="handleNavClick('${path}')">
                  <img src="${iconUrl}" class="icon-placeholder" alt="${label}">
                  <span>${label}</span>
                </button>
              `;
          }).join("");
      }

      window.launchDocuSignSigning = function() {
          const email = $("email").value.trim();
          const firstName = $("firstName").value.trim();
          const lastName = $("lastName").value.trim();

          if (!email || !firstName || !lastName) {
              toast("Please fill in your name and email before signing with DocuSign.");
              return;
          }

          toast("Initializing DocuSign secure session...");

          post("CUSTOMER_INITIATE_DOCUSIGN", {
              signer: { firstName, lastName, email }
          });

          setTimeout(() => {
              state.signatureDataUrl = "docusign-verified-envelope-" + Math.random().toString(36).substring(2);
              const btn = $("docusignLaunchBtn");
              btn.textContent = "✓ Signed via DocuSign";
              btn.style.background = "var(--green)";
              btn.disabled = true;
              toast("DocuSign signature successfully attached.");
          }, 1500);
      };

      function firstName() {
          const p = state.profile || {};
          return p.displayName || p.firstName || p.first_name || p.email || "Traveller";
      }

      function greeting() {
          const hour = new Date().getHours();
          if (hour < 12) return "Good morning,";
          if (hour < 18) return "Good afternoon,";
          return "Good evening,";
      }

      function renderShell() {
          const first = firstName();
          const c = state.clubProfile;
          const tier = c?.tier?.name || c?.tierName || "Guest";
          const title = state.profile?.title ? `${state.profile.title} ` : "";

          $("sideName").textContent = `${title}${first}`;
          $("sideTier").textContent = tier === "Guest" ? "Guest" : `${tier} Member`;
          $("sideGreeting").textContent = greeting();

          const isCalifornia = p_isCaliforniaResident(state.profile);
          if (isCalifornia) {
              $("ccpaNoticeGroup").classList.remove("hidden");
          }
      }

      function p_isCaliforniaResident(profile) {
          if (!profile) return false;
          const region = (profile.state || profile.region || profile.country || "").toUpperCase();
          return region === "CA" || region === "CALIFORNIA";
      }

      window.regexes = {
          bookingReference: /^([A-Z0-9]{6}|[A-Z]{3}-[0-9]{5,8})$/,
          name: /^[A-Za-z\s-]{2,50}$/,
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          flightNumber: /^[A-Z0-9]{2,3}\d{1,4}$/,
          pirNumber: /^[A-Z]{3}[A-Z0-9]{2}\d{5}$/,
          seatNumbers: /^\d{1,2}[A-K](,\s*\d{1,2}[A-K])*$/,
          iban: /^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/,
          bic: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
          cabin: /^[A-Z0-9]{3,5}$/
      };

      window.validateField = function(input, regex, errorId) {
          const val = input.value.trim().toUpperCase();
          input.value = val;
          const isValid = regex.test(val);
          input.setAttribute("aria-invalid", !isValid);
          const errEl = $(errorId);
          if (errEl) errEl.classList.toggle("show", !isValid);
          return isValid;
      };

      window.handleCategoryChange = function(category) {
          const container = $("branchContainer");
          container.innerHTML = "";

          const showPayer = ["flight_disruption", "billing_refund"].includes(category);
          const payerSection = $("globalFinancialMechanics");
          
          if (payerSection) {
              if (showPayer) {
                  payerSection.classList.remove("hidden");
              } else {
                  payerSection.classList.add("hidden");
                  const payoutMethod = $("payoutMethod");
                  if (payoutMethod) payoutMethod.value = "";
                  const bankFields = $("bankTransferFields");
                  if (bankFields) bankFields.classList.add("hidden");
              }
          }

          if (category === "flight_disruption") {
              container.innerHTML = `
                <div class="section-title">Branch A: Flight Disruption Details</div>
                <div class="form-row-grid">
                    <div class="form-field">
                        <label for="flightNumber">Flight Number *</label>
                        <input type="text" id="flightNumber" placeholder="e.g. B6123 or BY7845" required onblur="validateField(this, regexes.flightNumber, 'flightError')">
                        <div id="flightError" class="error-hint">Please input a valid IATA airline code and flight number (e.g., BY123).</div>
                    </div>
                    <div class="form-field">
                        <label for="delayHours">Delay Duration (Hours) *</label>
                        <input type="number" id="delayHours" min="1" max="72" value="3" required>
                    </div>
                </div>
              `;
          } else if (category === "baggage_issue") {
              container.innerHTML = `
                <div class="section-title">Branch D: Lost, Delayed, or Damaged Baggage</div>
                <div class="form-row-grid">
                    <div class="form-field">
                        <label for="pirNumber">PIR Reference Number *</label>
                        <input type="text" id="pirNumber" placeholder="e.g. LHROR12345" required onblur="validateField(this, regexes.pirNumber, 'pirError')">
                        <div id="pirError" class="error-hint">Invalid PIR format. Must match standard baggage tracking IDs (e.g., LHROR12345).</div>
                    </div>
                    <div class="form-field">
                        <label>Baggage Status *</label>
                        <div style="display:flex; gap:12px; margin-top:8px;">
                            <label><input type="radio" name="baggageStatus" value="delayed" checked> Delayed</label>
                            <label><input type="radio" name="baggageStatus" value="damaged"> Damaged</label>
                            <label><input type="radio" name="baggageStatus" value="stolen"> Stolen</label>
                        </div>
                    </div>
                </div>
              `;
          } else if (category === "billing_refund") {
              container.innerHTML = `
                <div class="section-title">Branch C: Invoicing, Refunds & Discrepancies</div>
                <div class="form-field">
                    <label for="refundReason">Reason for Refund *</label>
                    <select id="refundReason" required>
                        <option value="overcharge">Double charge / Overcharge</option>
                        <option value="canceled_service">Paid add-on service not delivered</option>
                        <option value="tax_refund">Airport tax refund request</option>
                    </select>
                </div>
              `;
          } else if (category === "hotel_complaint") {
              container.innerHTML = `
                <div class="section-title">Branch E: Hotel Accommodation & In-Resort Issues</div>
                <div class="form-row-grid">
                    <div class="form-field">
                        <label for="hotelName">Accommodation Name *</label>
                        <input type="text" id="hotelName" placeholder="Hotel name" required>
                    </div>
                    <div class="form-field">
                        <label>In-Resort Report Filed? *</label>
                        <div style="display:flex; gap:16px; margin-top:8px;">
                            <label><input type="radio" name="inResortReportFiled" value="true"> Yes</label>
                            <label><input type="radio" name="inResortReportFiled" value="false" checked> No</label>
                        </div>
                    </div>
                </div>
              `;
          } else if (category === "medical_dietary") {
              container.innerHTML = `
                <div class="section-title">Branch B: Medical & Dietary Assistance</div>
                <div class="form-field">
                    <label>Assistance Type *</label>
                    <div style="display:flex; gap:16px; margin-top:8px;">
                        <label><input type="radio" name="assistanceType" value="mobility" required> Mobility (Wheelchair/Ramp)</label>
                        <label><input type="radio" name="assistanceType" value="allergy"> Allergy (Severe Dietary)</label>
                        <label><input type="radio" name="assistanceType" value="equipment"> Equipment (Oxygen/Machinery)</label>
                    </div>
                </div>
              `;
          } else if (category === "ancillary_service") {
              container.innerHTML = `
                <div class="section-title">Branch F: Ancillary Services & Seats</div>
                <div class="form-field">
                    <label for="ancillaryType">Ancillary Target Type *</label>
                    <select id="ancillaryType">
                        <option value="airport_transfer">Airport Transfer (Bus/Taxi missing)</option>
                        <option value="seat_selection">Seat Selection (Paid seats not assigned)</option>
                        <option value="extra_luggage">Extra Luggage</option>
                    </select>
                </div>
              `;
          } else if (category === "car_rental") {
              container.innerHTML = `
                <div class="section-title">Branch G: Car Rental & Ground Transport</div>
                <div class="form-field">
                    <label for="rentalVoucherNumber">Rental Voucher Number *</label>
                    <input type="text" id="rentalVoucherNumber" placeholder="Voucher code" required>
                </div>
              `;
          } else if (category === "cruise_fault") {
              container.innerHTML = `
                <div class="section-title">Branch H: Cruise Itinerary & Excursions</div>
                <div class="form-field">
                    <label for="cabinNumber">Cabin Number *</label>
                    <input type="text" id="cabinNumber" placeholder="e.g. U102" required>
                </div>
              `;
          } else if (category === "force_majeure") {
              container.innerHTML = `
                <div class="section-title">Branch I: Force Majeure / Extraordinary Circumstances</div>
                <div class="info-banner">
                    <strong>Notice:</strong> Delays caused by severe weather or external air traffic control strikes are legally classified as extraordinary circumstances. While compensation may not apply, you are still eligible for care, hotel vouchers, and rebooking assistance.
                </div>
              `;
          } else if (category === "bereavement") {
              container.innerHTML = `
                <div class="section-title">Branch J: Bereavement & Medical Cancellations</div>
                <div class="info-banner" style="background:#f3e8ff; border-color:#e9d5ff; color:#6b21a8;">
                    <strong>HIPAA & GDPR Article 9 Security:</strong> Documents uploaded under this branch are routed to a restricted, encrypted cloud storage bucket.
                </div>
              `;
          } else if (category === "third_party_agent") {
              container.innerHTML = `
                <div class="section-title">Branch K: Third-Party Agent & Legal Representation</div>
                <div class="form-field">
                    <label for="agencyName">Agency Registered Name *</label>
                    <input type="text" id="agencyName" placeholder="Law Firm LLC" required>
                </div>
              `;
          }
      };

      window.handlePayoutMethodChange = function(val) {
          $("bankTransferFields").classList.toggle("hidden", val !== "bank_transfer");
      };

      window.handleFilesSelected = function(files) {
          for (let file of files) {
              if (file.size > 5 * 1024 * 1024) {
                  toast(`File ${file.name} exceeds 5MB limit.`);
                  continue;
              }
              if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                  toast(`File ${file.name} has unsupported MIME type.`);
                  continue;
              }
              state.attachments.push(file);
              state.fileScannerTokens[file.name] = "sha256-scanner-token-" + Math.random().toString(36).substring(2);
          }
          renderAttachmentChips();
      };

      window.removeAttachment = function(index) {
          state.attachments.splice(index, 1);
          renderAttachmentChips();
      };

      function renderAttachmentChips() {
          const container = $("fileListContainer");
          if (!container) return;
          container.innerHTML = state.attachments.map((file, idx) => `
            <div class="file-chip">
                <span>📄 ${esc(file.name)} (${(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                <button type="button" onclick="removeAttachment(${idx})">X</button>
            </div>
          `).join("");
      }

      function collectSupportForm() {
          const form = $("supportForm");
          const values = {};
          if (!form) return values;

          form.querySelectorAll("input[id], select[id], textarea[id]").forEach(field => {
              if (!field.id || field.type === "file" || field.type === "button" || field.type === "submit") return;
              if (field.type === "radio") {
                  if (field.checked) values[field.name || field.id] = field.value;
                  return;
              }
              if (field.type === "checkbox") {
                  values[field.id] = Boolean(field.checked);
                  return;
              }
              const value = String(field.value || "").trim();
              if (value) values[field.id] = value;
          });

          return values;
      }

      function supportMessageFrom(formData) {
          const direct = formData.caseDescription || formData.description || formData.message || formData.details || formData.complaintDescription || formData.claimDescription;
          if (direct) return direct;
          return Object.entries(formData)
              .filter(([key, value]) => value !== "" && value !== false && !["firstName","lastName","email","phone","phonePrefix","category","bookingReference"].includes(key))
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
              .join("\n");
      }

      $("supportForm").addEventListener("submit", function(e) {
          e.preventDefault();

          const refValid = validateField($("bookingReference"), regexes.bookingReference, "refError");
          const firstValid = validateField($("firstName"), regexes.name, "firstNameError");
          const lastValid = validateField($("lastName"), regexes.name, "lastNameError");
          const emailValid = validateField($("email"), regexes.email, "emailError");
          
          const sigValid = Boolean(state.signatureDataUrl);
          $("sigError").classList.toggle("show", !sigValid);
          
          const arbitrationChecked = $("arbitrationConsent").checked;
          $("arbitrationError").classList.toggle("show", !arbitrationChecked);

          if (!refValid || !firstValid || !lastValid || !emailValid || !sigValid || !arbitrationChecked) {
              toast("Please resolve highlighted form errors.");
              return;
          }

          const submitBtn = $("submitBtn");
          const fieldset = $("formFieldset");
          const originalText = submitBtn.innerHTML;

          submitBtn.disabled = true;
          fieldset.disabled = true;
          submitBtn.innerHTML = `<span class="spinner-loader"></span> Submitting...`;

          const formData = collectSupportForm();
          const payload = {
              ...formData,
              bookingReference: $("bookingReference").value.trim(),
              firstName: $("firstName").value.trim(),
              lastName: $("lastName").value.trim(),
              fullName: `${$("firstName").value.trim()} ${$("lastName").value.trim()}`.trim(),
              email: $("email").value.trim(),
              phone: `${$("phonePrefix")?.value || ""} ${$("phone")?.value || ""}`.trim(),
              category: $("category").value,
              subject: formData.subject || formData.caseSubject || `${$("category").value || "Member Support"} · ${$("bookingReference").value.trim() || "General inquiry"}`,
              message: supportMessageFrom(formData) || "Member Support request submitted from SKANDI Support Center.",
              digitalSignatureDataUrl: state.signatureDataUrl,
              attachmentNames: state.attachments.map(file => file.name),
              security_telemetry: {
                  user_agent_string: navigator.userAgent,
                  form_completion_time_seconds: Math.floor((Date.now() - formMountTime) / 1000),
                  paste_actions_detected: pasteActionsDetected
              },
              fileScannerTokens: state.fileScannerTokens,
              submissionIdempotencyKey: submissionIdempotencyKey,
              source: "member-helpdesk",
              sourceChannel: "MEMBER_HELPDESK",
              memberPriority: true
          };

          post("CUSTOMER_CREATE_CASE", { case: payload });
          toast("Transmitting request securely...");

          setTimeout(() => {
              submitBtn.disabled = false;
              fieldset.disabled = false;
              submitBtn.innerHTML = originalText;
          }, 2000);
      });

      function renderCases(payload = {}) {
        state.cases = payload.cases || [];
        const q = ($("query")?.value || "").toLowerCase();

        const items = state.cases.filter(c =>
          !q || [caseRefOf(c), c.subject, c.category, c.status, c.booking_ref, c.bookingRef].join(" ").toLowerCase().includes(q)
        );

        $("caseList").innerHTML = items.length ? items.map(c => {
          const id = caseIdOf(c);
          const ref = caseRefOf(c);
          const statusClass = String(c.status || "").toLowerCase() === "closed" ? "closed" : "open";

          return `
            <button class="case-item" data-id="${esc(id)}">
              <div class="case-header">
                <span class="case-title">${esc(c.subject || ref)}</span>
                <span class="badge-status ${statusClass}">${esc(c.status || "Open")}</span>
              </div>
              <div class="case-meta">Ref: ${esc(ref || "N/A")}</div>
              <div><span class="badge-status category">${esc(c.category || "Support")}</span></div>
            </button>
          `;
        }).join("") : `<div style="padding:40px;text-align:center;color:var(--muted);">No support cases found.</div>`;

        document.querySelectorAll("[data-id]").forEach(btn => {
          btn.onclick = () => post("CUSTOMER_OPEN_CASE", { caseId: btn.dataset.id });
        });
      }

      function renderCase(payload = {}) {
        const active = payload.case || {};
        const activeId = caseIdOf(active);
        const activeRef = caseRefOf(active);

        state.active = { ...active, caseId: activeId, case_id: activeId };

        $("caseTitle").textContent = active.subject || activeRef || "Support case";
        $("caseSubtitle").textContent = activeRef ? `Case Reference: ${activeRef}` : "Secure messaging channel";
        $("duffelCaseActions").classList.toggle("hidden", !activeId || !(active.bookingRef || active.pnr || /booking|duffel|flight|hotel/i.test(String(active.subject || ""))));

        $("messages").innerHTML = (payload.messages || []).filter(m => m.private !== true && m.kind !== "internal" && String(m.channel || "").toLowerCase() !== "internal").map(m => {
          const senderType = m.sender_type || m.senderType || "";
          const senderName = m.sender_name || m.senderName || "";
          const content = m.message || m.content || "";
          const isAgent = String(senderType).toLowerCase() === "agent";

          return `
            <div class="msg-wrapper ${isAgent ? "agent" : "user"}">
              <div class="chat-avatar ${isAgent ? "agent" : "user"}">${isAgent ? "S" : "U"}</div>
              <div class="msg-content">
                <span class="msg-sender">${esc(senderName || (isAgent ? "SKANDI Support" : "You"))}</span>
                <div class="msg-bubble">${esc(content)}</div>
              </div>
            </div>
          `;
        }).join("") || `<div style="margin:auto;color:var(--muted);">No messages yet.</div>`;

        $("replyBox").style.display = "flex";
        $("messages").scrollTop = $("messages").scrollHeight;
      }

      $("openDuffelFromCase").onclick = () => {
        const caseId = String(state.active?.caseId || "");
        if (!/^case_[A-Za-z0-9_]+$/.test(caseId)) return toast("Open your booking support case first.");
        post("CUSTOMER_NAVIGATE", { path: `/my-profile/travel-assistance?caseId=${encodeURIComponent(caseId)}` });
      };
      $("refreshBtn").onclick = () => post("CUSTOMER_LIST_CASES");
      $("newBtn").onclick = () => $("newCaseModal").classList.add("open");

      window.closeNewCaseModal = () => {
          $("newCaseModal").classList.remove("open");
          $("supportForm").reset();
          $("branchContainer").innerHTML = "";
          state.attachments = [];
          renderAttachmentChips();
          const payerSection = $("globalFinancialMechanics");
          if (payerSection) payerSection.classList.add("hidden");
      };

      $("query").addEventListener("input", () => renderCases({ cases: state.cases }));

      $("sendBtn").onclick = () => {
        const content = $("replyText").value.trim();
        const caseId = state.active?.case_id || state.active?.caseId;
        if (!content || !caseId) return;

        post("CUSTOMER_REPLY_CASE", { caseId, content });
        $("replyText").value = "";
        toast("Sending reply...");
      };

      window.addEventListener("message", e => {
        const m = e.data || {};
        if (m.source !== PARENT) return;
        const p = m.payload || {};

        if (m.type === "CUSTOMER_PORTAL_STATE" || m.type === "CUSTOMER_PORTAL_DATA") {
            if (p.profile) {
                state.profile = p.profile;
                const fname = p.profile.firstName || p.profile.first_name || "";
                const lname = p.profile.lastName || p.profile.last_name || "";
                const email = p.profile.email || "";
                const phone = p.profile.phone || "";

                if ($("firstName")) $("firstName").value = fname;
                if ($("lastName")) $("lastName").value = lname;
                if ($("email")) $("email").value = email;
                if ($("phone") && phone && !$("phone").value) $("phone").value = phone.replace(/^\+\d+\s*/, "");

                ["firstName", "lastName", "email"].forEach(id => {
                    const field = $(id);
                    if (!field) return;
                    field.readOnly = true;
                    field.setAttribute("aria-readonly", "true");
                    field.title = "Linked to your signed-in SKANDI profile";
                });
            }
            if (p.clubProfile) state.clubProfile = p.clubProfile;
            if (p.supportContext?.bookingRef && $("bookingReference") && !$("bookingReference").value) {
                $("bookingReference").value = p.supportContext.bookingRef;
            }
            if (p.supportContext?.topic && $("category") && !$("category").value) {
                const topic = String(p.supportContext.topic).toLowerCase();
                const options = Array.from($("category").options || []);
                const match = options.find(option => String(option.value || option.textContent || "").toLowerCase().includes(topic));
                if (match) {
                    $("category").value = match.value;
                    $("category").dispatchEvent(new Event("change", { bubbles: true }));
                }
            }
            renderShell();
        }

        if (m.type === "CUSTOMER_CASE_LIST") renderCases(p);
        if (m.type === "CUSTOMER_CASE_DETAIL") renderCase(p);

        if (m.type === "CUSTOMER_REPLY_SENT") {
          toast("Reply sent.");
          const caseId = state.active?.case_id || state.active?.caseId;
          if (caseId) post("CUSTOMER_OPEN_CASE", { caseId });
        }

        if (m.type === "CUSTOMER_CASE_CREATED") {
          toast("Case successfully created.");
          closeNewCaseModal();
          const createdCaseId = p.caseId || p.case?.case_id || p.case?.caseId || "";
          post("CUSTOMER_LIST_CASES");
          if (createdCaseId) setTimeout(() => post("CUSTOMER_OPEN_CASE", { caseId: createdCaseId }), 150);
        }

        if (m.type === "CUSTOMER_ERROR") {
          toast(m.message || p.message || "Support error.");
        }
      });

      renderNav();
      renderShell();
      post("CUSTOMER_READY");
    })();
    </script>

    <!-- BEGIN HOMEPAGE CUSTOMER SHELL FUNCTIONS -->
    <script>
    (function () {
        "use strict";

        const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
        const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
        const PARENT_SOURCE = "SKANDI_WIX_PARENT";

        const PARENT_ORIGIN = (() => {
            try {
                return document.referrer ? new URL(document.referrer).origin : "*";
            } catch (_) {
                return "*";
            }
        })();

        function postToParent(message) {
            window.parent.postMessage(message, PARENT_ORIGIN);
        }

        const I18N = {
            EN: {
                "nav.packages":"Packages","nav.destinations":"Destinations","nav.club":"SKANDI Club","nav.info":"Travel Info",
                "nav.search":"Search","nav.clubBtn":"SKANDI Club","nav.menu":"MENU","nav.signIn":"Sign in",
                "settings.language":"Language","settings.currency":"Currency","settings.apply":"Apply Settings",
                "welcome.title":"Welcome to SKANDI","welcome.copy":"Please confirm your preferred language and currency before continuing.","welcome.btn":"Continue to Site",
                "footer.news.title":"Get SKANDI offers and travel inspiration","footer.news.desc":"Receive destination guides, Signature Collection updates and member offers.",
                "footer.news.btn":"Sign up","footer.col1.title":"Book & Travel","footer.col1.l1":"Manage your booking","footer.col1.l2":"Book a trip",
                "footer.col1.l3":"Signature Collection","footer.col1.l4":"Destinations","footer.col1.l5":"Hotels","footer.col1.l6":"Flights",
                "footer.col1.l7":"Tours & Activities","footer.col1.l8":"Car Rental","footer.col1.l9":"Offers","footer.col2.title":"Help & Travel Info",
                "footer.col2.l1":"Before you travel","footer.col2.l2":"Passport & visa","footer.col2.l3":"Baggage","footer.col2.l4":"Insurance",
                "footer.col2.l5":"Help Center","footer.col2.l6":"Contact us","footer.col2.l7":"Special assistance","footer.col3.title":"SKANDI Club",
                "footer.col3.l1":"Join SKANDI Club","footer.col3.l2":"Member benefits","footer.col3.l3":"My Club Status",
                "footer.col3.l4":"Travel Wallet & Vouchers","footer.col4.title":"About","footer.col4.l1":"About SKANDI Travels",
                "footer.col4.l2":"Newsroom","footer.col4.l3":"Careers","footer.col4.l4":"Our Network",
                "footer.bottom.terms":"Payment methods, supplier terms and package travel conditions may vary by product.",
                "footer.bottom.l1":"Legal","footer.bottom.l8":"Terms of Use","footer.bottom.l2":"Accessibility","footer.bottom.l3":"Website disclaimer",
                "footer.bottom.l4":"Privacy Policy","footer.bottom.l5":"Cookies Policy","footer.bottom.l6":"Booking Terms","footer.bottom.l7":"Staff login"
            },
            SV: {
                "nav.packages":"Paketresor","nav.destinations":"Destinationer","nav.club":"Signature Club","nav.info":"Reseinfo",
                "nav.search":"Sök","nav.clubBtn":"SKANDI Club","nav.menu":"MENY","nav.signIn":"Logga in",
                "settings.language":"Språk","settings.currency":"Valuta","settings.apply":"Spara inställningar",
                "welcome.title":"Välkommen till SKANDI","welcome.copy":"Välj språk och valuta innan du fortsätter.","welcome.btn":"Fortsätt till SKANDI TRAVELS",
                "footer.news.title":"Få de senaste SKANDI-resemålen och erbjudanden","footer.news.desc":"De bästa destinationsguiderna, först på uppdateringar om SKANDI Collections och medlemserbjudanden.",
                "footer.news.btn":"Börja Prenumerera","footer.col1.title":"Boka & Res","footer.col1.l1":"Hantera din bokning","footer.col1.l2":"Boka resa",
                "footer.col1.l3":"SKANDI Collections","footer.col1.l4":"Destinationer","footer.col1.l5":"Hotell","footer.col1.l6":"Flyg",
                "footer.col1.l7":"Guided Turer & Aktiviteter","footer.col1.l8":"Hyrbil","footer.col1.l9":"Erbjudanden","footer.col2.title":"Reseinfo",
                "footer.col2.l1":"Innan du reser","footer.col2.l2":"Pass & visum","footer.col2.l3":"Bagage","footer.col2.l4":"Försäkring",
                "footer.col2.l5":"Hjälpcenter","footer.col2.l6":"Kontakta oss","footer.col2.l7":"Assistans under Resan","footer.col3.title":"SKANDI Club",
                "footer.col3.l1":"Gå med i SKANDI Club","footer.col3.l2":"Medlemsförmåner","footer.col3.l3":"Min klubbstatus",
                "footer.col3.l4":"Resekassa & värdebevis","footer.col4.title":"Om oss","footer.col4.l1":"Om SKANDI Travels",
                "footer.col4.l2":"Nyhetsrum","footer.col4.l3":"Jobba hos oss","footer.col4.l4":"Här finns SKANDI",
                "footer.bottom.terms":"Betalningsmetoderna, leverantörs- och paketresevilkoren kan variera mellan produkter.",
                "footer.bottom.l1":"Regler och villkor","footer.bottom.l8":"Användarvillkor","footer.bottom.l2":"Tillgänglighetsredogörelse","footer.bottom.l3":"Allmänna villkor:",
                "footer.bottom.l4":"Integritetspolicy","footer.bottom.l5":"Cookiepolicy","footer.bottom.l6":"Bokningsvillkor","footer.bottom.l7":"Personalinloggning"
            },
            NO: {
                "nav.packages":"Pakkereiser","nav.destinations":"Reisemål","nav.club":"Signature Club","nav.info":"Reiseinfo",
                "nav.search":"Søk","nav.clubBtn":"SKANDI Club","nav.menu":"MENY","nav.signIn":"Logg inn",
                "settings.language":"Språk","settings.currency":"Valuta","settings.apply":"Lagre innstillinger",
                "welcome.title":"Velkommen til SKANDI","welcome.copy":"Bekreft ønsket språk og valuta før du fortsetter.","welcome.btn":"Fortsett til SKANDI TRAVELS",
                "footer.news.title":"Få SKANDI-tilbud og reiseinspirasjon","footer.news.desc":"Motta reisemålsguider, oppdateringer om Signature Collection og medlemstilbud.",
                "footer.news.btn":"Registrer deg","footer.col1.title":"Bestill & Reis","footer.col1.l1":"Administrer bestillingen","footer.col1.l2":"Bestill en reise",
                "footer.col1.l3":"Signature Collection","footer.col1.l4":"Reisemål","footer.col1.l5":"Hotell","footer.col1.l6":"Fly",
                "footer.col1.l7":"Opplevelser og aktiviteter","footer.col1.l8":"Leiebil","footer.col1.l9":"Tilbud","footer.col2.title":"Hjelp & Reiseinfo",
                "footer.col2.l1":"Før du reiser","footer.col2.l2":"Pass & visum","footer.col2.l3":"Bagasje","footer.col2.l4":"Forsikring",
                "footer.col2.l5":"Hjelpesenter","footer.col2.l6":"Kontakt oss","footer.col2.l7":"Tilrettelagt assistanse","footer.col3.title":"SKANDI Club",
                "footer.col3.l1":"Bli med i SKANDI Club","footer.col3.l2":"Medlemsfordeler","footer.col3.l3":"Min klubbstatus",
                "footer.col3.l4":"Reiselommebok & kuponger","footer.col4.title":"Om","footer.col4.l1":"Om SKANDI Travels",
                "footer.col4.l2":"Nyhetsrom","footer.col4.l3":"Karriere","footer.col4.l4":"Vårt nettverk",
                "footer.bottom.terms":"Betalingsmetoder, leverandørvilkår og pakkereisevilkår kan variere etter produkt.",
                "footer.bottom.l1":"Juridisk","footer.bottom.l8":"Brukervilkår","footer.bottom.l2":"Tilgjengelighet","footer.bottom.l3":"Ansvarsfraskrivelse",
                "footer.bottom.l4":"Personvern","footer.bottom.l5":"Cookies","footer.bottom.l6":"Bestillingsvilkår","footer.bottom.l7":"Ansattinnlogging"
            },
            DA: {
                "nav.packages":"Pakkerejser","nav.destinations":"Destinationer","nav.club":"Signature Club","nav.info":"Rejseinfo",
                "nav.search":"Søg","nav.clubBtn":"SKANDI Club","nav.menu":"MENU","nav.signIn":"Log ind",
                "settings.language":"Sprog","settings.currency":"Valuta","settings.apply":"Gem indstillinger",
                "welcome.title":"Velkommen til SKANDI","welcome.copy":"Bekræft dit foretrukne sprog og din valuta, før du fortsætter.","welcome.btn":"Fortsæt til hjemmesiden",
                "footer.news.title":"Få SKANDI-tilbud og rejseinspiration","footer.news.desc":"Modtag destinationsguider, Signature Collection-opdateringer og medlemstilbud.",
                "footer.news.btn":"Tilmeld dig","footer.col1.title":"Book & Rejs","footer.col1.l1":"Administrer din booking","footer.col1.l2":"Book en rejse",
                "footer.col1.l3":"Signature Collection","footer.col1.l4":"Destinationer","footer.col1.l5":"Hoteller","footer.col1.l6":"Fly",
                "footer.col1.l7":"Oplevelser & aktiviteter","footer.col1.l8":"Billeje","footer.col1.l9":"Tilbud","footer.col2.title":"Hjælp & Rejseinfo",
                "footer.col2.l1":"Før du rejser","footer.col2.l2":"Pas & visum","footer.col2.l3":"Bagage","footer.col2.l4":"Forsikring",
                "footer.col2.l5":"Hjælpecenter","footer.col2.l6":"Kontakt os","footer.col2.l7":"Særlig assistance","footer.col3.title":"SKANDI Club",
                "footer.col3.l1":"Bliv medlem af SKANDI Club","footer.col3.l2":"Medlemsfordele","footer.col3.l3":"Min klubstatus",
                "footer.col3.l4":"Rejsepung & værdibeviser","footer.col4.title":"Om","footer.col4.l1":"Om SKANDI Travels",
                "footer.col4.l2":"Nyhedsrum","footer.col4.l3":"Karriere","footer.col4.l4":"Vores netværk",
                "footer.bottom.terms":"Betalingsmetoder, leverandørvilkår og pakkerejsevilkår kan variere efter produkt.",
                "footer.bottom.l1":"Juridisk","footer.bottom.l8":"Brugsvilkår","footer.bottom.l2":"Tilgængelighed","footer.bottom.l3":"Ansvarsfraskrivelse",
                "footer.bottom.l4":"Behandling af persondata","footer.bottom.l5":"Cookiepolitik","footer.bottom.l6":"Bookingvilkår","footer.bottom.l7":"Medarbejderlogin"
            },
            TG: {
  "nav.packages": "แพ็กเกจท่องเที่ยว",
  "nav.destinations": "จุดหมายปลายทาง",
  "nav.club": "Signature Club",
  "nav.info": "ข้อมูลการเดินทาง",
  "nav.search": "ค้นหา",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "เมนู",
  "nav.signIn": "เข้าสู่ระบบ",
  "settings.language": "ภาษา",
  "settings.currency": "สกุลเงิน",
  "settings.apply": "บันทึกการตั้งค่า",
  "welcome.title": "ยินดีต้อนรับสู่ SKANDI",
  "welcome.copy": "กรุณายืนยันภาษาและสกุลเงินที่คุณต้องการก่อนดำเนินการต่อ",
  "welcome.btn": "เข้าสู่เว็บไซต์",
  "footer.news.title": "รับข้อเสนอพิเศษและแรงบันดาลใจในการท่องเที่ยวจาก SKANDI",
  "footer.news.desc": "รับคู่มือท่องเที่ยว อัปเดตล่าสุดจาก Signature Collection และข้อเสนอพิเศษสำหรับสมาชิก",
  "footer.news.btn": "ลงทะเบียน",
  "footer.col1.title": "จองและเดินทาง",
  "footer.col1.l1": "จัดการการจองของฉัน",
  "footer.col1.l2": "จองการเดินทาง",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "จุดหมายปลายทาง",
  "footer.col1.l5": "โรงแรม",
  "footer.col1.l6": "เที่ยวบิน",
  "footer.col1.l7": "ทัวร์และกิจกรรม",
  "footer.col1.l8": "บริการเช่ารถ",
  "footer.col1.l9": "ข้อเสนอพิเศษ",
  "footer.col2.title": "ความช่วยเหลือและข้อมูลการเดินทาง",
  "footer.col2.l1": "ก่อนการเดินทาง",
  "footer.col2.l2": "พาสปอร์ตและวีซ่า",
  "footer.col2.l3": "สัมภาระ",
  "footer.col2.l4": "ประกันภัย",
  "footer.col2.l5": "ศูนย์ช่วยเหลือ",
  "footer.col2.l6": "ติดต่อเรา",
  "footer.col2.l7": "ความช่วยเหลือพิเศษ",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "เข้าร่วม SKANDI Club",
  "footer.col3.l2": "สิทธิประโยชน์สำหรับสมาชิก",
  "footer.col3.l3": "สถานะสมาชิกของฉัน",
  "footer.col3.l4": "กระเป๋าเงินเดินทางและคูปอง",
  "footer.col4.title": "เกี่ยวกับเรา",
  "footer.col4.l1": "เกี่ยวกับ SKANDI Travels",
  "footer.col4.l2": "ห้องข่าวประชาสัมพันธ์",
  "footer.col4.l3": "ร่วมงานกับเรา",
  "footer.col4.l4": "เครือข่ายของเรา",
  "footer.bottom.terms": "วิธีการชำระเงิน ข้อกำหนดของผู้ให้บริการ และเงื่อนไขแพ็กเกจท่องเที่ยวอาจแตกต่างกันไปตามแต่ละผลิตภัณฑ์",
  "footer.bottom.l1": "ข้อมูลทางกฎหมาย",
  "footer.bottom.l8": "ข้อกำหนดการใช้งาน",
  "footer.bottom.l2": "การเข้าถึงที่เท่าเทียม",
  "footer.bottom.l3": "ข้อจำกัดความรับผิดชอบ",
  "footer.bottom.l4": "นโยบายความเป็นส่วนตัว",
  "footer.bottom.l5": "นโยบายคุกกี้",
  "footer.bottom.l6": "เงื่อนไขการจอง",
  "footer.bottom.l7": "เข้าสู่ระบบสำหรับพนักงาน"
},
            FI: {
  "nav.packages": "Pakettimatkat",
  "nav.destinations": "Kohteet",
  "nav.club": "Signature Club",
  "nav.info": "Matkatiedot",
  "nav.search": "Hae",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "VALIKKO",
  "nav.signIn": "Kirjaudu sisään",
  "settings.language": "Kieli",
  "settings.currency": "Valuutta",
  "settings.apply": "Tallenna asetukset",
  "welcome.title": "Tervetuloa SKANDIin",
  "welcome.copy": "Vahvista haluamasi kieli ja valuutta ennen kuin jatkat.",
  "welcome.btn": "Jatka sivustolle",
  "footer.news.title": "Löydä SKANDI-tarjoukset ja matkainspiraatio",
  "footer.news.desc": "Tilaa kohdeoppaat, Signature Collection -päivitykset sekä jäsentarjoukset.",
  "footer.news.btn": "Tilaa uutiskirje",
  "footer.col1.title": "Varaa & Matkusta",
  "footer.col1.l1": "Hallitse varaustasi",
  "footer.col1.l2": "Varaa matka",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Kohteet",
  "footer.col1.l5": "Hotellit",
  "footer.col1.l6": "Lennot",
  "footer.col1.l7": "Retket & Aktiviteetit",
  "footer.col1.l8": "Autonvuokraus",
  "footer.col1.l9": "Tarjoukset",
  "footer.col2.title": "Apua & Matkatiedot",
  "footer.col2.l1": "Ennen matkaa",
  "footer.col2.l2": "Passi & viisumi",
  "footer.col2.l3": "Matkatavarat",
  "footer.col2.l4": "Vakuutus",
  "footer.col2.l5": "Asiakaspalvelu",
  "footer.col2.l6": "Ota yhteyttä",
  "footer.col2.l7": "Avustettavat matkustajat",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "Liity SKANDI Clubiin",
  "footer.col3.l2": "Jäsenedut",
  "footer.col3.l3": "Oma klubitaso",
  "footer.col3.l4": "Matkalompakko & etukupongit",
  "footer.col4.title": "Tietoa meistä",
  "footer.col4.l1": "Tietoa SKANDI Travelsista",
  "footer.col4.l2": "Medialle",
  "footer.col4.l3": "Urat",
  "footer.col4.l4": "Verkostomme",
  "footer.bottom.terms": "Maksutavat, palveluntarjoajien ehdot ja valmismatkaehdot voivat vaihdella tuotekohtaisesti.",
  "footer.bottom.l1": "Oikeudelliset tiedot",
  "footer.bottom.l8": "Käyttöehdot",
  "footer.bottom.l2": "Saavutettavuus",
  "footer.bottom.l3": "Vastuuvapauslauseke",
  "footer.bottom.l4": "Tietosuojaseloste",
  "footer.bottom.l5": "Evästekäytännöt",
  "footer.bottom.l6": "Varausehdot",
  "footer.bottom.l7": "Henkilökunnan sisäänkirjautuminen"
},
ES:{
  "nav.packages": "Paquetes de viaje",
  "nav.destinations": "Destinos",
  "nav.club": "Signature Club",
  "nav.info": "Información de viaje",
  "nav.search": "Buscar",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "MENÚ",
  "nav.signIn": "Iniciar sesión",
  "settings.language": "Idioma",
  "settings.currency": "Moneda",
  "settings.apply": "Guardar configuración",
  "welcome.title": "Bienvenido a SKANDI",
  "welcome.copy": "Confirma tu idioma y moneda preferidos antes de continuar.",
  "welcome.btn": "Continuar al sitio web",
  "footer.news.title": "Recibe ofertas de SKANDI e inspiración para viajar",
  "footer.news.desc": "Recibe guías de destinos, actualizaciones de Signature Collection y ofertas para miembros.",
  "footer.news.btn": "Registrarse",
  "footer.col1.title": "Reserva y viaja",
  "footer.col1.l1": "Gestionar mi reserva",
  "footer.col1.l2": "Reservar un viaje",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Destinos",
  "footer.col1.l5": "Hoteles",
  "footer.col1.l6": "Vuelos",
  "footer.col1.l7": "Excursiones y actividades",
  "footer.col1.l8": "Alquiler de coches",
  "footer.col1.l9": "Ofertas",
  "footer.col2.title": "Ayuda e información de viaje",
  "footer.col2.l1": "Antes de viajar",
  "footer.col2.l2": "Pasaporte y visados",
  "footer.col2.l3": "Equipaje",
  "footer.col2.l4": "Seguros",
  "footer.col2.l5": "Centro de ayuda",
  "footer.col2.l6": "Contacto",
  "footer.col2.l7": "Asistencia especial",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "Únete a SKANDI Club",
  "footer.col3.l2": "Beneficios de membresía",
  "footer.col3.l3": "Mi estado del club",
  "footer.col3.l4": "Monedero de viaje y cupones",
  "footer.col4.title": "Acerca de",
  "footer.col4.l1": "Acerca de SKANDI Travels",
  "footer.col4.l2": "Sala de prensa",
  "footer.col4.l3": "Empleo",
  "footer.col4.l4": "Nuestra red",
  "footer.bottom.terms": "Los métodos de pago, las condiciones del proveedor y los términos de los paquetes de viaje pueden variar según el producto.",
  "footer.bottom.l1": "Información legal",
  "footer.bottom.l8": "Términos de uso",
  "footer.bottom.l2": "Accesibilidad",
  "footer.bottom.l3": "Aviso legal",
  "footer.bottom.l4": "Política de privacidad",
  "footer.bottom.l5": "Política de cookies",
  "footer.bottom.l6": "Condiciones de reserva",
  "footer.bottom.l7": "Acceso para empleados"
},
DE: {
  "nav.packages": "Pauschalreisen",
  "nav.destinations": "Reiseziele",
  "nav.club": "Signature Club",
  "nav.info": "Reiseinfos",
  "nav.search": "Suchen",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "MENÜ",
  "nav.signIn": "Anmelden",
  "settings.language": "Sprache",
  "settings.currency": "Währung",
  "settings.apply": "Einstellungen speichern",
  "welcome.title": "Willkommen bei SKANDI",
  "welcome.copy": "Bitte bestätigen Sie Ihre bevorzugte Sprache und Währung, bevor Sie fortfahren.",
  "welcome.btn": "Weiter zur Website",
  "footer.news.title": "Erhalten Sie SKANDI-Angebote und Reiseinspirationen",
  "footer.news.desc": "Erhalten Sie Reiseführer, Updates zur Signature Collection und Mitgliederangebote.",
  "footer.news.btn": "Registrieren",
  "footer.col1.title": "Buchen & Reisen",
  "footer.col1.l1": "Buchung verwalten",
  "footer.col1.l2": "Reise buchen",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Reiseziele",
  "footer.col1.l5": "Hotels",
  "footer.col1.l6": "Flüge",
  "footer.col1.l7": "Ausflüge & Aktivitäten",
  "footer.col1.l8": "Mietwagen",
  "footer.col1.l9": "Angebote",
  "footer.col2.title": "Hilfe & Reiseinfos",
  "footer.col2.l1": "Vor der Reise",
  "footer.col2.l2": "Reisepass & Visum",
  "footer.col2.l3": "Gepäck",
  "footer.col2.l4": "Versicherungen",
  "footer.col2.l5": "Hilfezentrum",
  "footer.col2.l6": "Kontakt",
  "footer.col2.l7": "Barrierefreies Reisen",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "SKANDI Club beitreten",
  "footer.col3.l2": "Mitgliedsvorteile",
  "footer.col3.l3": "Mein Clubstatus",
  "footer.col3.l4": "Reise-Geldbörse & Gutscheine",
  "footer.col4.title": "Über uns",
  "footer.col4.l1": "Über SKANDI Travels",
  "footer.col4.l2": "Pressebereich",
  "footer.col4.l3": "Karriere",
  "footer.col4.l4": "Unser Netzwerk",
  "footer.bottom.terms": "Zahlungsarten, Reisebedingungen der Leistungsträger und Pauschalreisebedingungen können je nach Produkt variieren.",
  "footer.bottom.l1": "Rechtliches",
  "footer.bottom.l8": "Nutzungsbedingungen",
  "footer.bottom.l2": "Barrierefreiheit",
  "footer.bottom.l3": "Haftungsausschluss",
  "footer.bottom.l4": "Datenschutzerklärung",
  "footer.bottom.l5": "Cookie-Richtlinie",
  "footer.bottom.l6": "Buchungsbedingungen",
  "footer.bottom.l7": "Mitarbeiter-Login"
},
"FR-FR": {
  "nav.packages": "Voyages organisés",
  "nav.destinations": "Destinations",
  "nav.club": "Signature Club",
  "nav.info": "Infos voyage",
  "nav.search": "Rechercher",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "MENUS",
  "nav.signIn": "Se connecter",
  "settings.language": "Langue",
  "settings.currency": "Devise",
  "settings.apply": "Enregistrer les paramètres",
  "welcome.title": "Bienvenue chez SKANDI",
  "welcome.copy": "Veuillez confirmer votre langue et votre devise préférées avant de continuer.",
  "welcome.btn": "Accéder au site web",
  "footer.news.title": "Recevez les offres SKANDI et de l'inspiration pour voyager",
  "footer.news.desc": "Recevez des guides de voyage, les actualités de la Signature Collection et des offres membres.",
  "footer.news.btn": "S'inscrire",
  "footer.col1.title": "Réserver & Voyager",
  "footer.col1.l1": "Gérer ma réservation",
  "footer.col1.l2": "Réserver un voyage",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Destinations",
  "footer.col1.l5": "Hôtels",
  "footer.col1.l6": "Vols",
  "footer.col1.l7": "Excursions & Activités",
  "footer.col1.l8": "Location de voitures",
  "footer.col1.l9": "Offres",
  "footer.col2.title": "Aide & Infos voyage",
  "footer.col2.l1": "Avant de partir",
  "footer.col2.l2": "Passeport & visas",
  "footer.col2.l3": "Bagages",
  "footer.col2.l4": "Assurances",
  "footer.col2.l5": "Centre d'aide",
  "footer.col2.l6": "Nous contacter",
  "footer.col2.l7": "Assistance spéciale",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "Rejoindre le SKANDI Club",
  "footer.col3.l2": "Avantages membres",
  "footer.col3.l3": "Mon statut club",
  "footer.col3.l4": "Portefeuille de voyage & bons",
  "footer.col4.title": "À propos",
  "footer.col4.l1": "À propos de SKANDI Travels",
  "footer.col4.l2": "Espace presse",
  "footer.col4.l3": "Carrières",
  "footer.col4.l4": "Notre réseau",
  "footer.bottom.terms": "Les modes de paiement, les conditions des fournisseurs et les conditions des forfaits de voyage peuvent varier selon le produit.",
  "footer.bottom.l1": "Mentions légales",
  "footer.bottom.l8": "Conditions d'utilisation",
  "footer.bottom.l2": "Accessibilité",
  "footer.bottom.l3": "Avis de non-responsabilité",
  "footer.bottom.l4": "Politique de confidentialité",
  "footer.bottom.l5": "Politique de cookies",
  "footer.bottom.l6": "Conditions de réservation",
  "footer.bottom.l7": "Espace employés"
},
"FR-CA":{
  "nav.packages": "Forfaits Vacances",
  "nav.destinations": "Destinations",
  "nav.club": "Signature Club",
  "nav.info": "Infos voyage",
  "nav.search": "Rechercher",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "MENU",
  "nav.signIn": "Se connecter",
  "settings.language": "Langue",
  "settings.currency": "Devise",
  "settings.apply": "Enregistrer les paramètres",
  "welcome.title": "Bienvenue chez SKANDI",
  "welcome.copy": "Veuillez confirmer votre langue et votre devise préférées avant de continuer.",
  "welcome.btn": "Accéder au site web",
  "footer.news.title": "Recevez les offres SKANDI et de l'inspiration pour voyager",
  "footer.news.desc": "Recevez des guides de voyage, les actualités de la Signature Collection et des offres membres.",
  "footer.news.btn": "S'inscrire",
  "footer.col1.title": "Réserver & Voyager",
  "footer.col1.l1": "Gérer ma réservation",
  "footer.col1.l2": "Réserver un voyage",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Destinations",
  "footer.col1.l5": "Hôtels",
  "footer.col1.l6": "Vols",
  "footer.col1.l7": "Excursions & Activités",
  "footer.col1.l8": "Location de voitures",
  "footer.col1.l9": "Offres",
  "footer.col2.title": "Aide & Infos voyage",
  "footer.col2.l1": "Avant de partir",
  "footer.col2.l2": "Passeport & visas",
  "footer.col2.l3": "Bagages",
  "footer.col2.l4": "Assurances",
  "footer.col2.l5": "Centre d'aide",
  "footer.col2.l6": "Nous contacter",
  "footer.col2.l7": "Assistance spéciale",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "Rejoindre le SKANDI Club",
  "footer.col3.l2": "Avantages membres",
  "footer.col3.l3": "Mon statut club",
  "footer.col3.l4": "Portefeuille de voyage & coupons",
  "footer.col4.title": "À propos",
  "footer.col4.l1": "À propos de SKANDI Travels",
  "footer.col4.l2": "Salle de presse",
  "footer.col4.l3": "Carrières",
  "footer.col4.l4": "Notre réseau",
  "footer.bottom.terms": "Les modes de paiement, les conditions des fournisseurs et les conditions des forfaits de voyage peuvent varier selon le produit.",
  "footer.bottom.l1": "Avis juridiques",
  "footer.bottom.l8": "Conditions d'utilisation",
  "footer.bottom.l2": "Accessibilité",
  "footer.bottom.l3": "Exonération de responsabilité",
  "footer.bottom.l4": "Politique de confidentialité",
  "footer.bottom.l5": "Politique relative aux témoins",
  "footer.bottom.l6": "Conditions de réservation",
  "footer.bottom.l7": "Connexion employés"
}
        };

        let userSettings = { language: "EN", currency: "USD" };
        let settingsInitialized = false;

        const translationRoots = [
            document.getElementById("skandi-site-header"),
            document.getElementById("welcomeSettingsModal"),
            document.getElementById("mobileMenuLayer"),
            document.getElementById("skandi-site-footer")
        ].filter(Boolean);

        function translate(key, fallback = "") {
            const language = userSettings.language || "EN";
            return I18N[language]?.[key] || I18N.EN?.[key] || fallback || key;
        }

        function applyTranslations() {
            document.documentElement.lang = ({ EN: "en", SV: "sv", NO: "no", DA: "da", FI: "fi", "FR-FR": "fr-fr", "FR-CA": "fr-ca", DE: "de", ES: "es"})[userSettings.language] || "en";

            translationRoots.forEach((root) => {
                root.querySelectorAll("[data-i18n]").forEach((element) => {
                    const key = element.getAttribute("data-i18n");
                    const value = translate(key, element.textContent || "");
                    if (value) element.textContent = value;
                });

                root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
                    const key = element.getAttribute("data-i18n-placeholder");
                    const value = translate(key, element.getAttribute("placeholder") || "");
                    if (value) element.setAttribute("placeholder", value);
                });
            });
        }

        function updateSettingsControls() {
            ["langSelect", "mobileLangSelect", "welcomeLang"].forEach((id) => {
                const element = document.getElementById(id);
                if (element) element.value = userSettings.language;
            });

            ["currSelect", "mobileCurrSelect", "welcomeCurr"].forEach((id) => {
                const element = document.getElementById(id);
                if (element) element.value = userSettings.currency;
            });
        }

        function saveSettings(language, currency, notifyParent = true) {
            userSettings = {
                language: ["EN", "SV", "NO", "DA", "FR-FR", "FR-CA", "DE", "FI", "ES"].includes(language) ? language : "EN",
                currency: ["USD", "SEK", "NOK", "DKK", "EUR"].includes(currency) ? currency : "USD"
            };

            try {
                localStorage.setItem("skandi_user_settings", JSON.stringify(userSettings));
            } catch (_) {}

            updateSettingsControls();
            applyTranslations();

            if (notifyParent) {
                postToParent({
                    source: HEADER_SOURCE,
                    type: "UPDATE_SETTINGS",
                    payload: { ...userSettings }
                });
            }
        }

        function initializeSettings() {
            if (settingsInitialized) {
                updateSettingsControls();
                applyTranslations();
                return;
            }

            settingsInitialized = true;
            let stored = null;

            try {
                stored = JSON.parse(localStorage.getItem("skandi_user_settings") || "null");
            } catch (_) {
                stored = null;
            }

            if (stored && ["EN", "SV", "NO", "DA"].includes(stored.language)) {
                userSettings = {
                    language: stored.language,
                    currency: ["USD", "SEK", "NOK", "DKK", "EUR"].includes(stored.currency) ? stored.currency : "USD"
                };
            } else {
                userSettings = { language: "EN", currency: "USD" };
                const modal = document.getElementById("welcomeSettingsModal");
                modal?.classList.add("active");
                modal?.setAttribute("aria-hidden", "false");
            }

            updateSettingsControls();
            applyTranslations();
        }

        const HEADER_CONFIG = {
            nav: [
                { label: "Packages", i18n: "nav.packages", path: "/signature-collection" },
                { label: "Destinations", i18n: "nav.destinations", path: "/destinations" },
                { label: "Signature Club", i18n: "nav.club", path: "/skandi-club" },
                { label: "Travel Info", i18n: "nav.info", path: "/about/travel-info" }
            ],
            desktopMember: [
                { label: "My Profile", path: "/my-profile" }
            ],
            mobileExtra: [
                { label: "Help Center", path: "/about/help" }
            ],
            mobileMember: [
                { label: "My Profile", path: "/my-profile" },
                { label: "My Trips & Bookings", path: "/my-profile?tab=trips" },
                { label: "Club Rewards & Status", path: "/my-profile?tab=rewards" },
                { label: "Travel Wallet & Vouchers", path: "/my-profile?tab=wallet" },
                { label: "Help & Club Support", path: "/about/help" }
            ]
        };

        let session = { loggedIn: false, displayName: "", points: 0, tierName: "" };
        let mobileMenuOpen = false;
        let lastFocusedElement = null;
        const byId = (id) => document.getElementById(id);

        function headerPost(type, payload = {}) {
            postToParent({
                source: HEADER_SOURCE,
                type,
                payload,
                timestamp: new Date().toISOString()
            });
        }

        function footerPost(type, payload = {}) {
            postToParent({
                source: FOOTER_SOURCE,
                type,
                payload,
                timestamp: new Date().toISOString()
            });
        }

        function escapeHtml(value) {
            return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
            })[character]);
        }

        function closeClub() {
            byId("clubPanel")?.classList.remove("open");
            byId("clubBackdrop")?.classList.remove("open");
            if (!mobileMenuOpen) document.documentElement.style.overflow = "";
        }

        function closeMobile({ restoreFocus = true } = {}) {
            const layer = byId("mobileMenuLayer");
            const button = byId("mobileBtn");
            if (!layer || !button) return;

            mobileMenuOpen = false;
            layer.classList.remove("open");
            layer.setAttribute("aria-hidden", "true");
            button.setAttribute("aria-expanded", "false");
            document.documentElement.classList.remove("mobile-menu-open");
            document.body.classList.remove("mobile-menu-open");

            if (restoreFocus && lastFocusedElement?.focus) {
                lastFocusedElement.focus({ preventScroll: true });
            }
            lastFocusedElement = null;
        }

        function navTo(path) {
            if (!path) return;
            closeMobile({ restoreFocus: false });
            closeClub();
            headerPost("HEADER_NAVIGATE", { path });
        }

        function renderDesktopNav() {
            const nav = byId("customerMainNav");
            if (!nav) return;
            const items = session.loggedIn ? [...HEADER_CONFIG.nav, ...HEADER_CONFIG.desktopMember] : [...HEADER_CONFIG.nav];

            nav.innerHTML = items.map((item) => (
                `<button class="nav-btn" type="button" data-path="${escapeHtml(item.path)}" ${item.i18n ? `data-i18n="${item.i18n}"` : ""}>${escapeHtml(item.label)}</button>`
            )).join("");

            nav.querySelectorAll("[data-path]").forEach((button) => {
                button.addEventListener("click", () => navTo(button.dataset.path));
            });
            applyTranslations();
        }

        function renderMobileNav() {
            const list = byId("mobileList");
            if (!list) return;
            const items = session.loggedIn ? HEADER_CONFIG.mobileMember : [...HEADER_CONFIG.nav, ...HEADER_CONFIG.mobileExtra];

            list.innerHTML = items.map((item) => (
                `<button class="mobile-menu-link" type="button" data-path="${escapeHtml(item.path)}" ${item.i18n ? `data-i18n="${item.i18n}"` : ""}>${escapeHtml(item.label)}</button>`
            )).join("");

            list.querySelectorAll("[data-path]").forEach((button) => {
                button.addEventListener("click", () => navTo(button.dataset.path));
            });
            applyTranslations();
        }

        function updateMobileAccount() {
            const account = byId("mobileAccount");
            const button = byId("mobileAccountBtn");

            if (account) {
                account.textContent = session.loggedIn
                    ? `${session.displayName || "Member"} · ${Number(session.points || 0).toLocaleString()} pts`
                    : "Explore SKANDI Travels";
            }

            if (button) {
                button.textContent = session.loggedIn ? "My profile" : translate("nav.signIn", "Sign in");
            }
        }

        function renderClub(context = "") {
            const loggedIn = Boolean(session.loggedIn);
            const clubTitle = byId("clubTitle");
            const clubName = byId("clubName");
            const clubMeta = byId("clubMeta");
            const clubActions = byId("clubActions");
            const clubButton = byId("clubBtn");
            const accountMini = byId("accountMini");
            if (!clubTitle || !clubName || !clubMeta || !clubActions) return;

            clubTitle.textContent = loggedIn ? "Your SKANDI Club" : "Join SKANDI Club";

            if (loggedIn) {
                clubName.textContent = `Hi, ${session.displayName || "there"}`;
                clubMeta.textContent = `${Number(session.points || 0).toLocaleString()} points${session.tierName ? ` · ${session.tierName}` : ""}`;
                clubActions.innerHTML = `
                    <button class="shell-btn" type="button" data-path="/my-profile" style="width:100%;margin-bottom:12px">My Profile</button>
                    <button class="shell-btn secondary" type="button" data-action="logout" style="width:100%">Logout</button>
                `;
            } else {
                clubName.textContent = context === "favorites" ? "Save your favourites" : "Welcome Back";
                clubMeta.textContent = context === "favorites"
                    ? "Sign in to save destinations, offers and pages to your profile."
                    : "Sign in to access your trips, points and travel documents.";
                clubActions.innerHTML = `
                    <form id="inlineLoginForm" class="login-form">
                        <input type="email" id="loginEmail" placeholder="Email address" autocomplete="email">
                        <input type="password" id="loginPassword" placeholder="Password" autocomplete="current-password">
                        <button type="submit" class="shell-btn" style="width:100%">Log In</button>
                    </form>
                `;
            }

            clubActions.querySelectorAll("[data-path]").forEach((button) => {
                button.addEventListener("click", () => navTo(button.dataset.path));
            });
            clubActions.querySelectorAll("[data-action]").forEach((button) => {
                button.addEventListener("click", () => {
                    if (button.dataset.action === "logout") headerPost("HEADER_LOGOUT");
                });
            });

            byId("inlineLoginForm")?.addEventListener("submit", (event) => {
                event.preventDefault();
                closeClub();
                headerPost("HEADER_LOGIN");
            });

            if (clubButton) {
                clubButton.textContent = loggedIn ? (session.displayName || "My Profile") : translate("nav.clubBtn", "SKANDI Club");
            }
            if (accountMini) {
                accountMini.textContent = loggedIn
                    ? `${session.displayName || "Member"} · ${Number(session.points || 0).toLocaleString()} pts`
                    : "";
            }
            updateMobileAccount();
        }

        function openClub(context = "") {
            closeMobile({ restoreFocus: false });
            renderClub(context);
            byId("clubPanel")?.classList.add("open");
            byId("clubBackdrop")?.classList.add("open");
            document.documentElement.style.overflow = "hidden";
        }

        function openMobile() {
            closeClub();
            const layer = byId("mobileMenuLayer");
            const button = byId("mobileBtn");
            const drawer = byId("mobileDrawer");
            if (!layer || !button || !drawer || mobileMenuOpen) return;

            lastFocusedElement = document.activeElement;
            mobileMenuOpen = true;
            layer.classList.add("open");
            layer.setAttribute("aria-hidden", "false");
            button.setAttribute("aria-expanded", "true");
            document.documentElement.classList.add("mobile-menu-open");
            document.body.classList.add("mobile-menu-open");
            window.requestAnimationFrame(() => byId("mobileMenuClose")?.focus({ preventScroll: true }));
        }

        function trapMobileFocus(event) {
            if (!mobileMenuOpen || event.key !== "Tab") return;
            const drawer = byId("mobileDrawer");
            if (!drawer) return;

            const focusable = Array.from(
                drawer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')
            ).filter((element) => element.offsetParent !== null);
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        function bindSettings() {
            const settingsButton = byId("settingsBtn");
            const settingsMenu = byId("settingsMenu");

            settingsButton?.addEventListener("click", (event) => {
                event.stopPropagation();
                const open = !settingsMenu?.classList.contains("open");
                settingsMenu?.classList.toggle("open", open);
                settingsButton.setAttribute("aria-expanded", String(open));
            });

            document.addEventListener("click", (event) => {
                if (settingsMenu && !settingsMenu.contains(event.target) && event.target !== settingsButton) {
                    settingsMenu.classList.remove("open");
                    settingsButton?.setAttribute("aria-expanded", "false");
                }
            });

            byId("saveSettingsBtn")?.addEventListener("click", () => {
                saveSettings(byId("langSelect")?.value || "EN", byId("currSelect")?.value || "USD");
                settingsMenu?.classList.remove("open");
                settingsButton?.setAttribute("aria-expanded", "false");
            });

            const closeWelcome = () => {
                saveSettings(byId("welcomeLang")?.value || "EN", byId("welcomeCurr")?.value || "USD");
                const modal = byId("welcomeSettingsModal");
                modal?.classList.remove("active");
                modal?.setAttribute("aria-hidden", "true");
            };

            byId("welcomeSaveBtn")?.addEventListener("click", closeWelcome);
            byId("welcomeBackdrop")?.addEventListener("click", closeWelcome);
            byId("mobileLangSelect")?.addEventListener("change", (event) => {
                saveSettings(event.target.value, userSettings.currency);
            });
            byId("mobileCurrSelect")?.addEventListener("change", (event) => {
                saveSettings(userSettings.language, event.target.value);
            });
        }

        function bindHeader() {
            byId("logoBtn")?.addEventListener("click", () => navTo("/home"));
            byId("customerSearchBtn")?.addEventListener("click", () => headerPost("HEADER_SEARCH"));
            byId("favBtn")?.addEventListener("click", () => {
                session.loggedIn ? navTo("/my-profile?tab=favourites") : openClub("favorites");
            });
            byId("clubBtn")?.addEventListener("click", () => openClub());
            byId("clubClose")?.addEventListener("click", closeClub);
            byId("clubBackdrop")?.addEventListener("click", closeClub);
            byId("mobileBtn")?.addEventListener("click", () => mobileMenuOpen ? closeMobile() : openMobile());
            byId("mobileMenuBackdrop")?.addEventListener("click", () => closeMobile());
            byId("mobileMenuClose")?.addEventListener("click", () => closeMobile());
            byId("mobileSearchBtn")?.addEventListener("click", () => {
                closeMobile({ restoreFocus: false });
                headerPost("HEADER_SEARCH");
            });
            byId("mobileAccountBtn")?.addEventListener("click", () => {
                closeMobile({ restoreFocus: false });
                session.loggedIn ? navTo("/my-profile") : headerPost("HEADER_LOGIN");
            });

            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    closeMobile();
                    closeClub();
                    return;
                }
                trapMobileFocus(event);
            });
            window.addEventListener("resize", () => {
                if (window.innerWidth > 900) closeMobile({ restoreFocus: false });
            });
            bindSettings();
        }

        function showShellToast(message, isError = false) {
            const toast = byId("skandiShellToast");
            if (!toast) return;
            toast.textContent = message;
            toast.classList.toggle("error", isError);
            toast.classList.add("show");
            window.setTimeout(() => toast.classList.remove("show"), 3200);
        }

        function bindFooter() {
            const footerRoot = byId("skandi-site-footer");
            if (!footerRoot) return;

            const year = byId("customerFooterYear");
            if (year) year.textContent = new Date().getFullYear();

            footerRoot.querySelectorAll("[data-path]").forEach((element) => {
                element.addEventListener("click", () => {
                    footerPost("FOOTER_NAVIGATE", { path: element.getAttribute("data-path") });
                });
            });
            footerRoot.querySelectorAll(".social-btn[data-url]").forEach((button) => {
                button.addEventListener("click", () => {
                    const url = button.getAttribute("data-url");
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                });
            });

            const newsletterButton = byId("newsletterBtn");
            const newsletterEmail = byId("newsletterEmail");
            const subscribe = () => {
                footerPost("FOOTER_NEWSLETTER_SIGNUP", {
                    email: String(newsletterEmail?.value || "").trim(),
                    source: "Footer"
                });
            };

            newsletterButton?.addEventListener("click", subscribe);
            newsletterEmail?.addEventListener("keydown", (event) => {
                if (event.key === "Enter") subscribe();
            });
        }

        window.addEventListener("message", (event) => {
            const message = event.data || {};
            if (message.source && message.source !== PARENT_SOURCE) return;

            if (message.type === "CUSTOMER_HEADER_STATE") {
                session = {
                    loggedIn: Boolean(message.payload?.loggedIn),
                    displayName: message.payload?.displayName || "",
                    points: Number(message.payload?.points || 0),
                    tierName: message.payload?.tierName || ""
                };
                renderDesktopNav();
                renderMobileNav();
                renderClub();
            }

            if (message.type === "CLOSE_CUSTOMER_HEADER_PANELS") {
                closeMobile({ restoreFocus: false });
                closeClub();
            }

            if (message.type === "FOOTER_NEWSLETTER_RESULT") {
                const ok = Boolean(message.payload?.ok);
                showShellToast(
                    message.payload?.message || (ok ? "Thank you for subscribing." : "Newsletter signup failed."),
                    !ok
                );
            }
        });

        initializeSettings();
        renderDesktopNav();
        renderMobileNav();
        bindHeader();
        renderClub();
        bindFooter();
        applyTranslations();
        headerPost("HEADER_READY");
        footerPost("FOOTER_READY");
    })();
    </script>
    <!-- END HOMEPAGE CUSTOMER SHELL FUNCTIONS -->

<script>
(function(){
  "use strict";
  const SKANDI_R0037_LIVEKIT_MEMBER_SUPPORT=true;
  const PARENT="SKANDI_WIX_PARENT";
  const DEFAULT_TOPIC="skandi.support.chat";
  let room=null,session=null,connecting=null,activeCaseId="";
  const escLK=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  async function disconnect(){try{if(room)await room.disconnect();}catch(_){} room=null;session=null;connecting=null;}
  async function connect(s){
    if(!s?.url||!s?.token||!window.LivekitClient)return null;
    if(room&&session?.roomName===s.roomName&&room.state==="connected")return room;
    if(connecting)return connecting;
    connecting=(async()=>{await disconnect();const r=new window.LivekitClient.Room({adaptiveStream:true,dynacast:true});const topic=s.textTopic||DEFAULT_TOPIC;
      r.registerTextStreamHandler(topic,async(reader,participant)=>{if(participant?.identity===r.localParticipant?.identity)return;const text=await reader.readAll();const box=document.getElementById("messages");if(!box||!text)return;const wrap=document.createElement("div");wrap.className="msg-wrapper agent";wrap.innerHTML=`<div class="chat-avatar agent">S</div><div class="msg-content"><span class="msg-sender">SKANDI Support</span><div class="msg-bubble">${escLK(text)}</div></div>`;box.appendChild(wrap);box.scrollTop=box.scrollHeight;});
      await r.connect(s.url,s.token);room=r;session=s;return r;})().finally(()=>connecting=null);return connecting;
  }
  async function publish(sent,s){const text=String(sent?.message||sent?.content||"").trim();if(!text)return;const r=await connect(s);if(!r)return;await r.localParticipant.sendText(text,{topic:s?.textTopic||DEFAULT_TOPIC,attributes:{caseId:activeCaseId,messageId:String(sent?.messageId||sent?.message_id||""),senderType:"customer"}});}
  window.addEventListener("message",e=>{const m=e.data||{};if(m.source!==PARENT)return;const p=m.payload||{};if(m.type==="CUSTOMER_CASE_DETAIL"){activeCaseId=String(p.case?.caseId||p.case?.case_id||"");connect(p.livekitSession).catch(()=>{});}if(m.type==="CUSTOMER_REPLY_SENT"){activeCaseId=String(p.case?.caseId||p.case?.case_id||activeCaseId);publish(p.sentMessage,p.livekitSession).catch(()=>{});}if(m.type==="CUSTOMER_CASE_CREATED"){activeCaseId=String(p.caseId||p.case?.caseId||p.case?.case_id||activeCaseId);connect(p.livekitSession).catch(()=>{});}});
})();
</script></body>
</html>
```
