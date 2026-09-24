# SKANDI Club

## INFO / LOG

- **Current status:** `B-011.1 — STATICALLY VERIFIED / LIVE WIX + TIER MIGRATION TEST REQUIRED`
- **System:** SKANDI customer website
- **Route:** `/skandi-club`
- **Wix page:** `SKANDI Signature Club.gsejz`
- **HTML component:** `#skandiClubInfoEmbed`
- **HTML child source:** `SKANDI_CLUB_INFO`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Page controller:** `/src/pages/SKANDI Signature Club.gsejz.js`
- **Canonical public facade:** `/src/backend/SKANDI_CORE/clubPublic.web.js`
- **Canonical public core:** `/src/backend/SKANDI_CORE/clubPublic.js`
- **Canonical tier source:** Supabase `public.club_tiers`
- **Authenticated Club/My Profile authority:** `/src/backend/SKANDI_CORE/customerProfile.js`
- **Global customer header/footer:** `masterPage.js`
- **Version:** `B-011.1`
- **Last verified:** `2026-09-24`

### Read-before-write findings

The current page controller imported the legacy namespace:

`backend/CLUB/skandiClubPublic.web`

That module is not present in the current canonical repository and violates the SKANDI_CORE backend rule.

There was also no current `/HTML_REF/skandi/SKANDI Club.md` canonical source file for the public Club page, so B-011.1 establishes it here.

The supplied live HTML still contained legacy `Signature Club` customer wording and did not present the requested four-tier programme.

### Tier model mismatch found

The live `club_tiers` data inspected before this package contained:

- Member
- Bronze
- Silver
- Gold
- Platinum

The requested customer programme is:

- Member
- Silver
- Gold
- Diamond

At verification time, **zero** `customer_profiles` rows referenced any current `club_tiers` ID.

The package therefore includes, but does not execute:

`/supabase/SKANDI_CLUB_TIERS_B011.sql`

The migration:

- extends Member through 24,999 points
- retires Bronze
- keeps Silver at 25,000–49,999
- keeps Gold at 50,000–99,999
- renames the existing Platinum row to Diamond while preserving its row ID
- keeps Diamond at 100,000+ and 2× multiplier
- aborts if a customer profile begins referencing Bronze before the migration is applied.

### Canonical public runtime chain

`#skandiClubInfoEmbed`
→ `postMessage`
→ `/src/pages/SKANDI Signature Club.gsejz.js`
→ `backend/SKANDI_CORE/clubPublic.web`
→ `backend/SKANDI_CORE/clubPublic`
→ `backend/SKANDI_CORE/supabaseServer`
→ `public.club_tiers`

Customer login remains owned by Wix Members. Authenticated Club balances/activity remain owned by the existing My Profile / `customerProfile` chain.

### B-011.1 visual direction

The public SKANDI Club page now uses the same premium visual family as My Profile:

- deep ink/navy atlas background
- aqua and champagne detailing
- ivory content cards
- restrained metallic lines and shadows
- dark premium membership-card motif
- Montserrat display typography and Inter body typography
- global header/footer remain external chrome from `masterPage.js`.

### Tier-card design

All four tier cards use the same physical-card-inspired layout and differ only by tier finish.

The color system is taken from the supplied SKANDI Club membership-card designs:

- **Member:** core SKANDI navy + champagne gold
- **Silver:** brushed gunmetal + platinum
- **Gold:** warm bronze + champagne gold
- **Diamond:** midnight graphite + platinum / icy aqua.

The public page does not require the local card font or missing local SVG files from the standalone card prototypes.

### Message contracts

HTML → page:
- `SKANDI_CLUB_INFO_READY`
- `SKANDI_CLUB_INFO_REFRESH`
- `SKANDI_CLUB_AUTH_OPEN`
- `SKANDI_CLUB_PROFILE_OPEN`
- `SKANDI_CLUB_TERMS_OPEN`
- `SKANDI_CLUB_NAVIGATE`
- `SKANDI_CLUB_HEIGHT`

Page → HTML:
- `SKANDI_CLUB_PARENT_READY`
- `SKANDI_CLUB_INFO_DATA`
- `SKANDI_CLUB_MEMBER_STATUS`
- `SKANDI_CLUB_INFO_ERROR`

### Public tier payload

The public backend returns only active public tier configuration needed by the marketing page:

- tier key/name
- point range
- multiplier
- optional `payload.benefits`.

It does not expose customer profiles, member points ledgers, private Club profiles, bookings or authenticated customer data.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#03111f">
<meta name="color-scheme" content="dark light">
<title>SKANDI Club · B-011.1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  /* My Profile / premium customer system */
  --sk-navy:#022e64;
  --sk-navy-deep:#061a30;
  --sk-navy-black:#03111f;
  --sk-blue:#0b3a7a;
  --sk-blue-soft:#1f6ba3;
  --sk-aqua:#5fc7cf;
  --sk-aqua-soft:#9de0e5;
  --sk-ivory:#fbfaf6;
  --sk-porcelain:#f5f1ea;
  --sk-champagne:#d1bc98;
  --sk-limestone:#d8d2c8;
  --sk-graphite:#1a1a1a;
  --sk-muted:#66758a;
  --sk-dark-muted:#93a4b7;
  --sk-line:rgba(255,255,255,.13);
  --sk-line-soft:rgba(255,255,255,.08);
  --sk-line-dark:rgba(2,46,100,.13);
  --shadow-dark:0 28px 86px rgba(0,0,0,.30);
  --shadow-panel:0 24px 58px rgba(0,0,0,.17);
  --shadow-light:0 18px 46px rgba(3,17,31,.11);
  --max:1240px;
  --r-md:18px;
  --r-lg:26px;

  /* User-approved Club tier card palette */
  --member-bg1:#062948;
  --member-bg2:#031e38;
  --member-bg3:#021426;
  --member-metal1:#a76d20;
  --member-metal2:#f0d291;
  --member-metal3:#c6944b;
  --member-metal4:#efcf8a;

  --silver-bg1:#7b838e;
  --silver-bg2:#4f5864;
  --silver-bg3:#262d36;
  --silver-metal1:#8d949d;
  --silver-metal2:#f4f6f8;
  --silver-metal3:#b8bec5;
  --silver-metal4:#e3e7eb;

  --gold-bg1:#8a6221;
  --gold-bg2:#5b3d12;
  --gold-bg3:#211707;
  --gold-metal1:#a86c1d;
  --gold-metal2:#f6dda0;
  --gold-metal3:#c6903f;
  --gold-metal4:#fff0bf;

  --diamond-bg1:#1e3146;
  --diamond-bg2:#101b29;
  --diamond-bg3:#050a12;
  --diamond-metal1:#98a9b9;
  --diamond-metal2:#fff;
  --diamond-metal3:#cfd9e4;
  --diamond-metal4:#aee9ef;
}

*{box-sizing:border-box}
html,body{
  width:100%;
  min-height:100%;
  margin:0;
  background:var(--sk-navy-black);
  color:#fff;
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  overflow-x:hidden;
}
button,input{font:inherit}
button{cursor:pointer}
button:focus-visible,input:focus-visible,a:focus-visible{
  outline:3px solid rgba(95,199,207,.7);
  outline-offset:3px;
}
a{color:inherit}
.hidden{display:none!important}
.wrap{width:min(var(--max),calc(100% - 48px));margin-inline:auto}
.eyebrow{
  display:flex;
  align-items:center;
  gap:12px;
  color:var(--sk-aqua-soft);
  font:800 10px/1.2 Montserrat,sans-serif;
  letter-spacing:.18em;
  text-transform:uppercase;
}
.eyebrow::before{
  content:"";
  width:32px;
  height:1px;
  background:var(--sk-aqua);
}
.btn{
  min-height:44px;
  padding:0 18px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  border:1px solid rgba(255,255,255,.18);
  border-radius:999px;
  background:rgba(3,17,31,.54);
  color:#fff;
  font-size:10px;
  font-weight:800;
  letter-spacing:.03em;
  backdrop-filter:blur(16px);
}
.btn:hover{
  border-color:rgba(157,224,229,.58);
  background:rgba(8,35,59,.82);
}
.btn.primary{
  border-color:var(--sk-ivory);
  background:var(--sk-ivory);
  color:#07192c;
}
.btn.ink{
  border-color:var(--sk-navy-deep);
  background:var(--sk-navy-deep);
  color:#fff;
}
.btn.light{
  border-color:rgba(2,46,100,.16);
  background:#fff;
  color:var(--sk-navy-deep);
}

/* Hero */
.hero{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  padding:76px 0 120px;
  background:
    radial-gradient(circle at 77% 16%,rgba(95,199,207,.12),transparent 27%),
    radial-gradient(circle at 18% 90%,rgba(209,188,152,.07),transparent 31%),
    linear-gradient(145deg,#071c32 0%,#06172b 50%,#03101d 100%);
}
.hero::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:-2;
  opacity:.18;
  background-image:radial-gradient(rgba(255,255,255,.25) .55px,transparent .65px);
  background-size:18px 18px;
  mask-image:linear-gradient(180deg,#000,transparent 82%);
}
.hero::after{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  background:
    linear-gradient(180deg,rgba(1,12,25,.06),transparent 36%,rgba(1,12,25,.32) 100%),
    linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);
  background-size:auto,84px 100%;
  mask-image:linear-gradient(90deg,#000,transparent 72%);
}
.hero-grid{
  display:grid;
  grid-template-columns:minmax(0,1.06fr) minmax(370px,.74fr);
  gap:64px;
  align-items:end;
}
.hero h1{
  max-width:780px;
  margin:16px 0 20px;
  font:600 clamp(44px,6vw,76px)/.95 Montserrat,sans-serif;
  letter-spacing:-.055em;
}
.hero-copy{
  max-width:670px;
  margin:0;
  color:rgba(255,255,255,.74);
  font-size:15px;
  font-weight:500;
  line-height:1.75;
}
.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:28px}
.member-status{
  margin-top:23px;
  color:rgba(255,255,255,.58);
  font-size:10px;
  font-weight:700;
}

/* Premium summary panel */
.club-pass{
  position:relative;
  min-height:340px;
  overflow:hidden;
  padding:29px;
  border:1px solid rgba(209,188,152,.24);
  border-radius:24px;
  background:
    radial-gradient(circle at 88% 8%,rgba(95,199,207,.11),transparent 27%),
    linear-gradient(150deg,rgba(13,40,65,.96),rgba(5,25,44,.98) 62%,rgba(3,17,31,.98));
  box-shadow:0 34px 95px rgba(0,0,0,.34);
}
.club-pass::before{
  content:"";
  position:absolute;
  inset:18px;
  border:1px solid rgba(255,255,255,.055);
  border-radius:16px;
}
.club-pass::after{
  content:"SKANDI";
  position:absolute;
  right:-5px;
  bottom:-13px;
  color:rgba(255,255,255,.028);
  font:700 68px/1 Montserrat,sans-serif;
  letter-spacing:-.06em;
}
.pass-top,.pass-copy,.pass-stats{position:relative;z-index:1}
.pass-top{
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:center;
}
.club-word{
  font:800 12px/1 Montserrat,sans-serif;
  letter-spacing:.18em;
}
.pass-tag{
  padding-left:12px;
  border-left:1px solid rgba(209,188,152,.46);
  color:var(--sk-aqua-soft);
  font-size:9px;
  font-weight:800;
  letter-spacing:.14em;
  text-transform:uppercase;
}
.pass-copy{
  margin-top:76px;
}
.pass-copy strong{
  display:block;
  font:600 30px/1.05 Montserrat,sans-serif;
  letter-spacing:-.04em;
}
.pass-copy span{
  display:block;
  max-width:450px;
  margin-top:9px;
  color:rgba(255,255,255,.53);
  font-size:11px;
  line-height:1.6;
}
.pass-stats{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
  margin-top:27px;
  padding-top:18px;
  border-top:1px solid rgba(255,255,255,.10);
}
.pass-stat strong{
  display:block;
  font:600 24px/1 Montserrat,sans-serif;
  letter-spacing:-.04em;
}
.pass-stat span{
  display:block;
  margin-top:5px;
  color:rgba(255,255,255,.46);
  font-size:8px;
  font-weight:700;
  letter-spacing:.11em;
  text-transform:uppercase;
}

/* Dark main surface */
.main{
  position:relative;
  padding:66px 0 104px;
  background:
    radial-gradient(circle at 14% 8%,rgba(31,107,163,.11),transparent 20%),
    radial-gradient(circle at 86% 24%,rgba(95,199,207,.055),transparent 22%),
    linear-gradient(180deg,#06192d 0%,#06172a 44%,#03111f 100%);
}
.main::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:.08;
  background-image:radial-gradient(rgba(255,255,255,.26) .55px,transparent .65px);
  background-size:20px 20px;
  mask-image:linear-gradient(180deg,#000,transparent 70%);
}
.main>.wrap{position:relative;z-index:1}
.section{margin-top:70px}
.section:first-child{margin-top:0}
.section-head{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(280px,520px);
  gap:48px;
  align-items:end;
  margin-bottom:28px;
  padding-bottom:22px;
  border-bottom:1px solid rgba(255,255,255,.10);
}
.section-head h2{
  margin:7px 0 0;
  color:#fff;
  font:600 clamp(34px,4.3vw,54px)/.98 Montserrat,sans-serif;
  letter-spacing:-.05em;
}
.section-head p{
  margin:0;
  color:rgba(255,255,255,.57);
  font-size:13px;
  line-height:1.7;
}

/* Tier cards */
.tier-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:15px;
}
.tier-card{
  --bg1:#062948;
  --bg2:#031e38;
  --bg3:#021426;
  --m1:#a76d20;
  --m2:#f0d291;
  --m3:#c6944b;
  --m4:#efcf8a;
  position:relative;
  aspect-ratio:1.5854/1;
  min-height:230px;
  overflow:hidden;
  padding:22px;
  border:1px solid transparent;
  border-radius:20px;
  color:#fff;
  background:
    radial-gradient(circle at 18% 3%,color-mix(in srgb,var(--m2) 18%,transparent),transparent 31%),
    linear-gradient(145deg,var(--bg1),var(--bg2) 48%,var(--bg3));
  box-shadow:0 22px 58px rgba(0,0,0,.29);
}
.tier-card::before{
  content:"";
  position:absolute;
  inset:0;
  background:
    linear-gradient(110deg,transparent 27%,rgba(255,255,255,.03) 42%,rgba(255,255,255,.10) 52%,rgba(255,255,255,.02) 65%,transparent 78%);
  pointer-events:none;
}
.tier-card::after{
  content:"";
  position:absolute;
  right:-35%;
  bottom:-48%;
  width:110%;
  aspect-ratio:1;
  border:1px solid color-mix(in srgb,var(--m2) 24%,transparent);
  border-radius:50%;
  box-shadow:
    0 0 0 27px color-mix(in srgb,var(--m2) 4%,transparent),
    0 0 0 54px color-mix(in srgb,var(--m2) 2%,transparent);
}
.tier-card.member{
  --bg1:var(--member-bg1);--bg2:var(--member-bg2);--bg3:var(--member-bg3);
  --m1:var(--member-metal1);--m2:var(--member-metal2);--m3:var(--member-metal3);--m4:var(--member-metal4);
}
.tier-card.silver{
  --bg1:var(--silver-bg1);--bg2:var(--silver-bg2);--bg3:var(--silver-bg3);
  --m1:var(--silver-metal1);--m2:var(--silver-metal2);--m3:var(--silver-metal3);--m4:var(--silver-metal4);
}
.tier-card.gold{
  --bg1:var(--gold-bg1);--bg2:var(--gold-bg2);--bg3:var(--gold-bg3);
  --m1:var(--gold-metal1);--m2:var(--gold-metal2);--m3:var(--gold-metal3);--m4:var(--gold-metal4);
}
.tier-card.diamond{
  --bg1:var(--diamond-bg1);--bg2:var(--diamond-bg2);--bg3:var(--diamond-bg3);
  --m1:var(--diamond-metal1);--m2:var(--diamond-metal2);--m3:var(--diamond-metal3);--m4:var(--diamond-metal4);
}
.tier-frame{
  position:absolute;
  inset:1px;
  border:1px solid color-mix(in srgb,var(--m2) 60%,transparent);
  border-radius:19px;
  pointer-events:none;
}
.tier-top,.tier-body,.tier-foot{position:relative;z-index:2}
.tier-top{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:12px;
}
.tier-brand{
  color:#f7f5ef;
  font:800 9px/1 Montserrat,sans-serif;
  letter-spacing:.17em;
}
.tier-name{
  background:linear-gradient(90deg,var(--m1),var(--m2),var(--m3),var(--m4),var(--m1));
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  font:italic 400 25px/1 Georgia,"Times New Roman",serif;
}
.tier-body{margin-top:45px}
.tier-body strong{
  display:block;
  background:linear-gradient(90deg,var(--m1),var(--m2),var(--m3),var(--m4));
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  font:600 24px/1 Montserrat,sans-serif;
  letter-spacing:-.04em;
}
.tier-body span{
  display:block;
  margin-top:7px;
  color:rgba(255,255,255,.62);
  font-size:9px;
  line-height:1.45;
}
.tier-foot{
  position:absolute;
  left:22px;
  right:22px;
  bottom:20px;
  display:flex;
  justify-content:space-between;
  gap:10px;
  padding-top:12px;
  border-top:1px solid rgba(255,255,255,.12);
}
.tier-foot span{
  color:rgba(255,255,255,.68);
  font-size:8px;
  font-weight:750;
  letter-spacing:.06em;
  text-transform:uppercase;
}
.tier-foot strong{
  background:linear-gradient(90deg,var(--m2),var(--m4));
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  font-size:9px;
  letter-spacing:.04em;
}

/* Premium ivory cards */
.ivory-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:14px;
}
.ivory-card{
  min-height:200px;
  padding:24px;
  border:1px solid rgba(216,210,200,.82);
  border-radius:18px;
  background:var(--sk-ivory);
  color:var(--sk-graphite);
  box-shadow:var(--shadow-light);
}
.ivory-card:hover{border-color:rgba(95,199,207,.55)}
.ivory-index{
  width:38px;
  height:38px;
  display:grid;
  place-items:center;
  border:1px solid rgba(2,46,100,.10);
  border-radius:50%;
  background:#edf4f4;
  color:var(--sk-navy);
  font:800 10px/1 Montserrat,sans-serif;
}
.ivory-card h3{
  margin:20px 0 8px;
  color:var(--sk-navy-deep);
  font:700 17px/1.2 Montserrat,sans-serif;
  letter-spacing:-.025em;
}
.ivory-card p{
  margin:0;
  color:var(--sk-muted);
  font-size:11px;
  line-height:1.65;
}

/* Calculator */
.calculator{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(270px,.55fr);
  gap:18px;
  align-items:stretch;
}
.calc-panel{
  padding:30px;
  border:1px solid rgba(255,255,255,.10);
  border-radius:24px;
  background:
    radial-gradient(circle at 94% 4%,rgba(95,199,207,.08),transparent 28%),
    linear-gradient(145deg,#0a2138,#061a30 62%,#041523);
  box-shadow:var(--shadow-dark);
}
.calc-panel h3{
  margin:10px 0 9px;
  font:600 31px/1 Montserrat,sans-serif;
  letter-spacing:-.04em;
}
.calc-panel p{
  max-width:600px;
  margin:0;
  color:rgba(255,255,255,.55);
  font-size:11px;
  line-height:1.65;
}
.calc-input{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin-top:22px;
}
.calc-input input{
  min-width:210px;
  min-height:44px;
  padding:0 14px;
  border:1px solid rgba(255,255,255,.14);
  border-radius:999px;
  background:rgba(255,255,255,.06);
  color:#fff;
  outline:0;
}
.calc-result{
  display:grid;
  place-content:center;
  min-height:250px;
  padding:26px;
  border:1px solid rgba(216,210,200,.84);
  border-radius:24px;
  background:var(--sk-ivory);
  text-align:center;
  box-shadow:var(--shadow-light);
}
.calc-result span{
  color:var(--sk-muted);
  font-size:9px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
}
.calc-result strong{
  display:block;
  margin-top:11px;
  color:var(--sk-navy-deep);
  font:600 55px/1 Montserrat,sans-serif;
  letter-spacing:-.055em;
}

/* Rewards + FAQ */
.reward-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}
.reward{
  padding:20px;
  border:1px solid rgba(216,210,200,.82);
  border-radius:16px;
  background:var(--sk-ivory);
  color:var(--sk-graphite);
  box-shadow:var(--shadow-light);
}
.reward h3{
  margin:0 0 7px;
  color:var(--sk-navy-deep);
  font:700 15px/1.2 Montserrat,sans-serif;
}
.reward p{
  margin:0;
  color:var(--sk-muted);
  font-size:10px;
  line-height:1.6;
}
.tag{
  display:inline-flex;
  margin-top:13px;
  padding:6px 10px;
  border:1px solid rgba(2,46,100,.11);
  border-radius:999px;
  background:#edf4f4;
  color:var(--sk-navy);
  font-size:8px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.faq{display:grid;gap:8px}
.faq-item{
  overflow:hidden;
  border:1px solid rgba(255,255,255,.10);
  border-radius:14px;
  background:rgba(255,255,255,.035);
}
.faq-q{
  width:100%;
  min-height:52px;
  display:flex;
  justify-content:space-between;
  gap:14px;
  align-items:center;
  padding:0 17px;
  border:0;
  background:transparent;
  color:#fff;
  text-align:left;
  font-size:11px;
  font-weight:750;
}
.faq-q span:last-child{color:var(--sk-aqua-soft)}
.faq-a{
  display:none;
  padding:0 17px 17px;
  color:rgba(255,255,255,.56);
  font-size:10px;
  line-height:1.65;
}
.faq-item.open .faq-a{display:block}

/* CTA */
.cta{
  position:relative;
  overflow:hidden;
  margin-top:78px;
  padding:46px;
  border:1px solid rgba(209,188,152,.18);
  border-radius:26px;
  background:
    radial-gradient(circle at 90% 0%,rgba(95,199,207,.11),transparent 30%),
    linear-gradient(145deg,#0a2138,#061a30 62%,#03111f);
  box-shadow:var(--shadow-dark);
  text-align:center;
}
.cta::after{
  content:"";
  position:absolute;
  left:46px;
  right:46px;
  bottom:0;
  height:2px;
  background:linear-gradient(90deg,transparent,var(--sk-aqua),var(--sk-champagne),transparent);
  opacity:.8;
}
.cta h2{
  margin:0;
  font:600 clamp(31px,4.5vw,50px)/1 Montserrat,sans-serif;
  letter-spacing:-.05em;
}
.cta p{
  max-width:700px;
  margin:13px auto 24px;
  color:rgba(255,255,255,.58);
  font-size:12px;
  line-height:1.7;
}
.cta-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}
.toast{
  position:fixed;
  right:18px;
  bottom:18px;
  z-index:50;
  display:none;
  max-width:360px;
  padding:12px 15px;
  border:1px solid rgba(255,255,255,.12);
  border-radius:11px;
  background:#061a30;
  color:#fff;
  box-shadow:var(--shadow-panel);
  font-size:10px;
}

@media(max-width:1080px){
  .tier-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:900px){
  .hero-grid,.calculator{grid-template-columns:1fr}
  .hero{padding:58px 0 94px}
  .club-pass{max-width:560px}
  .section-head{grid-template-columns:1fr;gap:14px}
  .ivory-grid{grid-template-columns:1fr}
}
@media(max-width:620px){
  .wrap{width:min(var(--max),calc(100% - 28px))}
  .hero{padding-top:46px}
  .hero h1{font-size:42px}
  .tier-grid,.reward-grid{grid-template-columns:1fr}
  .tier-card{min-height:220px}
  .club-pass{padding:23px}
  .pass-stats{grid-template-columns:1fr}
  .calc-panel,.calc-result,.cta{padding:23px}
  .calc-input{display:grid}
  .calc-input input,.calc-input .btn{width:100%}
  .cta{margin-top:58px}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{scroll-behavior:auto!important;transition-duration:.01ms!important}
}
</style>
</head>
<body>
<header class="hero" data-section-id="club-hero">
  <div class="wrap hero-grid">
    <div>
      <div class="eyebrow" data-content-id="club-hero-eyebrow">SKANDI CLUB</div>
      <h1 data-content-id="club-hero-h1">Travel further.<br>Together.</h1>
      <p class="hero-copy" data-content-id="club-hero-copy">
        A more personal way to travel with SKANDI. Join free, earn SKANDI Points and progress through four Club levels as your journeys add up.
      </p>
      <div class="hero-actions">
        <button class="btn primary" type="button" data-auth="signup">Join SKANDI Club</button>
        <button class="btn" type="button" data-auth="login">Log in</button>
      </div>
      <div class="member-status" id="memberStatus">Checking membership…</div>
    </div>

    <aside class="club-pass" aria-label="SKANDI Club program summary">
      <div class="pass-top">
        <span class="club-word">SKANDI CLUB</span>
        <span class="pass-tag">Member programme</span>
      </div>
      <div class="pass-copy">
        <strong id="programName">SKANDI Club</strong>
        <span id="programSub">Travel further, together.</span>
      </div>
      <div class="pass-stats">
        <div class="pass-stat">
          <strong id="pointsName">SKANDI Points</strong>
          <span>Points currency</span>
        </div>
        <div class="pass-stat">
          <strong>4</strong>
          <span>Club tiers</span>
        </div>
      </div>
    </aside>
  </div>
</header>

<main class="main">
  <div class="wrap">
    <section class="section" data-section-id="club-tiers">
      <div class="section-head">
        <div>
          <div class="eyebrow" data-content-id="club-tiers-eyebrow">YOUR CLUB JOURNEY</div>
          <h2 data-content-id="club-tiers-h2">Four levels. One Club.</h2>
        </div>
        <p data-content-id="club-tiers-copy">
          Every tier uses the same SKANDI Club design language, while its finish changes from core SKANDI navy through silver and gold to the midnight Diamond level.
        </p>
      </div>

      <div class="tier-grid" id="tierGrid">
        <article class="tier-card member" data-tier-key="member">
          <div class="tier-frame"></div>
          <div class="tier-top"><span class="tier-brand">SKANDI CLUB</span><span class="tier-name">Member</span></div>
          <div class="tier-body"><strong data-tier-range>0–24,999</strong><span>SKANDI Points</span></div>
          <div class="tier-foot"><span data-tier-multiplier>1× earn rate</span><strong>MEMBER</strong></div>
        </article>

        <article class="tier-card silver" data-tier-key="silver">
          <div class="tier-frame"></div>
          <div class="tier-top"><span class="tier-brand">SKANDI CLUB</span><span class="tier-name">Silver</span></div>
          <div class="tier-body"><strong data-tier-range>25,000–49,999</strong><span>SKANDI Points</span></div>
          <div class="tier-foot"><span data-tier-multiplier>1.25× earn rate</span><strong>SILVER</strong></div>
        </article>

        <article class="tier-card gold" data-tier-key="gold">
          <div class="tier-frame"></div>
          <div class="tier-top"><span class="tier-brand">SKANDI CLUB</span><span class="tier-name">Gold</span></div>
          <div class="tier-body"><strong data-tier-range>50,000–99,999</strong><span>SKANDI Points</span></div>
          <div class="tier-foot"><span data-tier-multiplier>1.5× earn rate</span><strong>GOLD</strong></div>
        </article>

        <article class="tier-card diamond" data-tier-key="diamond">
          <div class="tier-frame"></div>
          <div class="tier-top"><span class="tier-brand">SKANDI CLUB</span><span class="tier-name">Diamond</span></div>
          <div class="tier-body"><strong data-tier-range>100,000+</strong><span>SKANDI Points</span></div>
          <div class="tier-foot"><span data-tier-multiplier>2× earn rate</span><strong>DIAMOND</strong></div>
        </article>
      </div>
    </section>

    <section class="section" data-section-id="club-benefits">
      <div class="section-head">
        <div>
          <div class="eyebrow" data-content-id="club-benefits-eyebrow">WHY JOIN</div>
          <h2 data-content-id="club-benefits-h2">Built around your travels.</h2>
        </div>
        <p data-content-id="club-benefits-copy">
          Your Club profile connects points and rewards with the same customer account you use for trips, saved travellers and travel documents.
        </p>
      </div>

      <div class="ivory-grid">
        <article class="ivory-card">
          <div class="ivory-index">01</div>
          <h3>Join free</h3>
          <p>Create one SKANDI account and your Club membership lives alongside your travel profile.</p>
        </article>
        <article class="ivory-card">
          <div class="ivory-index">02</div>
          <h3>Earn SKANDI Points</h3>
          <p>Your active Club tier determines the points earning multiplier shown in the tier programme above.</p>
        </article>
        <article class="ivory-card">
          <div class="ivory-index">03</div>
          <h3>Manage it in My Profile</h3>
          <p>See your live points balance, tier progress and Club activity from the premium My Profile experience.</p>
        </article>
      </div>
    </section>

    <section class="section" data-section-id="club-rewards">
      <div class="section-head">
        <div>
          <div class="eyebrow" data-content-id="club-rewards-eyebrow">MEMBER VALUE</div>
          <h2 data-content-id="club-rewards-h2">Points that stay connected.</h2>
        </div>
        <p data-content-id="club-rewards-copy">
          Available rewards are connected to SKANDI Club. Your actual points balance and active account benefits are shown after sign-in.
        </p>
      </div>
      <div class="reward-grid" id="rewardList"></div>
    </section>

    <section class="section" data-section-id="club-calculator">
      <div class="calculator">
        <div class="calc-panel">
          <div class="eyebrow">CALCULATE VALUE</div>
          <h3>See what your points could become.</h3>
          <p>This is an estimate only. Your actual reward and credit value is shown in My Profile.</p>
          <div class="calc-input">
            <input id="pointsInput" inputmode="numeric" value="1000" aria-label="Points amount">
            <button class="btn primary" id="calcBtn" type="button">Calculate</button>
          </div>
        </div>
        <div class="calc-result">
          <span>Estimated SKANDI Credit</span>
          <strong id="calcResult">$10</strong>
        </div>
      </div>
    </section>

    <section class="section" data-section-id="club-faq">
      <div class="section-head">
        <div>
          <div class="eyebrow" data-content-id="club-faq-eyebrow">CLUB QUESTIONS</div>
          <h2 data-content-id="club-faq-h2">Good to know.</h2>
        </div>
      </div>
      <div class="faq" id="faqList"></div>
    </section>

    <section class="cta" data-section-id="club-cta">
      <h2 data-content-id="club-cta-h2">Your next trip can start your Club journey.</h2>
      <p data-content-id="club-cta-copy">
        Join SKANDI Club for free, or sign in to My Profile to see your current tier, points balance and Club activity.
      </p>
      <div class="cta-actions">
        <button class="btn primary" type="button" data-auth="signup">Join now</button>
        <button class="btn" type="button" data-profile>Open My Profile</button>
      </div>
    </section>
  </div>
</main>

<div id="toast" class="toast" role="status" aria-live="polite"></div>

<script>
(()=>{
"use strict";

const SOURCE="SKANDI_CLUB_INFO";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();

const $=id=>document.getElementById(id);

const DEFAULT_TIERS=[
  {key:"member",name:"Member",minPoints:0,maxPoints:24999,multiplier:1},
  {key:"silver",name:"Silver",minPoints:25000,maxPoints:49999,multiplier:1.25},
  {key:"gold",name:"Gold",minPoints:50000,maxPoints:99999,multiplier:1.5},
  {key:"diamond",name:"Diamond",minPoints:100000,maxPoints:null,multiplier:2}
];

let DATA={
  program:{name:"SKANDI Club",pointsName:"SKANDI Points"},
  tiers:DEFAULT_TIERS,
  rewards:[],
  faqs:[],
  settings:{pointsToCreditRate:.01,creditExample:"$10",programSubtitle:"Travel further, together."}
};

let STATUS={loggedIn:false};

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}

function toast(message){
  const node=$("toast");
  node.textContent=String(message||"");
  node.style.display="block";
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>node.style.display="none",2600);
}

function formatPoints(value){
  return Number(value||0).toLocaleString(undefined,{maximumFractionDigits:0});
}

function rangeLabel(tier={}){
  const min=Number(tier.minPoints||0);
  const max=tier.maxPoints===null||tier.maxPoints===undefined?null:Number(tier.maxPoints);
  return max===null
    ?`${formatPoints(min)}+`
    :`${formatPoints(min)}–${formatPoints(max)}`;
}

function multiplierLabel(value){
  const n=Number(value||1);
  return `${Number.isInteger(n)?n:n.toFixed(2).replace(/0+$/,"").replace(/\.$/,"")}× earn rate`;
}

function normalizedTiers(){
  const incoming=Array.isArray(DATA.tiers)?DATA.tiers:[];
  const byKey=new Map(incoming.map(tier=>[String(tier.key||"").toLowerCase(),tier]));
  return DEFAULT_TIERS.map(fallback=>({
    ...fallback,
    ...(byKey.get(fallback.key)||{})
  }));
}

function renderTiers(){
  normalizedTiers().forEach(tier=>{
    const card=document.querySelector(`[data-tier-key="${CSS.escape(tier.key)}"]`);
    if(!card)return;
    const range=card.querySelector("[data-tier-range]");
    const multiplier=card.querySelector("[data-tier-multiplier]");
    const name=card.querySelector(".tier-name");
    if(range)range.textContent=rangeLabel(tier);
    if(multiplier)multiplier.textContent=multiplierLabel(tier.multiplier);
    if(name)name.textContent=tier.name||tier.key;
  });
}

function money(value){
  return "$"+Number(value||0).toLocaleString(undefined,{
    minimumFractionDigits:0,
    maximumFractionDigits:2
  });
}

function calc(){
  const points=Math.max(0,Number($("pointsInput").value||0));
  const rate=Number(DATA.settings?.pointsToCreditRate||.01);
  $("calcResult").textContent=money(points*rate);
}

function renderRewards(){
  const rewards=Array.isArray(DATA.rewards)?DATA.rewards:[];
  $("rewardList").innerHTML=rewards.length
    ?rewards.map(reward=>`
      <article class="reward">
        <h3>${esc(reward.name||reward.title||"SKANDI Reward")}</h3>
        <p>${esc(reward.description||"Connected SKANDI Club reward.")}</p>
        <span class="tag">${esc(reward.pointsCost||reward.requiredPoints||"")} ${esc(DATA.program?.pointsName||"points")}</span>
      </article>
    `).join("")
    :`
      <article class="reward">
        <h3>SKANDI Credit</h3>
        <p>Eligible Club points can connect to SKANDI Credit according to the active reward rules in your account.</p>
        <span class="tag">Connected reward</span>
      </article>
      <article class="reward">
        <h3>Member offers</h3>
        <p>Club-linked offers and account benefits are surfaced through your signed-in SKANDI profile when available.</p>
        <span class="tag">Club benefit</span>
      </article>`;
}

function renderFaqs(){
  const incoming=Array.isArray(DATA.faqs)?DATA.faqs:[];
  const faqs=incoming.length?incoming:[
    {q:"Is SKANDI Club free?",a:"Yes. Customers can join SKANDI Club for free."},
    {q:"Which Club levels are available?",a:"The Club programme uses Member, Silver, Gold and Diamond tiers."},
    {q:"Where do I see my current tier?",a:"Sign in and open My Profile. Your live tier, points balance and progress are shown there."},
    {q:"How are tiers calculated?",a:"The public tier thresholds and earning multipliers shown on this page come from the active SKANDI Club tier configuration."}
  ];

  $("faqList").innerHTML=faqs.map((faq,index)=>`
    <article class="faq-item ${index===0?"open":""}">
      <button class="faq-q" type="button" aria-expanded="${index===0?"true":"false"}">
        <span>${esc(faq.q||faq.question||"Club question")}</span>
        <span>+</span>
      </button>
      <div class="faq-a">${esc(faq.a||faq.answer||"")}</div>
    </article>
  `).join("");
}

function render(){
  const program=DATA.program||{};
  const settings=DATA.settings||{};

  $("programName").textContent=program.name||"SKANDI Club";
  $("programSub").textContent=settings.programSubtitle||"Travel further, together.";
  $("pointsName").textContent=program.pointsName||settings.pointsName||"SKANDI Points";

  $("memberStatus").textContent=STATUS.loggedIn
    ?`Signed in as ${STATUS.name||"SKANDI Club member"}. Open My Profile for your live tier and points.`
    :"Not a member yet? Join free and start with Member tier.";

  renderTiers();
  renderRewards();
  renderFaqs();
  calc();
  requestHeight();
}

document.addEventListener("click",event=>{
  const auth=event.target.closest("[data-auth]");
  if(auth){
    post("SKANDI_CLUB_AUTH_OPEN",{mode:auth.dataset.auth||"signup"});
    return;
  }

  const profile=event.target.closest("[data-profile]");
  if(profile){
    post("SKANDI_CLUB_PROFILE_OPEN",{});
    return;
  }

  const faq=event.target.closest(".faq-q");
  if(faq){
    const item=faq.closest(".faq-item");
    const open=item.classList.toggle("open");
    faq.setAttribute("aria-expanded",open?"true":"false");
    requestHeight();
  }
});

$("calcBtn").addEventListener("click",calc);
$("pointsInput").addEventListener("input",calc);

window.addEventListener("message",event=>{
  let message=event.data;
  if(typeof message==="string"){
    try{message=JSON.parse(message)}catch(_){return}
  }
  if(!message||typeof message!=="object")return;
  if(message.source&&message.source!==PARENT)return;

  const payload=message.payload||{};

  if(message.type==="SKANDI_CLUB_INFO_DATA"){
    DATA={
      ...DATA,
      ...payload,
      program:{...DATA.program,...(payload.program||{})},
      settings:{...DATA.settings,...(payload.settings||{})},
      tiers:Array.isArray(payload.tiers)?payload.tiers:DATA.tiers,
      rewards:Array.isArray(payload.rewards)?payload.rewards:DATA.rewards,
      faqs:Array.isArray(payload.faqs)?payload.faqs:DATA.faqs
    };
    render();
    return;
  }

  if(message.type==="SKANDI_CLUB_MEMBER_STATUS"){
    STATUS=payload.status||payload||{loggedIn:false};
    render();
    return;
  }

  if(message.type==="SKANDI_CLUB_INFO_ERROR"){
    toast(payload.message||"SKANDI Club information is unavailable.");
  }
});

let heightTimer=0;
function requestHeight(){
  clearTimeout(heightTimer);
  heightTimer=setTimeout(()=>{
    post("SKANDI_CLUB_HEIGHT",{
      height:Math.ceil(document.documentElement.scrollHeight)
    });
  },60);
}

if("ResizeObserver"in window){
  new ResizeObserver(requestHeight).observe(document.body);
}else{
  window.addEventListener("resize",requestHeight);
}

post("SKANDI_CLUB_INFO_READY",{});
render();
})();
</script>
</body>
</html>
```
