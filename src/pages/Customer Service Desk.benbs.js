<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SKANDI Support Center · LiveKit Agent Workspace</title>
<style>
:root{--bg:#f8f9f9;--white:#fff;--ink:#2f3941;--muted:#68737d;--line:#d8dcde;--soft:#eef0f1;--dark:#03111f;--teal:#022e64;--teal2:#1f6ba3;--note:#fff8d6;--red:#cc3340;--blue:#1f73b7;--green:#228f67;--shadow:0 12px 36px rgba(20,35,40,.18)}
*{box-sizing:border-box}html,body{height:100%;margin:0;font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg);overflow:hidden}
button,input,select,textarea{font:inherit}button{cursor:pointer}.app{height:100vh;display:grid;grid-template-columns:64px 300px minmax(560px,1fr) 330px;grid-template-rows:54px 1fr}
.rail{grid-row:1/3;background:var(--dark);color:#fff;display:flex;flex-direction:column;align-items:center}.logo{height:54px;width:100%;display:grid;place-items:center;border-bottom:1px solid #ffffff22}.logo b{border:2px solid;border-radius:8px 2px;width:31px;height:31px;display:grid;place-items:center}
.nav{padding:8px 0;width:100%;display:grid;gap:3px}.nav button{width:52px;height:50px;margin:auto;border:0;border-radius:7px;background:transparent;color:#ffffffbf;display:grid;place-items:center;font-size:18px;position:relative}.nav button small{font-size:9px}.nav button:hover,.nav button.active{background:#ffffff1e;color:#fff}.nav button.active:before{content:"";position:absolute;left:-6px;top:8px;bottom:8px;width:4px;border-radius:0 4px 4px 0;background:#5bd3c7}.rail-foot{margin-top:auto;padding:10px}
.nav svg {
      width: 21px;
      height: 21px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
.avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#3a858b,#174f4f);color:#fff;font-weight:800;border:2px solid #fff}.avatar.lg{width:56px;height:56px;font-size:17px;margin:auto}
.top{grid-column:2/5;background:#fff;border-bottom:1px solid var(--line);display:grid;grid-template-columns:300px 1fr 330px;align-items:center}.top>div{height:100%;display:flex;align-items:center;padding:0 13px;gap:9px}.top .qtop{border-right:1px solid var(--line)}.top .ctop{border-left:1px solid var(--line)}.title{min-width:0}.title b,.title small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.title small{color:var(--muted);font-size:11px}
.icon{border:0;background:transparent;border-radius:6px;width:34px;height:34px}.icon:hover{background:#f0f2f2}.search{position:relative;flex:1;max-width:450px}.search input{width:100%;height:34px;border:1px solid #cbd0d2;border-radius:6px;background:#f5f6f6;padding:0 35px}.search span{position:absolute;left:11px;top:7px}.search kbd{position:absolute;right:8px;top:8px;font-size:10px}.grow{flex:1}.pill,.presence{height:32px;border:1px solid var(--line);border-radius:6px;background:#fff;padding:0 10px;display:flex;align-items:center;gap:7px;white-space:nowrap}.pill{background:#e5f2f2;color:var(--dark);font-size:12px;font-weight:700}.dot{width:8px;height:8px;border-radius:50%;background:#2ba977}.dot.away{background:#d88e24}.dot.off{background:#87929a}.talk{height:34px;border:0;border-radius:6px;background:var(--dark);color:#fff;padding:0 13px;font-weight:700}
.queue{grid-column:2;grid-row:2;background:#f3f5f5;border-right:1px solid var(--line);display:flex;flex-direction:column;min-width:0}.qcontrols{padding:12px;background:#fff;border-bottom:1px solid var(--line);display:grid;gap:8px}.qhead{display:flex;justify-content:space-between;align-items:center}.qhead h2{font-size:15px;margin:0}.count{background:#e7eaea;border-radius:11px;padding:2px 8px;font-size:11px;font-weight:800}.qcontrols select,.qcontrols input{width:100%;height:34px;border:1px solid #cbd0d2;border-radius:5px;background:#fff;padding:0 9px}.qlist{overflow:auto}.qitem{width:100%;border:0;border-bottom:1px solid #dde1e2;background:#f8f9f9;text-align:left;padding:11px 12px;display:grid;gap:5px;position:relative}.qitem:hover,.qitem.active{background:#fff}.qitem.active{box-shadow:inset 3px 0 var(--teal2)}.qitem.unread:after{content:"";position:absolute;right:11px;top:12px;width:7px;height:7px;border-radius:50%;background:var(--blue)}.qmeta{display:flex;gap:6px;align-items:center;color:var(--muted);font-size:11px}.qsub{font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chan{width:21px;height:21px;border-radius:5px;display:grid;place-items:center;font-size:10px;font-weight:900}.email{background:#eaf4fb;color:#1f73b7}.chat{background:#e8f7f1;color:#228f67}.voice{background:#f1ecf8;color:#6b4ba1}.web{background:#fff2e1;color:#ad5e18}
.badge,.status{display:inline-flex;align-items:center;height:20px;padding:0 6px;border-radius:10px;font-size:10px;font-weight:800;text-transform:capitalize}.p-urgent{background:#fde8ea;color:#9b1c28}.p-high{background:#fff0db;color:#a05216}.p-normal{background:#eaf4fb;color:#25678f}.p-low{background:#edf0f1;color:#4d6670}.s-new{background:#dff4f3;color:#0c6b73}.s-open{background:#e6f2fc;color:#1b61a1}.s-pending{background:#fff1c8;color:#8a5c05}.s-on-hold{background:#f7ead9;color:#795019}.s-solved{background:#e4f3ec;color:#39735e}.s-closed{background:#e8ebed;color:#5e6870}
.work{grid-column:3;grid-row:2;background:#fff;display:flex;flex-direction:column;min-width:0;overflow:hidden}.tabs{height:44px;flex:0 0 44px;background:#eef0f0;border-bottom:1px solid var(--line);display:flex;overflow:auto}.tab{min-width:170px;max-width:240px;border:0;border-right:1px solid var(--line);background:#eef0f0;padding:0 9px;display:flex;gap:7px;align-items:center}.tab.active{background:#fff;box-shadow:inset 0 -3px var(--teal2)}.tab.home{min-width:48px;max-width:48px;justify-content:center}.tab span:nth-child(2){flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;font-size:12px;font-weight:700}.x{border:0;background:transparent;border-radius:4px}.x:hover{background:#dde1e2}.body{flex:1;min-height:0;overflow:hidden}.ticket{height:100%;display:grid;grid-template-rows:auto 1fr auto}.thead{padding:13px 16px 11px;border-bottom:1px solid var(--line);display:grid;gap:9px}.trow{display:flex;gap:10px;align-items:flex-start}.tmain{flex:1;min-width:0}.tmain h1{font-size:18px;margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.subline{color:var(--muted);font-size:12px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}.sla{min-width:126px;border:1px solid #ead17c;background:#fffbed;color:#6b5620;border-radius:6px;padding:6px 9px}.sla.breach{border-color:#e3a0a6;background:#fde8ea;color:#9b1c28}.sla small,.sla b{display:block}.sla small{font-size:10px;text-transform:uppercase;font-weight:800}.fields{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.fields label{font-size:11px;color:var(--muted)}.fields select{height:29px;border:1px solid #cbd0d2;border-radius:5px;background:#fff;font-size:12px}.tag{background:#eef1f1;color:#536068;border-radius:12px;padding:3px 8px;font-size:11px;font-weight:700}
.btn{min-height:33px;border:1px solid #c9ced0;border-radius:6px;background:#fff;padding:0 11px;font-weight:700;font-size:12px}.btn:hover{background:#f3f5f5}.primary{background:var(--dark);border-color:var(--dark);color:#fff}.primary:hover{background:#0d474e}.ghost{border-color:transparent;background:transparent}.danger{color:#a82633;border-color:#e0a5aa}.conversation{min-height:0;overflow:auto;background:#fafbfb;padding:18px max(16px,4vw);display:flex;flex-direction:column;gap:14px}.msg{display:flex;gap:9px;max-width:86%;align-items:flex-start}.msg.customer{align-self:flex-start}.msg.agent{align-self:flex-end;flex-direction:row-reverse}.msg.note{align-self:stretch;max-width:100%}.bubble{background:#fff;border:1px solid #dde1e2;border-radius:7px;padding:10px 12px;box-shadow:0 1px 2px #0000000f;min-width:180px}.agent .bubble{background:#f0f3f3}.note .bubble{width:100%;background:var(--note);border-color:#f0da83;box-shadow:none}.mmeta{font-size:11px;color:var(--muted);margin-bottom:5px;display:flex;gap:6px;align-items:center}.mmeta b{color:#3b474f}.mkind{background:#eef0f0;border-radius:8px;padding:1px 5px;font-size:9px;font-weight:800;text-transform:uppercase}.note .mkind{background:#f2da7c;color:#68520d}.mtext{white-space:pre-wrap;word-break:break-word}.mtext a{color:var(--blue)}.typing{align-self:flex-start;background:#fff;border:1px solid var(--line);border-radius:14px;padding:8px 11px}.typing i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#758189;margin:0 2px;animation:b 1.2s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}@keyframes b{40%{transform:translateY(-4px)}}
.composer{padding:10px 12px 12px;border-top:1px solid var(--line);position:relative}.cshell{border:1px solid #bdc4c7;border-radius:7px}.cshell.note-mode{background:var(--note);border-color:#d7b85a}.ctool,.cfoot{min-height:40px;padding:5px 7px;display:flex;align-items:center;gap:5px}.ctool{border-bottom:1px solid #dfe2e3}.cfoot{border-top:1px solid #e2e5e6}.ctool select{height:29px;border:1px solid #c9ced0;border-radius:5px;background:#fff;font-weight:700}.fmt{width:28px;height:28px;border:0;border-radius:4px;background:transparent}.fmt:hover{background:#0000000b}.editor{width:100%;min-height:86px;max-height:170px;resize:vertical;border:0;background:transparent;padding:11px 12px;display:block}.editor:focus{outline:0}.split{display:flex;position:relative}.split .btn:first-child{border-radius:6px 0 0 6px}.split .btn:nth-child(2){width:33px;border-left:1px solid #ffffff42;border-radius:0 6px 6px 0;padding:0}
.menu{position:absolute;z-index:100;background:#fff;border:1px solid #cdd2d4;border-radius:7px;box-shadow:var(--shadow);padding:5px;display:none;min-width:220px}.menu.open{display:block}.mi{width:100%;border:0;background:transparent;border-radius:4px;text-align:left;padding:8px;display:flex;gap:8px}.mi:hover{background:#f1f3f3}.mi b,.mi small{display:block}.mi small{color:var(--muted);font-size:10px}.macro-menu{left:12px;bottom:55px;min-width:300px;max-height:300px;overflow:auto}.submit-menu{right:0;bottom:40px}.presence-menu{right:104px;top:46px}.ctx{grid-column:4;grid-row:2;border-left:1px solid var(--line);background:#fff;display:flex;flex-direction:column;overflow:hidden}.ctabs{height:43px;border-bottom:1px solid var(--line);display:flex}.ctabs button{flex:1;border:0;background:transparent;font-size:12px;font-weight:750;color:#66727a;position:relative}.ctabs button.active{color:var(--dark)}.ctabs button.active:after{content:"";position:absolute;height:3px;left:8px;right:8px;bottom:0;background:var(--teal2)}.ccontent{overflow:auto}.section{padding:14px;border-bottom:1px solid var(--soft)}.section h3{font-size:12px;text-transform:uppercase;color:#59666e;margin:0 0 10px;display:flex;justify-content:space-between}.profile{text-align:center}.profile h2{font-size:16px;margin:7px 0 0}.muted{color:var(--muted)}.vip{display:inline-flex;background:#fff2bd;color:#7d5a00;border-radius:11px;padding:3px 8px;font-size:11px;font-weight:800;margin-top:7px}.details{display:grid;gap:8px}.detail{display:grid;grid-template-columns:85px 1fr;gap:8px;font-size:12px}.detail span:first-child{color:var(--muted)}.recent,.article,.appcard{border:1px solid var(--line);border-radius:6px;background:#fff;padding:9px;margin-bottom:8px}.recent{width:100%;text-align:left}.recent:hover,.article:hover{border-color:#9fa9ad}.recent b,.recent small{display:block}.recent small{color:var(--muted)}.kb input{width:100%;height:36px;border:1px solid #c9ced0;border-radius:5px;padding:0 9px}.article h4{margin:0 0 4px}.article p{margin:0 0 8px;font-size:11px;color:var(--muted)}.apps-head{background:#f6f7f7;border-bottom:1px solid var(--line);margin:-9px -9px 9px;padding:8px;font-weight:800}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:6px}.metric{background:#f8f9f9;border:1px solid #e7e9ea;border-radius:5px;padding:7px}.metric small,.metric b{display:block}
.page{height:100%;overflow:auto;padding:18px;background:var(--bg)}.pagehead{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}.pagehead h1{margin:0;font-size:22px}.pagehead p{margin:4px 0;color:var(--muted)}.card{background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:0 1px 2px #0000000d}.summaries{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.summary{padding:13px}.summary b{font-size:23px;display:block}.summary.active{border-color:var(--teal2);box-shadow:inset 0 0 0 1px var(--teal2)}.toolbar{min-height:49px;padding:8px 10px;border-bottom:1px solid var(--line);display:flex;gap:7px;align-items:center}.toolbar.bulk{background:#e5f2f2}.tablewrap{overflow:auto}table{border-collapse:collapse;width:100%;min-width:850px}th,td{padding:9px 10px;border-bottom:1px solid var(--soft);text-align:left;font-size:12px}th{background:#f6f7f7;color:#526068;position:sticky;top:0}tbody tr:hover{background:#f8fafa}tbody tr.selected{background:#edf8f7}.modules{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.module{padding:14px}.rule{padding:10px;display:flex;gap:10px;align-items:center;margin:8px 0}.toggle{width:38px;height:22px;border:0;border-radius:11px;background:#c6ccce;padding:2px}.toggle:after{content:"";display:block;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s}.toggle.on{background:var(--green)}.toggle.on:after{transform:translateX(16px)}
.call{position:fixed;right:24px;top:68px;width:320px;background:#fff;border:1px solid #bfc6c8;border-radius:10px;box-shadow:var(--shadow);z-index:150;display:none;overflow:hidden}.call.open{display:block}.callhead{background:var(--dark);color:#fff;padding:10px 12px;display:flex;justify-content:space-between}.callbody{text-align:center;padding:17px}.timer{font-size:24px;font-weight:800;font-variant-numeric:tabular-nums;margin:8px}.round{width:47px;height:47px;border-radius:50%;border:1px solid #c9ced0;background:#fff}.round.end{background:#d93f4c;color:#fff;border-color:#d93f4c}.disposition{display:grid;gap:7px;text-align:left;margin-top:12px}.disposition select,.disposition textarea{width:100%;border:1px solid #cbd0d2;border-radius:5px;padding:8px}.modalbg{position:fixed;inset:0;background:#10202366;z-index:200;display:none;place-items:center}.modalbg.open{display:grid}.modal{width:min(520px,95vw);background:#fff;border-radius:9px;box-shadow:var(--shadow);overflow:hidden}.mhead,.mfoot{padding:12px 15px;display:flex;align-items:center;justify-content:space-between}.mhead{border-bottom:1px solid var(--line)}.mhead h2{margin:0;font-size:16px}.mbody{padding:15px;display:grid;gap:10px}.mfoot{border-top:1px solid var(--line);justify-content:flex-end;gap:7px}.field{display:grid;gap:5px}.field input,.field select,.field textarea{border:1px solid #c9ced0;border-radius:5px;padding:8px}.toasts{position:fixed;right:18px;bottom:18px;z-index:300;display:grid;gap:8px}.toast{width:330px;background:#203c40;color:#fff;border-radius:7px;padding:11px 12px;box-shadow:var(--shadow)}.toast b,.toast small{display:block}.toast small{color:#ffffffc7}.empty{height:100%;display:grid;place-items:center;text-align:center;background:var(--bg);padding:30px}.hidden{display:none!important}
@media(max-width:1160px){.app{grid-template-columns:64px 280px 1fr}.top{grid-column:2/4;grid-template-columns:280px 1fr}.ctx,.ctop{display:none!important}}@media(max-width:850px){.app{grid-template-columns:58px 1fr}.top{grid-column:2;grid-template-columns:1fr}.qtop,.queue{display:none}.work{grid-column:2}.summaries,.modules{grid-template-columns:1fr}.pill{display:none}}
</style>
</head>
<body>
<div class="app">
<aside class="rail">
    <div class="logo"><b>Z</b>
  </div>
  <div class="nav" id="nav">
    <button class="active" data-nav="views">
        <svg viewBox="0 0 24 24">
          <path d="M3 11.5 12 4l9 7.5"></path>
          <path d="M5 10.5V20h5v-5h4v5h5v-9.5"></path>
        </svg><small>Home</small>
      </button>
      
    <button data-nav="customers"><svg viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
          <circle cx="9.5" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg><small>Customers</small></button>
    <button data-nav="reporting"><svg viewBox="0 0 24 24">
          <path d="M4 19V5"></path>
          <path d="M4 19h16"></path>
          <path d="M8 16v-5M12 16V8M16 16v-9"></path>
        </svg><small>Explore</small></button>
    <button data-nav="guide"><svg viewBox="0 0 24 24">
          <path d="M4 5h16v14H4z"></path>
          <path d="M8 9h8M8 13h8M8 17h5"></path>
        </svg><small>Guide</small></button>
    <button data-nav="settings"><svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.03 3.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.16.36.39.7.6 1 .3.3.69.45 1.1.45H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"></path>
        </svg><small>Admin</small></button>
  </div>
  <div class="rail-foot"><div class="avatar">?</div></div>
</aside>

<header class="top">
  <div class="qtop"><button class="icon" id="dashboardBtn">☰</button><div class="title"><b id="topView">Open cases</b><small id="topSub">Loading support workspace…</small></div></div>
  <div><div class="search"><span>⌕</span><input id="globalSearch" placeholder="Search ticket, PNR, traveler, vendor…"><kbd>⌘K</kbd></div><div class="grow"></div><span class="pill"><i class="dot"></i><span id="capacity">0 open · 0 messaging</span></span><button class="presence" id="presenceBtn"><i class="dot" id="pDot"></i><span id="pLabel">Online</span> ▾</button><button class="talk" id="talkBtn">☎ Talk</button></div>
  <div class="ctop"><div class="title"><b>Context panel</b><small>Traveler, knowledge and apps</small></div></div>
</header>

<aside class="queue">
  <div class="qcontrols"><div class="qhead"><h2 id="viewName"></h2><span class="count" id="viewCount"></span></div><select id="viewSelect"></select><input id="queueSearch" placeholder="Filter current view"></div>
  <div class="qlist" id="queueList"></div>
</aside>

<main class="work"><div class="tabs" id="tabs"></div><div class="body" id="workspace"></div></main>

<aside class="ctx"><div class="ctabs"><button class="active" data-ctx="customer">Customer</button><button data-ctx="knowledge">Knowledge</button><button data-ctx="apps">Apps</button></div><div class="ccontent" id="context"></div></aside>
</div>

<div class="menu presence-menu" id="presenceMenu">
  <button class="mi" data-presence="online"><i class="dot"></i><span><b>Online</b><small>Receive new work</small></span></button>
  <button class="mi" data-presence="away"><i class="dot away"></i><span><b>Away</b><small>Pause assignments</small></span></button>
  <button class="mi" data-presence="off"><i class="dot off"></i><span><b>Invisible</b><small>No new assignments</small></span></button>
</div>

<section class="call" id="callPanel">
  <div class="callhead"><b>LiveKit Talk</b><button class="x" id="closeCall">×</button></div>
  <div class="callbody"><div class="avatar lg" id="callAvatar">?</div><b id="callName">No traveler selected</b><div class="muted" id="callPhone">No phone number</div><div id="callStatus">Ready to call</div><div class="timer" id="callTimer">00:00</div><div><button class="round" id="muteBtn">M</button> <button class="round" id="holdBtn">Ⅱ</button> <button class="round end" id="callMain">☎</button></div><div class="disposition hidden" id="disposition"><select id="outcome"><option>Issue resolved</option><option>Follow-up required</option><option>Voicemail left</option><option>No answer</option></select><textarea id="callNotes" placeholder="Add call notes…"></textarea><button class="btn primary" id="saveCall">Save call to ticket</button></div></div>
</section>

<div class="modalbg" id="modalbg"><div class="modal"><div class="mhead"><h2 id="modalTitle"></h2><button class="x" id="closeModal">×</button></div><div class="mbody" id="modalBody"></div><div class="mfoot" id="modalFoot"></div></div></div>
<div class="toasts" id="toasts"></div>

<script src="https://cdn.jsdelivr.net/npm/livekit-client@2.22.3/dist/livekit-client.umd.min.js"></script>
<script>
"use strict";

/* =========================================================
   Parent embed bridge and SKANDI Support Center workspace data
   ========================================================= */
const SOURCE = "SKANDI_SUPPORT_AGENT";
const PARENT = "SKANDI_WIX_PARENT";
const DEFAULT_AGENT_ID = null;

const db = {
  views: [
    { id: "open", name: "Open cases", description: "All unsolved SKANDI support tickets", filter: t => !["solved", "closed"].includes(t.status) },
    { id: "mine", name: "Assigned to me", description: "Tickets assigned to the current agent", filter: t => Boolean(currentAgentId()) && t.assigneeId === currentAgentId() && !["solved", "closed"].includes(t.status) },
    { id: "urgent", name: "Urgent travel", description: "Active disruptions and priority recovery", filter: t => (t.queue === "urgent" || t.priority === "urgent") && !["solved", "closed"].includes(t.status) },
    { id: "member-priority", name: "Member priority", description: "SKANDI Club / signed-in member support ahead of standard Help Center cases", filter: t => t.memberPriority === true && !["solved", "closed"].includes(t.status) },
    { id: "booking-team", name: "Booking Team", description: "Cases routed from SKANDI Customer Service for booking review", filter: t => t.group === "booking-team" && !["solved", "closed"].includes(t.status) },
    { id: "duffel", name: "Duffel Assistant", description: "Customer Service cases linked to Duffel Assistant", filter: t => Boolean(t.customAttributes?.duffelAssistant?.customerUserId) && !["solved", "closed"].includes(t.status) },
    { id: "alexandra", name: "Alexandra", description: "Human follow-ups and requests created by Alexandra", filter: t => (String(t.source || "").toLowerCase()==="alexandra" || String(t.sourceChannel || "").toUpperCase()==="ALEXANDRA") && !["solved", "closed"].includes(t.status) },
    { id: "whatsapp", name: "WhatsApp", description: "Meta WhatsApp Cloud API messages handled by SKANDI Customer Service", filter: t => (String(t.source || "").toLowerCase()==="whatsapp" || String(t.sourceChannel || "").toUpperCase()==="WHATSAPP") && !["solved", "closed"].includes(t.status) },
    { id: "nordic", name: "Nordic Ops", description: "Destination and package operations", filter: t => t.queue === "nordic" && !["solved", "closed"].includes(t.status) },
    { id: "vendor", name: "Vendor Relations", description: "Waiting on hotels, transfers and activities", filter: t => t.queue === "vendor" && !["solved", "closed"].includes(t.status) },
    { id: "aviation", name: "Flight Operations", description: "Flight disruption and protection cases", filter: t => t.queue === "aviation" && !["solved", "closed"].includes(t.status) },
    { id: "solved", name: "Recently solved", description: "Solved during the current support period", filter: t => t.status === "solved" },
    { id: "all", name: "All tickets", description: "Every support case returned by the backend", filter: () => true }
  ],
  users: [],
  groups: [],
  tickets: [],
  macros: [],
  articles: [],
  triggers: [],
  automations: []
};

const S = {
  nav: "views",
  view: "open",
  active: null,
  open: [],
  dashboard: true,
  selected: new Set(),
  q: "",
  ctx: "customer",
  drafts: {},
  modes: {},
  submit: {},
  pending: new Map(),
  presence: "online",
  kb: "",
  session: { agentId: DEFAULT_AGENT_ID, agentName: "", agentInitials: "" },
  settings: { defaultGroup: "", defaultMacro: "", signature: "" },
  call: { active: false, seconds: 0, timer: null, ticketId: null },
  duffelContexts: {},
  duffelHandoffLinks: {}
};

const due = new Map();
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ticket = id => db.tickets.find(t => t.id === Number(id));
const user = id => db.users.find(u => u.id === Number(id));
const view = id => db.views.find(v => v.id === id) || db.views[0];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const tc = s => String(s || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const dateValue = value => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};
const fmt = d => {
  const date = dateValue(d);
  return date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date) : "—";
};
const short = d => {
  const date = dateValue(d);
  return date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date) : "—";
};
const ch = c => c === "email" ? "✉" : c === "voice" ? "☎" : c === "web" || c === "api" ? "W" : "●";
const chc = c => c === "email" ? "email" : c === "voice" ? "voice" : c === "web" || c === "api" ? "web" : "chat";
const sc = s => "s-" + String(s || "new").replace(/\s/g, "-");
const initials = name => String(name || "Support Agent").trim().split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
const currentAgentId = () => Number(S.session.agentId) || null;
const tid = t => t?.externalId || `#${t?.id ?? ""}`;
const arrayOf = value => Array.isArray(value) ? value : [];
const objectOf = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
let generatedId = 0;
let requestSequence = 0;

function nextGeneratedId(collection = []) {
  const highest = collection.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0);
  generatedId = Math.max(generatedId + 1, highest + 1, Date.now() % 1000000000);
  return generatedId;
}

function internalCaseId(raw = {}, rawId = "") {
  const candidates = [raw.internalId, raw.internal_id, raw.id, raw.caseId, raw.case_id, rawId];
  for (const candidate of candidates) {
    const number = Number(candidate);
    if (Number.isSafeInteger(number) && number > 0) return number;
  }
  const existing = db.tickets.find(item =>
    String(item.externalId || "") === String(rawId || "") ||
    String(item.caseId || "") === String(raw.caseId || raw.case_id || "")
  );
  return existing?.id || nextGeneratedId(db.tickets);
}

function post(type, payload = {}) {
  const requestId = payload.requestId || `${Date.now()}-${++requestSequence}`;
  try {
    window.parent.postMessage({
      source: SOURCE,
      type,
      requestId,
      payload: { ...payload, requestId }
    }, "*");
  } catch (error) {
    console.warn("Parent postMessage unavailable", error);
  }
  return requestId;
}

function serializeTicket(t) {
  if (!t) return null;
  const requester = user(t.requesterId);
  const assignee = user(t.assigneeId);
  return {
    ...t,
    id: t.externalId || t.id,
    internalId: t.id,
    requester: requester ? { ...requester } : null,
    assignee: assignee ? { ...assignee } : null,
    conversationHistory: t.history.map(m => ({ ...m, author: user(m.authorId) || null }))
  };
}

function normalizeStatus(value) {
  const v = String(value || "new").trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  if (v === "onhold") return "on-hold";
  return ["new", "open", "pending", "on-hold", "solved", "closed"].includes(v) ? v : "open";
}

function normalizePriority(value) {
  const v = String(value || "normal").trim().toLowerCase();
  return ["low", "normal", "high", "urgent"].includes(v) ? v : "normal";
}

function normalizeChannel(value) {
  const v = String(value || "email").trim().toLowerCase();
  if (["chat", "web chat", "live chat", "messaging", "sms", "whatsapp"].includes(v)) return v === "chat" || v.includes("chat") ? "chat" : "messaging";
  if (["phone", "talk", "voice"].includes(v)) return "voice";
  if (["api", "web", "web form", "mobile app"].includes(v)) return "web";
  return "email";
}

function resolveAgentId(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && user(value)) return value;
  if (typeof value === "object") {
    const existing = value.id ? user(value.id) : db.users.find(u =>
      u.role === "agent" &&
      (
        (value.email && String(u.email || "").toLowerCase() === String(value.email).toLowerCase()) ||
        (value.name && String(u.name || "").toLowerCase() === String(value.name).toLowerCase())
      )
    );
    if (existing) return existing.id;
    if (value.id || value.name || value.email) {
      const suppliedId = Number(value.id);
      const agent = {
        id: Number.isSafeInteger(suppliedId) && suppliedId > 0 ? suppliedId : nextGeneratedId(db.users),
        role: "agent",
        name: value.name || value.email || "Support Agent",
        initials: value.initials || initials(value.name || value.email),
        email: value.email || "",
        phone: value.phone || "",
        group: value.group?.name || value.group || ""
      };
      db.users.push(agent);
      return agent.id;
    }
    value = "";
  }
  const found = db.users.find(u => u.role === "agent" && [u.name, u.email].some(x => String(x || "").toLowerCase() === String(value).toLowerCase()));
  return found ? found.id : null;
}

function ensureRequester(raw = {}) {
  const metaSender = typeof raw.meta?.sender === "object" ? raw.meta.sender : {};
  const customer = typeof raw.customer === "object" ? raw.customer : metaSender;
  const requester = typeof raw.requester === "object" ? raw.requester : {};
  const name = requester.name || customer.name || (typeof raw.requester === "string" ? raw.requester : "Unknown traveler");
  const email = requester.email || customer.email || customer.additional_attributes?.email || raw.email || "";
  let found = db.users.find(u =>
    u.role === "requester" &&
    (
      (email && String(u.email || "").toLowerCase() === String(email).toLowerCase()) ||
      String(u.name || "").toLowerCase() === String(name).toLowerCase()
    )
  );
  if (!found) {
    const suppliedId = Number(requester.id || customer.id || raw.requesterId || raw.customerId);
    const nextId = Number.isSafeInteger(suppliedId) && suppliedId > 0 ? suppliedId : nextGeneratedId(db.users);
    found = {
      id: nextId, role: "requester", name, initials: initials(name), email,
      phone: requester.phone || customer.phone || customer.phone_number || raw.phone || "",
      organization: requester.organization || customer.organization || raw.organization || "",
      vip: Boolean(requester.vip ?? customer.vip ?? raw.vip),
      plan: requester.plan || customer.plan || raw.tier || "",
      locale: requester.locale || customer.locale || customer.additional_attributes?.locale || "",
      timezone: requester.timezone || customer.timezone || "",
      value: requester.value || customer.value || raw.booking?.total || "",
      notes: requester.notes || customer.notes || ""
    };
    db.users.push(found);
  } else {
    Object.assign(found, {
      name: name || found.name,
      initials: initials(name || found.name),
      email: email || found.email,
      phone: requester.phone || customer.phone || customer.phone_number || found.phone,
      organization: requester.organization || customer.organization || found.organization,
      vip: Boolean(requester.vip ?? customer.vip ?? found.vip),
      plan: requester.plan || customer.plan || raw.tier || found.plan,
      locale: requester.locale || customer.locale || found.locale,
      timezone: requester.timezone || customer.timezone || found.timezone,
      notes: requester.notes || customer.notes || found.notes
    });
  }
  return found.id;
}

function ensureSessionAgent() {
  const existing = db.users.find(u =>
    u.role === "agent" &&
    (
      (currentAgentId() && u.id === currentAgentId()) ||
      (S.session.agentName && String(u.name || "").toLowerCase() === S.session.agentName.toLowerCase())
    )
  );
  if (existing) return existing.id;
  if (!S.session.agentName && !currentAgentId()) return null;
  const id = currentAgentId() || nextGeneratedId(db.users);
  const agent = {
    id,
    role: "agent",
    name: S.session.agentName || "Support Agent",
    initials: S.session.agentInitials || initials(S.session.agentName),
    email: S.session.agentEmail || "",
    phone: "",
    group: S.settings.defaultGroup || ""
  };
  db.users.push(agent);
  S.session.agentId = id;
  return id;
}

function ensureMessageAuthor(message, requesterId) {
  if (message.authorId && user(message.authorId)) return Number(message.authorId);
  const messageType = String(message.message_type ?? message.messageType ?? message.type ?? "").toLowerCase();
  const senderType = String(message.sender_type || message.senderType || message.author?.type || "").toLowerCase();
  const isCustomer =
    messageType === "0" ||
    messageType === "incoming" ||
    messageType.includes("customer") ||
    senderType === "contact" ||
    String(message.role || "").toLowerCase() === "requester";
  if (isCustomer) return requesterId;
  const sender = message.sender || message.author?.name || message.authorName;
  const found = db.users.find(u => u.role === "agent" && String(u.name || "").toLowerCase() === String(sender || "").toLowerCase());
  if (found) return found.id;
  if (sender) {
    const agent = {
      id: nextGeneratedId(db.users),
      role: "agent",
      name: String(sender),
      initials: initials(sender),
      email: message.author?.email || "",
      phone: "",
      group: ""
    };
    db.users.push(agent);
    return agent.id;
  }
  return ensureSessionAgent();
}

function normalizeIncomingCase(raw = {}) {
  const custom = objectOf(raw.custom_attributes || raw.customAttributes);
  const rawId = raw.externalId || raw.external_id || raw.ticketId || raw.ticket_id || raw.id || raw.caseId || raw.case_id || "";
  const id = internalCaseId(raw, rawId);
  const externalId = String(raw.externalId || raw.external_id || raw.ticketId || raw.ticket_id || rawId || raw.caseId || raw.case_id || id);
  const requesterId = ensureRequester(raw);
  const channel = normalizeChannel(raw.channel || raw.via || raw.meta?.channel || raw.source);
  const historySource = arrayOf(raw.history || raw.conversationHistory || raw.messages);
  const history = historySource.map((m, index) => ({
    id: m.id || `import-${id}-${index}-${Date.now()}`,
    authorId: ensureMessageAuthor(m, requesterId),
    authorName: m.authorName || m.author?.name || m.sender?.name || (typeof m.sender === "string" ? m.sender : ""),
    authorInitials: m.author?.initials || "",
    kind: m.private || m.kind === "internal" || String(m.type || "").includes("internal") ? "internal" : "public",
    channel: m.private || m.kind === "internal" || String(m.type || "").includes("internal") ? "internal" : normalizeChannel(m.channel || m.kind || raw.channel),
    at: m.at || m.createdAt || m.created_at || m.timestamp || new Date().toISOString(),
    body: Array.isArray(m.body) ? m.body.join("\n\n") : String(m.body || m.content || m.text || m.message || "")
  }));

  return {
    id,
    externalId,
    caseId: String(raw.caseId || raw.case_id || raw.id || rawId || id),
    pnr: String(raw.pnr || custom.pnr || custom.booking_reference || raw.bookingRef || raw.booking_ref || raw.booking?.pnr || "").toUpperCase(),
    subject: raw.subject || custom.subject || raw.title || "Support case",
    requesterId,
    assigneeId: resolveAgentId(raw.assigneeId ?? raw.assignee_id ?? raw.assignee ?? raw.meta?.assignee),
    followers: Array.isArray(raw.followers) ? raw.followers.map(resolveAgentId).filter(Boolean) : [],
    ccs: Array.isArray(raw.ccs || raw.cc) ? (raw.ccs || raw.cc) : [],
    status: normalizeStatus(raw.status),
    priority: normalizePriority(raw.priority),
    memberPriority: Boolean(
      raw.memberPriority === true ||
      custom.memberPriority === true ||
      /(?:my-profile-support|member-helpdesk|customer-portal)/i.test(String(raw.source || custom.source || raw.sourceChannel || custom.sourceChannel || ""))
    ),
    type: String(raw.type || raw.ticketType || raw.ticket_type || "question").toLowerCase(),
    channel,
    channelLabel: raw.channelLabel || raw.channel_label || raw.channel || tc(channel),
    group: typeof raw.group === "object" ? raw.group.name : raw.group || "",
    queue: raw.queue || "open",
    formType: raw.formType || raw.form_type || raw.form || "",
    tier: raw.tier || raw.customer?.plan || "",
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
    tags: Array.isArray(raw.tags) ? raw.tags.map(tag => typeof tag === "object" ? tag.name : tag).filter(Boolean) : [],
    unread: Boolean(raw.unread || Number(raw.unread_count) > 0),
    slaMinutes: typeof raw.slaMinutes === "number" ? raw.slaMinutes : typeof raw.slaDueInMinutes === "number" ? raw.slaDueInMinutes : null,
    typing: Boolean(raw.typing),
    summary: raw.summary || raw.description || "",
    sentiment: raw.sentiment || { label: "", level: "" },
    travel: raw.travel || { trip: raw.trip || "", vendor: raw.vendor || "", sla: raw.sla || "", flight: "", hotel: "", transfer: "" },
    booking: raw.booking || { pnr: raw.pnr || "", package: raw.package || "", status: raw.bookingStatus || raw.booking_status || "", travelers: raw.travelers ?? null, total: raw.total || "", departure: raw.departure || "" },
    customAttributes: custom,
    source: raw.source || custom.source || "",
    sourceChannel: raw.sourceChannel || custom.sourceChannel || "",
    crm: raw.crm || { owner: raw.owner || "", health: "", renewal: "", arr: raw.booking?.total || "" },
    journey: arrayOf(raw.journey || raw.customer?.journey),
    history
  };
}

function upsertCase(raw, openAfter = false) {
  if (!raw || typeof raw !== "object") return null;
  const includesHistory = Array.isArray(raw?.history) || Array.isArray(raw?.conversationHistory) || Array.isArray(raw?.messages);
  const normalized = normalizeIncomingCase(raw);
  const existing = db.tickets.find(t => t.id === normalized.id || t.externalId === normalized.externalId || (normalized.caseId && t.caseId === normalized.caseId));
  if (existing) {
    const oldHistory = existing.history || [];
    Object.assign(existing, normalized);
    if (!includesHistory) existing.history = oldHistory;
    if (typeof normalized.slaMinutes === "number") due.set(existing.id, Date.now() + normalized.slaMinutes * 60000);
    if (openAfter) openTicket(existing.id, false);
    return existing;
  }
  db.tickets.unshift(normalized);
  if (typeof normalized.slaMinutes === "number") due.set(normalized.id, Date.now() + normalized.slaMinutes * 60000);
  if (openAfter) openTicket(normalized.id, false);
  return normalized;
}

function extractCaseList(value, depth = 0) {
  if (depth > 6 || value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "object") return [];
  for (const key of ["cases", "tickets", "items", "conversations", "data", "result", "payload"]) {
    if (key in value) {
      const found = extractCaseList(value[key], depth + 1);
      if (Array.isArray(found)) return found;
    }
  }
  return [];
}

function extractSingleCase(value, depth = 0) {
  if (depth > 6 || value == null) return null;
  if (Array.isArray(value)) return value[0] || null;
  if (typeof value !== "object") return null;
  for (const key of ["case", "ticket", "conversation", "data", "result", "payload"]) {
    if (key in value) {
      const found = extractSingleCase(value[key], depth + 1);
      if (found) return found;
    }
  }
  const hasIdentity = ["caseId", "case_id", "ticketId", "ticket_id", "externalId", "external_id", "id"].some(key => value[key] != null);
  const hasCaseFields = ["subject", "title", "requester", "customer", "messages", "history", "conversationHistory", "status", "pnr"].some(key => value[key] != null);
  return hasIdentity && hasCaseFields ? value : null;
}

function importCases(payload = {}, openFirst = false) {
  const list = extractCaseList(payload);
  const imported = list.map(item => upsertCase(item, false)).filter(Boolean);
  if (openFirst && imported[0]) openTicket(imported[0].id, false);
  else renderAll();
  return imported;
}

function rebuildDue() {
  due.clear();
  db.tickets.forEach(t => typeof t.slaMinutes === "number" && due.set(t.id, Date.now() + t.slaMinutes * 60000));
}

function toast(title, detail = "") {
  const n = document.createElement("div");
  n.className = "toast";
  n.innerHTML = `<b>${esc(title)}</b>${detail ? `<small>${esc(detail)}</small>` : ""}`;
  $("#toasts").append(n);
  setTimeout(() => n.remove(), 3200);
}

function openModal(title, body, footer) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalFoot").innerHTML = footer;
  $("#modalbg").classList.add("open");
}

function closeModal() {
  $("#modalbg").classList.remove("open");
}

function visible(id = S.view) {
  const v = view(id);
  const q = S.q.trim().toLowerCase();
  return db.tickets
    .filter(v.filter)
    .filter(t => !q || [tid(t), t.pnr, t.subject, user(t.requesterId)?.name, t.group, t.status, t.priority, t.travel?.vendor, t.memberPriority ? "member priority skandi club" : "", t.tags.join(" ")].join(" ").toLowerCase().includes(q))
        .sort((a, b) => {
      const memberDelta = Number(Boolean(b.memberPriority)) - Number(Boolean(a.memberPriority));
      if (memberDelta) return memberDelta;
      const rank = { urgent: 4, high: 3, normal: 2, low: 1 };
      const priorityDelta = (rank[b.priority] || 0) - (rank[a.priority] || 0);
      return priorityDelta || (new Date(b.updatedAt) - new Date(a.updatedAt));
    });
}

function renderTop() {
  const v = view(S.view);
  $("#topView").textContent = v.name;
  $("#topSub").textContent = v.description;
  const assigned = db.tickets.filter(t => t.assigneeId === currentAgentId() && !["solved", "closed"].includes(t.status));
  const realtime = assigned.filter(t => ["chat", "messaging"].includes(t.channel));
  $("#capacity").textContent = `${assigned.length} open · ${realtime.length} messaging`;
  const labels = { online: "Online", away: "Away", off: "Invisible" };
  $("#pLabel").textContent = labels[S.presence];
  $("#pDot").className = "dot " + (S.presence === "online" ? "" : S.presence);
  const agentAvatar = $(".rail-foot .avatar");
  if (agentAvatar) agentAvatar.textContent = S.session.agentInitials || (S.session.agentName ? initials(S.session.agentName) : "?");
}

function renderQueue() {
  const v = view(S.view);
  const rows = visible();
  $("#viewName").textContent = v.name;
  $("#viewCount").textContent = rows.length;
  $("#viewSelect").innerHTML = db.views.map(x => `<option value="${x.id}" ${x.id === S.view ? "selected" : ""}>${esc(x.name)}</option>`).join("");
  $("#queueList").innerHTML = rows.map(t => {
    const u = user(t.requesterId) || { name: "Unknown traveler" };
    return `<button class="qitem ${S.active === t.id && !S.dashboard ? "active" : ""} ${t.unread ? "unread" : ""}" data-open="${t.id}">
      <div class="qmeta"><span class="chan ${chc(t.channel)}">${ch(t.channel)}</span><span>${esc(tid(t))}</span>${t.memberPriority ? `<span class="badge" style="background:#d9f3f4;color:#022e64">SKANDI CLUB PRIORITY</span>` : ""}<span class="badge p-${t.priority}">${esc(t.priority)}</span></div>
      <div class="qsub">${esc(t.subject)}</div>
      <div class="qmeta"><span class="grow">${esc(u.name)}</span><span>${short(t.updatedAt)}</span><span class="status ${sc(t.status)}">${tc(t.status)}</span></div>
    </button>`;
  }).join("") || `<div class="muted" style="padding:24px;text-align:center">No tickets found</div>`;
}

function renderTabs() {
  const home = `<button class="tab home ${S.dashboard || !S.active ? "active" : ""}" id="homeTab">⌂</button>`;
  $("#tabs").innerHTML = home + S.open.map(id => {
    const t = ticket(id);
    if (!t) return "";
    return `<div class="tab ${!S.dashboard && S.active === id ? "active" : ""}" data-tab="${id}" tabindex="0">
      <span class="chan ${chc(t.channel)}">${ch(t.channel)}</span>
      <span>${esc(tid(t))} ${esc(t.subject)}</span>
      <button class="x" data-close="${id}">×</button>
    </div>`;
  }).join("");
}

function openTicket(id, notifyParent = true) {
  id = Number(id);
  const t = ticket(id);
  if (!t) return;
  if (!S.open.includes(id)) S.open.push(id);
  S.active = id;
  S.dashboard = false;
  S.nav = "views";
  t.unread = false;
  if (!S.modes[id]) S.modes[id] = String(t.sourceChannel || "").toUpperCase() === "WHATSAPP" ? "whatsapp" : ["chat", "messaging"].includes(t.channel) ? "chat" : "email";
  if (!S.submit[id]) S.submit[id] = ["pending", "solved"].includes(t.status) ? t.status : "open";
  $$('[data-nav]').forEach(b => b.classList.toggle("active", b.dataset.nav === "views"));
  renderAll();
  requestAnimationFrame(() => {
    const c = $("#conversation");
    if (c) c.scrollTop = c.scrollHeight;
  });
  if (notifyParent) {
    post("AGENT_OPEN_CASE", { ticketId: t.externalId || t.id, internalId: t.id, caseId: t.caseId, pnr: t.pnr });
    post("AGENT_DUFFEL_CONTEXT_REQUEST", { caseId: t.caseId });
  }
}

function closeTab(id) {
  id = Number(id);
  const i = S.open.indexOf(id);
  const t = ticket(id);
  S.open = S.open.filter(x => x !== id);
  if (S.active === id) {
    S.active = S.open[i] || S.open[i - 1] || null;
    S.dashboard = !S.active;
  }
  renderAll();
  if (t) post("AGENT_CLOSE_TAB", { ticketId: t.externalId || t.id, internalId: t.id, caseId: t.caseId });
}

function sla(t) {
  if (!due.has(t.id)) return null;
  const d = due.get(t.id) - Date.now();
  const breach = d < 0;
  const a = Math.abs(d);
  const s = Math.floor(a / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { breach, text: `${breach ? "−" : ""}${h ? h + "h " : ""}${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s` };
}

function messageHtml(m) {
  const u = user(m.authorId) || {
    name: m.authorName || (m.kind === "internal" ? "Support Agent" : "Traveler"),
    initials: m.authorInitials || initials(m.authorName || (m.kind === "internal" ? "Support Agent" : "Traveler")),
    role: m.kind === "internal" ? "agent" : "requester"
  };
  const note = m.kind === "internal";
  const agent = u.role === "agent";
  const cls = note ? "note" : agent ? "agent" : "customer";
  const body = esc(m.body).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a target="_blank" rel="noopener" href="$1">$1</a>');
  return `<article class="msg ${cls}">${note ? "" : `<div class="avatar">${esc(u.initials || initials(u.name))}</div>`}<div class="bubble"><div class="mmeta"><b>${esc(u.name)}</b><span>${fmt(m.at)}</span><span class="mkind">${note ? "Internal note" : tc(m.channel)}</span></div><div class="mtext">${body}</div></div></article>`;
}

function ticketHtml(t) {
  const u = user(t.requesterId) || { name: "Unknown traveler", email: "" };
  const isWhatsApp = String(t.sourceChannel || "").toUpperCase() === "WHATSAPP" || String(t.source || "").toLowerCase() === "whatsapp";
  const mode = isWhatsApp && S.modes[t.id] !== "internal" ? "whatsapp" : S.modes[t.id] || "email";
  const draft = S.drafts[t.id] || "";
  const submitStatus = S.submit[t.id] || "open";
  const pending = S.pending.has(t.id);
  const x = sla(t);
  const groupOptions = [...new Set([...db.groups, t.group, "booking-team"].filter(Boolean))];
  const supplier = S.duffelContexts[t.caseId];
  return `<div class="ticket">
    <header class="thead">
      <div class="trow">
        <div class="tmain">
          <h1>${esc(tid(t))} · ${esc(t.subject)}</h1>
          <div class="subline"><span class="chan ${chc(t.channel)}">${ch(t.channel)}</span><span>${esc(t.channelLabel || tc(t.channel))}</span><span>• Requester: <b>${esc(u.name)}</b></span>${t.pnr ? `<span>• PNR <b>${esc(t.pnr)}</b></span>` : ""}<span>• Created ${fmt(t.createdAt)}</span></div>
        </div>
        ${x ? `<div class="sla ${x.breach ? "breach" : ""}" data-sla="${t.id}"><small>${x.breach ? "SLA breached" : "Next reply SLA"}</small><b>${x.text}</b></div>` : ""}
        <button class="btn" id="followBtn">${t.followers.includes(currentAgentId()) ? "Following" : "Follow"}</button>
        <button class="btn" data-duffel-action="route">Booking Team</button>
        <button class="btn" data-duffel-action="verify" ${supplier?.bookingLinked ? "" : "disabled"} title="Verify an owned Duffel resource using the canonical API">Verify Duffel</button>
        <button class="btn" data-duffel-action="handoff" ${supplier?.bookingLinked ? "" : "disabled"} title="Requires a verified Duffel booking linked by the customer">Duffel handoff</button>
        <button class="btn" id="moreBtn">More ▾</button>
      </div>
      <div class="fields">
        <label>Status <select data-field="status">${["new", "open", "pending", "on-hold", "solved", "closed"].map(v => `<option value="${v}" ${t.status === v ? "selected" : ""}>${tc(v)}</option>`).join("")}</select></label>
        <label>Priority <select data-field="priority">${["low", "normal", "high", "urgent"].map(v => `<option value="${v}" ${t.priority === v ? "selected" : ""}>${tc(v)}</option>`).join("")}</select></label>
        <label>Type <select data-field="type">${["question", "incident", "problem", "task"].map(v => `<option value="${v}" ${t.type === v ? "selected" : ""}>${tc(v)}</option>`).join("")}</select></label>
        <label>Group <select data-field="group">${groupOptions.map(v => `<option value="${esc(v)}" ${t.group === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
        <label>Assignee <select data-field="assigneeId"><option value="">Unassigned</option>${db.users.filter(x => x.role === "agent").map(x => `<option value="${x.id}" ${t.assigneeId === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
        ${supplier?.resourceId ? `<span class="tag">Duffel: ${esc(supplier.resourceId)}</span>` : ""}
        ${t.memberPriority ? `<span class="tag" style="border-color:#5fc7cf;background:#d9f3f4;color:#022e64;font-weight:900">SKANDI CLUB · PRIORITY</span>` : ""}${t.tier ? `<span class="tag">${esc(t.tier)}</span>` : ""}${t.tags.slice(0, 3).map(x => `<span class="tag">#${esc(x)}</span>`).join("")}
      </div>
    </header>
    <div class="conversation" id="conversation">${t.history.map(messageHtml).join("")}${t.typing ? `<div class="typing"><i></i><i></i><i></i></div>` : ""}</div>
    <div class="composer">
      <div class="cshell ${mode === "internal" ? "note-mode" : ""}">
        <div class="ctool">
          <select id="mode">${isWhatsApp ? `<option value="whatsapp" ${mode === "whatsapp" ? "selected" : ""}>Public reply · WhatsApp</option>` : `<option value="email" ${mode === "email" ? "selected" : ""}>Public reply · Email</option><option value="chat" ${mode === "chat" ? "selected" : ""}>Public reply · Live chat</option>`}<option value="internal" ${mode === "internal" ? "selected" : ""}>Internal note</option></select>
          <button class="fmt" data-fmt="b"><b>B</b></button><button class="fmt" data-fmt="i"><i>I</i></button><button class="fmt" data-fmt="list">•≡</button><button class="fmt" id="attach">📎</button>
        </div>
        <textarea class="editor" id="editor" placeholder="${mode === "internal" ? "Internal note visible only to agents…" : "Write a reply…"}">${esc(draft)}</textarea>
        <div class="cfoot">
          <button class="btn" id="macroBtn">Apply macro ▾</button><button class="btn ghost" id="mention">@ mention</button><span class="muted">${mode === "internal" ? "Agents only" : isWhatsApp ? "WhatsApp · " + esc(u.phone || "unverified number") : "To: " + esc(u.email)}</span><div class="grow"></div>
          <div class="split"><button class="btn primary" id="submit" ${pending ? "disabled" : ""}>${pending ? "Sending…" : `Submit as ${tc(submitStatus)}`}</button><button class="btn primary" id="submitToggle" ${pending ? "disabled" : ""}>▾</button>
            <div class="menu submit-menu" id="submitMenu">${["open", "pending", "solved"].map(s => `<button class="mi" data-submit="${s}"><span class="status ${sc(s)}">${tc(s)}</span><span><b>Submit as ${tc(s)}</b><small>${s === "open" ? "Keep active" : s === "pending" ? "Waiting for requester or vendor" : "Mark resolved"}</small></span></button>`).join("")}</div>
          </div>
        </div>
      </div>
      <div class="menu macro-menu" id="macroMenu">${db.macros.map(m => `<button class="mi" data-macro="${m.id}"><span>⚡</span><span><b>${esc(m.name)}</b><small>${esc(m.description)}</small></span></button>`).join("") || `<div class="muted" style="padding:10px">No macros available.</div>`}</div>
    </div>
  </div>`;
}

function renderWorkspace() {
  const w = $("#workspace");
  if (S.dashboard || !S.active) {
    w.innerHTML = moduleHtml();
    wireModule();
    return;
  }
  const t = ticket(S.active);
  if (!t) {
    S.dashboard = true;
    S.active = null;
    w.innerHTML = moduleHtml();
    wireModule();
    return;
  }
  w.innerHTML = ticketHtml(t);
  wireTicket(t);
}

function postTicketUpdate(t, action, extra = {}) {
  return post("AGENT_UPDATE_CASE", { action, ticketId: t.externalId || t.id, internalId: t.id, caseId: t.caseId, pnr: t.pnr, case: serializeTicket(t), ...extra });
}

function wireTicket(t) {
  const ed = $("#editor");
  ed.oninput = () => S.drafts[t.id] = ed.value;
  $("#mode").onchange = e => {
    S.drafts[t.id] = ed.value;
    S.modes[t.id] = e.target.value;
    renderWorkspace();
  };

  $$('[data-field]').forEach(select => select.onchange = e => {
    const field = e.target.dataset.field;
    let value = e.target.value;
    if (field === "assigneeId") value = value ? Number(value) : null;
    t[field] = value;
    t.updatedAt = new Date().toISOString();
    renderAll();
    toast("Ticket updated", `${tc(field)} changed`);
    postTicketUpdate(t, "FIELD_CHANGE", { field, value });
  });

  $("#followBtn").onclick = () => {
    const agentId = ensureSessionAgent();
    if (!agentId) return toast("Authenticated agent required", "The parent page must provide the signed-in agent session.");
    t.followers = t.followers.includes(agentId) ? t.followers.filter(x => x !== agentId) : [...t.followers, agentId];
    renderWorkspace();
    postTicketUpdate(t, "FOLLOWER_CHANGE", { following: t.followers.includes(agentId) });
  };

  $("#moreBtn").onclick = () => {
    openModal("Ticket actions", `<button class="recent" id="printBtn"><b>Print ticket</b><small>Open browser print dialog</small></button><button class="recent" id="deleteBtn"><b style="color:#a82633">Delete ticket</b><small>Remove this ticket from the local workspace</small></button>`, `<button class="btn" id="cancel">Cancel</button>`);
    $("#cancel").onclick = closeModal;
    $("#printBtn").onclick = () => window.print();
    $("#deleteBtn").onclick = () => {
      db.tickets.splice(db.tickets.indexOf(t), 1);
      closeModal();
      closeTab(t.id);
      toast("Ticket deleted", tid(t));
      post("AGENT_DELETE_CASE", { ticketId: t.externalId || t.id, internalId: t.id, caseId: t.caseId });
    };
  };

  $("#macroBtn").onclick = e => {
    e.stopPropagation();
    $("#macroMenu").classList.toggle("open");
  };

  $$('[data-macro]').forEach(button => button.onclick = () => {
    const m = db.macros.find(x => x.id === button.dataset.macro);
    const requester = user(t.requesterId);
    S.drafts[t.id] = m.body.replaceAll("{{first}}", requester?.name.split(" ")[0] || "there");
    S.modes[t.id] = m.channel;
    S.submit[t.id] = m.status;
    renderWorkspace();
    toast("Macro applied", m.name);
    post("AGENT_APPLY_MACRO", { macroId: m.id, ticketId: t.externalId || t.id, caseId: t.caseId });
  });

  $("#submitToggle").onclick = e => {
    e.stopPropagation();
    $("#submitMenu").classList.toggle("open");
  };

  $$('[data-submit]').forEach(button => button.onclick = () => {
    S.submit[t.id] = button.dataset.submit;
    $("#submit").textContent = "Submit as " + tc(button.dataset.submit);
    $("#submitMenu").classList.remove("open");
  });

  $("#submit").onclick = () => {
    if (S.pending.has(t.id)) return;
    const body = ed.value.trim();
    if (!body) return toast("Nothing to submit", "Write a reply or internal note first");
    const isWhatsApp = String(t.sourceChannel || "").toUpperCase() === "WHATSAPP" || String(t.source || "").toLowerCase() === "whatsapp";
  const mode = isWhatsApp && S.modes[t.id] !== "internal" ? "whatsapp" : S.modes[t.id] || "email";
    const submitAs = S.submit[t.id] || "open";
    const assigneeId = t.assigneeId || currentAgentId();
    const message = {
      id: "m" + Date.now(),
      authorId: ensureSessionAgent(),
      authorName: S.session.agentName || "Support Agent",
      authorInitials: S.session.agentInitials || initials(S.session.agentName),
      kind: mode === "internal" ? "internal" : "public",
      channel: mode === "internal" ? "internal" : mode,
      at: new Date().toISOString(),
      body
    };
    let requestId;
    if (mode === "internal") {
      requestId = postTicketUpdate(t, "INTERNAL_NOTE", { message, submitAs });
    } else {
      requestId = post("AGENT_REPLY", {
        ticketId: t.externalId || t.id,
        internalId: t.id,
        caseId: t.caseId,
        pnr: t.pnr,
        content: body,
        channel: mode,
        submitAs,
        message,
        updates: { status: submitAs, assigneeId }
      });
    }
    S.pending.set(t.id, { requestId, message, submitAs, assigneeId, mode });
    renderWorkspace();
    toast(mode === "internal" ? "Saving internal note…" : "Sending reply…", `${tid(t)} · ${tc(submitAs)}`);
    setTimeout(() => {
      const pending = S.pending.get(t.id);
      if (!pending || pending.requestId !== requestId) return;
      S.pending.delete(t.id);
      renderWorkspace();
      toast("Action timed out", "Your draft was kept. Refresh the case before trying again.");
    }, 30000);
  };

  $$('[data-fmt]').forEach(button => button.onclick = () => {
    const start = ed.selectionStart;
    const end = ed.selectionEnd;
    const selected = ed.value.slice(start, end);
    const replacement = button.dataset.fmt === "b" ? `**${selected || "bold text"}**` : button.dataset.fmt === "i" ? `_${selected || "italic text"}_` : (selected || "List item").split("\n").map(x => "• " + x).join("\n");
    ed.setRangeText(replacement, start, end, "end");
    ed.dispatchEvent(new Event("input"));
  });
  $("#mention").onclick = () => {
    const agents = db.users.filter(item => item.role === "agent");
    if (!agents.length) return toast("No agents available", "Load agents in AGENT_BOOTSTRAP before using mentions.");
    openModal(
      "Mention an agent",
      agents.map(agent => `<button class="recent" data-mention-agent="${agent.id}"><b>${esc(agent.name)}</b><small>${esc(agent.group || agent.email || "Support agent")}</small></button>`).join(""),
      `<button class="btn" id="cancel">Cancel</button>`
    );
    $("#cancel").onclick = closeModal;
    $$("[data-mention-agent]").forEach(button => button.onclick = () => {
      const agent = user(button.dataset.mentionAgent);
      if (!agent) return;
      ed.value += `${ed.value && !/\s$/.test(ed.value) ? " " : ""}@${agent.name} `;
      ed.dispatchEvent(new Event("input"));
      closeModal();
      ed.focus();
    });
  };
  $("#attach").onclick = () => {
    toast("Opening attachment selector…");
    post("AGENT_ATTACHMENT_PICK", { ticketId: t.externalId || t.id, caseId: t.caseId });
  };
}

function journeyHtml(items = []) {
  if (!items.length) return `<span class="muted">No journey events available.</span>`;
  return items.map(item => `<button class="recent"><b>${item.active ? "● " : "○ "}${esc(item.title)}</b><small>${esc(item.meta)}</small></button>`).join("");
}

function contextHtml() {
  const t = ticket(S.active);
  if (!t || S.dashboard || S.nav !== "views") return `<div class="empty"><div><h2>No active ticket</h2><p class="muted">Open a ticket to see traveler context, Guide articles, and installed apps.</p></div></div>`;
  const u = user(t.requesterId) || { initials: "?", name: "Unknown traveler", organization: "", email: "", phone: "", plan: "", locale: "", timezone: "", value: "", notes: "" };

  if (S.ctx === "customer") {
    const recent = db.tickets.filter(x => x.requesterId === u.id && x.id !== t.id).slice(0, 4);
    return `<section class="section profile"><div class="avatar lg">${esc(u.initials)}</div><h2>${esc(u.name)}</h2><div class="muted">${esc(u.organization)}</div>${u.vip ? `<span class="vip">★ VIP traveler</span>` : ""}</section>
      <section class="section"><h3>Contact details</h3><div class="details">
        <div class="detail"><span>Email</span><span>${esc(u.email)}</span></div><div class="detail"><span>Phone</span><span>${esc(u.phone)}</span></div><div class="detail"><span>Service tier</span><span>${esc(t.tier || u.plan)}</span></div><div class="detail"><span>Locale</span><span>${esc(u.locale)}</span></div><div class="detail"><span>Time zone</span><span>${esc(u.timezone)}</span></div><div class="detail"><span>Booking value</span><span>${esc(t.booking?.total || u.value)}</span></div>
      </div></section>
      ${String(t.source || "").toLowerCase()==="alexandra" || String(t.sourceChannel || "").toUpperCase()==="ALEXANDRA" ? `<section class="section"><h3>Alexandra handoff</h3><p class="muted">An Alexandra-origin support case. Agent handoff notes and confirmed conversation details appear in the ticket history; live AI chat transcripts are not mirrored unless the Alexandra provider submits them through the authenticated support gateway.</p></section>` : ""}
      ${String(t.source || "").toLowerCase()==="whatsapp" || String(t.sourceChannel || "").toUpperCase()==="WHATSAPP" ? `<section class="section"><h3>WhatsApp Customer Care</h3><p class="muted">Verified Meta webhook messages, but the sender is not verified for SKANDI bookings. Reply here through Meta Cloud API within 24 hours of the last customer message. Delivery status is confirmed separately by Meta; outside the window requires an approved template.</p></section>` : ""}
      <section class="section"><h3>Travel profile</h3><div class="details"><div class="detail"><span>PNR</span><b>${esc(t.pnr || "—")}</b></div><div class="detail"><span>Trip</span><span>${esc(t.travel?.trip || "—")}</span></div><div class="detail"><span>Vendor</span><span>${esc(t.travel?.vendor || "—")}</span></div><div class="detail"><span>SLA</span><span>${esc(t.travel?.sla || "—")}</span></div></div></section>
      <section class="section"><h3>Customer notes</h3><div>${esc(u.notes || "No notes.")}</div></section>
      <section class="section"><h3>Recent interactions <span>${recent.length}</span></h3>${recent.map(x => `<button class="recent" data-open="${x.id}"><b>${esc(tid(x))} · ${esc(x.subject)}</b><small>${tc(x.status)} · ${short(x.updatedAt)}</small></button>`).join("") || `<span class="muted">No previous tickets.</span>`}</section>
      <section class="section"><h3>Interaction journey</h3>${journeyHtml(t.journey)}</section>`;
  }

  if (S.ctx === "knowledge") {
    const q = S.kb.toLowerCase();
    const tokens = (q || `${t.subject} ${t.tags.join(" ")}`).toLowerCase().split(/\W+/).filter(x => x.length > 2);
    const arts = db.articles.map(a => ({ ...a, score: tokens.reduce((n, token) => n + ([a.title, a.category, a.excerpt].join(" ").toLowerCase().includes(token) ? 1 : 0), 0) })).filter(a => !q || a.score > 0).sort((a, b) => b.score - a.score || b.votes - a.votes);
    return `<section class="section"><h3>Search Help Center</h3><div class="kb"><input id="kbSearch" value="${esc(S.kb)}" placeholder="Search articles…"></div></section><section class="section"><h3>Suggested articles <span>${arts.length}</span></h3>${arts.map(a => `<article class="article"><h4>${esc(a.title)}</h4><p>${esc(a.excerpt)}</p><small>${esc(a.category)} · ▲ ${a.votes}</small><div style="margin-top:8px"><button class="btn" data-preview="${a.id}">Preview</button> <button class="btn primary" data-insert="${a.id}">Insert link</button></div></article>`).join("") || `<span class="muted">No matching articles.</span>`}</section>`;
  }

  const d = S.duffelContexts[t.caseId];
  const bookingText = d?.bookingRef || t.pnr || "Not linked";
  const dataStatus = d?.verification ? `${d.verification.status || "Unknown"} · checked ${fmt(d.verification.verifiedAt)}` : "No verified supplier snapshot";
  const review = d?.verification?.reservationsReview === true ? "Reservations review required" : "No confirmed reconciliation outcome";
  const duffelCard = `<article class="appcard"><div class="apps-head">Duffel Assistant & Booking Team</div>
    <div class="details"><div class="detail"><span>SKANDI ref</span><b>${esc(bookingText)}</b></div>
      <div class="detail"><span>Support queue</span><b>${esc(d?.queue || t.group || "support")}</b></div>
      <div class="detail"><span>Resource</span><b>${esc(d?.resourceId || "No linked Duffel order")}</b></div>
      <div class="detail"><span>Duffel</span><span>${esc(dataStatus)}</span></div>
      <div class="detail"><span>Reconciliation</span><span>${esc(review)}</span></div>
      ${d?.verification?.altea ? `<div class="detail"><span>ALTEA</span><span>${esc(`${d.verification.altea.bookingReference || d.verification.altea.id} · ${d.verification.altea.status}`)}</span></div>` : ""}
      ${d?.handoff ? `<div class="detail"><span>Handoff</span><span>${esc(d.handoff.issueType)} · ${fmt(d.handoff.preparedAt)}</span></div>` : ""}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">
      <button class="btn" data-duffel-action="context">Refresh context</button>
      <button class="btn" data-duffel-action="verify" ${d?.bookingLinked ? "" : "disabled"}>Verify supplier</button>
      <button class="btn" data-duffel-action="route">Booking Team</button>
      <button class="btn primary" data-duffel-action="handoff" ${d?.bookingLinked ? "" : "disabled"}>Prepare Duffel handoff</button>
      ${S.duffelHandoffLinks[t.caseId] ? `<button class="btn" data-duffel-action="draft-link">Add customer link to reply</button>` : ""}
    </div>
    <p class="muted" style="font-size:11px;margin:9px 0 0">Customer-facing SKANDI messages stay in this case; Duffel private chat stays with Duffel. Supplier verification does not settle a refund or modify ALTEA.</p></article>`;
  return `<section class="section"><h3>Installed apps</h3>${duffelCard}
    <article class="appcard"><div class="apps-head">ALTEA Booking & Orders</div><div class="details"><div class="detail"><span>PNR</span><b>${esc(t.booking?.pnr || t.pnr)}</b></div><div class="detail"><span>Package</span><span>${esc(t.booking?.package || "—")}</span></div><div class="detail"><span>Status</span><span>${esc(t.booking?.status || "—")}</span></div><div class="detail"><span>Travelers</span><span>${esc(t.booking?.travelers ?? "—")}</span></div><div class="detail"><span>Total</span><span>${esc(t.booking?.total || "—")}</span></div></div></article>
    <article class="appcard"><div class="apps-head">Flight & Destination Operations</div><div class="details"><div class="detail"><span>Flight</span><span>${esc(t.travel?.flight || "—")}</span></div><div class="detail"><span>Hotel</span><span>${esc(t.travel?.hotel || "—")}</span></div><div class="detail"><span>Transfer</span><span>${esc(t.travel?.transfer || "—")}</span></div><div class="detail"><span>Vendor</span><span>${esc(t.travel?.vendor || "—")}</span></div></div></article>
    <article class="appcard"><div class="apps-head">Customer & Recovery</div><div class="metrics"><div class="metric"><small>Health</small><b>${esc(t.crm?.health || "—")}</b></div><div class="metric"><small>Tier</small><b>${esc(t.tier || u.plan)}</b></div><div class="metric"><small>Owner</small><b>${esc(t.crm?.owner || "—")}</b></div><div class="metric"><small>Booking value</small><b>${esc(t.booking?.total || t.crm?.arr || "—")}</b></div></div></article>
    <article class="appcard"><div class="apps-head">Traveler identity</div><div class="detail"><span>Verification</span><span>Refer to the authorized booking and identity workflow</span></div></article>
  </section>`;
}

function renderContext() {
  $("#context").innerHTML = contextHtml();
  $$('[data-ctx]').forEach(b => b.classList.toggle("active", b.dataset.ctx === S.ctx));
  $$('[data-open]', $("#context")).forEach(b => b.onclick = () => openTicket(b.dataset.open));
  const kb = $("#kbSearch");
  if (kb) kb.oninput = e => {
    S.kb = e.target.value;
    renderContext();
    const next = $("#kbSearch");
    if (next) {
      next.focus();
      next.setSelectionRange(next.value.length, next.value.length);
    }
  };
  $$('[data-insert]').forEach(b => b.onclick = () => {
    const a = db.articles.find(x => x.id === b.dataset.insert);
    S.drafts[S.active] = (S.drafts[S.active] ? S.drafts[S.active] + "\n\n" : "") + `${a.title}: ${a.url}`;
    if (S.modes[S.active] === "internal") S.modes[S.active] = "email";
    renderWorkspace();
    $("#editor")?.focus();
    toast("Article inserted", a.title);
    post("AGENT_INSERT_ARTICLE", { articleId: a.id, ticketId: ticket(S.active)?.externalId || S.active });
  });
  $$('[data-preview]').forEach(b => b.onclick = () => {
    const a = db.articles.find(x => x.id === b.dataset.preview);
    openModal(a.title, `<p><span class="tag">${esc(a.category)}</span></p><p>${esc(a.excerpt)}</p><div class="card" style="padding:12px"><b>Guide preview</b><p class="muted">The full article would load here inside the SKANDI Support Agent Workspace.</p><p>${esc(a.url)}</p></div>`, `<button class="btn" id="cancel">Close</button><button class="btn primary" id="insertFromModal">Insert link</button>`);
    $("#cancel").onclick = closeModal;
    $("#insertFromModal").onclick = () => {
      S.drafts[S.active] = (S.drafts[S.active] ? S.drafts[S.active] + "\n\n" : "") + `${a.title}: ${a.url}`;
      closeModal();
      renderWorkspace();
    };
  });
}

function dashboard() {
  const v = view(S.view);
  const rows = db.tickets.filter(v.filter).sort((a, b) => {
    const memberDelta = Number(Boolean(b.memberPriority)) - Number(Boolean(a.memberPriority));
    if (memberDelta) return memberDelta;
    const rank = { urgent: 4, high: 3, normal: 2, low: 1 };
    return ((rank[b.priority] || 0) - (rank[a.priority] || 0)) || (new Date(b.updatedAt) - new Date(a.updatedAt));
  });
  const n = S.selected.size;
  return `<div class="page"><div class="pagehead"><div><h1>Views</h1><p>Prioritized omnichannel queues for SKANDI travel support.</p></div><button class="btn primary" id="newTicket">＋ New ticket</button></div>
    <div class="summaries">${db.views.slice(0, 4).map(x => `<div class="card summary ${x.id === S.view ? "active" : ""}" data-viewcard="${x.id}"><small>${esc(x.name)}</small><b>${db.tickets.filter(x.filter).length}</b><span class="muted">${esc(x.description)}</span></div>`).join("")}</div>
    <div class="card"><div class="toolbar ${n ? "bulk" : ""}">${n ? `<b>${n} selected</b><button class="btn" id="bulkEdit">Edit</button><button class="btn" id="bulkMerge">Merge</button><button class="btn primary" id="bulkSolve">Mark as solved</button><button class="btn ghost" id="clearSel">Clear</button>` : `<b>${esc(v.name)}</b><span class="muted">${rows.length} tickets</span><div class="grow"></div><button class="btn" id="refresh">↻ Refresh</button><button class="btn" id="export">Export</button>`}</div>
      <div class="tablewrap"><table><thead><tr><th><input type="checkbox" id="allCheck"></th><th>ID</th><th>Subject</th><th>Requester</th><th>Requested</th><th>Group</th><th>Assignee</th><th>Status</th></tr></thead><tbody>${rows.map(t => `<tr class="${S.selected.has(t.id) ? "selected" : ""}" data-row="${t.id}"><td><input type="checkbox" data-check="${t.id}" ${S.selected.has(t.id) ? "checked" : ""}></td><td>${esc(tid(t))}</td><td><b>${esc(t.subject)}</b><br><small class="muted">${esc(t.pnr || "No PNR")} · ${tc(t.priority)} · ${tc(t.type)}</small></td><td>${esc(user(t.requesterId)?.name || "Unknown")}</td><td>${fmt(t.createdAt)}</td><td>${esc(t.group)}</td><td>${esc(user(t.assigneeId)?.name || "Unassigned")}</td><td><span class="status ${sc(t.status)}">${tc(t.status)}</span></td></tr>`).join("") || `<tr><td colspan="8" class="muted" style="padding:28px;text-align:center">No cases returned by the backend.</td></tr>`}</tbody></table></div>
    </div>
  </div>`;
}

function customers() {
  const users = db.users.filter(u => u.role === "requester");
  return `<div class="page"><div class="pagehead"><div><h1>Customers</h1><p>Traveler profiles, service tiers, contact details and support history.</p></div><button class="btn primary" id="addCustomer">＋ Add customer</button></div><div class="card tablewrap"><table><thead><tr><th>Customer</th><th>Organization</th><th>Email</th><th>Service tier</th><th>Open tickets</th><th>VIP</th></tr></thead><tbody>${users.map(u => `<tr data-customer="${u.id}"><td><b>${esc(u.name)}</b></td><td>${esc(u.organization)}</td><td>${esc(u.email)}</td><td>${esc(u.plan)}</td><td>${db.tickets.filter(t => t.requesterId === u.id && !["solved", "closed"].includes(t.status)).length}</td><td>${u.vip ? '<span class="vip">★ VIP</span>' : "—"}</td></tr>`).join("") || `<tr><td colspan="6" class="muted" style="padding:28px;text-align:center">No customer records returned by the backend.</td></tr>`}</tbody></table></div></div>`;
}

function reporting() {
  const active = db.tickets.filter(t => !["solved", "closed"].includes(t.status)).length;
  const breach = db.tickets.filter(t => due.has(t.id) && due.get(t.id) < Date.now()).length;
  const channelCounts = db.tickets.reduce((acc, t) => { acc[t.channel] = (acc[t.channel] || 0) + 1; return acc; }, {});
  const total = Math.max(db.tickets.length, 1);
  const channelCards = Object.entries(channelCounts).slice(0, 3).map(([channel, count]) => `<div class="card module"><h3>${tc(channel)}</h3><b style="font-size:28px">${Math.round(count / total * 100)}%</b><p class="muted">${count} ticket${count === 1 ? "" : "s"}</p></div>`).join("");
  return `<div class="page"><div class="pagehead"><div><h1>Explore reporting</h1><p>Travel support volume, SLA health and disruption workload.</p></div><button class="btn" id="reportPeriod">Last 7 days ▾</button></div><div class="summaries"><div class="card summary"><small>Active tickets</small><b>${active}</b><span class="muted">All support groups</span></div><div class="card summary"><small>Solved</small><b>${db.tickets.filter(t => t.status === "solved").length}</b><span class="muted">Current dataset</span></div><div class="card summary"><small>Urgent travel</small><b>${db.tickets.filter(t => t.priority === "urgent" && !["solved", "closed"].includes(t.status)).length}</b><span class="muted">Requires immediate action</span></div><div class="card summary"><small>SLA breaches</small><b>${breach}</b><span class="muted">Active reply targets</span></div></div><div class="modules">${channelCards || `<div class="card module"><h3>No reporting data</h3><p class="muted">Channel metrics will appear after cases are returned.</p></div>`}</div></div>`;
}

function guide() {
  return `<div class="page"><div class="pagehead"><div><h1>Guide knowledge base</h1><p>Search and maintain SKANDI traveler-facing Help Center content.</p></div><button class="btn primary" id="newArticle">＋ New article</button></div><div class="modules">${db.articles.map(a => `<article class="card module"><span class="tag">${esc(a.category)}</span><h3>${esc(a.title)}</h3><p class="muted">${esc(a.excerpt)}</p><button class="btn" data-guide="${a.id}">Open article</button></article>`).join("") || `<article class="card module"><h3>No articles available</h3><p class="muted">Help Center articles must be supplied in AGENT_BOOTSTRAP.</p></article>`}</div></div>`;
}

function settings() {
  const rules = (arr, type) => arr.map(r => `<div class="card rule"><b style="width:25px">${type}</b><div class="grow"><b>${esc(r.name)}</b><div class="muted">${esc(r.description)}</div></div><button class="toggle ${r.enabled ? "on" : ""}" data-rule="${r.id}" data-type="${type}"></button></div>`).join("");
  return `<div class="page"><div class="pagehead"><div><h1>Admin Center</h1><p>Triggers, automations, routing and Agent Workspace integration.</p></div><button class="btn primary" id="newRule">＋ Add business rule</button></div><div class="modules"><section class="card module" style="grid-column:span 2"><h3>Triggers</h3>${rules(db.triggers, "T") || `<p class="muted">No triggers returned by the backend.</p>`}</section><section class="card module"><h3>Automations</h3>${rules(db.automations, "A") || `<p class="muted">No automations returned by the backend.</p>`}</section><section class="card module"><h3>Embed connection</h3><p class="muted">Source: ${SOURCE}<br>Parent: ${PARENT}</p><button class="btn" id="requestBootstrap">Request bootstrap</button></section></div></div>`;
}

function moduleHtml() {
  if (S.nav === "views") return dashboard();
  if (S.nav === "customers") return customers();
  if (S.nav === "reporting") return reporting();
  if (S.nav === "guide") return guide();
  return settings();
}

function newTicket() {
  const requesters = db.users.filter(u => u.role === "requester");
  if (!requesters.length) {
    toast("No customers available", "Load customer records before creating a case.");
    return;
  }
  openModal("Create ticket", `<label>Requester<select id="newRequester">${requesters.map(u => `<option value="${u.id}">${esc(u.name)} · ${esc(u.email)}</option>`).join("")}</select></label><label>PNR / Booking reference<input id="newPnr" placeholder="ABC123"></label><label>Subject<input id="newSubject" placeholder="Ticket subject"></label><label>Initial message<textarea id="newMessage" rows="5" placeholder="Describe the request…"></textarea></label><label>Priority<select id="newPriority"><option>normal</option><option>low</option><option>high</option><option>urgent</option></select></label>`, `<button class="btn" id="cancel">Cancel</button><button class="btn primary" id="create">Create ticket</button>`);
  $("#cancel").onclick = closeModal;
  $("#create").onclick = () => {
    const subject = $("#newSubject").value.trim();
    const body = $("#newMessage").value.trim();
    if (!subject || !body) return toast("Missing details", "Add a subject and initial message");
    const id = nextGeneratedId(db.tickets);
    const externalId = `PENDING-${id}`;
    const now = new Date().toISOString();
    const requesterId = Number($("#newRequester").value);
    const pnr = $("#newPnr").value.trim().toUpperCase();
    const t = {
      id, externalId, caseId: String(id), pnr, subject, requesterId, assigneeId: currentAgentId(), followers: [], ccs: [], status: "new", priority: $("#newPriority").value, type: "question", channel: "email", channelLabel: "Email", group: S.settings.defaultGroup || "", queue: "open", formType: "", tier: user(requesterId)?.plan || "", createdAt: now, updatedAt: now, tags: [], unread: false, slaMinutes: null, summary: body.slice(0, 180), sentiment: { label: "", level: "" }, travel: { trip: "", vendor: "", sla: "", flight: "", hotel: "", transfer: "" }, booking: { pnr, package: "", status: "", travelers: null, total: "", departure: "" }, crm: { owner: S.session.agentName || "", health: "", renewal: "", arr: "" }, journey: [], history: [{ id: `message-${Date.now()}`, authorId: requesterId, kind: "public", channel: "email", at: now, body }]
    };
    db.tickets.unshift(t);
    closeModal();
    openTicket(id, false);
    toast("Creating case…", subject);
    post("AGENT_CREATE_CASE", { case: serializeTicket(t) });
  };
}

function bulkEdit() {
  const count = S.selected.size;
  openModal(`Bulk edit ${count} ticket${count === 1 ? "" : "s"}`, `<label>Status<select id="bulkStatus"><option value="">No change</option>${["new", "open", "pending", "on-hold", "solved"].map(v => `<option value="${v}">${tc(v)}</option>`).join("")}</select></label><label>Priority<select id="bulkPriority"><option value="">No change</option>${["low", "normal", "high", "urgent"].map(v => `<option value="${v}">${tc(v)}</option>`).join("")}</select></label><label>Assignee<select id="bulkAgent"><option value="">No change</option><option value="none">Unassigned</option>${db.users.filter(u => u.role === "agent").map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select></label><label>Add tag<input id="bulkTag" placeholder="optional-tag"></label>`, `<button class="btn" id="cancel">Cancel</button><button class="btn primary" id="saveBulk">Update tickets</button>`);
  $("#cancel").onclick = closeModal;
  $("#saveBulk").onclick = () => {
    const status = $("#bulkStatus").value;
    const priority = $("#bulkPriority").value;
    const agent = $("#bulkAgent").value;
    const tag = $("#bulkTag").value.trim().replace(/\s+/g, "-").toLowerCase();
    const changed = [];
    S.selected.forEach(id => {
      const t = ticket(id);
      if (!t) return;
      if (status) t.status = status;
      if (priority) t.priority = priority;
      if (agent) t.assigneeId = agent === "none" ? null : Number(agent);
      if (tag && !t.tags.includes(tag)) t.tags.push(tag);
      t.updatedAt = new Date().toISOString();
      changed.push(serializeTicket(t));
    });
    S.selected.clear();
    closeModal();
    renderAll();
    toast("Bulk update complete", `${changed.length} tickets updated`);
    post("AGENT_BULK_UPDATE", { cases: changed });
  };
}

function bulkMerge() {
  toast("Merge unavailable", "Ticket merge is disabled until the canonical Supabase support core exposes an atomic merge operation. No local-only merge will be performed.");
}

function exportView() {
  const v = view(S.view);
  const rows = db.tickets.filter(v.filter);
  const csvRows = [["Ticket", "PNR", "Subject", "Requester", "Status", "Priority", "Group", "Assignee", "Channel"], ...rows.map(t => [tid(t), t.pnr, t.subject, user(t.requesterId)?.name || "", t.status, t.priority, t.group, user(t.assigneeId)?.name || "Unassigned", t.channelLabel || t.channel])];
  const csv = csvRows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${v.name.toLowerCase().replace(/\W+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("View exported", `${rows.length} ticket rows downloaded`);
  post("AGENT_EXPORT_VIEW", { view: v.id, count: rows.length });
}

function wireModule() {
  if ($("#newTicket")) $("#newTicket").onclick = newTicket;
  $$('[data-viewcard]').forEach(x => x.onclick = () => {
    S.view = x.dataset.viewcard;
    S.selected.clear();
    renderAll();
    post("AGENT_LIST_CASES", { queue: S.view });
  });
  $$('[data-row]').forEach(r => r.onclick = e => { if (!e.target.matches("input")) openTicket(r.dataset.row); });
  $$('[data-check]').forEach(c => c.onchange = e => {
    e.target.checked ? S.selected.add(Number(c.dataset.check)) : S.selected.delete(Number(c.dataset.check));
    renderWorkspace();
  });
  if ($("#allCheck")) $("#allCheck").onchange = e => {
    db.tickets.filter(view(S.view).filter).forEach(t => e.target.checked ? S.selected.add(t.id) : S.selected.delete(t.id));
    renderWorkspace();
  };
  if ($("#clearSel")) $("#clearSel").onclick = () => { S.selected.clear(); renderWorkspace(); };
  if ($("#bulkSolve")) $("#bulkSolve").onclick = () => {
    const changed = [];
    S.selected.forEach(id => { const t = ticket(id); if (t) { t.status = "solved"; t.updatedAt = new Date().toISOString(); changed.push(serializeTicket(t)); } });
    S.selected.clear();
    renderAll();
    toast("Tickets solved", `${changed.length} updated`);
    post("AGENT_BULK_UPDATE", { action: "SOLVE", cases: changed });
  };
  if ($("#bulkEdit")) $("#bulkEdit").onclick = bulkEdit;
  if ($("#bulkMerge")) $("#bulkMerge").onclick = bulkMerge;
  if ($("#refresh")) $("#refresh").onclick = () => { toast("View refreshed"); post("AGENT_REFRESH_CASES", { queue: S.view }); };
  if ($("#export")) $("#export").onclick = exportView;
  if ($("#addCustomer")) $("#addCustomer").onclick = () => toast("Customer form opened", "Use AGENT_BOOTSTRAP or AGENT_CASE_DETAIL to import customer data");
  $$('[data-customer]').forEach(r => r.onclick = () => {
    const t = db.tickets.find(x => x.requesterId === Number(r.dataset.customer));
    t ? openTicket(t.id) : toast("No tickets");
  });
  $$('[data-guide]').forEach(b => b.onclick = () => {
    const article = db.articles.find(a => a.id === b.dataset.guide);
    toast("Guide article opened", article.title);
    post("AGENT_OPEN_ARTICLE", { articleId: article.id, url: article.url });
  });
  if ($("#newArticle")) $("#newArticle").onclick = () => toast("Article editor opened");
  if ($("#newRule")) $("#newRule").onclick = () => toast("Business rule builder opened");
  if ($("#requestBootstrap")) $("#requestBootstrap").onclick = () => { post("AGENT_REQUEST_BOOTSTRAP", {}); toast("Bootstrap requested"); };
  $$('[data-rule]').forEach(b => b.onclick = () => {
    const arr = b.dataset.type === "T" ? db.triggers : db.automations;
    const rule = arr.find(x => x.id === b.dataset.rule);
    toast("Read-only rule", `${rule?.name || "This rule"} is shown from the canonical Support configuration. Editing is disabled until the backend exposes a persisted rule-management contract.`);
  });
  if ($("#reportPeriod")) $("#reportPeriod").onclick = () => toast("Reporting period", "Last 7 days");
}

function renderAll() {
  renderTop();
  renderQueue();
  renderTabs();
  renderWorkspace();
  renderContext();
}

/* =========================================================
   Static DOM events
   ========================================================= */
$("#viewSelect").onchange = e => {
  S.view = e.target.value;
  S.q = "";
  $("#queueSearch").value = "";
  renderAll();
  post("AGENT_LIST_CASES", { queue: S.view });
};

$("#queueSearch").oninput = e => {
  S.q = e.target.value;
  renderQueue();
};

$("#queueList").onclick = e => {
  const b = e.target.closest("[data-open]");
  if (b) openTicket(b.dataset.open);
};

$("#tabs").onclick = e => {
  const close = e.target.closest("[data-close]");
  if (close) {
    e.stopPropagation();
    return closeTab(close.dataset.close);
  }
  const tab = e.target.closest("[data-tab]");
  if (tab) openTicket(tab.dataset.tab);
  if (e.target.closest("#homeTab")) {
    S.dashboard = true;
    S.active = null;
    renderAll();
    post("AGENT_NAVIGATE", { page: S.nav });
  }
};

$$('[data-nav]').forEach(b => b.onclick = () => {
  S.nav = b.dataset.nav;
  S.dashboard = true;
  S.active = null;
  $$('[data-nav]').forEach(x => x.classList.toggle("active", x === b));
  renderAll();
  post("AGENT_NAVIGATE", { page: S.nav });
});

$("#dashboardBtn").onclick = () => {
  S.nav = "views";
  S.dashboard = true;
  S.active = null;
  $$('[data-nav]').forEach(b => b.classList.toggle("active", b.dataset.nav === "views"));
  renderAll();
  post("AGENT_NAVIGATE", { page: "views" });
};

$$('[data-ctx]').forEach(b => b.onclick = () => {
  S.ctx = b.dataset.ctx;
  renderContext();
});

$("#presenceBtn").onclick = e => {
  e.stopPropagation();
  $("#presenceMenu").classList.toggle("open");
};

$$('[data-presence]').forEach(b => b.onclick = () => {
  S.presence = b.dataset.presence;
  $("#presenceMenu").classList.remove("open");
  renderTop();
  toast("Agent status changed", $("#pLabel").textContent);
  post("AGENT_SET_PRESENCE", { presence: S.presence });
});

$("#talkBtn").onclick = () => {
  const t = ticket(S.active) || db.tickets.find(x => x.channel === "voice") || db.tickets[0];
  if (!t) return toast("No case selected", "Open a case before starting a call.");
  const u = user(t.requesterId);
  S.call.ticketId = t.id;
  $("#callAvatar").textContent = u?.initials || "?";
  $("#callName").textContent = u?.name || "Unknown traveler";
  $("#callPhone").textContent = u?.phone || "No phone number";
  $("#callStatus").textContent = "Ready to call";
  $("#callTimer").textContent = "00:00";
  $("#disposition").classList.add("hidden");
  $("#callPanel").classList.add("open");
};

$("#closeCall").onclick = () => $("#callPanel").classList.remove("open");

$("#callMain").onclick = () => {
  const t = ticket(S.call.ticketId);
  if (!S.call.active) {
    S.call.active = true;
    S.call.seconds = 0;
    $("#callStatus").textContent = "Connected";
    S.call.timer = setInterval(() => {
      S.call.seconds += 1;
      $("#callTimer").textContent = `${String(Math.floor(S.call.seconds / 60)).padStart(2, "0")}:${String(S.call.seconds % 60).padStart(2, "0")}`;
    }, 1000);
    toast("Call connected", user(t?.requesterId)?.name || "Traveler");
    post("AGENT_CALL_START", { ticketId: t?.externalId || t?.id, caseId: t?.caseId, phone: user(t?.requesterId)?.phone });
  } else {
    S.call.active = false;
    clearInterval(S.call.timer);
    $("#callStatus").textContent = "Call ended";
    $("#disposition").classList.remove("hidden");
    toast("Call ended", $("#callTimer").textContent);
    post("AGENT_CALL_END", { ticketId: t?.externalId || t?.id, caseId: t?.caseId, duration: S.call.seconds });
  }
};

$("#muteBtn").onclick = e => e.target.classList.toggle("primary");
$("#holdBtn").onclick = e => {
  e.target.classList.toggle("primary");
  $("#callStatus").textContent = e.target.classList.contains("primary") ? "On hold" : "Connected";
};

$("#saveCall").onclick = () => {
  const t = ticket(S.call.ticketId);
  if (!t) return;
  const message = { id: "call" + Date.now(), authorId: ensureSessionAgent(), authorName: S.session.agentName || "Support Agent", authorInitials: S.session.agentInitials || initials(S.session.agentName), kind: "public", channel: "voice", at: new Date().toISOString(), body: `Call recording · ${$("#callTimer").textContent}\nOutcome: ${$("#outcome").value}\n${$("#callNotes").value}` };
  t.history.push(message);
  t.updatedAt = new Date().toISOString();
  $("#callPanel").classList.remove("open");
  openTicket(t.id, false);
  toast("Call saved", `Added to ${tid(t)}`);
  postTicketUpdate(t, "TALK_CALL", { message, outcome: $("#outcome").value, duration: S.call.seconds });
};

$("#closeModal").onclick = closeModal;
$("#modalbg").onclick = e => { if (e.target.id === "modalbg") closeModal(); };

document.onclick = e => {
  if (!e.target.closest(".menu") && !e.target.closest("#presenceBtn") && !e.target.closest("#macroBtn") && !e.target.closest("#submitToggle")) {
    $$(".menu.open").forEach(m => m.classList.remove("open"));
  }
};

document.onkeydown = e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    $("#globalSearch").focus();
  }
  if (e.key === "Escape") {
    $$(".menu.open").forEach(m => m.classList.remove("open"));
    closeModal();
  }
};

$("#globalSearch").onkeydown = e => {
  if (e.key !== "Enter") return;
  const q = e.target.value.trim().toLowerCase();
  if (!q) return;
  const t = db.tickets.find(t => [tid(t), t.caseId, t.pnr, t.subject, user(t.requesterId)?.name, user(t.requesterId)?.email, t.travel?.vendor, t.tags.join(" ")].join(" ").toLowerCase().includes(q));
  t ? openTicket(t.id) : toast("No results", e.target.value);
};

/* =========================================================
   Parent imports and commands
   ========================================================= */
function flattenEnvelope(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const merged = { ...value };
  let current = value;
  for (let depth = 0; depth < 5; depth += 1) {
    const next = ["result", "data", "payload"]
      .map(key => current?.[key])
      .find(item => item && typeof item === "object" && !Array.isArray(item));
    if (!next || next === current) break;
    Object.assign(merged, next);
    current = next;
  }
  return merged;
}

function applyBootstrapData(value) {
  const payload = flattenEnvelope(value);
  const agent = payload.agent && typeof payload.agent === "object" ? payload.agent : {};
  const session = payload.session && typeof payload.session === "object" ? payload.session : {};
  if (Object.keys(session).length || Object.keys(agent).length) {
    S.session = {
      ...S.session,
      ...session,
      agentId: session.agentId || session.id || agent.id || S.session.agentId,
      agentName: session.agentName || session.name || agent.name || S.session.agentName,
      agentEmail: session.agentEmail || session.email || agent.email || S.session.agentEmail
    };
    S.session.agentInitials = session.agentInitials || session.initials || agent.initials || (S.session.agentName ? initials(S.session.agentName) : "");
  }

  if (payload.settings && typeof payload.settings === "object") {
    S.settings = { ...S.settings, ...payload.settings };
  }

  const suppliedUsers = [
    ...arrayOf(payload.users),
    ...arrayOf(payload.agents).map(item => ({ ...item, role: item.role || "agent" })),
    ...arrayOf(payload.customers).map(item => ({ ...item, role: item.role || "requester" }))
  ];
  suppliedUsers.forEach(raw => {
    const role = String(raw.role || raw.type || "").toLowerCase();
    if (["agent", "administrator", "admin"].includes(role)) {
      resolveAgentId(raw);
    } else {
      ensureRequester({ requester: raw });
    }
  });
  ensureSessionAgent();

  if (Array.isArray(payload.groups)) {
    db.groups.splice(0, db.groups.length, ...payload.groups.map(group => typeof group === "object" ? group.name : group).filter(Boolean));
  }
  if (Array.isArray(payload.macros)) db.macros.splice(0, db.macros.length, ...payload.macros);
  if (Array.isArray(payload.articles)) db.articles.splice(0, db.articles.length, ...payload.articles);
  if (Array.isArray(payload.triggers)) db.triggers.splice(0, db.triggers.length, ...payload.triggers);
  if (Array.isArray(payload.automations)) db.automations.splice(0, db.automations.length, ...payload.automations);
  if (payload.rules && typeof payload.rules === "object") {
    if (Array.isArray(payload.rules.triggers)) db.triggers.splice(0, db.triggers.length, ...payload.rules.triggers);
    if (Array.isArray(payload.rules.automations)) db.automations.splice(0, db.automations.length, ...payload.rules.automations);
  }
  if (payload.activeQueue && db.views.some(item => item.id === payload.activeQueue)) S.view = payload.activeQueue;
}

function settlePendingRequest(requestId, succeeded) {
  if (!requestId) return null;
  const match = [...S.pending.entries()].find(([, pending]) => pending.requestId === requestId);
  if (!match) return null;
  const [ticketId, pending] = match;
  const target = ticket(ticketId);

  if (succeeded && target) {
    if (!target.history.some(message => String(message.id) === String(pending.message.id))) {
      target.history.push(pending.message);
    }
    target.status = pending.submitAs;
    target.assigneeId = pending.assigneeId;
    target.updatedAt = new Date().toISOString();
    target.typing = false;
    target.unread = false;
    S.drafts[target.id] = "";
  }

  S.pending.delete(ticketId);
  return pending;
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-duffel-action]");
  if (!button || button.disabled) return;
  const t = ticket(S.active);
  if (!t) return;
  const action = button.dataset.duffelAction;
  const context = S.duffelContexts[t.caseId];
  if (action === "context") return void post("AGENT_DUFFEL_CONTEXT_REQUEST", { caseId: t.caseId });
  if (action === "verify") return void post("AGENT_DUFFEL_VERIFY_REQUEST", { caseId: t.caseId });
  if (action === "draft-link") {
    const link = S.duffelHandoffLinks[t.caseId];
    if (!link) return toast("No saved handoff link", "Prepare a handoff first.");
    const text = `SKANDI has prepared support for your booking. Sign in and open the travel assistant: ${link}`;
    S.drafts[t.id] = `${S.drafts[t.id] ? S.drafts[t.id] + "\n\n" : ""}${text}`;
    S.modes[t.id] = "chat";
    renderWorkspace();
    toast("Link added to reply draft", "Review the draft before sending to the customer.");
    return;
  }
  if (action === "route") {
    openModal("Send to Booking Team", `<div class="field"><label>Booking reference</label><strong>${esc(context?.bookingRef || t.pnr || "Not linked")}</strong></div><div class="field"><label>Instructions to Booking Team</label><textarea rows="5" id="bookingTeamReason" placeholder="What should Booking Team verify or resolve?"></textarea></div><p class="muted" style="font-size:12px">Routes this SAME Customer Service case to the Booking Team queue with a private instruction. It does not cancel, change, or refund a booking.</p>`, `<button class="btn" id="cancelBookingHandoff">Cancel</button><button class="btn primary" id="confirmBookingHandoff">Send to Booking Team</button>`);
    $("#cancelBookingHandoff").onclick = closeModal;
    $("#confirmBookingHandoff").onclick = () => {
      const reason = $("#bookingTeamReason").value.trim();
      if (reason.length < 12) return toast("Add instructions", "Use at least 12 characters.");
      post("AGENT_DUFFEL_ROUTE_BOOKING", { caseId: t.caseId, reason });
      closeModal();
      toast("Routing requested", "The case will update after the backend confirms it.");
    };
    return;
  }
  if (action === "handoff") {
    if (!context?.bookingLinked) return toast("No verified Duffel booking", "Ask the customer to launch Duffel Assistant for their trip first.");
    openModal("Prepare Duffel specialist handoff", `<div class="field"><label>Issue type</label><select id="duffelIssueType"><option value="change">Change booking</option><option value="cancellation">Cancellation</option><option value="other">Other</option></select></div><div class="field"><label>Summary for Duffel specialists</label><textarea rows="6" id="duffelSummary" placeholder="State the issue, customer's request, actions already taken, and anything Duffel should verify."></textarea></div><p class="muted" style="font-size:12px">The summary is saved as a private SKANDI Support note. Only the authenticated customer can open the Duffel conversation.</p>`, `<button class="btn" id="cancelDuffelHandoff">Cancel</button><button class="btn primary" id="confirmDuffelHandoff">Prepare handoff</button>`);
    $("#cancelDuffelHandoff").onclick = closeModal;
    if (context.handoff?.issueType) $("#duffelIssueType").value = context.handoff.issueType;
    $("#duffelSummary").value = context.handoff?.summary || "";
    $("#confirmDuffelHandoff").onclick = () => {
      const summary = $("#duffelSummary").value.trim();
      if (summary.length < 12) return toast("Add handoff context", "Use at least 12 characters.");
      post("AGENT_DUFFEL_PREPARE_HANDOFF", { caseId: t.caseId, issueType: $("#duffelIssueType").value, summary });
      closeModal();
      toast("Saving Duffel context…", "A handoff link will appear after the backend confirms the note.");
    };
  }
});

window.addEventListener("message", event => {
  const message = event.data || {};
  if (event.source !== window.parent || message.source !== PARENT) return;
  const payload = message.payload || {};
  const envelope = flattenEnvelope(payload);

  if (message.type === "AGENT_DUFFEL_CONTEXT" || message.type === "AGENT_DUFFEL_RESULT") {
    const caseId = String(payload.caseId || "");
    if (caseId) S.duffelContexts[caseId] = payload;
    if (message.type === "AGENT_DUFFEL_RESULT") {
      if (payload.action === "handoff" && payload.prepared === true && payload.customerRoute) {
        S.duffelHandoffLinks[caseId] = payload.customerRoute;
        toast("Duffel handoff prepared", "Open Apps and add the customer link to your public reply draft.");
      } else if (payload.action === "route") toast(payload.routed ? "Booking Team queue updated" : "Booking Team routing checked", payload.queue || "");
      else if (payload.action === "verify") toast("Supplier booking verified", "Check the Apps panel for confirmed Duffel state.");
    }
    if (!S.dashboard && ticket(S.active)?.caseId === caseId) {
      renderWorkspace();
      renderContext();
    }
    return;
  }
  if (message.type === "AGENT_BOOTSTRAP") {
    applyBootstrapData(payload);
    importCases(payload, false);
    rebuildDue();
    renderAll();
    toast("Support system connected", `${db.tickets.length} case${db.tickets.length === 1 ? "" : "s"} available`);
    return;
  }

  if (message.type === "AGENT_CASE_DETAIL") {
    const caseData = extractSingleCase(payload);
    if (!caseData) return toast("Case unavailable", "The backend returned no case record.");
    const updated = upsertCase(caseData, true);
    toast("Case loaded", tid(updated));
    return;
  }

  if (["AGENT_CASE_LIST", "AGENT_CASES_IMPORT", "AGENT_IMPORT_CASES"].includes(message.type)) {
    applyBootstrapData(payload);
    const imported = importCases(payload, Boolean(envelope.openFirst));
    rebuildDue();
    toast("Cases refreshed", `${imported.length} record${imported.length === 1 ? "" : "s"}`);
    return;
  }

  if (["AGENT_REPLY_SENT", "AGENT_CASE_UPDATED", "AGENT_CASE_CREATED"].includes(message.type)) {
    const caseData = extractSingleCase(payload);
    if (caseData) upsertCase(caseData, message.type === "AGENT_CASE_CREATED");
    const settled = settlePendingRequest(String(message.requestId || envelope.requestId || ""), true);
    if (message.type === "AGENT_REPLY_SENT" && !caseData && !settled && envelope.caseId) {
      post("AGENT_OPEN_CASE", { caseId: envelope.caseId });
    }
    renderAll();
    const labels = {
      AGENT_REPLY_SENT: payload.providerAccepted === true ? "WhatsApp accepted by Meta (delivery pending)" : "Reply sent",
      AGENT_CASE_UPDATED: "Case updated",
      AGENT_CASE_CREATED: "Case created"
    };
    toast(labels[message.type]);
    return;
  }

  if (message.type === "AGENT_ERROR") {
    if (String(envelope.action || "").startsWith("AGENT_DUFFEL_")) {
      toast("Booking / Duffel action failed", envelope.message || "The backend did not complete this action.");
      return;
    }
    settlePendingRequest(String(message.requestId || envelope.requestId || ""), false);
    renderAll();
    toast("Customer service action failed", envelope.message || message.message || "The backend did not complete the request.");
    post("AGENT_REFRESH_CASES", { queue: S.view });
    return;
  }

  if (message.type === "AGENT_OPEN_CASE") {
    const identifier = envelope.ticketId || envelope.id || envelope.caseId;
    const found = db.tickets.find(t => t.id === Number(identifier) || t.externalId === identifier || t.caseId === String(identifier));
    if (found) openTicket(found.id, false);
    return;
  }

  if (message.type === "AGENT_SET_VIEW" || message.type === "AGENT_LIST_CASES") {
    const id = envelope.queue || envelope.view;
    if (db.views.some(v => v.id === id)) {
      S.view = id;
      S.nav = "views";
      S.dashboard = true;
      S.active = null;
      renderAll();
    }
    return;
  }

  if (message.type === "AGENT_SET_PRESENCE") {
    S.presence = ["online", "away", "off"].includes(envelope.presence) ? envelope.presence : S.presence;
    renderTop();
    return;
  }

  if (message.type === "AGENT_REFRESH" || message.type === "AGENT_RENDER") renderAll();
});

window.SKANDI_SUPPORT_AGENT_API = {
  render: renderAll,
  openTicket: identifier => {
    const found = db.tickets.find(t => t.id === Number(identifier) || t.externalId === identifier || t.caseId === String(identifier));
    if (found) openTicket(found.id, false);
    return found ? serializeTicket(found) : null;
  },
  importCase: raw => serializeTicket(upsertCase(raw, false)),
  importCases: payload => importCases(payload, false).map(serializeTicket),
  getState: () => ({ activePage: S.nav, activeQueue: S.view, activeTicket: serializeTicket(ticket(S.active)), openTickets: S.open.map(id => serializeTicket(ticket(id))).filter(Boolean), session: { ...S.session }, presence: S.presence }),
  getTickets: () => db.tickets.map(serializeTicket),
  post
};

setInterval(() => {
  $$('[data-sla]').forEach(el => {
    const t = ticket(el.dataset.sla);
    const x = t ? sla(t) : null;
    if (!x) return;
    el.classList.toggle("breach", x.breach);
    el.querySelector("small").textContent = x.breach ? "SLA breached" : "Next reply SLA";
    el.querySelector("b").textContent = x.text;
  });
}, 1000);

rebuildDue();
renderAll();
requestAnimationFrame(() => {
  const c = $("#conversation");
  if (c) c.scrollTop = c.scrollHeight;
});
post("AGENT_READY", { tickets: db.tickets.length, activeQueue: S.view, session: S.session });

</script>

<script>
/* V12 realtime rule: customer text reaches this room only after the canonical Customer Support backend has persisted it to Supabase. Agent replies publish to LiveKit only after AGENT_REPLY_SENT confirms canonical persistence. */
(function(){
  "use strict";
  const SKANDI_R0071_LIVEKIT_AGENT_SUPPORT=true;
  const PARENT="SKANDI_WIX_PARENT";const DEFAULT_TOPIC="skandi.support.chat";let room=null,session=null,connecting=null,activeCaseId="";
  const escLK=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  async function disconnect(){try{if(room)await room.disconnect();}catch(_){}room=null;session=null;connecting=null;}
  async function connect(s){if(!s?.url||!s?.token||!window.LivekitClient)return null;if(room&&session?.roomName===s.roomName&&room.state==="connected")return room;if(connecting)return connecting;connecting=(async()=>{await disconnect();const r=new window.LivekitClient.Room({adaptiveStream:true,dynacast:true});const topic=s.textTopic||DEFAULT_TOPIC;r.registerTextStreamHandler(topic,async(reader,participant)=>{if(participant?.identity===r.localParticipant?.identity)return;const text=await reader.readAll();const box=document.getElementById("conversation");if(!box||!text)return;const article=document.createElement("article");article.className="msg customer";article.innerHTML=`<div class="avatar">T</div><div class="bubble"><div class="mmeta"><b>Traveler</b><span>now</span><span class="mkind">LiveKit</span></div><div class="mtext">${escLK(text)}</div></div>`;box.appendChild(article);box.scrollTop=box.scrollHeight;});await r.connect(s.url,s.token);room=r;session=s;return r;})().finally(()=>connecting=null);return connecting;}
  async function publish(sent,s){const text=String(sent?.message||sent?.content||"").trim();if(!text||!s)return;const r=await connect(s);if(!r)return;await r.localParticipant.sendText(text,{topic:s.textTopic||DEFAULT_TOPIC,attributes:{caseId:activeCaseId,messageId:String(sent?.messageId||sent?.message_id||""),senderType:"agent"}});}
  window.addEventListener("message",e=>{const m=e.data||{};if(m.source!==PARENT)return;const p=m.payload||{};if(m.type==="AGENT_CASE_DETAIL"||m.type==="AGENT_LIVEKIT_SESSION"){activeCaseId=String(p.case?.caseId||p.case?.case_id||activeCaseId);connect(p.livekitSession).catch(()=>{});}if(m.type==="AGENT_REPLY_SENT"&&p.privateNote!==true&&p.livekitSession){activeCaseId=String(p.case?.caseId||p.case?.case_id||activeCaseId);publish(p.sentMessage,p.livekitSession).catch(()=>{});}});
})();
</script>
</body>
</html>
