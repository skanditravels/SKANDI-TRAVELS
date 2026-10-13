# SKANDI Uniform Center

## INFO / LOG

- **Status:** V12 repair prepared — STATICALLY VERIFIED / REQUIRES LIVE TEST
- **System:** RIAINTRA
- **Route:** `/riaintra/success-factors/uniform`
- **Wix page:** `Uniform Center.lukfc`
- **HTML component:** `#uniformCenterEmbed`
- **Child source:** `SKANDI_UNIFORM_EMPLOYEE`
- **Repository baseline:** `skanditravels/SKANDI-TRAVELS` main `4163618a81fed71d7114ac55d3fa003421f145b0`
- **Prepared:** 2026-10-13

### V12 repair

Added server-authoritative Admin Login routing to Uniform Control, an explicit unauthorized dialog, and resilient startup synchronization. Existing employee catalog/order/policy functionality is preserved.

### Verification boundary

Source contracts and syntax are checked locally. Wix publication, Supabase/RLS, staff/member session state and provider behavior require live testing after replacement and publication.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SKANDI Uniform Shop</title>
  <style>
    :root {
      --hm-red:#022e64;
      --hm-black:#111827;
      --hm-charcoal:#374151;
      --hm-bg-primary:#ffffff;
      --hm-bg-secondary:#f7f8fa;
      --hm-border-muted:#e5e7eb;
      --hm-muted-text:#667085;
      --hm-success:#087443;
      --hm-warning:#d8aa3d;
      --hm-danger:#b42318;
      --hm-shadow:0 16px 40px rgba(17,24,39,.08);
      --hm-fast:all .25s ease-in-out;
    }
* { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--hm-bg-primary);
      color: var(--hm-charcoal);
      font-family: "Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.5;
    }

    /* =========================================
       SKANDI UNIFORM SHOP STYLES
       ========================================= */
    a, button, input, select, textarea, .product-card, .swatch, .size-option, .accordion-header, .newsletter-submit {
      transition: var(--hm-fast);
    }
    a { color: inherit; text-decoration: none; cursor: pointer; }
    button { font: inherit; cursor: pointer; border: 0; background: transparent; color: inherit; }
    
    input, select, textarea {
      width: 100%; border: 1px solid var(--hm-black); background: var(--hm-bg-primary);
      color: var(--hm-charcoal); padding: 13px 14px; border-radius: 0; font: inherit; outline: none;
    }
    input:focus, select:focus, textarea:focus { box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.12); }
    img { display: block; max-width: 100%; }
    .d-none { display: none !important; }
    .serif { font-family: "Montserrat", sans-serif; letter-spacing: -0.04em; font-weight: 800; }

    .hm-shell { min-height:100vh; background:var(--hm-bg-primary); }
    .uniform-toolbar-shell { position:sticky; top:0; z-index:100; background:rgba(255,255,255,.97); border-bottom:1px solid var(--hm-border-muted); backdrop-filter:blur(12px); }

    .top-bar {
      display: flex; justify-content: space-between; gap: 16px; padding: 10px 36px;
      font-size: 12px; color: var(--hm-muted-text); background: var(--hm-bg-primary); font-weight: 600;
    }
    .top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
    .top-bar a:hover { color: var(--hm-black); text-decoration: underline; }

    .mid-header { position: relative; min-height: 76px; display: flex; align-items: center; justify-content: center; padding: 12px 36px; }
    .hm-logo { display: flex; align-items: center; justify-content: center; height: clamp(34px, 5vw, 50px); padding: 0; }
    .hm-logo img { max-height: 100%; width: auto; object-fit: contain; }
    .hm-logo:hover { opacity: 0.78; }

    .utility-controls {
      position: absolute; right: 36px; top: 50%; transform: translateY(-50%);
      display: flex; gap: 22px; align-items: center; font-size: 14px; color: var(--hm-black); font-weight: 700;
    }
    .utility-controls a:hover, .utility-controls button:hover { text-decoration: underline; }

    .nav-rail {
      display: flex; justify-content: center; align-items: center; gap: clamp(22px, 4vw, 60px);
      padding: 0 24px 18px; color: var(--hm-black); font-weight: 700; text-transform: uppercase; font-size: 13px;
    }
    .nav-item { position: relative; padding: 6px 2px; letter-spacing: 0.05em; }
    .nav-item::after {
      content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 2px;
      background: var(--hm-black); transform: scaleX(0); transform-origin: center; transition: var(--hm-fast);
    }
    .nav-item:hover::after, .nav-item.is-active::after { transform: scaleX(1); }

    .promo-ticker {
      text-align: center; background: var(--hm-bg-secondary); color: var(--hm-charcoal);
      padding: 10px 18px; font-size: 12px; font-weight: 700; border-top: 1px solid var(--hm-border-muted);
    }

    .view { min-height: 68vh; }
    .container { width: min(1440px, calc(100% - 48px)); margin: 0 auto; }

    .btn {
      display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 26px;
      border: 1px solid var(--hm-black); background: var(--hm-black); color: var(--hm-bg-primary);
      font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; text-align: center;
    }
    .btn:hover { background-color: #333; border-color: #333; }
    .btn-light { background: var(--hm-bg-primary); color: var(--hm-black); }
    .btn-light:hover { background: var(--hm-bg-secondary); border-color: var(--hm-black); }
    .btn-full { width: 100%; }
    .btn-small { min-height: 38px; padding: 0 16px; font-size: 12px; }
    .btn-disabled { background: #d4d0cc; border-color: #d4d0cc; color: #77716b; cursor: not-allowed; }

    .hero-panel {
      position: relative; height: min(780px, calc(100vh - 170px)); min-height: 520px;
      background-image: linear-gradient(90deg, rgba(2, 46, 100, 0.45), rgba(2, 46, 100, 0.15)), url("https://static.wixstatic.com/media/394052_54b5f789d38c4b0f87678a2f4852c85e~mv2.png");
      background-size: cover; background-position: center 26%; display: flex; align-items: flex-end;
      justify-content: center; padding: 72px 24px; color: var(--hm-bg-primary); text-align: center;
    }
    .hero-content { position: relative; z-index: 1; max-width: 780px; }
    .hero-kicker { margin: 0 0 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
    .hero-title { margin: 0 0 26px; font-size: clamp(48px, 8vw, 100px); line-height: 0.9; text-shadow: 0 10px 34px rgba(0, 0, 0, 0.28); }
    .hero-button { min-width: 180px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22); }

    .curated-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; padding: 42px 0 74px; }
    .curated-card { position: relative; min-height: 480px; overflow: hidden; background: var(--hm-bg-secondary); cursor: pointer; isolation: isolate; }
    .curated-card::before {
      content: ""; position: absolute; inset: 0; background-size: cover; background-position: center;
      transform: scale(1); transition: var(--hm-fast); z-index: -2;
    }
    .curated-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.42)); z-index: -1; }
    .curated-card:hover::before { transform: scale(1.04); opacity: 0.94; }
    .curated-men::before { background-image: url("https://static.wixstatic.com/media/394052_b172af14b4a84588a72682dec255dc39~mv2.png"); }
    .curated-divided::before { background-image: url("https://static.wixstatic.com/media/394052_abcbcd71048744b9ac848a19412b5151~mv2.png"); }
    .curated-content { position: absolute; left: 34px; right: 34px; bottom: 34px; color: var(--hm-bg-primary); }
    .curated-title { margin: 0 0 18px; font-size: clamp(34px, 4vw, 54px); line-height: 0.95; }

    .plp-header { padding: 46px 0 22px; display: flex; justify-content: space-between; align-items: end; gap: 20px; }
    .plp-title { margin: 0; font-size: clamp(36px, 5vw, 64px); line-height: 1; text-transform: uppercase; }
    .plp-count { margin: 12px 0 0; color: var(--hm-muted-text); font-weight: 600; }

    .toolbar {
      display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 14px;
      background: var(--hm-bg-secondary); border: 1px solid var(--hm-border-muted); padding: 18px; margin-bottom: 26px;
    }
    .toolbar label { display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .toolbar select { font-size: 13px; font-weight: 600; }

    .product-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 26px 18px; padding-bottom: 74px; }
    .product-card { position: relative; background: var(--hm-bg-primary); cursor: pointer; }
    .product-card:hover { transform: translateY(-3px); }
    .product-media { position: relative; overflow: hidden; background: #eef2f7; aspect-ratio: 3 / 4; display: flex; align-items: center; justify-content: center; }
    .product-card-image { width: 100%; height: 100%; object-fit: cover; transition: var(--hm-fast); }
    .product-card:hover .product-card-image { transform: scale(1.02); }
    .favorite-btn {
      position: absolute; top: 12px; right: 12px; z-index: 3; width: 38px; height: 38px;
      display: grid; place-items: center; background: rgba(255, 255, 255, 0.86); color: var(--hm-black);
      border-radius: 50%; font-size: 22px; line-height: 1;
    }
    .favorite-btn:hover, .favorite-btn.is-favorite { background: var(--hm-black); color: var(--hm-bg-primary); }
    .sale-tag {
      position: absolute; left: 12px; top: 12px; z-index: 3; background: #b45309; color: var(--hm-bg-primary);
      padding: 5px 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
    }

    .product-info { padding: 12px 2px 4px; }
    .product-title { margin: 0 0 6px; font-size: 15px; line-height: 1.2; font-weight: 700; color: var(--hm-black); }
    .product-price { margin: 0 0 4px; font-weight: 800; color: var(--hm-charcoal); font-size: 14px; }
    .product-rating { margin: 0 0 10px; font-size: 12px; color: var(--hm-muted-text); font-weight: 600; }

    .swatch-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
    .swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.18); box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.7); }

    .empty-state { padding: 60px 24px; text-align: center; background: var(--hm-bg-secondary); border: 1px solid var(--hm-border-muted); }
    .empty-state h2 { margin: 0 0 10px; font-size: 32px; font-weight: 800; }

    .pdp-layout { display: grid; grid-template-columns: minmax(0, 3fr) minmax(360px, 2fr); gap: 42px; padding: 38px 0 82px; }
    .pdp-image-stack { display: grid; gap: 18px; }
    .pdp-image-card { background: #eef2f7; overflow: hidden; min-height: 520px; display: flex; align-items: center; justify-content: center; }
    .pdp-image-card img { width: 100%; height: auto; min-height: 620px; object-fit: cover; }
    
    .pdp-panel { position: sticky; top: 110px; align-self: start; background: var(--hm-bg-primary); padding: 10px 0 0; }
    .breadcrumb { margin-bottom: 24px; font-size: 12px; color: var(--hm-muted-text); font-weight: 700; text-transform: uppercase; }
    .breadcrumb button:hover { text-decoration: underline; color: var(--hm-black); }
    .pdp-title { margin: 0 0 12px; font-size: clamp(34px, 4vw, 54px); line-height: 0.95; }
    .pdp-price { font-size: 20px; font-weight: 800; margin: 0 0 12px; }
    .pdp-review { color: var(--hm-muted-text); font-size: 13px; font-weight: 600; margin-bottom: 26px; }

    .selector-block { margin-bottom: 26px; }
    .selector-label {
      display: flex; justify-content: space-between; gap: 16px; align-items: center;
      margin-bottom: 12px; font-size: 12px; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase;
    }
    .selected-meta { color: var(--hm-muted-text); font-weight: 600; letter-spacing: 0; text-transform: none; }
    
    .size-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
    .size-option { min-height: 44px; border: 1px solid var(--hm-border-muted); background: var(--hm-bg-primary); color: var(--hm-black); font-weight: 800; font-size: 13px; }
    .size-option:hover, .size-option.is-active { background: var(--hm-black); color: var(--hm-bg-primary); border-color: var(--hm-black); }
    .size-guide-link { font-size: 12px; text-decoration: underline; color: var(--hm-black); font-weight: 700; }
    .pdp-message { min-height: 22px; margin: 12px 0 0; color: #b42318; font-size: 13px; font-weight: 700; }

    .accordion { margin-top: 28px; border-top: 1px solid var(--hm-border-muted); }
    .accordion-item { border-bottom: 1px solid var(--hm-border-muted); }
    .accordion-header { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 18px 0; font-weight: 800; font-size: 13px; text-transform: uppercase; text-align: left; }
    .accordion-header:hover { color: var(--hm-muted-text); }
    .accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.25s ease-in-out, padding 0.25s ease-in-out; padding: 0; color: var(--hm-charcoal); font-size: 14px; }
    .accordion-item.is-open .accordion-body { max-height: 420px; padding: 0 0 18px; }

    .bag-layout { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 36px; padding: 44px 0 82px; }
    .page-heading { margin: 0 0 24px; font-size: clamp(38px, 5vw, 64px); line-height: 1; text-transform: uppercase; }
    
    .bag-items { display: grid; gap: 14px; }
    .bag-line { display: grid; grid-template-columns: 100px minmax(0, 1fr); gap: 18px; padding: 18px; border: 1px solid var(--hm-border-muted); background: var(--hm-bg-primary); }
    .bag-line img, .bag-line .fallback-img { width: 100px; height: 134px; object-fit: cover; background: #eef2f7; display:flex; align-items:center; justify-content:center; font-weight:800; color:#94a3b8; font-size:11px;}
    .bag-line-title { margin: 0 0 8px; font-size: 18px; line-height: 1.1; font-weight: 800; color: var(--hm-black); }
    .bag-line-meta { margin: 0 0 4px; color: var(--hm-muted-text); font-size: 13px; font-weight: 600; }
    .bag-line-price { margin: 12px 0 16px; font-weight: 800; font-size: 15px;}
    
    .quantity-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .qty-btn, .trash-btn { width: 32px; height: 32px; border: 1px solid var(--hm-border-muted); display: grid; place-items: center; background: var(--hm-bg-primary); color: var(--hm-black); font-weight: 900; }
    .qty-btn:hover, .trash-btn:hover { background: var(--hm-black); color: var(--hm-bg-primary); border-color: var(--hm-black); }
    .qty-value { min-width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid var(--hm-border-muted); background: var(--hm-bg-secondary); font-weight: 800; font-size: 13px; }

    .summary-card { position: sticky; top: 110px; align-self: start; border: 1px solid var(--hm-border-muted); background: var(--hm-bg-secondary); padding: 24px; }
    .summary-title { margin: 0 0 20px; font-size: 24px; font-weight: 800; text-transform: uppercase; }
    .summary-row { display: flex; justify-content: space-between; gap: 18px; padding: 11px 0; border-bottom: 1px solid var(--hm-border-muted); font-weight: 600; font-size: 14px;}
    .summary-total { font-size: 21px; font-weight: 900; border-bottom: 0; padding-top: 18px; margin-bottom: 20px; }
    .shipping-note { margin: 0 0 20px; color: var(--hm-muted-text); font-size: 13px; font-weight: 600; line-height: 1.6; }

    .checkout-layout { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 36px; padding: 44px 0 82px; }
    .checkout-accordion { display: grid; gap: 14px; }
    .checkout-step { border: 1px solid var(--hm-border-muted); background: var(--hm-bg-primary); }
    .checkout-step.is-locked { opacity: 0.52; pointer-events: none; }
    .checkout-step-header {
      display: flex; justify-content: space-between; gap: 18px; align-items: center; width: 100%;
      padding: 20px; font-weight: 900; text-align: left; background: var(--hm-bg-secondary); text-transform: uppercase; font-size: 14px;
    }
    .checkout-step-header:hover { background: #f2efec; }
    .checkout-step-body { max-height: 0; overflow: hidden; padding: 0 20px; transition: max-height 0.25s ease-in-out, padding 0.25s ease-in-out; }
    .checkout-step.is-open .checkout-step-body { max-height: 760px; padding: 20px; }

    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .form-field-full { grid-column: 1 / -1; }
    .form-field label { display: block; font-size: 11px; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 7px; color: var(--hm-muted-text);}
    .form-error { min-height: 22px; color: #b42318; font-weight: 800; font-size: 13px; margin: 12px 0 0; }

    .success-panel { text-align: center; padding: 58px 26px; border: 1px solid var(--hm-border-muted); background: var(--hm-bg-secondary); }
    .success-icon {
      width: 72px; height: 72px; margin: 0 auto 22px; display: grid; place-items: center;
      border-radius: 50%; background: var(--hm-success); color: var(--hm-bg-primary); font-size: 36px; font-weight: 900;
    }
    .success-panel h2 { margin: 0 0 14px; font-size: clamp(38px, 5vw, 64px); line-height: 0.95; text-transform: uppercase; }
    .success-code { display: inline-flex; padding: 10px 14px; margin: 12px 0; background: var(--hm-bg-primary); border: 1px solid var(--hm-black); font-weight: 900; letter-spacing: 0.08em; }

    .modal-overlay { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 24px; background: rgba(17, 24, 39, 0.54); }
    .modal { width: min(720px, 100%); max-height: min(760px, calc(100vh - 48px)); overflow: auto; background: var(--hm-bg-primary); box-shadow: var(--hm-shadow); padding: 32px; position: relative; }
    .modal-close { position: absolute; right: 18px; top: 18px; width: 36px; height: 36px; border: 1px solid var(--hm-black); display: grid; place-items: center; font-weight: 900; font-size: 20px;}
    .modal-close:hover { background: var(--hm-black); color: var(--hm-bg-primary); }
    
    .toast {
      position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%) translateY(24px); z-index: 250;
      background: var(--hm-black); color: var(--hm-bg-primary); padding: 14px 22px; min-width: 260px;
      text-align: center; opacity: 0; pointer-events: none; transition: var(--hm-fast); box-shadow: var(--hm-shadow);
      font-weight: 700; font-size: 13px;
    }
    .toast.is-visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    
    .status-banner { display: none; background: #111827; color: white; text-align: center; padding: 10px; font-size: 12px; font-weight: 700; }
    .status-banner.show { display: block; }
    .status-banner.error { background: #b42318; }
    .status-banner.ok { background: #087443; }

    @media (max-width: 1100px) {
      .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .pdp-layout, .bag-layout, .checkout-layout { grid-template-columns: 1fr; }
      .pdp-panel, .summary-card { position: static; }
      .footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 760px) {
      .container { width: min(100% - 28px, 1440px); }
      .top-bar { padding: 9px 14px; }
      .top-bar-left { display: none; }
      .mid-header { min-height: 92px; padding: 12px 14px 42px; }
      .utility-controls { left: 14px; right: 14px; top: auto; bottom: 10px; transform: none; justify-content: center; gap: 14px; font-size: 12px; }
      .nav-rail { gap: 18px; overflow-x: auto; justify-content: flex-start; padding: 0 14px 14px; }
      .hero-panel { min-height: 480px; }
      .curated-grid, .toolbar, .footer-grid, .form-grid { grid-template-columns: 1fr; }
      .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 12px; }
      .product-title { font-size: 14px; }
      .plp-header { display: block; }
      .bag-line { grid-template-columns: 80px minmax(0, 1fr); padding: 12px; }
      .bag-line img, .bag-line .fallback-img { width: 80px; height: 106px; }
      .bag-line-title { font-size: 15px; }
      .pdp-image-card img { min-height: 420px; }
    }
    @media (max-width: 480px) {
      .product-grid { grid-template-columns: 1fr; }
      .size-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
  
    .uniform-toolbar-main{width:min(1440px,calc(100% - 48px));margin:0 auto;min-height:64px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:22px;}
    .uniform-brand{display:flex;flex-direction:column;align-items:flex-start;gap:2px;color:var(--hm-black);text-align:left;padding:0;}
    .uniform-brand strong{font-size:16px;letter-spacing:.08em;}
    .uniform-brand span{font-size:10px;color:var(--hm-muted-text);letter-spacing:.12em;text-transform:uppercase;font-weight:800;}
    .uniform-staff{justify-self:end;display:flex;gap:8px;align-items:center;font-size:12px;color:var(--hm-muted-text);white-space:nowrap;}
    .uniform-staff strong{color:var(--hm-black);}
    .uniform-utilities{display:flex;align-items:center;gap:18px;font-size:12px;font-weight:800;color:var(--hm-black);}
    .uniform-utilities button:hover{text-decoration:underline;}
    .uniform-toolbar-shell .nav-rail{padding:0 24px 10px;gap:clamp(16px,3vw,42px);}
    .uniform-toolbar-shell .promo-ticker{padding:8px 18px;}
    @media(max-width:760px){.uniform-toolbar-main{width:calc(100% - 28px);grid-template-columns:1fr auto;min-height:58px;gap:10px}.uniform-staff{display:none}.uniform-utilities{gap:10px;font-size:11px}.uniform-toolbar-shell .nav-rail{padding:0 14px 10px}.promo-ticker{font-size:11px}}

    /* =========================================
       INTEGRATED UNIFORM REGULATIONS
       ========================================= */
    .regulations-shell { padding: 46px 0 86px; }
    .regulations-hero {
      display:grid; grid-template-columns:minmax(0,1fr) auto; gap:28px; align-items:end;
      padding:34px; background:var(--hm-bg-secondary); border:1px solid var(--hm-border-muted); margin-bottom:24px;
    }
    .regulations-kicker { margin:0 0 10px; font-size:12px; text-transform:uppercase; letter-spacing:.14em; font-weight:900; color:var(--hm-red); }
    .regulations-title { margin:0; font-size:clamp(38px,5vw,68px); line-height:.95; text-transform:uppercase; color:var(--hm-black); }
    .regulations-meta { margin:14px 0 0; display:flex; flex-wrap:wrap; gap:12px 20px; color:var(--hm-muted-text); font-size:12px; font-weight:700; }
    .regulations-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
    .regulations-layout { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:28px; }
    .regulations-document { border:1px solid var(--hm-border-muted); background:#fff; padding:34px; }
    .regulations-document h2 { margin:30px 0 10px; font-size:22px; line-height:1.15; color:var(--hm-black); text-transform:uppercase; letter-spacing:.02em; }
    .regulations-document h2:first-child { margin-top:0; }
    .regulations-document p { margin:0 0 14px; color:var(--hm-charcoal); line-height:1.75; font-size:14px; }
    .regulations-document ul { margin:0 0 18px; padding-left:20px; }
    .regulations-document li { margin:0 0 8px; line-height:1.65; }
    .regulations-side { display:grid; gap:14px; align-content:start; }
    .reg-card { border:1px solid var(--hm-border-muted); background:var(--hm-bg-secondary); padding:20px; }
    .reg-card h3 { margin:0 0 10px; font-size:15px; text-transform:uppercase; color:var(--hm-black); }
    .reg-card p { margin:0; color:var(--hm-muted-text); font-size:13px; line-height:1.6; }
    .policy-ack { margin-top:14px; display:flex; align-items:flex-start; gap:9px; font-size:12px; line-height:1.5; color:var(--hm-charcoal); }
    .policy-ack input { width:auto; margin-top:2px; }
    .eligibility-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:10px; }
    .eligibility-chip { background:var(--hm-bg-secondary); border:1px solid var(--hm-border-muted); padding:10px; }
    .eligibility-chip strong { display:block; color:var(--hm-black); font-size:10px; text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px; }
    .eligibility-chip span { display:block; color:var(--hm-muted-text); font-size:12px; overflow-wrap:anywhere; }
    .item-regulation-callout { margin:0 0 18px; padding:14px 16px; background:var(--hm-bg-secondary); border-left:3px solid var(--hm-red); font-size:13px; line-height:1.55; }
    .item-regulation-callout strong { display:block; margin-bottom:5px; color:var(--hm-black); }
    @media(max-width:900px){
      .regulations-hero,.regulations-layout{grid-template-columns:1fr}
      .regulations-actions{justify-content:flex-start}
      .eligibility-grid{grid-template-columns:1fr}
    }


    .swatch{padding:0;cursor:pointer}
    .swatch.is-active{outline:2px solid var(--hm-black);outline-offset:3px}
    .swatch-label{font-size:11px;color:var(--hm-muted-text);font-weight:700;margin-top:7px}
    .pdp-gallery-main{background:#eef2f7;aspect-ratio:4/5;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .pdp-gallery-main img{width:100%;height:100%;object-fit:contain}
    .pdp-thumbnails{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}
    .pdp-thumb{border:1px solid var(--hm-border-muted);background:#eef2f7;aspect-ratio:1/1.15;padding:0;overflow:hidden}
    .pdp-thumb img{width:100%;height:100%;object-fit:cover}
    .pdp-thumb.is-active{border:2px solid var(--hm-black)}
    .variant-selector{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .variant-color-button{width:28px;height:28px;border-radius:50%;border:1px solid rgba(0,0,0,.22);box-shadow:inset 0 0 0 3px #fff;padding:0}
    .variant-color-button.is-active{outline:2px solid var(--hm-black);outline-offset:3px}
    .issue-cycle-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .issue-cycle-card{padding:12px;border:1px solid var(--hm-border-muted);background:var(--hm-bg-secondary)}
    .issue-cycle-card strong{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--hm-muted-text);margin-bottom:5px}
    .issue-cycle-card span{font-weight:800;color:var(--hm-black)}
    @media(max-width:760px){.pdp-thumbnails{grid-template-columns:repeat(3,minmax(0,1fr))}.issue-cycle-grid{grid-template-columns:1fr}}

</style>
</head>
<body>

  <!-- =========================================
       SKANDI UNIFORM SHOP
       ========================================= -->
  <div id="hm-app" class="hm-shell">
    <div id="status-banner" class="status-banner">Loading Uniform Center from Supabase...</div>
    
    <div class="uniform-toolbar-shell" aria-label="Uniform Center controls">
      <div class="uniform-toolbar-main">
        <button class="uniform-brand" type="button" data-action="route-home" aria-label="Uniform Center home">
          <strong>UNIFORM CENTER</strong><span>SKANDI STAFF PORTAL</span>
        </button>
        <div class="uniform-staff"><span id="staff-name">Staff</span><span>•</span><strong id="wallet-points">0 points</strong></div>
        <nav class="uniform-utilities" aria-label="Uniform actions">
          <button type="button" data-action="sync-uniform">Sync</button>
          <button type="button" data-action="route-regulations">Uniform Regulations</button>
          <button type="button" data-action="route-orders">Orders (<span id="orders-count">0</span>)</button>
          <button type="button" data-action="admin-login">Admin Login</button>
          <button type="button" data-action="route-favorites">Saved (<span data-favorites-count>0</span>)</button>
          <button type="button" data-action="route-bag">Bag (<span data-bag-count>0</span>)</button>
        </nav>
      </div>
      <nav class="nav-rail" id="main-nav-rail" aria-label="Uniform categories"></nav>
      <div class="promo-ticker" id="promo-ticker">Loading your Supabase uniform allowance…</div>
    </div>

    <main>
      <section id="view-home" class="view" data-view="home" aria-label="Home page">
        <div class="hero-panel">
          <div class="hero-content">
            <p class="hero-kicker">Duty Required</p>
            <h1 class="hero-title serif">Uniform Essentials</h1>
            <button class="btn hero-button" type="button" data-action="route-category" data-category="">SHOP CATALOG</button>
          </div>
        </div>

        <div class="container">
          <div class="curated-grid">
            <article class="curated-card curated-men" tabindex="0" role="button" data-action="route-subcategory" data-subcategory="Men" aria-label="Shop men's uniform">
              <div class="curated-content">
                <h2 class="curated-title serif">Men</h2>
                <span class="btn btn-light btn-small">Shop Men</span>
              </div>
            </article>
            <article class="curated-card curated-divided" tabindex="0" role="button" data-action="route-subcategory" data-subcategory="Women" aria-label="Shop women's uniform">
              <div class="curated-content">
                <h2 class="curated-title serif">Women</h2>
                <span class="btn btn-light btn-small">Shop Women</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="view-plp" class="view d-none" data-view="plp" aria-label="Product listing page">
        <div class="container">
          <div id="plp-root"></div>
        </div>
      </section>

      <section id="view-pdp" class="view d-none" data-view="pdp" aria-label="Product detail page">
        <div class="container">
          <div id="pdp-root"></div>
        </div>
      </section>

      <section id="view-bag" class="view d-none" data-view="bag" aria-label="Shopping bag page">
        <div class="container">
          <div id="bag-root"></div>
        </div>
      </section>

      <section id="view-checkout" class="view d-none" data-view="checkout" aria-label="Checkout page">
        <div class="container">
          <div id="checkout-root"></div>
        </div>
      </section>

      <section id="view-orders" class="view d-none" data-view="orders" aria-label="Orders page">
        <div class="container" style="padding: 44px 0 82px;">
          <h1 class="page-heading serif">My Uniform Orders</h1>
          <div id="orders-root"></div>
        </div>
      </section>

      <section id="view-regulations" class="view d-none" data-view="regulations" aria-label="Uniform Regulations">
        <div class="container">
          <div id="regulations-root"></div>
        </div>
      </section>

    </main>

    <div id="size-guide-modal" class="modal-overlay d-none" role="dialog" aria-modal="true" aria-labelledby="size-guide-title">
      <div class="modal">
        <button class="modal-close" type="button" data-action="close-size-guide" aria-label="Close size guide">×</button>
        <h2 id="size-guide-title" class="serif" style="font-size: 34px; margin: 0 0 16px;">Size Guide</h2>
        <p style="color: var(--hm-muted-text); font-size:13px; font-weight:600; line-height:1.6;">
          Choose your normal uniform size. For fitted items, use the size you usually wear on duty. Uniform Control can adjust the request before fulfillment if your measurements are registered in the staff profile.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 22px; font-size:13px; font-weight:600; text-align:center;">
          <thead>
            <tr>
              <th style="border: 1px solid var(--hm-border-muted); padding: 12px; background: var(--hm-bg-secondary); color: var(--hm-black);">Size</th>
              <th style="border: 1px solid var(--hm-border-muted); padding: 12px; background: var(--hm-bg-secondary); color: var(--hm-black);">Chest</th>
              <th style="border: 1px solid var(--hm-border-muted); padding: 12px; background: var(--hm-bg-secondary); color: var(--hm-black);">Waist</th>
              <th style="border: 1px solid var(--hm-border-muted); padding: 12px; background: var(--hm-bg-secondary); color: var(--hm-black);">Hip</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">XS</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">31-33 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">24-26 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">34-36 in</td></tr>
            <tr><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">S</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">34-36 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">27-29 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">37-39 in</td></tr>
            <tr><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">M</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">37-39 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">30-32 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">40-42 in</td></tr>
            <tr><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">L</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">40-42 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">33-35 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">43-45 in</td></tr>
            <tr><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">XL</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">43-46 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">36-39 in</td><td style="border: 1px solid var(--hm-border-muted); padding: 12px;">46-49 in</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    
    <div id="admin-auth-modal" class="modal-overlay d-none" role="dialog" aria-modal="true" aria-labelledby="admin-auth-title">
      <div class="modal" style="max-width:520px">
        <button class="modal-close" type="button" data-action="close-admin-auth" aria-label="Close">×</button>
        <h2 id="admin-auth-title" class="serif" style="margin:0 0 12px;font-size:34px">Uniform Control access</h2>
        <p id="admin-auth-copy" style="margin:0;color:var(--hm-muted-text);line-height:1.65">Checking your staff permissions…</p>
        <div style="margin-top:22px;display:flex;justify-content:flex-end"><button class="btn btn-small" type="button" data-action="close-admin-auth">Close</button></div>
      </div>
    </div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
  </div>

  <script>
    /* =========================================
       SKANDI UNIFORM SHOP JAVASCRIPT
       ========================================= */
    const SOURCE = "SKANDI_UNIFORM_EMPLOYEE";
    const PARENT = "SKANDI_WIX_PARENT";
    const EMBEDDED_REGULATIONS_PDF_BASE64 = "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgMTAgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjc1NiA4NDEuODg5OCBdIC9QYXJlbnQgOSAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNSAwIG9iago8PAovQ29udGVudHMgMTEgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjc1NiA4NDEuODg5OCBdIC9QYXJlbnQgOSAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNiAwIG9iago8PAovQ29udGVudHMgMTIgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjc1NiA4NDEuODg5OCBdIC9QYXJlbnQgOSAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNyAwIG9iago8PAovUGFnZU1vZGUgL1VzZU5vbmUgL1BhZ2VzIDkgMCBSIC9UeXBlIC9DYXRhbG9nCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9BdXRob3IgKFNLQU5ESSBUUkFWRUxTKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwOTA4MTIxMjMwKzAwJzAwJykgL0NyZWF0b3IgKFwodW5zcGVjaWZpZWRcKSkgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwOTA4MTIxMjMwKzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKFwodW5zcGVjaWZpZWRcKSkgL1RpdGxlIChTS0FOREkgVW5pZm9ybSBSZWd1bGF0aW9ucykgL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9Db3VudCAzIC9LaWRzIFsgNCAwIFIgNSAwIFIgNiAwIFIgXSAvVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjEwIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDIyNTcKPj4Kc3RyZWFtCkdhdTBEZ04pJSwmOk86U2xzJjspTCU2XlZPKUY+cWdxKCZLOShFQmZPRyY5MjxKJVNJUj05TW81YGQwKTkyVEleVCVHNGUvcD5SNDRVXT1XIz0jQmVTWltjdFNeOSRuPyNpKXNiZkw7cjVhLVErU1F1KThfJk9oWyIudHIiNCs/MCRfXzNzLVcqRVRnR1dCcTZMQEtmMixcMTNxTmxgQkwzNWNBbksnJzZoP2tiaC1ENzhwXmVpUC1uQ2NCLy5DT0hMcGsnNmtCOUFHPWw4YStXNjdAMCdiPmVkdF9VV0xGSFZxXyk9cU85W19dbUtfR2lENGQwSUltIi5IPy9jSm1HbE1McSpMOUhnKV5YV0FGLjdRSmZvKk5LTlJHR0AtPCY1JklYUis3aV8iYig6bkRNPXBKcTdmUTJgRTdcOFkiN250Z1sqNE5DaWhoOjBzKzpjOF5NPilCQFc7ampCIThHMSJmajFCImREdUpeYUZPTWRoXnBnVlIlP1lUKSZQNyU/RC0/UCtydHBoLD9dUjpAPUJ1dDVsUi5vR3U6YS41cU07Wz0wZm5JbGgibGNMNUZrbC1jXGcsR0xAIzgsXUprVTpPZ2dXODdHNzZFNzM5TlIyWygkZSlha0FNKSs2M2VeY0JSblUvQCIpPCRGUmNYTzwtTVFJRykhOktzPyouWy5ecVonLHIoQV0ySSUkUzIqIThlSVUzc1oiY25NZyRVK0RJNVNhSEpATSw7PkJQR1xIO2k0PWQ5LylaRjAzbWcnYi1BQ3E0MkhrTjdXcms0c0VaWTdEPixCZD40TExdbCJSY1oyQ1AoJnQ3YmcudUlRPl9ZZj9BWj1oXTo1L19nMCs+bl10TWQ6aG1HUSVjSz9DUmpISDVTWUplVz5tdTJFQmE2MyVSW15OQmtsViVYUzxVaGhXPkMzaHJtPnQ7SSg6LE5RcG9ka2VAWVFJSixDIksmVyYuZ15iRyg2WVJjMSEyTTY/Xi9iKjgvbm9kYGlUZkMvTTdqYXRIUE9DS0w9cGAlNC1WIS1iSFskaW1pLkJQISg0UVxYaVVuOURnMV9XVzZnX2dNXl02MWUlY15QZSJyPFlUbyc+XzFDSlohXC5vRDkyR0MqcE5EZi9uKmNHLEdrK0Y9MyJMOW47O3RZX1FfZD5CJTBYSFZHODVIWCxHVGg2Yl4qUWRQXUE+U2chRCJIc25VQFAqJFtPLmRBcEVSME90cl4/dEMjZ2daTjlyIUk/P0QoQUhTVHFMJ3I4OUBVaSQxV0k3YjV0MjJLVXJeJE1hM2RNa1FRK2I/UmxPS1ktUG09Wmg3S0hpLldEP1EmK3MxblFcTEppSyJoKT8uJkY0KGU1XkEwLnRCcj47TFZwJzE9UiU0VTJeYS9XZDdkYnFxOCpAL0VEZ1ZVZFwhJUs6M0FANGZUW289LTIoZ1IwSTIocEpeXTZLXWBWOG5oWVdsWF5dLmpaIkJTUSd0aFdpWzxHJlRpQ0ZbMixhM2JIcWBNO1dhdS9sYTU+SS9XMz11MUBHa0tTJ1lILmQ6YDZKa3FrNkZFdUkmKFJTJnVXM0hCdEFlSWs0V09jJ2k4SHRGPjpRLVN1PW1tRylFclk9WydRUWQvI09mLShXKkVGXHNzIV1yOGowUj0kYTY4S2xWMW4nWlA0QWBnRSNedVVCakgvbFQ7Zm10UCFeTyphRD44dVE1IUZZWC9rV1FpREg0OkwpdWRTWEdhNixJb1dQLFZScU1YUkdkbis6NW0mKkkmYkdlNz5YLSxuNz01USRAP0dyLmtXUDBvcDAhTCcnNTxOS2pLaSVxK1UnIVQ5KUsrRzVkN2haVWoyKixuVF1iVSVPJHAnTkU5Yz4yTD5bOWdmRilabWotO19CXFdCZzFaXi5ZYC51Z2VHLEAjQEs3Q286YCE8MDwnPTZIWFFpREI5TThMPSsoLTNDPGA9WDtXVi49PmduZjIxOTpbQipVI2BTM0ZdL1ZyV2JlQlQiKW8sayRaMnA6SUNKYG0lQmFbImNtYTJFQkM1ZWU2UU9Sclk8WTpSZ2JOL2U4JlluYlVQdCQjLVNAMkImTDZpZG88JEZzXG8maistRUY4YkdIKUQsJDRhVCNCXUUpL3A1W21lNkZIcnBPW19EYE5RZSZfRCU/NlU7dC5VPENqXF1QblFEYjZGRyJPMz5DSXMwaW8kOilZPl1TTi9pcF1pM0wudClUV0NVNCcxKmUnTkhdK2Q7J2lOQT5aVnJqQklicyJNTzQjRzk/Ll5Nb3FNSzc8S0QuZ1JeKyxFWms1LFxwI0U4NVdZSWlZPi5RRl9EQGcjJiJYKjU8MCdcME1SUkRwN2Y8NFZzUDZUMTxAV15MS1Y8OjY2STRaNF8hRXA6QjEjMj02ISgyZ2RrQE1SZ2o1M1xAODloREoiXU9UUEcyP2NgRkhQQylpc0wlLz1PSzkuWnEwazpIT0NiPCE0ZjNyS0AndUtsTC5nImJFOCteTzxrSTM8Ik9xajlqWExnS2ZPVVVPKEYkcnE2ZS5kNmspNEQ2UUFZKmJSR3NFUDcpKUk4dDBMKTdrNzpDaTQ7RDVkMC1ARFVZaHNpQ04sW1shOldrZSQ/MCJsPldaKTNnXiU7WlFYaWchZzg4XFIwQGBnVVsmZWQsTDI8bVNdPV86c1NUSWoyPDhZaVtsLFAwaVpaZi8sNlRkQVlnP3NhRkNLM3EjTVddP2ZZLWw2ZV06J1QvVkxCT09PPUoxZSNlPylfUFwwP1RyUj8qayhvPlpJLklEMyFiSUs3cDhkXW82QyNWImVBcjUnLkNAJkBKJ1tGQTRaPTs7KD5nclpXMjclYzdrbUdEZDZyJlFtRVIzQDc2VCIldSxXck8uciwrW21MQGotbU5rL11aa2M+VGQzOlpbblVtbydDaDQ3ZmNnLiUmWWVaNHJgWGFvLmZLL29Ub2slQVNJXSlTJUQzVT9PN2Q7RWZ1NC5BKlIyOCE1KGEwX0pnT2RqPDI6aXU0PEk5X0ZNfj5lbmRzdHJlYW0KZW5kb2JqCjExIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDIzNjcKPj4Kc3RyZWFtCkdhdG08PyRGYVcmOk8jTlFvRFVIYCtxR1g0cnQoQGQnTWhEZ1RaKixDYUJcNztOVTcybStFSnExUW9OJGR0LypgNj43SEMpVnFyRm1tbiVEcF9DQC49VFMjLCJiNDdDK0dzVThKTENnOz1DJmdiRm5ZMlIjZkc9WFI2Vj4uX29YKlchNUN0ZSUqXEU9aVFMZ0glSWVXRWtvcFNyPVpWOFkxbWszOSNSbEw1Yjs1WSZeTXBQYSwpLytbWVIlLSEhcitVUEBuRUY8TiRoT0QnJFokXSwrWk5MSkZoTzEvajxOSF88VTFCVEI1X3RyIS9pWT5lVHJYbyxfZThEYS5UOVhLRmE5XEdaTTE/WFdQaWpwUj5jMGIqOlcsZnFUMihEKkFjNTNOJyg/bCNPaktIQz0uVmEyNGlvO0UvV0VmPWRvRVA2PzNgbVxxOyhsKVBMPkktT18qIVhNSThXVGVFYDNwWkZoQV5xaFlqRXNJSElaLlIkX2hsKGBJcDUrVnRhbS82K0JJKSwvY14qblleW1g7NEJlZy5dLFhKQ1EkIWtEYU9KMkEqQkZjWGRCNWdvIm1eamZiMmpVLmEpbls4ZmYrWU4pM18sRzkhXCckZWctZkYyTFVyU25YSUo7SjlXTUstKjVCNygvbCwjQE5wKFtiaSRQY2dxLSMudE88L2JtKUwkQ0syOSlUalMsSEciZ2xfZmZeIjNYYkBKTiFTNyU0PVxhbjpJKllKaEUpa29pPl8xQkJgcXM5UEw0PzYsWHQuWlEjZzAnXU4kaCwnNSJqbFswT3MqM2lIVTUmM2hBYSJXVFZfMWhJcDFZRStYUjVwaUkpUFpdZiJsNF1hOWZmVE41KFIyZFtlMytnLWIiTiVWM0pAL3FAPS0vcVxWRyZxRTtOYjYoIystOGxbWDRVJk5RPExRUT5KVG5WOGVqQmQ6U1E9J0tPNGNQXWtOYFg2O11YQU8lVD5rcmI/JydUPitaMyZvVm9HKz9gOitSPnRvUCxSP2IsLF08TC86PDI6LlJbRFA/V1hrIl4kbS5ETSZZZCo2ImowKyFGLTlXPjsvMDcsQyQvXGBGSnRUPGMiJl1ZR2ljSixwMWRVNkhRdCRQIicrUEtaQWYzJ2VHXDYpaT5WbWFQcyM6SUFFVFUpM0c8PVFnRE0lKFZsbSJNUkNDbjtHQjxsQ1tSaT1NVVpgViZncUBkLD5mVE5rXmJ1Rk50ViZXTk05UlRcNkpuJ2BmNy5DM3M6J2YzV2U1YE1nLSNRN0AlP3M/cmU4RkYxQU5hX09XNj9xWU5KSlQrPEVCL3FXX2s9aC81OFpsKFtvZ2xBJURfU1tIPFBARXVwaCROaC4uIUwobjsoJTowOyFfPmktQmJGIjtOOCNHJltZXVdfSlYwbFZWUSRlXzx1dCptPTYxUVA+ZipFNClJWEYmQlJpWWoiQzNkPjtsXyQnWTZJLCRmSWQxYU83Oz5YS2FZOywpM0RXRFRSKjpfbVEqcjA0XUo4KHVGOSEiNHVka25CPmlKZGRONlNfWEAmS0ZdIjozJyVeb1dQQypYTkA8LGg0R1VLcjNuXCkwJHA9THJRYCtNampZTUVPImBlSS1AMUFGZ0k1U2hSOFgoajwvYWY5JzlhSCFJPmVcKlpqZj0+ZDluR0xBNUlDbDFoQnJbal5RY3ROSG5vcS1eTmNfM1I3OERsVnBUTSFLYSo0cSk1Tyk2dCY2PGdkaGZBI1pSKT9LRW9hMGw5QScoT0A3WU88ZWIsYihFXm4lczswM0E6ZzcqOzlpamdOWmM5U0ZMcHE1RmdATk8mI24zNGlaamVBcW9pYG4wcDlCPi1AQDxwTUYmPSY8WWBaJlAyMW5XRUtpbzVNVmVQNDNfZCReLVc3JFl0TT9FTEhHTUYsI1VMbFNjQUtub2BBXTsjYUwwRihma0BoV1hxRVlnJCVBby9QPihGSCpOIm9WWUwuK1ptVGpjbWNUUDcwKWVdPGZOaTIqbUVFXS8zXj5LKiZVRFkpYzpMT1VbN1RcNSNDU1RoXllNLyIjQD4iZFcoV2pIYDdPR2o0R3BqIj8hLlA3JlosU2U8Z2xUXHFab0ZKNm1GXGAwTWBBR2lKIyU6ZnRCQDVFJTtMNl9QcihBZGZdJkhsSCVjQzhTRFxhZDhRTiktcSonU1dWRiIsXDVXQCltSy9FViYiXCgzSypJbEBtPmYrXGArazVGdCVeMiRRK0ltMWQvXz5HTSptZ2ZPJiZUYXQoWW1mcnNHamsrKHRNcDduNzgnZWIkNFVOZmZcZz9zaHFCWFIvZ1tlMGc0KD81bHA9aCFYdVFVOCpWRFNjJkovZkRbJCZtQ2RDNXUiNzQhO0xlYkNBMnBTW3FFOydxXHBIYmc9M2s0cEZaOT47Vmg+RDNTOnFwaWMrclstPWVpczFOMzA5UUNcNkIkTmFkQWFlP0EqUExDRyEnRXJILmcrZTMmbVBdVypJbW9cNGJLY1JdS0dMMDVvVG91Wzc4ST5pRGdlWmdsUXA6WUJnaCpKNiI9cmpGXCYyPEoncFcpbEwmRSpmK1QlK2A8b05oJycqP1NgYUMlJG9JTnNcRUlIWj9rRlRlUTZjIzFiP0JwZSNrLy5LVyxzS3BPQmVtallPTENQdE9NWV0tLmknb0lLNGlDIk5jJ0AlcCtdPihuRT1lcE1dOWhsZHFVLDknYyxaaWZOSzlQL2I3OCsmMEw2PiVfXS4nKi1AT3Jvcm45VF90VDlWYmM6aDo7MkA3YmNCQCU1XjpJU0NvNzkkMUFaYDpFQz5kUzwubltZQ2MpblU9Qm9XOzBuOFBaW2JaNGhsZDZ0OUdFcyglSD9bajZOVGIwLlFWRFBVM1BALVktLUUkUlBBSjlMREF0Xl5MMkBDJCtbQk8rJUNVJyh0JTEyWSRiZ11GJUkzJiI1JSFyZGNdYGRgIWE5OHI+aF9SSWdnKm1BKUNpNDRtPTFINXBkO0UuNClkbUVlJC9LLWYtZDlVVUNlN1hsJF9AIiJWQzBQJioqI2tdRitGPG1vcWVuKSRjRCU6cGxUS2BnTT0qaS51IUNKaT0+cGA/TT9bWVtNaHJxQidiPVtcUlJzSVY8RmJwOWBcO21NZC5BIlBJN1NMSHFLQyw0KkQmInA+RzplTypDYXJ+PmVuZHN0cmVhbQplbmRvYmoKMTIgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTk5Ngo+PgpzdHJlYW0KR2F1MEQ/JCJeaCdSZl9aXDhRTEc9SHUtPG5FQGVjTFQrZF1SLlBmaCg+KVQiYWZeO1A6NElaOz8lIWkjZ2VndWdjXjpxP21HPDM4XFIsaWZhJXRXQi1YMz4+JGk5KnQ1ZiZOdC5nZVRyVXI8R2wwPFcjcEgra0ByX0BfKDBgI2heL2pQYS9PYEZSUCQzRjg8UE9iYFVrVTFyWnRqKE0sXVlyQE5ENnE1VmloJV5GPSVzR1E4TCxAai5WVlxocyEzOEQmOSwpWE1FJj5TIytTT2YvMW5xc1RZK0wzU0lDdSZzQFhlNC9yUExHaThSRU5PKy5xXGZCUl4hUVFcWD43bS00Jzk3cDo7OmBCLTkwJFxSXXJUOSdrRFlvY11eTWdSJnElMSJCVSwlbmJXKGJnb10talYuY0Q4PXM6bV8kQWEyYWAnU15AQSpbXilxSWJsbEluUl1sNFRSVmFsK01DSXQ7SCludUkscDZFLyUyJUYrTChyZyVzaWMkIiI/VkklVSU8MnNLTywhRjptNz5VcCNIV1otJCtpK2cuZk1wOHEqPFE8Nj5nYC46KnNfUCcoRS5ZMUpvUWs+N3Imay8rUVhSZylPZSYlMkJnWk9NVkFIYnVYVGRZc1ZxRSxzI0NFLk9qUk0nY1ZPLWI/UHNKT1kkXVpiOGJIXmZUM19GOi5laDAxbkokV0ZJKS8tNTBZKnJjNSkhSEhxLD8hYEtzaUdRN1tPI0dHP3JsLm5WUipwbSNTTURUU19LQWE1aFpHb2s7amtRSzNqRmFTZihPUUVgaTs/YChVLlkvOSEyODdLRCMqKDs3LFpKKms+aV5iLkA+UjU+VlozKzxuMUBnLipgNyhSYl02cFQxOSRZSyl1WXBdN1xyWDZabmpiXixOYnAuKERLSSRdXGsiSTRzQ1k1Uj84bzVfRkEhP10xNlhGUipRZ1VPNW4kNi91bV9oOXQ7bVRbJCE7NjhXZyckNGVVOkVnbnVvcihDNUpJJS43KmNmWkladWRvc3AxOi4mLGFmbio1aGpOQ2xbT1NpSzpmMlcnaGYkaXJxZ2hCXGAuXmc+L21RZSRcYWVWMG1sdWw4REFxISFHWENRPFkvJChSU1B0OC9aUjQ4XHArQEVZL1FddS5IZD9ALnVFVk9xNGQmMiIzX2oqbkAvbFsxIidncmo1NkIxPkhmVzNlO2pMOCQ9KFpybShFa1FiI2NJK0pbOVVGUSYxND41c0kkTXJSbGw3VEdgWyNlTl0sKXJ0SktJaSU+OTRHcCRcbmRjMU88RWtYZzU1VldSPUhFMVI8Z0phZW9BdGQ6RElbKEJzLTg+XSpQPVlqXDplJCRmTlMoQ1lVQ05EVixZYWphS28lXllqZ1tzJDY0cFU8USUnYUpSTSROMUktSEQkUzdhQFguNCRyO2ReRi8uMzJIWW9LQ187UTRyaCpRXWxQMHQwVzBZT08pJjBVUjFhdUlaITUhWSx1aGlVK1o5VFU6NiVxKDojW1ptJmxXTiRGKjxmNFEqKFYlUT0vMSZ0aWFuVGlDQ1U+aT5kPy5KITElPyhhOyhPTStNOVkjXiRbbVVqKUdNayhvVDtXU09TRkBvPmMoLUhicUZAM04qbWhnIU9kYnByaFs1ZmItKEFNPSpcN1YnP2kiNk9NRjFmWkYyYV1HNElzL1xDIUM1Y3U7aDslcTZdRWYnMEJiWGFYVzQwXCcwViIndCIiNidZSj0/QTInTy1YW2VeMzFtVXQndD5XRGdlWSQ9NiNASG8oSlkxdEtAZz5DNSlba00iMFB0b1dFQFpPb04oXFBNcmxASFdZWHJ1Z2VmUEYxL0QzJ2JoSkdCNz1AanFiK09BU0pqYjRTJz1NPzFUPUZma2VOPzxWWzFQREtZJFRMXEI7aSVZRVtPT1hMJTlTISpEPy4wLFdKI1w+ck0uW2xLRVI1UFcoQmw2VlRLTzFIZTxAclFAWk5BKSNTO0hKT2EoNSxCOWxRTEczK2BgZmRxKXM2NS9eVChLMWkqbk82clhbSjFYXWxrcTAlWj4lMys1UyFZbzRZUDw1KklGRThmJCdcKWBvRDMxInAxaVMiXD8wI0MjNURVIytFZCo6ME5oKCNaW0ZkS2hrM19wa1swLHNSb2QvaSZMIT1GJEJUbUNbck9rOUsnKGU5cGApLkciX2JHWD9lRVlbWG5xKiE9X2tXLjNXPkklK05rcTsjMVE9XE8nZmNAUURTPFRGOixQT2dFMiFuQENoJkY+Wl0yTjZHJkEmQjsyMVArb0wwViZkQmRwP1JlVl81P2AnR0JgPE5rXT82OjUkY1xGJSxcRTtEYCpDPzBfW2BxKF1ZY0FZQ2MtRXQiP0xNZ0hrKW80XihERUF1X1MndGxKZT1fVDpibFhLc0kuPl4jUT9bX1NrKHJGVmRjX2FDQmpMPGFZYCU0IVpyUyMvXTpGYzVfWkpwSHBIcGdwbFxhSDZAIUdjTUciZlQoI0huQCo1KjFnWT8vNjkkZlVaU005O1pgVDxhcCNnNS5kWkVqJ21LJ2dnWDZwU1lqcjY4Ui9xL0VsSCZzb2c0MDlqYk5vRC5KMCFBT2lnRmllJTVeWSRNMGRtWm5jcjNGVnVSSGU7T2o4by9EVzc0L3RNUVNFWVVOJVtKdWhGUy1HM285KiZ+PmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDEzCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMTAyIDAwMDAwIG4gCjAwMDAwMDAyMDkgMDAwMDAgbiAKMDAwMDAwMDMyMSAwMDAwMCBuIAowMDAwMDAwNTI1IDAwMDAwIG4gCjAwMDAwMDA3MjkgMDAwMDAgbiAKMDAwMDAwMDkzMyAwMDAwMCBuIAowMDAwMDAxMDAxIDAwMDAwIG4gCjAwMDAwMDEyOTUgMDAwMDAgbiAKMDAwMDAwMTM2NiAwMDAwMCBuIAowMDAwMDAzNzE1IDAwMDAwIG4gCjAwMDAwMDYxNzQgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8MDE4NjMyNDY1Mzc1YmZkNDM3NWU1ODUzMTY3OTk5OWI+PDAxODYzMjQ2NTM3NWJmZDQzNzVlNTg1MzE2Nzk5OTliPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyA4IDAgUgovUm9vdCA3IDAgUgovU2l6ZSAxMwo+PgpzdGFydHhyZWYKODI2MgolJUVPRgo=";
    
    let state = {
      profile: {},
      wallet: {},
      catalog: [],
      categories: [],
      orders: [],
      policy: null,
      cart: [],
      saved: [],
      activeCategory: "",
      activeFilters: { subCategory: "", size: "", sort: "recommended" },
      currentView: "home",
      activeProduct: null,
      activeSize: "",
      activeFit: "",
      activeImageIndex: 0,
      cardVariantByGroup: {},
      requestNote: "",
      lastOrderCode: "",
      lastOrderPoints: 0,
      policyAcknowledged: false,
      bootstrapReceived: false,
      lastSyncAt: ""
    };

    function post(type, payload={}) {
      window.parent.postMessage({ source: SOURCE, type: type, payload: payload || {} }, "*");
    }

    function arr(v) {
      return Array.isArray(v) ? v.map(x=>String(x).trim()).filter(Boolean) : String(v||"").split(",").map(x=>x.trim()).filter(Boolean);
    }
    
    function itemId(x) { return x.itemId || x._id; }
    function itemGallery(x) {
      var raw = Array.isArray(x.imageGallery) ? x.imageGallery : (Array.isArray(x.imageUrls) ? x.imageUrls : []);
      var urls = raw.map(function(entry) {
        if (typeof entry === "string") return entry;
        return entry && (entry.url || entry.imageUrl || entry.image_url);
      }).filter(Boolean);
      if (!urls.length && x.imageUrl) urls.push(x.imageUrl);
      return urls;
    }
    function itemImage(x) { return itemGallery(x)[0] || x.imageUrl || ""; }
    
    function setStatus(msg, mode="") {
      const e = document.getElementById("status-banner");
      e.textContent = msg || "";
      e.className = msg ? `status-banner show ${mode}` : "status-banner";
    }

    function byId(id) { return document.getElementById(id); }
    
    function formatPoints(value) {
      return Number(value || 0) + " points";
    }

    function escapeHtml(value) {
      return String(value || "").replace(/[&<>"']/g, function(character) {
        var map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
        return map[character];
      });
    }

    function getProductById(id) {
      return (state.catalog || []).find(x => itemId(x) === id);
    }

    function getBagCount() {
      return state.cart.reduce(function(total, item) { return total + (Number(item.quantity) || 1); }, 0);
    }

    function calculateTotalPoints() {
      return state.cart.reduce(function(total, item) {
        return total + (Number(item.pointsCost || 0) * (Number(item.quantity) || 1));
      }, 0);
    }

    function showToast(message) {
      var toast = byId("toast");
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(function() { toast.classList.remove("is-visible"); }, 2600);
    }

    function renderHeaderBadges() {
      document.querySelectorAll("[data-bag-count]").forEach(n => n.textContent = String(getBagCount()));
      document.querySelectorAll("[data-favorites-count]").forEach(n => n.textContent = String(state.saved.length));
      byId("orders-count").textContent = String((state.orders || []).length);
      
      byId("staff-name").textContent = state.profile?.displayName || state.profile?.skId || "Staff";
      var pts = formatPoints(state.wallet?.availablePoints || 0);
      byId("wallet-points").textContent = pts;
      const syncText = state.lastSyncAt
        ? ` · Synced ${new Date(state.lastSyncAt).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`
        : "";
      byId("promo-ticker").textContent =
        `You have ${pts} available for uniform requests.` +
        (state.policy?.policyVersion ? ` · Uniform Regulations ${state.policy.policyVersion}` : "") +
        syncText;

      document.querySelectorAll(".nav-item").forEach(function(node) {
        var cat = node.getAttribute("data-category");
        node.classList.toggle("is-active", (state.currentView === "plp" && cat === state.activeCategory) || (cat === "" && state.currentView === "plp" && !state.activeCategory));
      });
    }

    function renderNavFromCategories() {
      const cats = state.categories || [];
      const nav = byId("main-nav-rail");
      let html = `<button class="nav-item ${!state.activeCategory ? "is-active" : ""}" type="button" data-action="route-category" data-category="">All</button>`;
      
      if (cats.length) {
        cats.slice(0, 5).forEach(c => {
          let title = c.title || c.categoryKey;
          let active = state.activeCategory === title ? "is-active" : "";
          html += `<button class="nav-item ${active}" type="button" data-action="route-category" data-category="${escapeHtml(title)}">${escapeHtml(title)}</button>`;
        });
      }
      nav.innerHTML = html;
    }

    function navigate(view, payload) {
      if (payload && payload.category !== undefined) {
        state.activeCategory = payload.category;
        state.activeFilters = { subCategory: "", size: "", sort: "recommended" };
      }
      if (payload && payload.productId) {
        state.activeProduct = getProductById(payload.productId);
        const initialSizes = availableFamilySizes(state.activeProduct);
        state.activeSize = initialSizes[0] || "Standard";
        const initialFits = availableFamilyFits(state.activeProduct, state.activeSize);
        state.activeFit = initialFits[0] || "";
        state.activeProduct = resolveFamilyVariant(state.activeProduct, {
          size: state.activeSize,
          fit: state.activeFit,
          colorKey: variantColorKey(state.activeProduct)
        }) || state.activeProduct;
        state.activeImageIndex = 0;
      }

      state.currentView = view;
      document.querySelectorAll("[data-view]").forEach(s => s.classList.add("d-none"));
      
      var activeSection = byId("view-" + view);
      if (activeSection) activeSection.classList.remove("d-none");

      renderHeaderBadges();
      renderNavFromCategories();
      renderView(view);

      var targetHash = "#view-" + view;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ view: view }, "", targetHash);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderView(view) {
      if (view === "plp") renderPLP();
      if (view === "pdp") renderPDP();
      if (view === "bag") renderBag();
      if (view === "checkout") renderCheckout();
      if (view === "orders") renderOrders();
      if (view === "regulations") renderRegulations();
    }


    function skuParts(value) {
      return String(value || "").trim().toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
    }

    function erpData(p) {
      return (p && p.erp && typeof p.erp === "object")
        ? p.erp
        : ((p && p.payload && p.payload.erp && typeof p.payload.erp === "object") ? p.payload.erp : {});
    }

    function productIdentityKey(p) {
      const erp = erpData(p);
      const variantTokens = new Set([
        ...skuParts(p?.colorName),
        ...arr(p?.sizes).flatMap(skuParts),
        ...arr(p?.fitOptions).flatMap(skuParts),
        ...skuParts(erp.supplierColor),
        ...skuParts(erp.supplierSize)
      ]);
      const baseTitle = skuParts(p?.title).filter(part => !variantTokens.has(part)).join("-");
      return [
        baseTitle,
        String(p?.category || p?.categoryKey || "").trim().toUpperCase(),
        String(p?.subCategory || "").trim().toUpperCase(),
        String(erp.genderFit || "").trim().toUpperCase(),
        String(erp.program || "").trim().toUpperCase(),
        String(erp.collection || "").trim().toUpperCase()
      ].join("|");
    }

    function meaningfulSkuPrefix(parts) {
      if(parts.length >= 2) return true;
      return parts.length === 1 && String(parts[0] || "").length >= 5;
    }

    function inferredSkuFamilyKey(p) {
      const sku = String(p?.itemCode || "").trim().toUpperCase();
      const style = String(p?.styleGroup || "").trim().toUpperCase();

      if(style && style !== sku) return `STYLE:${style}`;

      const erp = erpData(p);
      const supplierStyle = String(erp.supplierStyle || erp.style || "").trim().toUpperCase();
      if(supplierStyle && supplierStyle !== sku) return `SUPPLIER:${supplierStyle}`;

      if(!sku) return `ITEM:${String(itemId(p) || "").toUpperCase()}`;

      const parts = skuParts(sku);
      const identity = productIdentityKey(p);
      const peers = (state.catalog || []).filter(peer =>
        peer !== p &&
        peer?.itemCode &&
        productIdentityKey(peer) === identity
      );

      // Common delimited SKU stem.
      if(parts.length >= 2) {
        let family = parts;
        const maxTrim = Math.min(3, parts.length - 1);
        for(let trim = 1; trim <= maxTrim; trim += 1) {
          const prefix = parts.slice(0, parts.length - trim);
          if(!meaningfulSkuPrefix(prefix)) continue;

          const hasSibling = peers.some(peer => {
            const peerParts = skuParts(peer.itemCode);
            return peerParts.length > prefix.length &&
              prefix.every((part, index) => peerParts[index] === part);
          });

          if(hasSibling) family = prefix;
        }
        if(family.length < parts.length) return `SKU:${family.join("-")}`;
      }

      // Meaningful repeated token anywhere in the SKU.
      const generic = new Set(["SK", "SKU", "UNIFORM", "ITEM", "PRODUCT", "STYLE"]);
      const sharedTokens = parts
        .filter(part => !generic.has(part) && (part.length >= 4 || /\d/.test(part)))
        .filter(part => peers.some(peer => skuParts(peer.itemCode).includes(part)))
        .sort((a,b) => b.length - a.length || a.localeCompare(b));
      if(sharedTokens.length) return `SKU-TOKEN:${sharedTokens[0]}`;

      // Compact/non-delimited SKU family fallback.
      const compactSku = sku.replace(/[^A-Z0-9]/g, "");
      let bestPrefix = "";
      peers.forEach(peer => {
        const peerSku = String(peer.itemCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
        let i = 0;
        while(i < compactSku.length && i < peerSku.length && compactSku[i] === peerSku[i]) i += 1;
        const prefix = compactSku.slice(0, i);
        if(prefix.length >= 5 && prefix.length > bestPrefix.length) bestPrefix = prefix;
      });
      if(bestPrefix) return `SKU-PREFIX:${bestPrefix}`;

      return `SKU:${sku}`;
    }

    function productGroupKey(p) {
      return String(p?.shopGroupKey || inferredSkuFamilyKey(p) || p?.styleGroup || p?.itemCode || itemId(p) || "").toUpperCase();
    }

    function productVariants(p) {
      const key = productGroupKey(p);
      return (state.catalog || [])
        .filter(x => productGroupKey(x) === key)
        .sort((a,b) => String(a.itemCode||"").localeCompare(String(b.itemCode||"")));
    }

    function variantColorKey(v) {
      const name = String(v?.colorName || "").trim().toLowerCase();
      const hex = String(v?.colorHex || "").trim().toUpperCase();
      return name || hex ? `${name}|${hex}` : "";
    }

    function sameVariantColor(a, b) {
      const aKey = variantColorKey(a);
      const bKey = variantColorKey(b);
      if(!aKey && !bKey) return true;
      return aKey === bKey;
    }

    function uniqueOptions(values) {
      const seen = new Set();
      return values.filter(value => {
        const key = String(value || "").trim().toLowerCase();
        if(!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    function availableFamilySizes(p, fitValue="") {
      if(!p) return [];
      const family = productVariants(p).filter(v => sameVariantColor(v, p));
      const fitKey = String(fitValue || "").trim().toLowerCase();
      const candidates = fitKey
        ? family.filter(v => {
            const fits = arr(v.fitOptions).map(x => x.toLowerCase());
            return !fits.length || fits.includes(fitKey);
          })
        : family;
      return uniqueOptions(candidates.flatMap(v => arr(v.sizes)));
    }

    function availableFamilyFits(p, sizeValue="") {
      if(!p) return [];
      const family = productVariants(p).filter(v => sameVariantColor(v, p));
      const sizeKey = String(sizeValue || "").trim().toLowerCase();
      const candidates = sizeKey
        ? family.filter(v => {
            const sizes = arr(v.sizes).map(x => x.toLowerCase());
            return !sizes.length || sizes.includes(sizeKey);
          })
        : family;
      return uniqueOptions(candidates.flatMap(v => arr(v.fitOptions)));
    }

    function resolveFamilyVariant(p, { size="", fit="", colorKey="" } = {}) {
      if(!p) return null;
      let candidates = productVariants(p);
      const wantedColor = colorKey || variantColorKey(p);
      if(wantedColor) {
        const sameColor = candidates.filter(v => variantColorKey(v) === wantedColor);
        if(sameColor.length) candidates = sameColor;
      }

      const sizeKey = String(size || "").trim().toLowerCase();
      if(sizeKey && sizeKey !== "standard") {
        const sized = candidates.filter(v => {
          const sizes = arr(v.sizes).map(x => x.toLowerCase());
          return !sizes.length || sizes.includes(sizeKey);
        });
        if(sized.length) candidates = sized;
      }

      const fitKey = String(fit || "").trim().toLowerCase();
      if(fitKey) {
        const fitted = candidates.filter(v => {
          const fits = arr(v.fitOptions).map(x => x.toLowerCase());
          return !fits.length || fits.includes(fitKey);
        });
        if(fitted.length) candidates = fitted;
      }

      return candidates.find(v => itemId(v) === itemId(p)) || candidates[0] || p;
    }

    function coloredVariants(p) {
      const groups = new Map();
      productVariants(p).forEach(v => {
        const key = variantColorKey(v);
        if(!key || !v.colorName || !v.colorHex) return;
        if(!groups.has(key)) groups.set(key, []);
        groups.get(key).push(v);
      });

      return Array.from(groups.values()).map(group => {
        const preferred = group.find(v => {
          const sizes = arr(v.sizes);
          const fits = arr(v.fitOptions);
          const sizeOk = !state.activeSize || state.activeSize === "Standard" || !sizes.length || sizes.includes(state.activeSize);
          const fitOk = !state.activeFit || !fits.length || fits.includes(state.activeFit);
          return sizeOk && fitOk;
        });
        return preferred || group[0];
      });
    }

    function selectedProductForGroup(p, allowedGroup=[]) {
      const key = productGroupKey(p);
      const selectedId = state.cardVariantByGroup[key];
      const selected = selectedId ? getProductById(selectedId) : null;
      if(selected && (!allowedGroup.length || allowedGroup.some(item => itemId(item) === itemId(selected)))) return selected;
      return allowedGroup[0] || p;
    }

    function getFilteredProducts() {
      let items = (state.catalog || []).filter(x => x.active !== false && x.stockStatus !== "HIDDEN");
      
      if (state.activeCategory && state.activeCategory !== "Favorites") {
        items = items.filter(x => 
          String(x.category||"").toLowerCase().includes(state.activeCategory.toLowerCase()) || 
          [x.title, x.itemCode, x.description, arr(x.tags).join(" ")].join(" ").toLowerCase().includes(state.activeCategory.toLowerCase())
        );
      } else if (state.activeCategory === "Favorites") {
        items = items.filter(x => state.saved.includes(itemId(x)));
      }

      if (state.activeFilters.subCategory) {
        items = items.filter(x => String(x.subCategory || "").toLowerCase() === state.activeFilters.subCategory.toLowerCase());
      }

      if (state.activeFilters.size) {
        items = items.filter(x => arr(x.sizes).includes(state.activeFilters.size));
      }

      const grouped = new Map();
      items.forEach(function(p){
        const key = productGroupKey(p);
        if(!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(p);
      });

      items = Array.from(grouped.values()).map(function(group){
        const base = group[0];
        return selectedProductForGroup(base, group);
      });

      const sort = state.activeFilters.sort;
      if (sort === "pointsAsc") items.sort((a,b) => Number(a.pointsCost||0) - Number(b.pointsCost||0));
      if (sort === "pointsDesc") items.sort((a,b) => Number(b.pointsCost||0) - Number(a.pointsCost||0));
      if (sort === "newest") items.reverse();

      return items;
    }

    function getCategoryTitle() {
      if (state.activeCategory === "Favorites") return "Saved Items";
      return state.activeCategory || "All Uniform Items";
    }

    function renderPLP() {
      var root = byId("plp-root");
      var products = getFilteredProducts();

      root.innerHTML =
        '<div class="plp-header">' +
          '<div>' +
            '<h1 class="plp-title serif">' + escapeHtml(getCategoryTitle()) + '</h1>' +
            '<p class="plp-count">' + products.length + ' approved items available</p>' +
          '</div>' +
          '<button class="btn btn-light btn-small" type="button" data-action="reset-filters">Clear Filters</button>' +
        '</div>' +
        '<div class="toolbar" aria-label="Product filters">' +
          '<div>' +
            '<label for="filter-subcategory">Sub Category</label>' +
            '<select id="filter-subcategory" data-filter="subCategory">' +
              '<option value="">All Sub Categories</option>' +
              [...new Set((state.catalog || []).map(x => x.subCategory).filter(Boolean))].sort().map(function(v){ return '<option value="' + escapeHtml(v) + '"' + (state.activeFilters.subCategory === v ? ' selected' : '') + '>' + escapeHtml(v) + '</option>'; }).join("") +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label for="filter-size">Filter by Size</label>' +
            '<select id="filter-size" data-filter="size">' +
              '<option value="">All Sizes</option>' +
              '<option value="XS"' + (state.activeFilters.size === "XS" ? " selected" : "") + '>XS</option>' +
              '<option value="S"' + (state.activeFilters.size === "S" ? " selected" : "") + '>S</option>' +
              '<option value="M"' + (state.activeFilters.size === "M" ? " selected" : "") + '>M</option>' +
              '<option value="L"' + (state.activeFilters.size === "L" ? " selected" : "") + '>L</option>' +
              '<option value="XL"' + (state.activeFilters.size === "XL" ? " selected" : "") + '>XL</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label for="filter-sort">Sort By</label>' +
            '<select id="filter-sort" data-filter="sort">' +
              '<option value="recommended"' + (state.activeFilters.sort === "recommended" ? " selected" : "") + '>Recommended</option>' +
              '<option value="newest"' + (state.activeFilters.sort === "newest" ? " selected" : "") + '>New Arrivals</option>' +
              '<option value="pointsAsc"' + (state.activeFilters.sort === "pointsAsc" ? " selected" : "") + '>Points: Low to High</option>' +
              '<option value="pointsDesc"' + (state.activeFilters.sort === "pointsDesc" ? " selected" : "") + '>Points: High to Low</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        renderProductGrid(products);
    }

    function renderProductGrid(products) {
      if (products.length === 0) {
        return '<div class="empty-state"><h2 class="serif">No pieces found</h2><p>Try clearing filters or checking other categories.</p></div>';
      }
      var html = '<div class="product-grid">';
      products.forEach(function(p) {
        var id = itemId(p);
        var isFav = state.saved.includes(id);
        var imgUrl = itemImage(p);
        
        var imgTag = imgUrl ? `<img class="product-card-image" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.title)}">` : `<div class="fallback-img" style="width:100%;height:100%;background:#eef2f7;display:flex;align-items:center;justify-content:center;font-weight:900;color:#94a3b8;font-size:14px;">SKANDI</div>`;
        var saleTag = p.stockStatus === "LOW_STOCK" ? '<span class="sale-tag" style="background:#b45309;">Low Stock</span>' : (p.stockStatus === "OUT_OF_STOCK" ? '<span class="sale-tag" style="background:#b42318;">Out of Stock</span>' : "");

        html +=
          '<article class="product-card" tabindex="0" data-action="open-product" data-product-id="' + escapeHtml(id) + '" aria-label="Open ' + escapeHtml(p.title) + '">' +
            '<div class="product-media">' +
              saleTag +
              '<button class="favorite-btn' + (isFav ? " is-favorite" : "") + '" type="button" data-action="toggle-favorite" data-product-id="' + escapeHtml(id) + '">♥</button>' +
              imgTag +
            '</div>' +
            '<div class="product-info">' +
              '<h2 class="product-title">' + escapeHtml(p.title) + '</h2>' +
              '<p class="product-price">' + formatPoints(p.pointsCost) + '</p>' +
              '<p class="product-rating">' + escapeHtml(p.category || "Uniform") + (p.subCategory ? ` / ${escapeHtml(p.subCategory)}` : "") + (p.itemCode ? ` · ${escapeHtml(p.itemCode)}` : "") + '</p>' +
              (function(){
                const variants=coloredVariants(p);
                if(variants.length<=1) return "";
                return '<div class="swatch-row">' +
                  variants.map(function(v){
                    return '<button class="swatch ' + (itemId(v)===id?'is-active':'') + '" type="button" data-action="select-card-color" data-product-id="' + escapeHtml(itemId(v)) + '" title="' + escapeHtml(v.colorName) + '" aria-label="' + escapeHtml(v.colorName) + '" style="background-color:' + escapeHtml(v.colorHex) + ';"></button>';
                  }).join("") +
                '</div><div class="swatch-label">' + escapeHtml(p.colorName || "") + '</div>';
              })() +
            '</div>' +
          '</article>';
      });
      html += '</div>';
      return html;
    }

    function renderPDP() {
      var p = state.activeProduct;
      if (!p) { navigate("home"); return; }

      var sizes = availableFamilySizes(p, state.activeFit);
      if(!sizes.length) sizes = ["Standard"];
      if(!state.activeSize || !sizes.includes(state.activeSize)) state.activeSize = sizes[0];

      var fits = availableFamilyFits(p, state.activeSize);
      if(fits.length && !fits.includes(state.activeFit)) state.activeFit = fits[0];
      if(!fits.length) state.activeFit = "";

      var resolvedVariant = resolveFamilyVariant(p, {
        size: state.activeSize,
        fit: state.activeFit,
        colorKey: variantColorKey(p)
      });
      if(resolvedVariant) {
        p = resolvedVariant;
        state.activeProduct = resolvedVariant;
      }

      // Recalculate selectors against the resolved SKU so every option shown is available
      // within the selected color family.
      sizes = availableFamilySizes(p, state.activeFit);
      if(!sizes.length) sizes = ["Standard"];
      if(!sizes.includes(state.activeSize)) state.activeSize = sizes[0];
      fits = availableFamilyFits(p, state.activeSize);
      if(fits.length && !fits.includes(state.activeFit)) state.activeFit = fits[0];
      if(!fits.length) state.activeFit = "";

      var finalVariant = resolveFamilyVariant(p, {
        size: state.activeSize,
        fit: state.activeFit,
        colorKey: variantColorKey(p)
      });
      if(finalVariant) {
        p = finalVariant;
        state.activeProduct = finalVariant;
      }

      var gallery = itemGallery(p);
      if(state.activeImageIndex >= gallery.length) state.activeImageIndex = 0;
      var activeImage = gallery[state.activeImageIndex] || "";

      var galleryHtml =
        '<div>' +
          '<div class="pdp-gallery-main">' +
            (activeImage
              ? '<img src="' + escapeHtml(activeImage) + '" alt="' + escapeHtml(p.title) + '">'
              : '<div style="font-size:24px;font-weight:900;color:#94a3b8;">SKANDI</div>') +
          '</div>' +
          (gallery.length > 1
            ? '<div class="pdp-thumbnails">' +
                gallery.map(function(imgUrl,index){
                  return '<button class="pdp-thumb ' + (index===state.activeImageIndex?'is-active':'') + '" type="button" data-action="select-pdp-image" data-image-index="' + index + '"><img src="' + escapeHtml(imgUrl) + '" alt="' + escapeHtml(p.title) + ' image ' + (index+1) + '"></button>';
                }).join("") +
              '</div>'
            : '') +
        '</div>';

      var sizeButtons = sizes.map(s =>
        '<button class="size-option ' + (state.activeSize === s ? "is-active" : "") + '" type="button" data-action="select-pdp-size" data-size="' + escapeHtml(s) + '">' + escapeHtml(s) + '</button>'
      ).join("");

      var fitHtml = fits.length
        ? '<div class="selector-block">' +
            '<div class="selector-label">Fit <span class="selected-meta">' + escapeHtml(state.activeFit || "") + '</span></div>' +
            '<div class="size-grid">' +
              fits.map(function(f){
                return '<button class="size-option ' + (state.activeFit===f?'is-active':'') + '" type="button" data-action="select-pdp-fit" data-fit="' + escapeHtml(f) + '">' + escapeHtml(f) + '</button>';
              }).join("") +
            '</div>' +
          '</div>'
        : "";

      var variants = coloredVariants(p);
      var colorHtml = variants.length > 1
        ? '<div class="selector-block">' +
            '<div class="selector-label">Color <span class="selected-meta">' + escapeHtml(p.colorName || "") + '</span></div>' +
            '<div class="variant-selector">' +
              variants.map(function(v){
                return '<button class="variant-color-button ' + (variantColorKey(v)===variantColorKey(p)?'is-active':'') + '" type="button" data-action="select-pdp-color" data-product-id="' + escapeHtml(itemId(v)) + '" title="' + escapeHtml(v.colorName) + '" aria-label="' + escapeHtml(v.colorName) + '" style="background:' + escapeHtml(v.colorHex) + '"></button>';
              }).join("") +
            '</div>' +
          '</div>'
        : "";

      var replacementDisabled = p.replacementEligible === false;
      var replacementText = p.replacementPending
        ? "REQUEST IN PROGRESS"
        : (p.replacementNextEligibleAt
            ? "REPLACEMENT AVAILABLE " + new Date(p.replacementNextEligibleAt).toLocaleDateString()
            : "REPLACEMENT NOT YET AVAILABLE");

      byId("pdp-root").innerHTML =
        '<div class="pdp-layout">' +
          '<div>' + galleryHtml + '</div>' +
          '<aside class="pdp-panel" aria-label="Product purchase panel">' +
            '<div class="breadcrumb">' +
              '<button type="button" data-action="route-category" data-category="' + escapeHtml(p.category) + '">' + escapeHtml(p.category || "Catalog") + '</button>' +
              (p.subCategory ? ' / <button type="button" data-action="route-subcategory" data-subcategory="' + escapeHtml(p.subCategory) + '">' + escapeHtml(p.subCategory) + '</button>' : '') +
              ' / <span>' + escapeHtml(p.itemCode || "") + '</span>' +
            '</div>' +
            '<h1 class="pdp-title serif">' + escapeHtml(p.title) + '</h1>' +
            '<p class="pdp-price">' + formatPoints(p.pointsCost) + '</p>' +
            '<div class="pdp-review">' +
              (p.colorName ? escapeHtml(p.colorName) + ' · ' : '') +
              (p.stockStatus === "LOW_STOCK" ? '<span style="color:#b45309;font-weight:800;">Low Stock</span>' : (p.stockStatus === "OUT_OF_STOCK" ? '<span style="color:#b42318;font-weight:800;">Out of Stock</span>' : 'In Stock')) +
            '</div>' +

            colorHtml +

            '<div class="selector-block">' +
              '<div class="selector-label">Size <button class="size-guide-link" type="button" data-action="open-size-guide">Size Guide</button></div>' +
              '<div class="size-grid">' + sizeButtons + '</div>' +
              '<p id="pdp-message" class="pdp-message"></p>' +
            '</div>' +

            fitHtml +

            (p.itemRegulations ? '<div class="item-regulation-callout"><strong>ITEM UNIFORM REGULATION</strong>' + escapeHtml(p.itemRegulations) + '</div>' : '') +

            '<button class="btn btn-full' + ((p.stockStatus === "OUT_OF_STOCK" || replacementDisabled) ? ' btn-disabled' : '') + '" type="button" data-action="add-to-bag"' + ((p.stockStatus === "OUT_OF_STOCK" || replacementDisabled) ? ' disabled' : '') + '>' +
              (p.stockStatus === "OUT_OF_STOCK" ? 'OUT OF STOCK' : (replacementDisabled ? escapeHtml(replacementText) : 'ADD TO REQUEST BAG')) +
            '</button>' +

            '<div class="accordion">' +
              '<div class="accordion-item is-open">' +
                '<button class="accordion-header" type="button" data-action="toggle-accordion">Description <span>+</span></button>' +
                '<div class="accordion-body"><p>' + escapeHtml(p.description || "Approved SKANDI uniform item.") + '</p></div>' +
              '</div>' +
              '<div class="accordion-item">' +
                '<button class="accordion-header" type="button" data-action="toggle-accordion">Details <span>+</span></button>' +
                '<div class="accordion-body"><p>' + escapeHtml(p.details || "No additional product details have been added.") + '</p></div>' +
              '</div>' +
              '<div class="accordion-item">' +
                '<button class="accordion-header" type="button" data-action="toggle-accordion">Care Instructions <span>+</span></button>' +
                '<div class="accordion-body"><p>' + escapeHtml(p.careInstructions || "Follow the care label attached to the garment.") + '</p></div>' +
              '</div>' +
              '<div class="accordion-item">' +
                '<button class="accordion-header" type="button" data-action="toggle-accordion">Issue & Replacement <span>+</span></button>' +
                '<div class="accordion-body"><div class="issue-cycle-grid">' +
                  '<div class="issue-cycle-card"><strong>Initial Issue</strong><span>' + (Number(p.initialIssueQuantity||0) ? escapeHtml(String(p.initialIssueQuantity)) + ' in starting pack' : 'Not configured') + '</span></div>' +
                  '<div class="issue-cycle-card"><strong>Replacement Cycle</strong><span>' + (Number(p.replacementCycleMonths||0) ? escapeHtml(String(p.replacementCycleMonths)) + ' months' : 'No cycle configured') + '</span></div>' +
                '</div>' +
                (p.replacementMessage ? '<p style="margin-top:12px;font-weight:800;color:#b42318;">' + escapeHtml(p.replacementMessage) + '</p>' : '') +
                '</div>' +
              '</div>' +
              '<div class="accordion-item">' +
                '<button class="accordion-header" type="button" data-action="toggle-accordion">Item Uniform Regulations <span>+</span></button>' +
                '<div class="accordion-body"><p>' + escapeHtml(p.itemRegulations || "No additional item-specific regulation. The general SKANDI Uniform Regulations apply.") + '</p></div>' +
              '</div>' +
              '<div class="accordion-item">' +
                '<button class="accordion-header" type="button" data-action="toggle-accordion">Eligibility <span>+</span></button>' +
                '<div class="accordion-body"><div class="eligibility-grid">' +
                  '<div class="eligibility-chip"><strong>Role</strong><span>' + escapeHtml(arr(p.availableRoles).join(", ") || "ALL") + '</span></div>' +
                  '<div class="eligibility-chip"><strong>Department</strong><span>' + escapeHtml(arr(p.availableDepartments).join(", ") || "ALL") + '</span></div>' +
                  '<div class="eligibility-chip"><strong>Base</strong><span>' + escapeHtml(arr(p.availableBases).join(", ") || "ALL") + '</span></div>' +
                '</div></div>' +
              '</div>' +
              '<div class="accordion-item">' +
                '<button class="accordion-header" type="button" data-action="toggle-accordion">Uniform Regulations <span>+</span></button>' +
                '<div class="accordion-body">' +
                  '<p>' + escapeHtml(state.policy?.title || "SKANDI Uniform Regulations") + ' · Version ' + escapeHtml(state.policy?.policyVersion || "Current") + '</p>' +
                  '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">' +
                    '<button class="btn btn-light btn-small" type="button" data-action="route-regulations">READ FULL REGULATIONS</button>' +
                    '<button class="btn btn-light btn-small" type="button" data-action="download-regulations">DOWNLOAD PDF</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</aside>' +
        '</div>';
    }

    function addToBag() {
      var p = resolveFamilyVariant(state.activeProduct, {
        size: state.activeSize,
        fit: state.activeFit,
        colorKey: variantColorKey(state.activeProduct)
      }) || state.activeProduct;
      state.activeProduct = p;
      if(!p || !state.activeSize || p.stockStatus === "OUT_OF_STOCK" || p.replacementEligible === false) return;
      if(availableFamilyFits(p, state.activeSize).length && !state.activeFit) return;
      var id = itemId(p);
      var existing = state.cart.find(x => x.itemId === id && x.size === state.activeSize && x.fit === state.activeFit);
      
      if(existing) existing.quantity += 1;
      else {
        state.cart.push({
          itemId: id, title: p.title, itemCode: p.itemCode, category: p.category,
          styleGroup: p.styleGroup || p.itemCode, colorName: p.colorName || "",
          size: state.activeSize, fit: state.activeFit || "", quantity: 1,
          pointsCost: Number(p.pointsCost || 0), imageUrl: itemImage(p)
        });
      }
      
      renderHeaderBadges();
      var msg = byId("pdp-message");
      if(msg) { msg.style.color = "var(--hm-success)"; msg.textContent = "Added to uniform request."; }
      showToast(p.title + " added to bag");
    }

    function renderBag() {
      var root = byId("bag-root");
      var totalPts = calculateTotalPoints();
      
      if (state.cart.length === 0) {
        root.innerHTML =
          '<div style="padding: 44px 0 82px;">' +
            '<h1 class="page-heading serif">Request Bag</h1>' +
            '<div class="empty-state"><h2 class="serif">Your bag is empty</h2><p>Add approved uniform items to submit a request.</p><button class="btn" type="button" data-action="route-category" data-category="">CONTINUE SHOPPING</button></div>' +
          '</div>';
        return;
      }

      var itemsHtml = "";
      state.cart.forEach(function(item, index) {
        var imgUrl = item.imageUrl;
        var imgHtml = imgUrl ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.title)}">` : `<div class="fallback-img">SKANDI</div>`;
        itemsHtml +=
          '<article class="bag-line">' +
            imgHtml +
            '<div>' +
              '<h2 class="bag-line-title serif">' + escapeHtml(item.title) + '</h2>' +
              '<p class="bag-line-meta">Code: ' + escapeHtml(item.itemCode || "") + '</p>' +
              (item.colorName ? '<p class="bag-line-meta">Color: ' + escapeHtml(item.colorName) + '</p>' : '') +
              '<p class="bag-line-meta">Size: ' + escapeHtml(item.size) + '</p>' +
              (item.fit ? '<p class="bag-line-meta">Fit: ' + escapeHtml(item.fit) + '</p>' : '') +
              '<p class="bag-line-price">' + formatPoints(item.pointsCost) + ' each</p>' +
              '<div class="quantity-row">' +
                '<button class="qty-btn" type="button" data-action="decrement-cart" data-cart-index="' + index + '">−</button>' +
                '<span class="qty-value">' + item.quantity + '</span>' +
                '<button class="qty-btn" type="button" data-action="increment-cart" data-cart-index="' + index + '">+</button>' +
                '<button class="trash-btn" type="button" data-action="remove-cart" data-cart-index="' + index + '">🗑</button>' +
              '</div>' +
            '</div>' +
          '</article>';
      });

      root.innerHTML =
        '<div class="bag-layout">' +
          '<section>' +
            '<h1 class="page-heading serif">Request Bag</h1>' +
            '<div class="bag-items">' + itemsHtml + '</div>' +
          '</section>' +
          '<aside class="summary-card">' +
            '<h2 class="summary-title serif">Request Summary</h2>' +
            '<div class="summary-row"><span>Available Points</span><strong>' + formatPoints(state.wallet?.availablePoints || 0) + '</strong></div>' +
            '<div class="summary-row summary-total" style="border-top:1px solid var(--hm-border-muted);"><span>Total Cost</span><strong>' + formatPoints(totalPts) + '</strong></div>' +
            '<p class="shipping-note">Points will be held upon submission pending Uniform Control approval.</p>' +
            '<button class="btn btn-full" type="button" data-action="route-checkout">PROCEED TO SUBMIT</button>' +
          '</aside>' +
        '</div>';
    }

    function renderCheckout() {
      var root = byId("checkout-root");
      var totalPts = calculateTotalPoints();

      if (state.lastOrderCode && state.cart.length === 0) {
        root.innerHTML =
          '<div style="padding: 44px 0 82px;">' +
            '<div class="success-panel">' +
              '<div class="success-icon">✓</div>' +
              '<h2 class="serif">Request Submitted</h2>' +
              '<p>Your uniform request has been successfully sent to Uniform Control.</p>' +
              '<p><strong>Total points reserved:</strong> ' + formatPoints(state.lastOrderPoints) + '</p>' +
              '<button class="btn" type="button" data-action="route-home" style="margin-top:20px;">RETURN TO PORTAL</button>' +
            '</div>' +
          '</div>';
        return;
      }

      if (state.cart.length === 0) {
        navigate("bag"); return;
      }

      root.innerHTML =
        '<div class="checkout-layout">' +
          '<section>' +
            '<h1 class="page-heading serif">Submit Request</h1>' +
            '<div class="checkout-accordion">' +
              '<article class="checkout-step is-open">' +
                '<button class="checkout-step-header" type="button" style="cursor:default;">' +
                  '<span>Step 1: Request Details</span>' +
                '</button>' +
                '<div class="checkout-step-body" style="max-height:760px; padding:20px;">' +
                  '<div class="form-grid">' +
                    '<div class="form-field form-field-full">' +
                      '<label>Employee Name</label>' +
                      '<input type="text" readonly disabled value="' + escapeHtml(state.profile?.displayName || state.profile?.skId || "Staff") + '">' +
                    '</div>' +
                    '<div class="form-field form-field-full">' +
                      '<label for="req-note">Note for Uniform Control (Optional)</label>' +
                      '<textarea id="req-note" rows="3" placeholder="Add any necessary sizing notes or duty details here...">' + escapeHtml(state.requestNote) + '</textarea>' +
                    '</div>' +
                  '</div>' +
                  '<p id="submit-error" class="form-error"></p>' +
                  '<button class="btn" type="button" data-action="submit-order" style="margin-top:16px;">CONFIRM & SUBMIT (' + formatPoints(totalPts) + ')</button>' +
                '</div>' +
              '</article>' +
            '</div>' +
          '</section>' +
          '<aside class="summary-card">' +
            '<h2 class="summary-title serif">Request Summary</h2>' +
            '<div class="summary-row"><span>Items</span><strong>' + getBagCount() + '</strong></div>' +
            '<div class="summary-row summary-total"><span>Total Cost</span><strong>' + formatPoints(totalPts) + '</strong></div>' +
            '<p class="shipping-note">Review your selections carefully. Once approved by Uniform Control, items will be dispatched to your base station.</p>' +
          '</aside>' +
        '</div>';
    }
    
    function renderPolicyBody(body) {
      const raw = String(body || "").trim();
      if(!raw) return '<p>No Uniform Regulations have been published yet.</p>';

      const lines = raw.split(/\r?\n/);
      let html = "";
      let listOpen = false;

      function closeList(){
        if(listOpen){ html += "</ul>"; listOpen = false; }
      }

      lines.forEach(function(line){
        const t = String(line || "").trim();
        if(!t){ closeList(); return; }

        if(/^[-•]\s+/.test(t)){
          if(!listOpen){ html += "<ul>"; listOpen = true; }
          html += "<li>" + escapeHtml(t.replace(/^[-•]\s+/, "")) + "</li>";
          return;
        }

        closeList();

        if(/^\d+(\.\d+)*[\.\s]/.test(t) || /^[A-Z][A-Z0-9 &/()'-]{5,}$/.test(t)){
          html += "<h2>" + escapeHtml(t) + "</h2>";
        } else {
          html += "<p>" + escapeHtml(t) + "</p>";
        }
      });

      closeList();
      return html;
    }

    function downloadUniformRegulations() {
      const policyUrl = String(state.policy?.pdfUrl || "").trim();

      if(policyUrl){
        const a = document.createElement("a");
        a.href = policyUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      try{
        const binary = atob(EMBEDDED_REGULATIONS_PDF_BASE64);
        const bytes = new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type:"application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const version = String(state.policy?.policyVersion || "current").replace(/[^A-Za-z0-9._-]/g,"-");
        a.href = url;
        a.download = `SKANDI_Uniform_Regulations_${version}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(()=>URL.revokeObjectURL(url), 1500);
      }catch(err){
        showToast("Could not prepare the Uniform Regulations PDF.");
      }
    }

    function renderRegulations() {
      const root = byId("regulations-root");
      const policy = state.policy || {};

      root.innerHTML =
        '<div class="regulations-shell">' +
          '<section class="regulations-hero">' +
            '<div>' +
              '<p class="regulations-kicker">SKANDI Staff Uniform</p>' +
              '<h1 class="regulations-title serif">' + escapeHtml(policy.title || "Uniform Regulations") + '</h1>' +
              '<div class="regulations-meta">' +
                '<span>Version: <strong>' + escapeHtml(policy.policyVersion || "Current") + '</strong></span>' +
                (policy.effectiveDate ? '<span>Effective: <strong>' + escapeHtml(policy.effectiveDate) + '</strong></span>' : '') +
                (policy.documentId ? '<span>Document: <strong>' + escapeHtml(policy.documentId) + '</strong></span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="regulations-actions">' +
              '<button class="btn btn-light" type="button" data-action="download-regulations">Download PDF</button>' +
              '<button class="btn" type="button" data-action="route-category" data-category="">Back to Catalog</button>' +
            '</div>' +
          '</section>' +
          '<div class="regulations-layout">' +
            '<article class="regulations-document">' + renderPolicyBody(policy.body) + '</article>' +
            '<aside class="regulations-side">' +
              '<div class="reg-card">' +
                '<h3>Applies together</h3>' +
                '<p>General Uniform Regulations apply to every uniform item. Product-specific regulations shown on an item page apply in addition to this document.</p>' +
              '</div>' +
              '<div class="reg-card">' +
                '<h3>Acknowledgement</h3>' +
                '<p>Confirm that you have read the current Uniform Regulations. Your acknowledgement is recorded against the active policy version.</p>' +
                '<label class="policy-ack"><input id="policy-ack-checkbox" type="checkbox" ' + (state.policyAcknowledged ? 'checked disabled' : '') + '> <span>I have read and understand the current SKANDI Uniform Regulations.</span></label>' +
                '<button class="btn btn-full' + (state.policyAcknowledged ? ' btn-disabled' : '') + '" style="margin-top:14px;" type="button" data-action="ack-regulations" ' + (state.policyAcknowledged ? 'disabled' : '') + '>' + (state.policyAcknowledged ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE REGULATIONS') + '</button>' +
              '</div>' +
              '<div class="reg-card">' +
                '<h3>Product eligibility</h3>' +
                '<p>The catalog is already filtered for your staff profile. Role, department and base requirements are shown on each product detail page.</p>' +
              '</div>' +
            '</aside>' +
          '</div>' +
        '</div>';
    }

    function renderOrders() {
      var root = byId("orders-root");
      if(!state.orders || !state.orders.length) {
        root.innerHTML = '<div class="empty-state"><h2 class="serif">No Orders</h2><p>You have not submitted any uniform requests yet.</p></div>';
        return;
      }
      var html = '<div style="display:grid;gap:14px;">';
      state.orders.forEach(o => {
        html += `<div class="bag-line" style="grid-template-columns:1fr; padding:24px;">
          <h2 class="bag-line-title serif">Order ${escapeHtml(o.orderNumber)}</h2>
          <p class="bag-line-meta">Status: <strong>${escapeHtml(o.status)}</strong></p>
          <p class="bag-line-meta">${escapeHtml(o.summary||"")}</p>
          <p class="bag-line-price" style="margin-bottom:0;">${formatPoints(o.totalPoints)}</p>
        </div>`;
      });
      html += '</div>';
      root.innerHTML = html;
    }

    function toggleFav(id) {
      if(state.saved.includes(id)) state.saved = state.saved.filter(x=>x!==id);
      else state.saved.push(id);
      renderHeaderBadges();
      if(state.currentView === "plp") renderPLP();
    }


    function requestUniformSync(showMessage=true) {
      if(showMessage) setStatus("Synchronizing Uniform Center...");
      post("UNIFORM_EMPLOYEE_BOOTSTRAP");
    }

    function installUniformSyncRecovery() {
      // Startup retries cover the Wix iframe/Velo listener race.
      [250, 1200, 3500, 7000].forEach(function(delay) {
        window.setTimeout(function() {
          if(!state.bootstrapReceived) {
            requestUniformSync(delay > 250);
          }
        }, delay);
      });

      // Keep staff eligibility, balances, policy, orders and catalog current.
      window.setInterval(function() {
        if(document.visibilityState === "visible") {
          requestUniformSync(false);
        }
      }, 60000);

      document.addEventListener("visibilitychange", function() {
        if(document.visibilityState === "visible" && state.bootstrapReceived) {
          requestUniformSync(false);
        }
      });
    }

    // EVENT LISTENERS
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-action]");
      if(!btn) return;
      var action = btn.getAttribute("data-action");
      if (action === "admin-login") {
        const modal = byId("admin-auth-modal");
        const copy = byId("admin-auth-copy");
        if (modal) modal.classList.remove("d-none");
        if (copy) copy.textContent = "Checking your staff permissions…";
        post("UNIFORM_EMPLOYEE_ADMIN_LOGIN", {});
        return;
      }
      if (action === "close-admin-auth") {
        const modal = byId("admin-auth-modal");
        if (modal) modal.classList.add("d-none");
        return;
      }
      
      if (action !== "open-product") { e.preventDefault(); e.stopPropagation(); }

      if (action === "route-home") navigate("home");
      if (action === "route-bag") navigate("bag");
      if (action === "route-checkout") {
        if(state.cart.length) navigate("checkout");
        else showToast("Your bag is empty.");
      }
      if (action === "sync-uniform") {
        requestUniformSync(true);
        showToast("Synchronizing Uniform Center…");
      }
      if (action === "route-regulations") navigate("regulations");
      if (action === "download-regulations") downloadUniformRegulations();
      if (action === "ack-regulations") {
        const box = byId("policy-ack-checkbox");
        if(!box || !box.checked){
          showToast("Confirm that you have read the regulations first.");
        } else if(state.policy?.policyId || state.policy?.id) {
          btn.textContent = "RECORDING...";
          btn.disabled = true;
          post("UNIFORM_EMPLOYEE_ACK_POLICY", {
            policyId: state.policy.policyId || state.policy.id,
            policyVersion: state.policy.policyVersion || ""
          });
        }
      }
      if (action === "route-orders") navigate("orders");
      if (action === "route-favorites") navigate("plp", {category: "Favorites"});
      
      if (action === "route-category") {
        navigate("plp", {category: btn.getAttribute("data-category") || ""});
      }
      if (action === "route-subcategory") {
        state.activeCategory = "";
        state.activeFilters = { subCategory: btn.getAttribute("data-subcategory") || "", size: "", sort: "recommended" };
        navigate("plp");
      }
      if (action === "open-product") {
        navigate("pdp", {productId: btn.getAttribute("data-product-id")});
      }
      if (action === "toggle-favorite") toggleFav(btn.getAttribute("data-product-id"));
      if (action === "select-card-color") {
        const variant=getProductById(btn.getAttribute("data-product-id"));
        if(variant){
          state.cardVariantByGroup[productGroupKey(variant)]=itemId(variant);
          renderPLP();
        }
      }
      if (action === "reset-filters") { state.activeFilters = {subCategory:"", size:"", sort:"recommended"}; renderPLP(); }
      
      if (action === "select-pdp-size") {
        state.activeSize = btn.getAttribute("data-size");
        state.activeProduct = resolveFamilyVariant(state.activeProduct, {
          size: state.activeSize,
          fit: state.activeFit,
          colorKey: variantColorKey(state.activeProduct)
        }) || state.activeProduct;
        renderPDP();
      }
      if (action === "select-pdp-fit") {
        state.activeFit = btn.getAttribute("data-fit");
        state.activeProduct = resolveFamilyVariant(state.activeProduct, {
          size: state.activeSize,
          fit: state.activeFit,
          colorKey: variantColorKey(state.activeProduct)
        }) || state.activeProduct;
        renderPDP();
      }
      if (action === "select-pdp-image") { state.activeImageIndex = Number(btn.getAttribute("data-image-index")||0); renderPDP(); }
      if (action === "select-pdp-color") {
        const variant=getProductById(btn.getAttribute("data-product-id"));
        if(variant){
          const nextSizes = availableFamilySizes(variant, state.activeFit);
          if(!state.activeSize || !nextSizes.includes(state.activeSize)) state.activeSize = nextSizes[0] || "Standard";

          const nextFits = availableFamilyFits(variant, state.activeSize);
          if(nextFits.length && !nextFits.includes(state.activeFit)) state.activeFit = nextFits[0];
          if(!nextFits.length) state.activeFit = "";

          state.activeProduct = resolveFamilyVariant(variant, {
            size: state.activeSize,
            fit: state.activeFit,
            colorKey: variantColorKey(variant)
          }) || variant;
          state.activeImageIndex=0;
          state.cardVariantByGroup[productGroupKey(variant)]=itemId(state.activeProduct);
          renderPDP();
        }
      }
      if (action === "add-to-bag") addToBag();
      
      if (action === "open-size-guide") byId("size-guide-modal").classList.remove("d-none");
      if (action === "close-size-guide") byId("size-guide-modal").classList.add("d-none");
      
      if (action === "toggle-accordion") {
        var item = btn.closest(".accordion-item");
        if(item) item.classList.toggle("is-open");
      }
      
      if (action === "increment-cart") { var idx = Number(btn.getAttribute("data-cart-index")); if(state.cart[idx]) { state.cart[idx].quantity++; renderHeaderBadges(); renderBag(); } }
      if (action === "decrement-cart") { var idx = Number(btn.getAttribute("data-cart-index")); if(state.cart[idx]) { state.cart[idx].quantity--; if(state.cart[idx].quantity<=0) state.cart.splice(idx,1); renderHeaderBadges(); renderBag(); } }
      if (action === "remove-cart") { var idx = Number(btn.getAttribute("data-cart-index")); if(state.cart[idx]) { state.cart.splice(idx,1); renderHeaderBadges(); renderBag(); } }
      
      if (action === "submit-order") {
        if(!state.cart.length) { showToast("Bag is empty"); return; }
        state.requestNote = byId("req-note") ? byId("req-note").value : "";
        post("UNIFORM_EMPLOYEE_SUBMIT_ORDER", { items: state.cart, note: state.requestNote });
        // Disable button visually
        btn.textContent = "SUBMITTING...";
        btn.style.opacity = "0.7";
        btn.style.pointerEvents = "none";
      }
    });

    document.addEventListener("change", function(e) {
      var filter = e.target.getAttribute("data-filter");
      if (filter) {
        state.activeFilters[filter] = e.target.value;
        renderPLP();
      }
    });

    // SKANDI BACKEND MESSAGE LISTENER
    window.addEventListener("message", e => {
      const m = e.data || {};
      if(m.source !== PARENT) return;
      
      if(m.type === "UNIFORM_EMPLOYEE_HOST_READY") {
        if(!state.bootstrapReceived) post("UNIFORM_EMPLOYEE_BOOTSTRAP", {});
      }

      if(m.type === "UNIFORM_EMPLOYEE_ADMIN_GRANTED") {
        const copy = byId("admin-auth-copy");
        if (copy) copy.textContent = "Access confirmed. Opening Uniform Control…";
        showToast("Uniform Control access confirmed.");
      }

      if(m.type === "UNIFORM_EMPLOYEE_ADMIN_DENIED") {
        const modal = byId("admin-auth-modal");
        const copy = byId("admin-auth-copy");
        if (modal) modal.classList.remove("d-none");
        if (copy) copy.textContent = m.payload?.message || m.message || "Your current staff role is not authorized to open Uniform Control.";
      }

      if(m.type === "UNIFORM_EMPLOYEE_BOOTSTRAP_RESULT") {
        state = { ...state, ...(m.payload || {}) };
        state.cart = state.cart || [];
        state.bootstrapReceived = true;
        state.lastSyncAt = m.payload?.lastSync || new Date().toISOString();
        setStatus("");
        renderHeaderBadges();
        renderNavFromCategories();
        // Just refresh current view safely
        if(["home","plp","pdp","bag","checkout","orders","regulations"].includes(state.currentView)) {
           renderView(state.currentView);
        } else {
           navigate("home");
        }
      }
      
      if(m.type === "UNIFORM_EMPLOYEE_ORDER_SUBMITTED") {
        const result = m.payload || {};
        state.lastOrderPoints = calculateTotalPoints();
        state.lastOrderCode = result.order?.orderNumber || "REQ-SUBMITTED";
        if(result.wallet) state.wallet = result.wallet;
        state.cart = [];
        state.requestNote = "";
        renderHeaderBadges();
        if(state.currentView === "checkout") renderCheckout();
        showToast("Uniform request submitted.");
        post("UNIFORM_EMPLOYEE_BOOTSTRAP");
      }
      
      if(m.type === "UNIFORM_EMPLOYEE_ACK_OK") {
        state.policyAcknowledged = true;
        if(state.currentView === "regulations") renderRegulations();
        showToast("Uniform Regulations acknowledged.");
      }

      if(m.type === "UNIFORM_EMPLOYEE_ERROR") {
        setStatus(m.message || "Uniform Center synchronization failed.", "error");
        showToast(m.message || "An error occurred.");
        // Reset submit button if on checkout
        var btn = document.querySelector('[data-action="submit-order"]');
        if(btn) { btn.textContent = "CONFIRM & SUBMIT"; btn.style.opacity="1"; btn.style.pointerEvents="auto"; }
      }
    });

    // INIT
    function initUniformCenter(){
      renderHeaderBadges();
      renderNavFromCategories();
      setStatus("Synchronizing Uniform Center...");
      post("UNIFORM_EMPLOYEE_READY");
      installUniformSyncRecovery();
    }
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", initUniformCenter, { once:true });
    else initUniformCenter();
  </script>
</body>
</html>
```
