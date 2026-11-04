// Complete server-rendered layouts derived from the approved full-cart HTML v8.
// Each locale shares its existing body across the optional Club and recommendation sections.
export const UNSUBSCRIBE_MARKER = "[SKANDI_WIX_UNSUBSCRIBE_URL]";

function escapeHtml(value) {
  const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, character => replacements[character]);
}

function renderEN(data) {
  const start = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your cart is waiting | The Store by SKANDI Travels</title>

  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->

  <style>
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }

    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
    }

    @media only screen and (max-width: 620px) {
      .outer-pad {
        padding: 12px 8px !important;
      }

      .shell {
        width: 100% !important;
        max-width: 600px !important;
      }

      .header-pad {
        padding: 22px !important;
      }

      .brand-caption {
        display: table-cell !important;
        width: 96px !important;
      }

      .store-header-logo {
        width: 140px !important;
        height: auto !important;
      }

      .footer-brand-cell,
      .upsell-cell {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
      }

      .company-details-cell {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        padding: 0 0 8px !important;
      }

      .footer-group-cell {
        padding: 0 0 14px !important;
      }

      .group-member-image {
        margin-left: 0 !important;
      }

      .upsell-cell {
        padding: 0 0 26px !important;
      }

      .upsell-image {
        width: 230px !important;
        max-width: 100% !important;
        height: auto !important;
      }

      .hero-column {
        display: block !important;
        width: 100% !important;
      }

      .hero-copy {
        padding: 30px 24px !important;
      }

      .hero-title {
        font-size: 34px !important;
        line-height: 38px !important;
      }

      .hero-image {
        width: 100% !important;
        max-width: 600px !important;
        height: auto !important;
      }

      .content-pad {
        padding: 30px 22px !important;
      }

      .product-photo {
        width: 100px !important;
      }

      .product-image {
        width: 100px !important;
        max-width: 100px !important;
        height: auto !important;
      }

      .product-details {
        padding-left: 16px !important;
      }

      .support-pad {
        padding: 26px 22px !important;
      }

      .footer-pad {
        padding: 24px 22px !important;
      }

      .main-button {
        width: 100% !important;
      }

      .main-button a {
        display: block !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background-color:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#243f54;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;word-spacing:normal;">


  <div
    aria-hidden="true"
    style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:#f3f5f7;mso-hide:all;"
  >
    A little something for your next getaway. Pick up where you left off.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    bgcolor="#f3f5f7"
    style="width:100%;background-color:#f3f5f7;"
  >
    <tr>
      <td
        class="outer-pad"
        align="center"
        style="padding:28px 16px;"
      >

        <!--[if mso]>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
        <![endif]-->

        <table
          role="presentation"
          class="shell"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          bgcolor="#ffffff"
          style="width:100%;max-width:600px;background-color:#ffffff;"
        >

          <!-- HEADER -->
          <tr>
            <td
              class="header-pad"
              style="padding:24px 30px;background-color:#ffffff;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td align="left" valign="middle">
                    <a
                      href="https://www.skanditravels.com/the-store"
                      target="_blank"
                      style="color:#022e64;text-decoration:none;"
                    >
                      <img class="store-header-logo" src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_NAVY.svg" width="200" height="50" alt="THE STORE" style="display:block;width:200px;height:50px;max-width:100%;font-size:14px;font-weight:bold;color:#022e64;" >
                    </a>
                  </td>

                  <td
                    class="brand-caption"
                    align="right"
                    valign="middle"
                    style="font-size:13px;line-height:16px;letter-spacing:1.2px;font-weight:bold;color:#8fa6bc;white-space:nowrap;"
                  >
                     <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-NAVY-TEXTMARK.svg"
                      width="80"
                      height="32"
                      alt="SKANDI TRAVELS"
                      style="display:inline-block;vertical-align:middle;width:80px;height:auto;max-width:100%;border-left:1px solid #8fa6bc;margin-left:5px;padding-left:10px;color:#022e64;"
                    >
                      
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td
              bgcolor="#e7f3f4"
              style="background-color:#e7f3f4;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="table-layout:fixed;"
              >
                <tr>
                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          class="hero-copy"
                          style="padding:28px;"
                        >
                          <p style="margin:0;font-size:18px;line-height:24px;font-weight:700;color:#022e64;">${escapeHtml(data.firstName)}</p>
                          <h1
                            class="hero-title"
                            style="margin:0 0 16px;font-size:28px;line-height:36px;letter-spacing:-0.7px;font-weight:500;color:#022e64;"
                          >
                            Your cart<br>is waiting.
                          </h1>

                          <p style="margin:0 0 22px;font-size:15px;line-height:24px;color:#294b60;">
                            Don't forget it for your next holiday.<br>Pick up where you left off.
                          </p>

                          <!--[if mso]>
                          <v:roundrect
                            href="${escapeHtml(data.checkoutUrl)}"
                            style="height:50px;v-text-anchor:middle;width:220px;"
                            arcsize="8%"
                            stroke="f"
                            fillcolor="#022e64"
                          >
                            <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                            <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">
                              Continue Shopping
                            </center>
                          </v:roundrect>
                          <![endif]-->

                          <!--[if !mso]><!-->
                          <a
                            class="recovery-button"
                            href="${escapeHtml(data.checkoutUrl)}"
                            target="_blank"
                            style="display:inline-block;padding:16px 24px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:15px;line-height:18px;font-weight:bold;text-align:center;text-decoration:none;mso-hide:all;"
                          >
                            Continue Shopping
                          </a>
                          <!--<![endif]-->

                        </td>
                      </tr>
                    </table>
                  </td>

                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    align="center"
                    bgcolor="#e7f3f4"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <img
                      class="hero-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/branding/the_store_products/Scandi%20travel%20self-care%20essentials.png"
                      width="300"
                      height="300"
                      alt="SKANDI travelwear, ready for a getaway."
                      style="display:block;width:300px;max-width:100%;height:auto;color:#022e64;font-size:14px;line-height:22px;"
                    >
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- COMPLETE ABANDONED CART: SERVER-RENDERED HANDLEBARS TEMPLATE -->
          <tr>
            <td
              class="content-pad"
              style="padding:34px 36px 32px;border-bottom:1px solid #e1e8ed;"
            >
              <h2 style="margin:0 0 22px;font-size:22px;line-height:28px;letter-spacing:-0.3px;font-weight:700;color:#022e64;">Your saved cart</h2>
              <!-- Render every cart.items entry before sending; no fixed item count. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${(data.cart.items || []).map(item => `
                <tr>
                  <td colspan="2" style="padding:0 0 18px;border-bottom:1px solid #e1e8ed;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        ${item.imageUrl ? `
                        <td class="product-photo" width="112" valign="top" style="width:112px;padding-top:18px;">
                          <img class="product-image" src="${escapeHtml(item.imageUrl)}" width="112" alt="${escapeHtml(item.name)}" style="display:block;width:112px;max-width:112px;height:auto;color:#536b7c;font-size:12px;line-height:18px;">
                        </td>
                        ` : ""}
                        <td class="product-details" valign="top" style="padding:18px 0 0 24px;">
                          <h3 style="margin:0 0 6px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;word-break:break-word;">${escapeHtml(item.name)}</h3>
                          ${item.optionsText ? `<p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">${escapeHtml(item.optionsText)}</p>` : ""}
                          <p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">Quantity: ${escapeHtml(item.quantity)} &times; ${item.originalUnitPriceFormatted ? `<del style="color:#6b7c89;">${escapeHtml(item.originalUnitPriceFormatted)}</del> &nbsp;` : ""}${escapeHtml(item.unitPriceFormatted)}</p>
                          <p style="margin:0;font-size:16px;line-height:23px;font-weight:bold;color:#022e64;">${escapeHtml(item.lineTotalFormatted)}</p>
                          ${item.discountText ? `<p style="margin:6px 0 0;font-size:12px;line-height:18px;color:#316b59;">${escapeHtml(item.discountText)}</p>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join("")}
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Subtotal</td>
                  <td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.subtotalFormatted)}</td>
                </tr>
                ${(data.cart.discounts || []).map(item => `
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">${escapeHtml(item.label)}${item.code ? `<br><span style="font-size:12px;">Code: <strong>${escapeHtml(item.code)}</strong></span>` : ""}</td>
                  <td align="right" valign="top" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">${item.amountFormatted ? `&minus;${escapeHtml(item.amountFormatted)}` : ""}</td>
                </tr>
                `).join("")}
                ${data.cart.shippingFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Shipping</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.shippingFormatted)}</td></tr>` : ""}
                ${data.cart.taxFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Tax</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.taxFormatted)}</td></tr>` : ""}
                ${data.cart.giftCardFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">Gift card credit</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">&minus;${escapeHtml(data.cart.giftCardFormatted)}</td></tr>` : ""}
                <tr><td style="padding:13px 12px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">Total</td><td align="right" style="padding:13px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">${escapeHtml(data.cart.totalFormatted)}</td></tr>
              </table>
              <p style="margin:8px 0 0;text-align:right;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(data.currency)}</p>

              ${data.cart.offers?.length ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                <tr><td style="padding:16px;background-color:#edf5f6;">
                  <h3 style="margin:0 0 10px;font-size:15px;line-height:21px;color:#022e64;">Offers for your cart</h3>
                  ${(data.cart.offers || []).map(item => `
                  <p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;"><strong>${escapeHtml(item.title)}</strong></p>
                  <p style="margin:0 0 5px;font-size:12px;line-height:18px;color:#243f54;">${escapeHtml(item.description)}</p>
                  ${item.code ? `<p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;">Code: <strong>${escapeHtml(item.code)}</strong></p>` : ""}
                  <p style="margin:0 0 12px;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(item.termsText)}${item.termsUrl ? ` <a href="${escapeHtml(item.termsUrl)}" target="_blank" style="color:#022e64;text-decoration:underline;">View offer terms</a>` : ""}</p>
                  `).join("")}
                </td></tr>
              </table>
              ` : ""}

              <p style="margin:22px 0 24px;font-size:13px;line-height:21px;color:#536b7c;">Review your saved items and applied savings. Final prices and eligibility are confirmed when you return to checkout.</p>

              <table
                role="presentation"
                class="main-button"
                align="center"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="border-collapse:separate;"
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#022e64"
                    style="border-radius:4px;background-color:#022e64;"
                  >

                    <!--[if mso]>
                    <v:roundrect
                      href="${escapeHtml(data.checkoutUrl)}"
                      style="height:52px;v-text-anchor:middle;width:260px;"
                      arcsize="8%"
                      stroke="f"
                      fillcolor="#022e64"
                    >
                      <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">
                        Return to my cart
                      </center>
                    </v:roundrect>
                    <![endif]-->

                    <!--[if !mso]><!-->
                    <a
                      class="recovery-button"
                      href="${escapeHtml(data.checkoutUrl)}"
                      target="_blank"
                      style="display:inline-block;padding:17px 44px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:16px;line-height:18px;font-weight:bold;text-decoration:none;mso-hide:all;"
                    >
                      Return to my cart
                    </a>
                    <!--<![endif]-->

                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Items are not reserved. Prices and availability may change.
              </p>

              <p style="margin:8px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Already placed your order? You can disregard this reminder.
              </p>
            </td>
          </tr>

`;
  let recommendations = "";
  if (data.recommendations.length === 2) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Complete your travel kit</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">More from The Store for your next journey. View current options and prices on each product page.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 12px 0 0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">View product</a></p>
                  </td>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 0 0 12px;">
                    <a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[1].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[1].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[1].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">View product</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  } else if (data.recommendations.length === 1) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Complete your travel kit</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">More from The Store for your next journey. View current options and prices on each product page.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="100%" valign="top" style="width:100%;padding:0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">View product</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  }
  const clubOffer = data.clubOfferTermsUrl ? `          <!-- CLUB SIGNUP OFFER: NON-MEMBERS ONLY. Select this complete email only after a trusted send-time membership check has confirmed is_loyalty_member === false. Unknown/error uses the member/no-offer version. -->
          <tr>
            <td class="content-pad" style="padding:30px 36px;background-color:#f6faff;border-bottom:1px solid #e1e8ed;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                <tr>
                  <td align="left" bgcolor="#e7f3f4" style="padding:26px 24px;border-left:4px solid #5fc7cf;background-color:#e7f3f4;">
                    <p style="margin:0 0 9px;font-size:11px;line-height:16px;letter-spacing:1px;font-weight:bold;color:#022e64;">SKANDI CLUB · SPECIAL OFFER</p>
                    <h2 style="margin:0 0 12px;font-size:24px;line-height:30px;font-weight:700;color:#022e64;">Join free. Start with a bonus.</h2>
                    <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#243f54;">Become a SKANDI Club member and receive a signup bonus with extra SKANDI Points.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                      <tr>
                        <td align="center" bgcolor="#022e64" style="border-radius:4px;background-color:#022e64;mso-padding-alt:14px 22px;">
                          <a class="club-signup-button" href="https://www.skanditravels.com/skandi-club" target="_blank" style="display:inline-block;padding:14px 22px;border:1px solid #022e64;border-radius:4px;color:#ffffff;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none;">Join SKANDI Club</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:11px;line-height:16px;color:#536b7c;">For new SKANDI Club members. <a href="${escapeHtml(data.clubOfferTermsUrl)}" style="color:#022e64;text-decoration:underline;">Offer terms apply.</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

` : "";
  const footer = `          <!-- CUSTOMER SERVICE -->
          <tr>
            <td
              class="support-pad"
              align="center"
              bgcolor="#edf5f6"
              style="padding:28px 36px;background-color:#edf5f6;"
            >
              <h2 style="margin:0 0 10px;font-size:20px;line-height:26px;font-weight:700;color:#022e64;">
                Questions before you order?
              </h2>

              <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#37556a;">
                For help with products, delivery or checkout,<br>
                get in touch with our team.
              </p>

              <p style="margin:0;font-size:14px;line-height:24px;">
                <a
                  href="https://www.skanditravels.com/about/support"
                  target="_blank"
                  style="color:#022e64;font-weight:bold;text-decoration:underline;"
                >
                  Contact Customer Service
                </a>
              </p>

              <p style="margin:8px 0 0;font-size:13px;line-height:22px;">
                <a
                  href="mailto:support@skanditravels.com"
                  style="color:#37556a;text-decoration:underline;"
                >
                  support@skanditravels.com
                </a>
              </p>
            </td>
          </tr>

          <!-- FOOTER: original branding; secondary legal copy; retain Wix's managed preferences footer -->
          <tr>
            <td
              class="footer-pad"
              align="left"
              bgcolor="#022e64"
              style="padding:24px 36px;background-color:#022e64;"
            >
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="footer-brand-cell" width="180" valign="middle" align="left" style="width:180px;padding:0 0 14px;">
                    <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_LIGHT.svg"
                      width="150" height="38" alt="THE STORE"
                      style="display:block;width:150px;height:auto;max-width:100%;color:#ffffff;"
                    >
                    <p style="margin:5px 0 0;font-size:12px;line-height:20px;color:#8fa6bc;">by <b>SKANDI TRAVELS</b></p>
                  </td>
                  <td class="footer-brand-cell footer-group-cell" valign="middle" align="right" style="padding:0 0 14px;">
                    <img class="group-member-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_GROUP-MEMBER-LIGHT.svg"
                      width="230" height="29" alt="A SKANDI GROUP MEMBER"
                      style="display:block;width:230px;height:auto;max-width:100%;margin-left:auto;color:#ffffff;"
                    >
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:12px;line-height:24px;">
                <a
                  href="https://www.instagram.com/skanditravels"
                  target="_blank"
                  style="color:#faf6ff;text-decoration:underline;"
                >Instagram</a>
                <span aria-hidden="true" style="color:#8fa6bc;">
                  &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                </span>
                <a
                  href="https://www.facebook.com/skanditravels"
                  target="_blank"
                  style="color:#f6faff;text-decoration:underline;"
                >Facebook</a>
              </p>

              <p style="margin:0 0 8px;font-size:11px;line-height:16px;color:#a2b4c5;">Advertisement. Cart reminder from THE STORE.</p>

              <!-- Business Info source: primary US HQ and Sweden HQ. Swedish registered seat and organisation number remain separate unverified company particulars. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 4px;table-layout:fixed;">
                <tr>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 18px 8px 0;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">US HQ</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Inc.</p>
                    <p style="margin:0;font-size:11px;line-height:16px;color:#a2b4c5;">450 Lexington Avenue<br>New York, NY 10163<br>United States</p>
                  </td>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 0 8px 12px;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">SWEDEN HQ</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Aktiebolag</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;color:#a2b4c5;">Biblioteksgatan 11<br>111 46 Stockholm<br>Sweden</p>
                    <p style="margin:0;font-size:11px;line-height:16px;"><a href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#a2b4c5;text-decoration:underline;">Company information</a></p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:11px;line-height:16px;color:#a2b4c5;">Use the unsubscribe or email-preferences link below to stop marketing emails.</p>
              <p style="margin:0 0 10px;font-size:11px;line-height:16px;"><a href="[SKANDI_WIX_UNSUBSCRIBE_URL]" style="color:#f6faff;text-decoration:underline;">Unsubscribe</a></p>

              <p style="margin:0 0 10px;font-size:11px;line-height:18px;">
                <a href="https://www.skanditravels.com/about/legal/policies?slug=privacy-policy" target="_blank" style="color:#f6faff;text-decoration:underline;">Privacy</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a href="mailto:support@skanditravels.com" style="color:#f6faff;text-decoration:underline;">Contact</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a
                  href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#f6faff;text-decoration:underline;">Terms &amp; Policies</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com/the-store" target="_blank" style="color:#f6faff;text-decoration:underline;">THE STORE</a>
              <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com" style="color:#f6faff;text-decoration:underline;">SKANDI TRAVELS</a>
            </p>
              <p style="margin:0;border-bottom:1px solid #284d76;border-top:1px solid #284d76;padding:9px 0;font-size:10px;line-height:15px;color:#a2b4c5;">© 2026 SKANDI GROUP Inc. (United States) &amp; SKANDI GROUP Aktiebolag (Sweden). All rights reserved. THE STORE™ &amp; SKANDI TRAVELS™ are trademarks of the SKANDI GROUP.
              </p>
            </td>
          </tr>
          <tr><td style="background-color:#f6faff;height:5px;font-size:0;line-height:5px;">&nbsp;</td></tr>
        </table>

        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>


</body>
</html>`;
  return { subject: "Your favourites are still in your SKANDI cart", html: start + recommendations + clubOffer + footer };
}

function renderSV(data) {
  const start = `<!DOCTYPE html>
<html lang="sv" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Din varukorg väntar | The Store by SKANDI Travels</title>

  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->

  <style>
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }

    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
    }

    @media only screen and (max-width: 620px) {
      .outer-pad {
        padding: 12px 8px !important;
      }

      .shell {
        width: 100% !important;
        max-width: 600px !important;
      }

      .header-pad {
        padding: 22px !important;
      }

      .brand-caption {
        display: table-cell !important;
        width: 96px !important;
      }

      .store-header-logo {
        width: 140px !important;
        height: auto !important;
      }

      .footer-brand-cell,
      .upsell-cell {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
      }

      .company-details-cell {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        padding: 0 0 8px !important;
      }

      .footer-group-cell {
        padding: 0 0 14px !important;
      }

      .group-member-image {
        margin-left: 0 !important;
      }

      .upsell-cell {
        padding: 0 0 26px !important;
      }

      .upsell-image {
        width: 230px !important;
        max-width: 100% !important;
        height: auto !important;
      }

      .hero-column {
        display: block !important;
        width: 100% !important;
      }

      .hero-copy {
        padding: 30px 24px !important;
      }

      .hero-title {
        font-size: 34px !important;
        line-height: 38px !important;
      }

      .hero-image {
        width: 100% !important;
        max-width: 600px !important;
        height: auto !important;
      }

      .content-pad {
        padding: 30px 22px !important;
      }

      .product-photo {
        width: 100px !important;
      }

      .product-image {
        width: 100px !important;
        max-width: 100px !important;
        height: auto !important;
      }

      .product-details {
        padding-left: 16px !important;
      }

      .support-pad {
        padding: 26px 22px !important;
      }

      .footer-pad {
        padding: 24px 22px !important;
      }

      .main-button {
        width: 100% !important;
      }

      .main-button a {
        display: block !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background-color:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#243f54;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;word-spacing:normal;">


  <div
    aria-hidden="true"
    style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:#f3f5f7;mso-hide:all;"
  >
    Något för din nästa semester. Fortsätt där du slutade.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    bgcolor="#f3f5f7"
    style="width:100%;background-color:#f3f5f7;"
  >
    <tr>
      <td
        class="outer-pad"
        align="center"
        style="padding:28px 16px;"
      >

        <!--[if mso]>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
        <![endif]-->

        <table
          role="presentation"
          class="shell"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          bgcolor="#ffffff"
          style="width:100%;max-width:600px;background-color:#ffffff;"
        >

          <!-- HEADER -->
          <tr>
            <td
              class="header-pad"
              style="padding:24px 30px;background-color:#ffffff;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td align="left" valign="middle">
                    <a
                      href="https://www.skanditravels.com/the-store"
                      target="_blank"
                      style="color:#022e64;text-decoration:none;"
                    >
                      <img class="store-header-logo" src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_NAVY.svg" width="200" height="50" alt="THE STORE" style="display:block;width:200px;height:50px;max-width:100%;font-size:14px;font-weight:bold;color:#022e64;" >
                    </a>
                  </td>

                  <td
                    class="brand-caption"
                    align="right"
                    valign="middle"
                    style="font-size:13px;line-height:16px;letter-spacing:1.2px;font-weight:bold;color:#8fa6bc;white-space:nowrap;"
                  >
                     <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-NAVY-TEXTMARK.svg"
                      width="80"
                      height="32"
                      alt="SKANDI TRAVELS"
                      style="display:inline-block;vertical-align:middle;width:80px;height:auto;max-width:100%;border-left:1px solid #8fa6bc;margin-left:5px;padding-left:10px;color:#022e64;"
                    >
                      
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td
              bgcolor="#e7f3f4"
              style="background-color:#e7f3f4;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="table-layout:fixed;"
              >
                <tr>
                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          class="hero-copy"
                          style="padding:28px;"
                        >
                          <p style="margin:0;font-size:18px;line-height:24px;font-weight:700;color:#022e64;">${escapeHtml(data.firstName)}</p>
                          <h1
                            class="hero-title"
                            style="margin:0 0 16px;font-size:28px;line-height:36px;letter-spacing:-0.7px;font-weight:500;color:#022e64;"
                          >
                            Din varukorg<br>väntar.
                          </h1>

                          <p style="margin:0 0 22px;font-size:15px;line-height:24px;color:#294b60;">
                            Glöm inte det du valt inför nästa semester.<br>Fortsätt där du slutade.
                          </p>

                          <!--[if mso]>
                          <v:roundrect
                            href="${escapeHtml(data.checkoutUrl)}"
                            style="height:50px;v-text-anchor:middle;width:220px;"
                            arcsize="8%"
                            stroke="f"
                            fillcolor="#022e64"
                          >
                            <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                            <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">
                              Fortsätt handla
                            </center>
                          </v:roundrect>
                          <![endif]-->

                          <!--[if !mso]><!-->
                          <a
                            class="recovery-button"
                            href="${escapeHtml(data.checkoutUrl)}"
                            target="_blank"
                            style="display:inline-block;padding:16px 24px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:15px;line-height:18px;font-weight:bold;text-align:center;text-decoration:none;mso-hide:all;"
                          >
                            Fortsätt handla
                          </a>
                          <!--<![endif]-->

                        </td>
                      </tr>
                    </table>
                  </td>

                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    align="center"
                    bgcolor="#e7f3f4"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <img
                      class="hero-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/branding/the_store_products/Scandi%20travel%20self-care%20essentials.png"
                      width="300"
                      height="300"
                      alt="SKANDI-produkter, redo för nästa resa."
                      style="display:block;width:300px;max-width:100%;height:auto;color:#022e64;font-size:14px;line-height:22px;"
                    >
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- COMPLETE ABANDONED CART: SERVER-RENDERED HANDLEBARS TEMPLATE -->
          <tr>
            <td
              class="content-pad"
              style="padding:34px 36px 32px;border-bottom:1px solid #e1e8ed;"
            >
              <h2 style="margin:0 0 22px;font-size:22px;line-height:28px;letter-spacing:-0.3px;font-weight:700;color:#022e64;">Din sparade varukorg</h2>
              <!-- Render every cart.items entry before sending; no fixed item count. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${(data.cart.items || []).map(item => `
                <tr>
                  <td colspan="2" style="padding:0 0 18px;border-bottom:1px solid #e1e8ed;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        ${item.imageUrl ? `
                        <td class="product-photo" width="112" valign="top" style="width:112px;padding-top:18px;">
                          <img class="product-image" src="${escapeHtml(item.imageUrl)}" width="112" alt="${escapeHtml(item.name)}" style="display:block;width:112px;max-width:112px;height:auto;color:#536b7c;font-size:12px;line-height:18px;">
                        </td>
                        ` : ""}
                        <td class="product-details" valign="top" style="padding:18px 0 0 24px;">
                          <h3 style="margin:0 0 6px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;word-break:break-word;">${escapeHtml(item.name)}</h3>
                          ${item.optionsText ? `<p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">${escapeHtml(item.optionsText)}</p>` : ""}
                          <p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">Antal: ${escapeHtml(item.quantity)} &times; ${item.originalUnitPriceFormatted ? `<del style="color:#6b7c89;">${escapeHtml(item.originalUnitPriceFormatted)}</del> &nbsp;` : ""}${escapeHtml(item.unitPriceFormatted)}</p>
                          <p style="margin:0;font-size:16px;line-height:23px;font-weight:bold;color:#022e64;">${escapeHtml(item.lineTotalFormatted)}</p>
                          ${item.discountText ? `<p style="margin:6px 0 0;font-size:12px;line-height:18px;color:#316b59;">${escapeHtml(item.discountText)}</p>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join("")}
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Delsumma</td>
                  <td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.subtotalFormatted)}</td>
                </tr>
                ${(data.cart.discounts || []).map(item => `
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">${escapeHtml(item.label)}${item.code ? `<br><span style="font-size:12px;">Kod: <strong>${escapeHtml(item.code)}</strong></span>` : ""}</td>
                  <td align="right" valign="top" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">${item.amountFormatted ? `&minus;${escapeHtml(item.amountFormatted)}` : ""}</td>
                </tr>
                `).join("")}
                ${data.cart.shippingFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Frakt</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.shippingFormatted)}</td></tr>` : ""}
                ${data.cart.taxFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Moms</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.taxFormatted)}</td></tr>` : ""}
                ${data.cart.giftCardFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">Presentkort</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">&minus;${escapeHtml(data.cart.giftCardFormatted)}</td></tr>` : ""}
                <tr><td style="padding:13px 12px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">Totalt</td><td align="right" style="padding:13px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">${escapeHtml(data.cart.totalFormatted)}</td></tr>
              </table>
              <p style="margin:8px 0 0;text-align:right;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(data.currency)}</p>

              ${data.cart.offers?.length ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                <tr><td style="padding:16px;background-color:#edf5f6;">
                  <h3 style="margin:0 0 10px;font-size:15px;line-height:21px;color:#022e64;">Erbjudanden för din varukorg</h3>
                  ${(data.cart.offers || []).map(item => `
                  <p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;"><strong>${escapeHtml(item.title)}</strong></p>
                  <p style="margin:0 0 5px;font-size:12px;line-height:18px;color:#243f54;">${escapeHtml(item.description)}</p>
                  ${item.code ? `<p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;">Kod: <strong>${escapeHtml(item.code)}</strong></p>` : ""}
                  <p style="margin:0 0 12px;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(item.termsText)}${item.termsUrl ? ` <a href="${escapeHtml(item.termsUrl)}" target="_blank" style="color:#022e64;text-decoration:underline;">Se erbjudandets villkor</a>` : ""}</p>
                  `).join("")}
                </td></tr>
              </table>
              ` : ""}

              <p style="margin:22px 0 24px;font-size:13px;line-height:21px;color:#536b7c;">Se dina sparade varor och tillämpade rabatter. Slutpriser och villkor bekräftas när du återvänder till kassan.</p>

              <table
                role="presentation"
                class="main-button"
                align="center"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="border-collapse:separate;"
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#022e64"
                    style="border-radius:4px;background-color:#022e64;"
                  >

                    <!--[if mso]>
                    <v:roundrect
                      href="${escapeHtml(data.checkoutUrl)}"
                      style="height:52px;v-text-anchor:middle;width:260px;"
                      arcsize="8%"
                      stroke="f"
                      fillcolor="#022e64"
                    >
                      <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">
                        Till min varukorg
                      </center>
                    </v:roundrect>
                    <![endif]-->

                    <!--[if !mso]><!-->
                    <a
                      class="recovery-button"
                      href="${escapeHtml(data.checkoutUrl)}"
                      target="_blank"
                      style="display:inline-block;padding:17px 44px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:16px;line-height:18px;font-weight:bold;text-decoration:none;mso-hide:all;"
                    >
                      Till min varukorg
                    </a>
                    <!--<![endif]-->

                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Varorna är inte reserverade. Priser och tillgänglighet kan ändras.
              </p>

              <p style="margin:8px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Har du redan lagt din beställning? Då kan du bortse från den här påminnelsen.
              </p>
            </td>
          </tr>

`;
  let recommendations = "";
  if (data.recommendations.length === 2) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Lite extra för resan</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">Mer från The Store inför nästa resa. Se aktuella alternativ och priser på respektive produktsida.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 12px 0 0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Visa produkt</a></p>
                  </td>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 0 0 12px;">
                    <a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[1].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[1].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[1].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Visa produkt</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  } else if (data.recommendations.length === 1) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Lite extra för resan</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">Mer från The Store inför nästa resa. Se aktuella alternativ och priser på respektive produktsida.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="100%" valign="top" style="width:100%;padding:0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Visa produkt</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  }
  const clubOffer = data.clubOfferTermsUrl ? `          <!-- CLUB SIGNUP OFFER: NON-MEMBERS ONLY. Select this complete email only after a trusted send-time membership check has confirmed is_loyalty_member === false. Unknown/error uses the member/no-offer version. -->
          <tr>
            <td class="content-pad" style="padding:30px 36px;background-color:#f6faff;border-bottom:1px solid #e1e8ed;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                <tr>
                  <td align="left" bgcolor="#e7f3f4" style="padding:26px 24px;border-left:4px solid #5fc7cf;background-color:#e7f3f4;">
                    <p style="margin:0 0 9px;font-size:11px;line-height:16px;letter-spacing:1px;font-weight:bold;color:#022e64;">SKANDI CLUB · SPECIALERBJUDANDE</p>
                    <h2 style="margin:0 0 12px;font-size:24px;line-height:30px;font-weight:700;color:#022e64;">Bli medlem gratis. Börja med en bonus.</h2>
                    <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#243f54;">Gå med i SKANDI Club och få en välkomstbonus med extra SKANDI Points.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                      <tr>
                        <td align="center" bgcolor="#022e64" style="border-radius:4px;background-color:#022e64;mso-padding-alt:14px 22px;">
                          <a class="club-signup-button" href="https://www.skanditravels.com/skandi-club" target="_blank" style="display:inline-block;padding:14px 22px;border:1px solid #022e64;border-radius:4px;color:#ffffff;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none;">Gå med i SKANDI Club</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:11px;line-height:16px;color:#536b7c;">För nya medlemmar i SKANDI Club. <a href="${escapeHtml(data.clubOfferTermsUrl)}" style="color:#022e64;text-decoration:underline;">Erbjudandets villkor gäller.</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

` : "";
  const footer = `          <!-- CUSTOMER SERVICE -->
          <tr>
            <td
              class="support-pad"
              align="center"
              bgcolor="#edf5f6"
              style="padding:28px 36px;background-color:#edf5f6;"
            >
              <h2 style="margin:0 0 10px;font-size:20px;line-height:26px;font-weight:700;color:#022e64;">
                Frågor innan du beställer?
              </h2>

              <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#37556a;">
                För hjälp med produkter, leverans eller betalning,<br>
                kontakta vårt team.
              </p>

              <p style="margin:0;font-size:14px;line-height:24px;">
                <a
                  href="https://www.skanditravels.com/about/support"
                  target="_blank"
                  style="color:#022e64;font-weight:bold;text-decoration:underline;"
                >
                  Kontakta kundservice
                </a>
              </p>

              <p style="margin:8px 0 0;font-size:13px;line-height:22px;">
                <a
                  href="mailto:support@skanditravels.com"
                  style="color:#37556a;text-decoration:underline;"
                >
                  support@skanditravels.com
                </a>
              </p>
            </td>
          </tr>

          <!-- FOOTER: original branding; secondary legal copy; retain Wix's managed preferences footer -->
          <tr>
            <td
              class="footer-pad"
              align="left"
              bgcolor="#022e64"
              style="padding:24px 36px;background-color:#022e64;"
            >
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="footer-brand-cell" width="180" valign="middle" align="left" style="width:180px;padding:0 0 14px;">
                    <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_LIGHT.svg"
                      width="150" height="38" alt="THE STORE"
                      style="display:block;width:150px;height:auto;max-width:100%;color:#ffffff;"
                    >
                    <p style="margin:5px 0 0;font-size:12px;line-height:20px;color:#8fa6bc;">by <b>SKANDI TRAVELS</b></p>
                  </td>
                  <td class="footer-brand-cell footer-group-cell" valign="middle" align="right" style="padding:0 0 14px;">
                    <img class="group-member-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_GROUP-MEMBER-LIGHT.svg"
                      width="230" height="29" alt="A SKANDI GROUP MEMBER"
                      style="display:block;width:230px;height:auto;max-width:100%;margin-left:auto;color:#ffffff;"
                    >
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:12px;line-height:24px;">
                <a
                  href="https://www.instagram.com/skanditravels"
                  target="_blank"
                  style="color:#faf6ff;text-decoration:underline;"
                >Instagram</a>
                <span aria-hidden="true" style="color:#8fa6bc;">
                  &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                </span>
                <a
                  href="https://www.facebook.com/skanditravels"
                  target="_blank"
                  style="color:#f6faff;text-decoration:underline;"
                >Facebook</a>
              </p>

              <p style="margin:0 0 8px;font-size:11px;line-height:16px;color:#a2b4c5;">Reklam. Påminnelse om din varukorg hos THE STORE.</p>

              <!-- Business Info source: primary US HQ and Sweden HQ. Swedish registered seat and organisation number remain separate unverified company particulars. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 4px;table-layout:fixed;">
                <tr>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 18px 8px 0;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">HUVUDKONTOR USA</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Inc.</p>
                    <p style="margin:0;font-size:11px;line-height:16px;color:#a2b4c5;">450 Lexington Avenue<br>New York, NY 10163<br>USA</p>
                  </td>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 0 8px 12px;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">HUVUDKONTOR SVERIGE</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Aktiebolag</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;color:#a2b4c5;">Biblioteksgatan 11<br>111 46 Stockholm<br>Sverige</p>
                    <p style="margin:0;font-size:11px;line-height:16px;"><a href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#a2b4c5;text-decoration:underline;">Företagsinformation</a></p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:11px;line-height:16px;color:#a2b4c5;">Avsluta marknadsföringsutskick via länken för avregistrering eller e-postinställningar nedan.</p>
              <p style="margin:0 0 10px;font-size:11px;line-height:16px;"><a href="[SKANDI_WIX_UNSUBSCRIBE_URL]" style="color:#f6faff;text-decoration:underline;">Avregistrera</a></p>

              <p style="margin:0 0 10px;font-size:11px;line-height:18px;">
                <a href="https://www.skanditravels.com/about/legal/policies?slug=privacy-policy" target="_blank" style="color:#f6faff;text-decoration:underline;">Integritet</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a href="mailto:support@skanditravels.com" style="color:#f6faff;text-decoration:underline;">Kontakt</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a
                  href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#f6faff;text-decoration:underline;">Villkor &amp; policyer</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com/the-store" target="_blank" style="color:#f6faff;text-decoration:underline;">THE STORE</a>
              <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com" style="color:#f6faff;text-decoration:underline;">SKANDI TRAVELS</a>
            </p>
              <p style="margin:0;border-bottom:1px solid #284d76;border-top:1px solid #284d76;padding:9px 0;font-size:10px;line-height:15px;color:#a2b4c5;">© 2026 SKANDI GROUP Inc. (USA) &amp; SKANDI GROUP Aktiebolag (Sverige). Alla rättigheter förbehållna. THE STORE™ &amp; SKANDI TRAVELS™ är varumärken som tillhör SKANDI GROUP.
              </p>
            </td>
          </tr>
          <tr><td style="background-color:#f6faff;height:5px;font-size:0;line-height:5px;">&nbsp;</td></tr>
        </table>

        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>


</body>
</html>`;
  return { subject: "Dina favoriter finns kvar i din SKANDI-varukorg", html: start + recommendations + clubOffer + footer };
}

function renderNO(data) {
  const start = `<!DOCTYPE html>
<html lang="no" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Handlekurven din venter | The Store by SKANDI Travels</title>

  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->

  <style>
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }

    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
    }

    @media only screen and (max-width: 620px) {
      .outer-pad {
        padding: 12px 8px !important;
      }

      .shell {
        width: 100% !important;
        max-width: 600px !important;
      }

      .header-pad {
        padding: 22px !important;
      }

      .brand-caption {
        display: table-cell !important;
        width: 96px !important;
      }

      .store-header-logo {
        width: 140px !important;
        height: auto !important;
      }

      .footer-brand-cell,
      .upsell-cell {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
      }

      .company-details-cell {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        padding: 0 0 8px !important;
      }

      .footer-group-cell {
        padding: 0 0 14px !important;
      }

      .group-member-image {
        margin-left: 0 !important;
      }

      .upsell-cell {
        padding: 0 0 26px !important;
      }

      .upsell-image {
        width: 230px !important;
        max-width: 100% !important;
        height: auto !important;
      }

      .hero-column {
        display: block !important;
        width: 100% !important;
      }

      .hero-copy {
        padding: 30px 24px !important;
      }

      .hero-title {
        font-size: 34px !important;
        line-height: 38px !important;
      }

      .hero-image {
        width: 100% !important;
        max-width: 600px !important;
        height: auto !important;
      }

      .content-pad {
        padding: 30px 22px !important;
      }

      .product-photo {
        width: 100px !important;
      }

      .product-image {
        width: 100px !important;
        max-width: 100px !important;
        height: auto !important;
      }

      .product-details {
        padding-left: 16px !important;
      }

      .support-pad {
        padding: 26px 22px !important;
      }

      .footer-pad {
        padding: 24px 22px !important;
      }

      .main-button {
        width: 100% !important;
      }

      .main-button a {
        display: block !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background-color:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#243f54;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;word-spacing:normal;">


  <div
    aria-hidden="true"
    style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:#f3f5f7;mso-hide:all;"
  >
    Noe til din neste ferie. Fortsett der du slapp.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    bgcolor="#f3f5f7"
    style="width:100%;background-color:#f3f5f7;"
  >
    <tr>
      <td
        class="outer-pad"
        align="center"
        style="padding:28px 16px;"
      >

        <!--[if mso]>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
        <![endif]-->

        <table
          role="presentation"
          class="shell"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          bgcolor="#ffffff"
          style="width:100%;max-width:600px;background-color:#ffffff;"
        >

          <!-- HEADER -->
          <tr>
            <td
              class="header-pad"
              style="padding:24px 30px;background-color:#ffffff;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td align="left" valign="middle">
                    <a
                      href="https://www.skanditravels.com/the-store"
                      target="_blank"
                      style="color:#022e64;text-decoration:none;"
                    >
                      <img class="store-header-logo" src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_NAVY.svg" width="200" height="50" alt="THE STORE" style="display:block;width:200px;height:50px;max-width:100%;font-size:14px;font-weight:bold;color:#022e64;" >
                    </a>
                  </td>

                  <td
                    class="brand-caption"
                    align="right"
                    valign="middle"
                    style="font-size:13px;line-height:16px;letter-spacing:1.2px;font-weight:bold;color:#8fa6bc;white-space:nowrap;"
                  >
                     <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-NAVY-TEXTMARK.svg"
                      width="80"
                      height="32"
                      alt="SKANDI TRAVELS"
                      style="display:inline-block;vertical-align:middle;width:80px;height:auto;max-width:100%;border-left:1px solid #8fa6bc;margin-left:5px;padding-left:10px;color:#022e64;"
                    >
                      
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td
              bgcolor="#e7f3f4"
              style="background-color:#e7f3f4;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="table-layout:fixed;"
              >
                <tr>
                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          class="hero-copy"
                          style="padding:28px;"
                        >
                          <p style="margin:0;font-size:18px;line-height:24px;font-weight:700;color:#022e64;">${escapeHtml(data.firstName)}</p>
                          <h1
                            class="hero-title"
                            style="margin:0 0 16px;font-size:28px;line-height:36px;letter-spacing:-0.7px;font-weight:500;color:#022e64;"
                          >
                            Handlekurven din<br>venter.
                          </h1>

                          <p style="margin:0 0 22px;font-size:15px;line-height:24px;color:#294b60;">
                            Ikke glem det du valgte til neste ferie.<br>Fortsett der du slapp.
                          </p>

                          <!--[if mso]>
                          <v:roundrect
                            href="${escapeHtml(data.checkoutUrl)}"
                            style="height:50px;v-text-anchor:middle;width:220px;"
                            arcsize="8%"
                            stroke="f"
                            fillcolor="#022e64"
                          >
                            <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                            <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">
                              Fortsett å handle
                            </center>
                          </v:roundrect>
                          <![endif]-->

                          <!--[if !mso]><!-->
                          <a
                            class="recovery-button"
                            href="${escapeHtml(data.checkoutUrl)}"
                            target="_blank"
                            style="display:inline-block;padding:16px 24px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:15px;line-height:18px;font-weight:bold;text-align:center;text-decoration:none;mso-hide:all;"
                          >
                            Fortsett å handle
                          </a>
                          <!--<![endif]-->

                        </td>
                      </tr>
                    </table>
                  </td>

                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    align="center"
                    bgcolor="#e7f3f4"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <img
                      class="hero-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/branding/the_store_products/Scandi%20travel%20self-care%20essentials.png"
                      width="300"
                      height="300"
                      alt="SKANDI-produkter, klare for neste reise."
                      style="display:block;width:300px;max-width:100%;height:auto;color:#022e64;font-size:14px;line-height:22px;"
                    >
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- COMPLETE ABANDONED CART: SERVER-RENDERED HANDLEBARS TEMPLATE -->
          <tr>
            <td
              class="content-pad"
              style="padding:34px 36px 32px;border-bottom:1px solid #e1e8ed;"
            >
              <h2 style="margin:0 0 22px;font-size:22px;line-height:28px;letter-spacing:-0.3px;font-weight:700;color:#022e64;">Din lagrede handlekurv</h2>
              <!-- Render every cart.items entry before sending; no fixed item count. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${(data.cart.items || []).map(item => `
                <tr>
                  <td colspan="2" style="padding:0 0 18px;border-bottom:1px solid #e1e8ed;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        ${item.imageUrl ? `
                        <td class="product-photo" width="112" valign="top" style="width:112px;padding-top:18px;">
                          <img class="product-image" src="${escapeHtml(item.imageUrl)}" width="112" alt="${escapeHtml(item.name)}" style="display:block;width:112px;max-width:112px;height:auto;color:#536b7c;font-size:12px;line-height:18px;">
                        </td>
                        ` : ""}
                        <td class="product-details" valign="top" style="padding:18px 0 0 24px;">
                          <h3 style="margin:0 0 6px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;word-break:break-word;">${escapeHtml(item.name)}</h3>
                          ${item.optionsText ? `<p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">${escapeHtml(item.optionsText)}</p>` : ""}
                          <p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">Antall: ${escapeHtml(item.quantity)} &times; ${item.originalUnitPriceFormatted ? `<del style="color:#6b7c89;">${escapeHtml(item.originalUnitPriceFormatted)}</del> &nbsp;` : ""}${escapeHtml(item.unitPriceFormatted)}</p>
                          <p style="margin:0;font-size:16px;line-height:23px;font-weight:bold;color:#022e64;">${escapeHtml(item.lineTotalFormatted)}</p>
                          ${item.discountText ? `<p style="margin:6px 0 0;font-size:12px;line-height:18px;color:#316b59;">${escapeHtml(item.discountText)}</p>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join("")}
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Delsum</td>
                  <td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.subtotalFormatted)}</td>
                </tr>
                ${(data.cart.discounts || []).map(item => `
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">${escapeHtml(item.label)}${item.code ? `<br><span style="font-size:12px;">Kode: <strong>${escapeHtml(item.code)}</strong></span>` : ""}</td>
                  <td align="right" valign="top" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">${item.amountFormatted ? `&minus;${escapeHtml(item.amountFormatted)}` : ""}</td>
                </tr>
                `).join("")}
                ${data.cart.shippingFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Frakt</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.shippingFormatted)}</td></tr>` : ""}
                ${data.cart.taxFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Avgifter</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.taxFormatted)}</td></tr>` : ""}
                ${data.cart.giftCardFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">Gavekort</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">&minus;${escapeHtml(data.cart.giftCardFormatted)}</td></tr>` : ""}
                <tr><td style="padding:13px 12px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">Totalt</td><td align="right" style="padding:13px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">${escapeHtml(data.cart.totalFormatted)}</td></tr>
              </table>
              <p style="margin:8px 0 0;text-align:right;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(data.currency)}</p>

              ${data.cart.offers?.length ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                <tr><td style="padding:16px;background-color:#edf5f6;">
                  <h3 style="margin:0 0 10px;font-size:15px;line-height:21px;color:#022e64;">Tilbud for handlekurven din</h3>
                  ${(data.cart.offers || []).map(item => `
                  <p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;"><strong>${escapeHtml(item.title)}</strong></p>
                  <p style="margin:0 0 5px;font-size:12px;line-height:18px;color:#243f54;">${escapeHtml(item.description)}</p>
                  ${item.code ? `<p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;">Kode: <strong>${escapeHtml(item.code)}</strong></p>` : ""}
                  <p style="margin:0 0 12px;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(item.termsText)}${item.termsUrl ? ` <a href="${escapeHtml(item.termsUrl)}" target="_blank" style="color:#022e64;text-decoration:underline;">Se tilbudsvilkår</a>` : ""}</p>
                  `).join("")}
                </td></tr>
              </table>
              ` : ""}

              <p style="margin:22px 0 24px;font-size:13px;line-height:21px;color:#536b7c;">Se de lagrede varene dine og rabattene som er brukt. Endelige priser og vilkår bekreftes når du går tilbake til kassen.</p>

              <table
                role="presentation"
                class="main-button"
                align="center"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="border-collapse:separate;"
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#022e64"
                    style="border-radius:4px;background-color:#022e64;"
                  >

                    <!--[if mso]>
                    <v:roundrect
                      href="${escapeHtml(data.checkoutUrl)}"
                      style="height:52px;v-text-anchor:middle;width:260px;"
                      arcsize="8%"
                      stroke="f"
                      fillcolor="#022e64"
                    >
                      <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">
                        Til handlekurven min
                      </center>
                    </v:roundrect>
                    <![endif]-->

                    <!--[if !mso]><!-->
                    <a
                      class="recovery-button"
                      href="${escapeHtml(data.checkoutUrl)}"
                      target="_blank"
                      style="display:inline-block;padding:17px 44px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:16px;line-height:18px;font-weight:bold;text-decoration:none;mso-hide:all;"
                    >
                      Til handlekurven min
                    </a>
                    <!--<![endif]-->

                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Varene er ikke reservert. Priser og tilgjengelighet kan endres.
              </p>

              <p style="margin:8px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Har du allerede bestilt? Da kan du se bort fra denne påminnelsen.
              </p>
            </td>
          </tr>

`;
  let recommendations = "";
  if (data.recommendations.length === 2) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Litt ekstra til reisen</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">Mer fra The Store til neste reise. Se gjeldende alternativer og priser på produktsidene.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 12px 0 0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Se produkt</a></p>
                  </td>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 0 0 12px;">
                    <a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[1].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[1].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[1].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Se produkt</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  } else if (data.recommendations.length === 1) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Litt ekstra til reisen</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">Mer fra The Store til neste reise. Se gjeldende alternativer og priser på produktsidene.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="100%" valign="top" style="width:100%;padding:0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Se produkt</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  }
  const clubOffer = data.clubOfferTermsUrl ? `          <!-- CLUB SIGNUP OFFER: NON-MEMBERS ONLY. Select this complete email only after a trusted send-time membership check has confirmed is_loyalty_member === false. Unknown/error uses the member/no-offer version. -->
          <tr>
            <td class="content-pad" style="padding:30px 36px;background-color:#f6faff;border-bottom:1px solid #e1e8ed;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                <tr>
                  <td align="left" bgcolor="#e7f3f4" style="padding:26px 24px;border-left:4px solid #5fc7cf;background-color:#e7f3f4;">
                    <p style="margin:0 0 9px;font-size:11px;line-height:16px;letter-spacing:1px;font-weight:bold;color:#022e64;">SKANDI CLUB · SPESIALTILBUD</p>
                    <h2 style="margin:0 0 12px;font-size:24px;line-height:30px;font-weight:700;color:#022e64;">Bli medlem gratis. Start med en bonus.</h2>
                    <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#243f54;">Bli med i SKANDI Club og få en velkomstbonus med ekstra SKANDI Points.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                      <tr>
                        <td align="center" bgcolor="#022e64" style="border-radius:4px;background-color:#022e64;mso-padding-alt:14px 22px;">
                          <a class="club-signup-button" href="https://www.skanditravels.com/skandi-club" target="_blank" style="display:inline-block;padding:14px 22px;border:1px solid #022e64;border-radius:4px;color:#ffffff;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none;">Bli med i SKANDI Club</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:11px;line-height:16px;color:#536b7c;">For nye medlemmer i SKANDI Club. <a href="${escapeHtml(data.clubOfferTermsUrl)}" style="color:#022e64;text-decoration:underline;">Tilbudsvilkår gjelder.</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

` : "";
  const footer = `          <!-- CUSTOMER SERVICE -->
          <tr>
            <td
              class="support-pad"
              align="center"
              bgcolor="#edf5f6"
              style="padding:28px 36px;background-color:#edf5f6;"
            >
              <h2 style="margin:0 0 10px;font-size:20px;line-height:26px;font-weight:700;color:#022e64;">
                Spørsmål før du bestiller?
              </h2>

              <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#37556a;">
                For hjelp med produkter, levering eller betaling,<br>
                ta kontakt med teamet vårt.
              </p>

              <p style="margin:0;font-size:14px;line-height:24px;">
                <a
                  href="https://www.skanditravels.com/about/support"
                  target="_blank"
                  style="color:#022e64;font-weight:bold;text-decoration:underline;"
                >
                  Kontakt kundeservice
                </a>
              </p>

              <p style="margin:8px 0 0;font-size:13px;line-height:22px;">
                <a
                  href="mailto:support@skanditravels.com"
                  style="color:#37556a;text-decoration:underline;"
                >
                  support@skanditravels.com
                </a>
              </p>
            </td>
          </tr>

          <!-- FOOTER: original branding; secondary legal copy; retain Wix's managed preferences footer -->
          <tr>
            <td
              class="footer-pad"
              align="left"
              bgcolor="#022e64"
              style="padding:24px 36px;background-color:#022e64;"
            >
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="footer-brand-cell" width="180" valign="middle" align="left" style="width:180px;padding:0 0 14px;">
                    <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_LIGHT.svg"
                      width="150" height="38" alt="THE STORE"
                      style="display:block;width:150px;height:auto;max-width:100%;color:#ffffff;"
                    >
                    <p style="margin:5px 0 0;font-size:12px;line-height:20px;color:#8fa6bc;">by <b>SKANDI TRAVELS</b></p>
                  </td>
                  <td class="footer-brand-cell footer-group-cell" valign="middle" align="right" style="padding:0 0 14px;">
                    <img class="group-member-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_GROUP-MEMBER-LIGHT.svg"
                      width="230" height="29" alt="A SKANDI GROUP MEMBER"
                      style="display:block;width:230px;height:auto;max-width:100%;margin-left:auto;color:#ffffff;"
                    >
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:12px;line-height:24px;">
                <a
                  href="https://www.instagram.com/skanditravels"
                  target="_blank"
                  style="color:#faf6ff;text-decoration:underline;"
                >Instagram</a>
                <span aria-hidden="true" style="color:#8fa6bc;">
                  &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                </span>
                <a
                  href="https://www.facebook.com/skanditravels"
                  target="_blank"
                  style="color:#f6faff;text-decoration:underline;"
                >Facebook</a>
              </p>

              <p style="margin:0 0 8px;font-size:11px;line-height:16px;color:#a2b4c5;">Reklame. Påminnelse om handlekurven din hos THE STORE.</p>

              <!-- Business Info source: primary US HQ and Sweden HQ. Swedish registered seat and organisation number remain separate unverified company particulars. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 4px;table-layout:fixed;">
                <tr>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 18px 8px 0;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">HOVEDKONTOR USA</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Inc.</p>
                    <p style="margin:0;font-size:11px;line-height:16px;color:#a2b4c5;">450 Lexington Avenue<br>New York, NY 10163<br>USA</p>
                  </td>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 0 8px 12px;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">HOVEDKONTOR SVERIGE</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Aktiebolag</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;color:#a2b4c5;">Biblioteksgatan 11<br>111 46 Stockholm<br>Sverige</p>
                    <p style="margin:0;font-size:11px;line-height:16px;"><a href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#a2b4c5;text-decoration:underline;">Selskapsinformasjon</a></p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:11px;line-height:16px;color:#a2b4c5;">Stopp markedsførings-e-post via lenken for avmelding eller e-postinnstillinger nedenfor.</p>
              <p style="margin:0 0 10px;font-size:11px;line-height:16px;"><a href="[SKANDI_WIX_UNSUBSCRIBE_URL]" style="color:#f6faff;text-decoration:underline;">Meld av</a></p>

              <p style="margin:0 0 10px;font-size:11px;line-height:18px;">
                <a href="https://www.skanditravels.com/about/legal/policies?slug=privacy-policy" target="_blank" style="color:#f6faff;text-decoration:underline;">Personvern</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a href="mailto:support@skanditravels.com" style="color:#f6faff;text-decoration:underline;">Kontakt</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a
                  href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#f6faff;text-decoration:underline;">Vilkår &amp; retningslinjer</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com/the-store" target="_blank" style="color:#f6faff;text-decoration:underline;">THE STORE</a>
              <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com" style="color:#f6faff;text-decoration:underline;">SKANDI TRAVELS</a>
            </p>
              <p style="margin:0;border-bottom:1px solid #284d76;border-top:1px solid #284d76;padding:9px 0;font-size:10px;line-height:15px;color:#a2b4c5;">© 2026 SKANDI GROUP Inc. (USA) &amp; SKANDI GROUP Aktiebolag (Sverige). Alle rettigheter forbeholdt. THE STORE™ &amp; SKANDI TRAVELS™ er varemerker som tilhører SKANDI GROUP.
              </p>
            </td>
          </tr>
          <tr><td style="background-color:#f6faff;height:5px;font-size:0;line-height:5px;">&nbsp;</td></tr>
        </table>

        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>


</body>
</html>`;
  return { subject: "Favorittene dine ligger fortsatt i SKANDI-handlekurven", html: start + recommendations + clubOffer + footer };
}

function renderDA(data) {
  const start = `<!DOCTYPE html>
<html lang="da" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Din kurv venter | The Store by SKANDI Travels</title>

  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->

  <style>
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }

    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
    }

    @media only screen and (max-width: 620px) {
      .outer-pad {
        padding: 12px 8px !important;
      }

      .shell {
        width: 100% !important;
        max-width: 600px !important;
      }

      .header-pad {
        padding: 22px !important;
      }

      .brand-caption {
        display: table-cell !important;
        width: 96px !important;
      }

      .store-header-logo {
        width: 140px !important;
        height: auto !important;
      }

      .footer-brand-cell,
      .upsell-cell {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
      }

      .company-details-cell {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        padding: 0 0 8px !important;
      }

      .footer-group-cell {
        padding: 0 0 14px !important;
      }

      .group-member-image {
        margin-left: 0 !important;
      }

      .upsell-cell {
        padding: 0 0 26px !important;
      }

      .upsell-image {
        width: 230px !important;
        max-width: 100% !important;
        height: auto !important;
      }

      .hero-column {
        display: block !important;
        width: 100% !important;
      }

      .hero-copy {
        padding: 30px 24px !important;
      }

      .hero-title {
        font-size: 34px !important;
        line-height: 38px !important;
      }

      .hero-image {
        width: 100% !important;
        max-width: 600px !important;
        height: auto !important;
      }

      .content-pad {
        padding: 30px 22px !important;
      }

      .product-photo {
        width: 100px !important;
      }

      .product-image {
        width: 100px !important;
        max-width: 100px !important;
        height: auto !important;
      }

      .product-details {
        padding-left: 16px !important;
      }

      .support-pad {
        padding: 26px 22px !important;
      }

      .footer-pad {
        padding: 24px 22px !important;
      }

      .main-button {
        width: 100% !important;
      }

      .main-button a {
        display: block !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background-color:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#243f54;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;word-spacing:normal;">


  <div
    aria-hidden="true"
    style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:#f3f5f7;mso-hide:all;"
  >
    Lidt til din næste ferie. Fortsæt, hvor du slap.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    bgcolor="#f3f5f7"
    style="width:100%;background-color:#f3f5f7;"
  >
    <tr>
      <td
        class="outer-pad"
        align="center"
        style="padding:28px 16px;"
      >

        <!--[if mso]>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
        <![endif]-->

        <table
          role="presentation"
          class="shell"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          bgcolor="#ffffff"
          style="width:100%;max-width:600px;background-color:#ffffff;"
        >

          <!-- HEADER -->
          <tr>
            <td
              class="header-pad"
              style="padding:24px 30px;background-color:#ffffff;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td align="left" valign="middle">
                    <a
                      href="https://www.skanditravels.com/the-store"
                      target="_blank"
                      style="color:#022e64;text-decoration:none;"
                    >
                      <img class="store-header-logo" src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_NAVY.svg" width="200" height="50" alt="THE STORE" style="display:block;width:200px;height:50px;max-width:100%;font-size:14px;font-weight:bold;color:#022e64;" >
                    </a>
                  </td>

                  <td
                    class="brand-caption"
                    align="right"
                    valign="middle"
                    style="font-size:13px;line-height:16px;letter-spacing:1.2px;font-weight:bold;color:#8fa6bc;white-space:nowrap;"
                  >
                     <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-NAVY-TEXTMARK.svg"
                      width="80"
                      height="32"
                      alt="SKANDI TRAVELS"
                      style="display:inline-block;vertical-align:middle;width:80px;height:auto;max-width:100%;border-left:1px solid #8fa6bc;margin-left:5px;padding-left:10px;color:#022e64;"
                    >
                      
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td
              bgcolor="#e7f3f4"
              style="background-color:#e7f3f4;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="table-layout:fixed;"
              >
                <tr>
                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          class="hero-copy"
                          style="padding:28px;"
                        >
                          <p style="margin:0;font-size:18px;line-height:24px;font-weight:700;color:#022e64;">${escapeHtml(data.firstName)}</p>
                          <h1
                            class="hero-title"
                            style="margin:0 0 16px;font-size:28px;line-height:36px;letter-spacing:-0.7px;font-weight:500;color:#022e64;"
                          >
                            Din kurv<br>venter.
                          </h1>

                          <p style="margin:0 0 22px;font-size:15px;line-height:24px;color:#294b60;">
                            Glem ikke det, du valgte til næste ferie.<br>Fortsæt, hvor du slap.
                          </p>

                          <!--[if mso]>
                          <v:roundrect
                            href="${escapeHtml(data.checkoutUrl)}"
                            style="height:50px;v-text-anchor:middle;width:220px;"
                            arcsize="8%"
                            stroke="f"
                            fillcolor="#022e64"
                          >
                            <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                            <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">
                              Fortsæt med at handle
                            </center>
                          </v:roundrect>
                          <![endif]-->

                          <!--[if !mso]><!-->
                          <a
                            class="recovery-button"
                            href="${escapeHtml(data.checkoutUrl)}"
                            target="_blank"
                            style="display:inline-block;padding:16px 24px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:15px;line-height:18px;font-weight:bold;text-align:center;text-decoration:none;mso-hide:all;"
                          >
                            Fortsæt med at handle
                          </a>
                          <!--<![endif]-->

                        </td>
                      </tr>
                    </table>
                  </td>

                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    align="center"
                    bgcolor="#e7f3f4"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <img
                      class="hero-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/branding/the_store_products/Scandi%20travel%20self-care%20essentials.png"
                      width="300"
                      height="300"
                      alt="SKANDI-produkter, klar til næste rejse."
                      style="display:block;width:300px;max-width:100%;height:auto;color:#022e64;font-size:14px;line-height:22px;"
                    >
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- COMPLETE ABANDONED CART: SERVER-RENDERED HANDLEBARS TEMPLATE -->
          <tr>
            <td
              class="content-pad"
              style="padding:34px 36px 32px;border-bottom:1px solid #e1e8ed;"
            >
              <h2 style="margin:0 0 22px;font-size:22px;line-height:28px;letter-spacing:-0.3px;font-weight:700;color:#022e64;">Din gemte kurv</h2>
              <!-- Render every cart.items entry before sending; no fixed item count. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${(data.cart.items || []).map(item => `
                <tr>
                  <td colspan="2" style="padding:0 0 18px;border-bottom:1px solid #e1e8ed;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        ${item.imageUrl ? `
                        <td class="product-photo" width="112" valign="top" style="width:112px;padding-top:18px;">
                          <img class="product-image" src="${escapeHtml(item.imageUrl)}" width="112" alt="${escapeHtml(item.name)}" style="display:block;width:112px;max-width:112px;height:auto;color:#536b7c;font-size:12px;line-height:18px;">
                        </td>
                        ` : ""}
                        <td class="product-details" valign="top" style="padding:18px 0 0 24px;">
                          <h3 style="margin:0 0 6px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;word-break:break-word;">${escapeHtml(item.name)}</h3>
                          ${item.optionsText ? `<p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">${escapeHtml(item.optionsText)}</p>` : ""}
                          <p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">Antal: ${escapeHtml(item.quantity)} &times; ${item.originalUnitPriceFormatted ? `<del style="color:#6b7c89;">${escapeHtml(item.originalUnitPriceFormatted)}</del> &nbsp;` : ""}${escapeHtml(item.unitPriceFormatted)}</p>
                          <p style="margin:0;font-size:16px;line-height:23px;font-weight:bold;color:#022e64;">${escapeHtml(item.lineTotalFormatted)}</p>
                          ${item.discountText ? `<p style="margin:6px 0 0;font-size:12px;line-height:18px;color:#316b59;">${escapeHtml(item.discountText)}</p>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join("")}
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Subtotal</td>
                  <td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.subtotalFormatted)}</td>
                </tr>
                ${(data.cart.discounts || []).map(item => `
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">${escapeHtml(item.label)}${item.code ? `<br><span style="font-size:12px;">Kode: <strong>${escapeHtml(item.code)}</strong></span>` : ""}</td>
                  <td align="right" valign="top" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">${item.amountFormatted ? `&minus;${escapeHtml(item.amountFormatted)}` : ""}</td>
                </tr>
                `).join("")}
                ${data.cart.shippingFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Fragt</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.shippingFormatted)}</td></tr>` : ""}
                ${data.cart.taxFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Moms</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.taxFormatted)}</td></tr>` : ""}
                ${data.cart.giftCardFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">Gavekort</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">&minus;${escapeHtml(data.cart.giftCardFormatted)}</td></tr>` : ""}
                <tr><td style="padding:13px 12px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">I alt</td><td align="right" style="padding:13px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">${escapeHtml(data.cart.totalFormatted)}</td></tr>
              </table>
              <p style="margin:8px 0 0;text-align:right;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(data.currency)}</p>

              ${data.cart.offers?.length ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                <tr><td style="padding:16px;background-color:#edf5f6;">
                  <h3 style="margin:0 0 10px;font-size:15px;line-height:21px;color:#022e64;">Tilbud til din kurv</h3>
                  ${(data.cart.offers || []).map(item => `
                  <p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;"><strong>${escapeHtml(item.title)}</strong></p>
                  <p style="margin:0 0 5px;font-size:12px;line-height:18px;color:#243f54;">${escapeHtml(item.description)}</p>
                  ${item.code ? `<p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;">Kode: <strong>${escapeHtml(item.code)}</strong></p>` : ""}
                  <p style="margin:0 0 12px;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(item.termsText)}${item.termsUrl ? ` <a href="${escapeHtml(item.termsUrl)}" target="_blank" style="color:#022e64;text-decoration:underline;">Se tilbuddets vilkår</a>` : ""}</p>
                  `).join("")}
                </td></tr>
              </table>
              ` : ""}

              <p style="margin:22px 0 24px;font-size:13px;line-height:21px;color:#536b7c;">Se dine gemte varer og anvendte rabatter. Endelige priser og vilkår bekræftes, når du vender tilbage til kassen.</p>

              <table
                role="presentation"
                class="main-button"
                align="center"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="border-collapse:separate;"
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#022e64"
                    style="border-radius:4px;background-color:#022e64;"
                  >

                    <!--[if mso]>
                    <v:roundrect
                      href="${escapeHtml(data.checkoutUrl)}"
                      style="height:52px;v-text-anchor:middle;width:260px;"
                      arcsize="8%"
                      stroke="f"
                      fillcolor="#022e64"
                    >
                      <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">
                        Til min kurv
                      </center>
                    </v:roundrect>
                    <![endif]-->

                    <!--[if !mso]><!-->
                    <a
                      class="recovery-button"
                      href="${escapeHtml(data.checkoutUrl)}"
                      target="_blank"
                      style="display:inline-block;padding:17px 44px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:16px;line-height:18px;font-weight:bold;text-decoration:none;mso-hide:all;"
                    >
                      Til min kurv
                    </a>
                    <!--<![endif]-->

                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Varerne er ikke reserveret. Priser og tilgængelighed kan ændre sig.
              </p>

              <p style="margin:8px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Har du allerede bestilt? Så kan du se bort fra denne påmindelse.
              </p>
            </td>
          </tr>

`;
  let recommendations = "";
  if (data.recommendations.length === 2) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Lidt ekstra til rejsen</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">Mere fra The Store til næste rejse. Se aktuelle muligheder og priser på produktsiderne.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 12px 0 0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Se produkt</a></p>
                  </td>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 0 0 12px;">
                    <a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[1].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[1].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[1].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Se produkt</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  } else if (data.recommendations.length === 1) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Lidt ekstra til rejsen</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">Mere fra The Store til næste rejse. Se aktuelle muligheder og priser på produktsiderne.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="100%" valign="top" style="width:100%;padding:0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Se produkt</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  }
  const clubOffer = data.clubOfferTermsUrl ? `          <!-- CLUB SIGNUP OFFER: NON-MEMBERS ONLY. Select this complete email only after a trusted send-time membership check has confirmed is_loyalty_member === false. Unknown/error uses the member/no-offer version. -->
          <tr>
            <td class="content-pad" style="padding:30px 36px;background-color:#f6faff;border-bottom:1px solid #e1e8ed;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                <tr>
                  <td align="left" bgcolor="#e7f3f4" style="padding:26px 24px;border-left:4px solid #5fc7cf;background-color:#e7f3f4;">
                    <p style="margin:0 0 9px;font-size:11px;line-height:16px;letter-spacing:1px;font-weight:bold;color:#022e64;">SKANDI CLUB · SÆRTILBUD</p>
                    <h2 style="margin:0 0 12px;font-size:24px;line-height:30px;font-weight:700;color:#022e64;">Bliv medlem gratis. Start med en bonus.</h2>
                    <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#243f54;">Bliv medlem af SKANDI Club og få en velkomstbonus med ekstra SKANDI Points.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                      <tr>
                        <td align="center" bgcolor="#022e64" style="border-radius:4px;background-color:#022e64;mso-padding-alt:14px 22px;">
                          <a class="club-signup-button" href="https://www.skanditravels.com/skandi-club" target="_blank" style="display:inline-block;padding:14px 22px;border:1px solid #022e64;border-radius:4px;color:#ffffff;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none;">Bliv medlem af SKANDI Club</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:11px;line-height:16px;color:#536b7c;">For nye medlemmer af SKANDI Club. <a href="${escapeHtml(data.clubOfferTermsUrl)}" style="color:#022e64;text-decoration:underline;">Tilbuddets vilkår gælder.</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

` : "";
  const footer = `          <!-- CUSTOMER SERVICE -->
          <tr>
            <td
              class="support-pad"
              align="center"
              bgcolor="#edf5f6"
              style="padding:28px 36px;background-color:#edf5f6;"
            >
              <h2 style="margin:0 0 10px;font-size:20px;line-height:26px;font-weight:700;color:#022e64;">
                Spørgsmål, før du bestiller?
              </h2>

              <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#37556a;">
                Har du brug for hjælp til produkter, levering eller betaling,<br>
                så kontakt vores team.
              </p>

              <p style="margin:0;font-size:14px;line-height:24px;">
                <a
                  href="https://www.skanditravels.com/about/support"
                  target="_blank"
                  style="color:#022e64;font-weight:bold;text-decoration:underline;"
                >
                  Kontakt kundeservice
                </a>
              </p>

              <p style="margin:8px 0 0;font-size:13px;line-height:22px;">
                <a
                  href="mailto:support@skanditravels.com"
                  style="color:#37556a;text-decoration:underline;"
                >
                  support@skanditravels.com
                </a>
              </p>
            </td>
          </tr>

          <!-- FOOTER: original branding; secondary legal copy; retain Wix's managed preferences footer -->
          <tr>
            <td
              class="footer-pad"
              align="left"
              bgcolor="#022e64"
              style="padding:24px 36px;background-color:#022e64;"
            >
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="footer-brand-cell" width="180" valign="middle" align="left" style="width:180px;padding:0 0 14px;">
                    <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_LIGHT.svg"
                      width="150" height="38" alt="THE STORE"
                      style="display:block;width:150px;height:auto;max-width:100%;color:#ffffff;"
                    >
                    <p style="margin:5px 0 0;font-size:12px;line-height:20px;color:#8fa6bc;">by <b>SKANDI TRAVELS</b></p>
                  </td>
                  <td class="footer-brand-cell footer-group-cell" valign="middle" align="right" style="padding:0 0 14px;">
                    <img class="group-member-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_GROUP-MEMBER-LIGHT.svg"
                      width="230" height="29" alt="A SKANDI GROUP MEMBER"
                      style="display:block;width:230px;height:auto;max-width:100%;margin-left:auto;color:#ffffff;"
                    >
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:12px;line-height:24px;">
                <a
                  href="https://www.instagram.com/skanditravels"
                  target="_blank"
                  style="color:#faf6ff;text-decoration:underline;"
                >Instagram</a>
                <span aria-hidden="true" style="color:#8fa6bc;">
                  &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                </span>
                <a
                  href="https://www.facebook.com/skanditravels"
                  target="_blank"
                  style="color:#f6faff;text-decoration:underline;"
                >Facebook</a>
              </p>

              <p style="margin:0 0 8px;font-size:11px;line-height:16px;color:#a2b4c5;">Reklame. Påmindelse om din kurv hos THE STORE.</p>

              <!-- Business Info source: primary US HQ and Sweden HQ. Swedish registered seat and organisation number remain separate unverified company particulars. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 4px;table-layout:fixed;">
                <tr>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 18px 8px 0;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">HOVEDKONTOR USA</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Inc.</p>
                    <p style="margin:0;font-size:11px;line-height:16px;color:#a2b4c5;">450 Lexington Avenue<br>New York, NY 10163<br>USA</p>
                  </td>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 0 8px 12px;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">HOVEDKONTOR SVERIGE</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Aktiebolag</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;color:#a2b4c5;">Biblioteksgatan 11<br>111 46 Stockholm<br>Sverige</p>
                    <p style="margin:0;font-size:11px;line-height:16px;"><a href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#a2b4c5;text-decoration:underline;">Virksomhedsoplysninger</a></p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:11px;line-height:16px;color:#a2b4c5;">Stop markedsføringsmails via linket til afmelding eller e-mailindstillinger nedenfor.</p>
              <p style="margin:0 0 10px;font-size:11px;line-height:16px;"><a href="[SKANDI_WIX_UNSUBSCRIBE_URL]" style="color:#f6faff;text-decoration:underline;">Afmeld</a></p>

              <p style="margin:0 0 10px;font-size:11px;line-height:18px;">
                <a href="https://www.skanditravels.com/about/legal/policies?slug=privacy-policy" target="_blank" style="color:#f6faff;text-decoration:underline;">Privatliv</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a href="mailto:support@skanditravels.com" style="color:#f6faff;text-decoration:underline;">Kontakt</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a
                  href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#f6faff;text-decoration:underline;">Vilkår &amp; politikker</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com/the-store" target="_blank" style="color:#f6faff;text-decoration:underline;">THE STORE</a>
              <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com" style="color:#f6faff;text-decoration:underline;">SKANDI TRAVELS</a>
            </p>
              <p style="margin:0;border-bottom:1px solid #284d76;border-top:1px solid #284d76;padding:9px 0;font-size:10px;line-height:15px;color:#a2b4c5;">© 2026 SKANDI GROUP Inc. (USA) &amp; SKANDI GROUP Aktiebolag (Sverige). Alle rettigheder forbeholdes. THE STORE™ &amp; SKANDI TRAVELS™ er varemærker tilhørende SKANDI GROUP.
              </p>
            </td>
          </tr>
          <tr><td style="background-color:#f6faff;height:5px;font-size:0;line-height:5px;">&nbsp;</td></tr>
        </table>

        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>


</body>
</html>`;
  return { subject: "Dine favoritter ligger stadig i din SKANDI-kurv", html: start + recommendations + clubOffer + footer };
}

function renderFI(data) {
  const start = `<!DOCTYPE html>
<html lang="fi" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Ostoskorisi odottaa | The Store by SKANDI Travels</title>

  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->

  <style>
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }

    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
    }

    @media only screen and (max-width: 620px) {
      .outer-pad {
        padding: 12px 8px !important;
      }

      .shell {
        width: 100% !important;
        max-width: 600px !important;
      }

      .header-pad {
        padding: 22px !important;
      }

      .brand-caption {
        display: table-cell !important;
        width: 96px !important;
      }

      .store-header-logo {
        width: 140px !important;
        height: auto !important;
      }

      .footer-brand-cell,
      .upsell-cell {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
      }

      .company-details-cell {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        padding: 0 0 8px !important;
      }

      .footer-group-cell {
        padding: 0 0 14px !important;
      }

      .group-member-image {
        margin-left: 0 !important;
      }

      .upsell-cell {
        padding: 0 0 26px !important;
      }

      .upsell-image {
        width: 230px !important;
        max-width: 100% !important;
        height: auto !important;
      }

      .hero-column {
        display: block !important;
        width: 100% !important;
      }

      .hero-copy {
        padding: 30px 24px !important;
      }

      .hero-title {
        font-size: 34px !important;
        line-height: 38px !important;
      }

      .hero-image {
        width: 100% !important;
        max-width: 600px !important;
        height: auto !important;
      }

      .content-pad {
        padding: 30px 22px !important;
      }

      .product-photo {
        width: 100px !important;
      }

      .product-image {
        width: 100px !important;
        max-width: 100px !important;
        height: auto !important;
      }

      .product-details {
        padding-left: 16px !important;
      }

      .support-pad {
        padding: 26px 22px !important;
      }

      .footer-pad {
        padding: 24px 22px !important;
      }

      .main-button {
        width: 100% !important;
      }

      .main-button a {
        display: block !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background-color:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#243f54;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;word-spacing:normal;">


  <div
    aria-hidden="true"
    style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:#f3f5f7;mso-hide:all;"
  >
    Jotakin seuraavalle lomallesi. Jatka siitä, mihin jäit.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    bgcolor="#f3f5f7"
    style="width:100%;background-color:#f3f5f7;"
  >
    <tr>
      <td
        class="outer-pad"
        align="center"
        style="padding:28px 16px;"
      >

        <!--[if mso]>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
        <![endif]-->

        <table
          role="presentation"
          class="shell"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          bgcolor="#ffffff"
          style="width:100%;max-width:600px;background-color:#ffffff;"
        >

          <!-- HEADER -->
          <tr>
            <td
              class="header-pad"
              style="padding:24px 30px;background-color:#ffffff;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td align="left" valign="middle">
                    <a
                      href="https://www.skanditravels.com/the-store"
                      target="_blank"
                      style="color:#022e64;text-decoration:none;"
                    >
                      <img class="store-header-logo" src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_NAVY.svg" width="200" height="50" alt="THE STORE" style="display:block;width:200px;height:50px;max-width:100%;font-size:14px;font-weight:bold;color:#022e64;" >
                    </a>
                  </td>

                  <td
                    class="brand-caption"
                    align="right"
                    valign="middle"
                    style="font-size:13px;line-height:16px;letter-spacing:1.2px;font-weight:bold;color:#8fa6bc;white-space:nowrap;"
                  >
                     <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-NAVY-TEXTMARK.svg"
                      width="80"
                      height="32"
                      alt="SKANDI TRAVELS"
                      style="display:inline-block;vertical-align:middle;width:80px;height:auto;max-width:100%;border-left:1px solid #8fa6bc;margin-left:5px;padding-left:10px;color:#022e64;"
                    >
                      
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td
              bgcolor="#e7f3f4"
              style="background-color:#e7f3f4;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="table-layout:fixed;"
              >
                <tr>
                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          class="hero-copy"
                          style="padding:28px;"
                        >
                          <p style="margin:0;font-size:18px;line-height:24px;font-weight:700;color:#022e64;">${escapeHtml(data.firstName)}</p>
                          <h1
                            class="hero-title"
                            style="margin:0 0 16px;font-size:28px;line-height:36px;letter-spacing:-0.7px;font-weight:500;color:#022e64;"
                          >
                            Ostoskorisi<br>odottaa.
                          </h1>

                          <p style="margin:0 0 22px;font-size:15px;line-height:24px;color:#294b60;">
                            Muista seuraavaa lomaasi varten valitsemasi tuotteet.<br>Jatka siitä, mihin jäit.
                          </p>

                          <!--[if mso]>
                          <v:roundrect
                            href="${escapeHtml(data.checkoutUrl)}"
                            style="height:50px;v-text-anchor:middle;width:220px;"
                            arcsize="8%"
                            stroke="f"
                            fillcolor="#022e64"
                          >
                            <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                            <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">
                              Jatka ostoksia
                            </center>
                          </v:roundrect>
                          <![endif]-->

                          <!--[if !mso]><!-->
                          <a
                            class="recovery-button"
                            href="${escapeHtml(data.checkoutUrl)}"
                            target="_blank"
                            style="display:inline-block;padding:16px 24px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:15px;line-height:18px;font-weight:bold;text-align:center;text-decoration:none;mso-hide:all;"
                          >
                            Jatka ostoksia
                          </a>
                          <!--<![endif]-->

                        </td>
                      </tr>
                    </table>
                  </td>

                  <td
                    class="hero-column"
                    width="300"
                    valign="middle"
                    align="center"
                    bgcolor="#e7f3f4"
                    style="width:50%;background-color:#e7f3f4;"
                  >
                    <img
                      class="hero-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/branding/the_store_products/Scandi%20travel%20self-care%20essentials.png"
                      width="300"
                      height="300"
                      alt="SKANDI-matkatuotteita seuraavalle lomallesi."
                      style="display:block;width:300px;max-width:100%;height:auto;color:#022e64;font-size:14px;line-height:22px;"
                    >
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- COMPLETE ABANDONED CART: SERVER-RENDERED HANDLEBARS TEMPLATE -->
          <tr>
            <td
              class="content-pad"
              style="padding:34px 36px 32px;border-bottom:1px solid #e1e8ed;"
            >
              <h2 style="margin:0 0 22px;font-size:22px;line-height:28px;letter-spacing:-0.3px;font-weight:700;color:#022e64;">Tallennettu ostoskorisi</h2>
              <!-- Render every cart.items entry before sending; no fixed item count. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${(data.cart.items || []).map(item => `
                <tr>
                  <td colspan="2" style="padding:0 0 18px;border-bottom:1px solid #e1e8ed;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        ${item.imageUrl ? `
                        <td class="product-photo" width="112" valign="top" style="width:112px;padding-top:18px;">
                          <img class="product-image" src="${escapeHtml(item.imageUrl)}" width="112" alt="${escapeHtml(item.name)}" style="display:block;width:112px;max-width:112px;height:auto;color:#536b7c;font-size:12px;line-height:18px;">
                        </td>
                        ` : ""}
                        <td class="product-details" valign="top" style="padding:18px 0 0 24px;">
                          <h3 style="margin:0 0 6px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;word-break:break-word;">${escapeHtml(item.name)}</h3>
                          ${item.optionsText ? `<p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">${escapeHtml(item.optionsText)}</p>` : ""}
                          <p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#536b7c;">Määrä: ${escapeHtml(item.quantity)} &times; ${item.originalUnitPriceFormatted ? `<del style="color:#6b7c89;">${escapeHtml(item.originalUnitPriceFormatted)}</del> &nbsp;` : ""}${escapeHtml(item.unitPriceFormatted)}</p>
                          <p style="margin:0;font-size:16px;line-height:23px;font-weight:bold;color:#022e64;">${escapeHtml(item.lineTotalFormatted)}</p>
                          ${item.discountText ? `<p style="margin:6px 0 0;font-size:12px;line-height:18px;color:#316b59;">${escapeHtml(item.discountText)}</p>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join("")}
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Välisumma</td>
                  <td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.subtotalFormatted)}</td>
                </tr>
                ${(data.cart.discounts || []).map(item => `
                <tr>
                  <td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">${escapeHtml(item.label)}${item.code ? `<br><span style="font-size:12px;">Koodi: <strong>${escapeHtml(item.code)}</strong></span>` : ""}</td>
                  <td align="right" valign="top" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">${item.amountFormatted ? `&minus;${escapeHtml(item.amountFormatted)}` : ""}</td>
                </tr>
                `).join("")}
                ${data.cart.shippingFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Toimitus</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.shippingFormatted)}</td></tr>` : ""}
                ${data.cart.taxFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#536b7c;">Verot</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#243f54;">${escapeHtml(data.cart.taxFormatted)}</td></tr>` : ""}
                ${data.cart.giftCardFormatted ? `<tr><td style="padding:5px 12px 5px 0;font-size:13px;line-height:20px;color:#316b59;">Lahjakortti</td><td align="right" style="padding:5px 0;font-size:13px;line-height:20px;color:#316b59;">&minus;${escapeHtml(data.cart.giftCardFormatted)}</td></tr>` : ""}
                <tr><td style="padding:13px 12px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">Yhteensä</td><td align="right" style="padding:13px 0 0;border-top:1px solid #e1e8ed;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">${escapeHtml(data.cart.totalFormatted)}</td></tr>
              </table>
              <p style="margin:8px 0 0;text-align:right;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(data.currency)}</p>

              ${data.cart.offers?.length ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                <tr><td style="padding:16px;background-color:#edf5f6;">
                  <h3 style="margin:0 0 10px;font-size:15px;line-height:21px;color:#022e64;">Tarjouksia ostoskorillesi</h3>
                  ${(data.cart.offers || []).map(item => `
                  <p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;"><strong>${escapeHtml(item.title)}</strong></p>
                  <p style="margin:0 0 5px;font-size:12px;line-height:18px;color:#243f54;">${escapeHtml(item.description)}</p>
                  ${item.code ? `<p style="margin:0 0 5px;font-size:13px;line-height:20px;color:#022e64;">Koodi: <strong>${escapeHtml(item.code)}</strong></p>` : ""}
                  <p style="margin:0 0 12px;font-size:11px;line-height:16px;color:#536b7c;">${escapeHtml(item.termsText)}${item.termsUrl ? ` <a href="${escapeHtml(item.termsUrl)}" target="_blank" style="color:#022e64;text-decoration:underline;">Katso tarjouksen ehdot</a>` : ""}</p>
                  `).join("")}
                </td></tr>
              </table>
              ` : ""}

              <p style="margin:22px 0 24px;font-size:13px;line-height:21px;color:#536b7c;">Tarkista tallennetut tuotteesi ja käytetyt alennukset. Lopulliset hinnat ja tarjousten ehdot vahvistetaan kassalla.</p>

              <table
                role="presentation"
                class="main-button"
                align="center"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="border-collapse:separate;"
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#022e64"
                    style="border-radius:4px;background-color:#022e64;"
                  >

                    <!--[if mso]>
                    <v:roundrect
                      href="${escapeHtml(data.checkoutUrl)}"
                      style="height:52px;v-text-anchor:middle;width:260px;"
                      arcsize="8%"
                      stroke="f"
                      fillcolor="#022e64"
                    >
                      <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">
                        Takaisin ostoskoriini
                      </center>
                    </v:roundrect>
                    <![endif]-->

                    <!--[if !mso]><!-->
                    <a
                      class="recovery-button"
                      href="${escapeHtml(data.checkoutUrl)}"
                      target="_blank"
                      style="display:inline-block;padding:17px 44px;border:1px solid #022e64;border-radius:4px;background-color:#022e64;color:#ffffff;font-size:16px;line-height:18px;font-weight:bold;text-decoration:none;mso-hide:all;"
                    >
                      Takaisin ostoskoriini
                    </a>
                    <!--<![endif]-->

                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Tuotteita ei ole varattu. Hinnat ja saatavuus voivat muuttua.
              </p>

              <p style="margin:8px 0 0;text-align:center;font-size:11px;line-height:18px;color:#6b7c89;">
                Oletko jo tehnyt tilauksen? Voit jättää tämän muistutuksen huomiotta.
              </p>
            </td>
          </tr>

`;
  let recommendations = "";
  if (data.recommendations.length === 2) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Täydennä matkavarusteesi</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">Lisää tuotteita The Storesta seuraavalle matkallesi. Katso ajantasaiset vaihtoehdot ja hinnat tuotesivuilta.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 12px 0 0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Katso tuote</a></p>
                  </td>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 0 0 12px;">
                    <a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[1].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[1].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[1].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[1].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Katso tuote</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  } else if (data.recommendations.length === 1) {
    recommendations = `          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Täydennä matkavarusteesi</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">Lisää tuotteita The Storesta seuraavalle matkallesi. Katso ajantasaiset vaihtoehdot ja hinnat tuotesivuilta.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="100%" valign="top" style="width:100%;padding:0;">
                    <a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${escapeHtml(data.recommendations[0].imageUrl)}" width="230" alt="${escapeHtml(data.recommendations[0].name)}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${escapeHtml(data.recommendations[0].name)}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(data.recommendations[0].url)}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">Katso tuote</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

`;
  }
  const clubOffer = data.clubOfferTermsUrl ? `          <!-- CLUB SIGNUP OFFER: NON-MEMBERS ONLY. Select this complete email only after a trusted send-time membership check has confirmed is_loyalty_member === false. Unknown/error uses the member/no-offer version. -->
          <tr>
            <td class="content-pad" style="padding:30px 36px;background-color:#f6faff;border-bottom:1px solid #e1e8ed;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                <tr>
                  <td align="left" bgcolor="#e7f3f4" style="padding:26px 24px;border-left:4px solid #5fc7cf;background-color:#e7f3f4;">
                    <p style="margin:0 0 9px;font-size:11px;line-height:16px;letter-spacing:1px;font-weight:bold;color:#022e64;">SKANDI CLUB · ERIKOISTARJOUS</p>
                    <h2 style="margin:0 0 12px;font-size:24px;line-height:30px;font-weight:700;color:#022e64;">Liity ilmaiseksi. Aloita bonuksella.</h2>
                    <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#243f54;">Liity SKANDI Clubiin ja saat liittymisbonuksen sekä ylimääräisiä SKANDI Points -pisteitä.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                      <tr>
                        <td align="center" bgcolor="#022e64" style="border-radius:4px;background-color:#022e64;mso-padding-alt:14px 22px;">
                          <a class="club-signup-button" href="https://www.skanditravels.com/skandi-club" target="_blank" style="display:inline-block;padding:14px 22px;border:1px solid #022e64;border-radius:4px;color:#ffffff;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none;">Liity SKANDI Clubiin</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:11px;line-height:16px;color:#536b7c;">Uusille SKANDI Clubin jäsenille. <a href="${escapeHtml(data.clubOfferTermsUrl)}" style="color:#022e64;text-decoration:underline;">Tarjouksen ehdot ovat voimassa.</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

` : "";
  const footer = `          <!-- CUSTOMER SERVICE -->
          <tr>
            <td
              class="support-pad"
              align="center"
              bgcolor="#edf5f6"
              style="padding:28px 36px;background-color:#edf5f6;"
            >
              <h2 style="margin:0 0 10px;font-size:20px;line-height:26px;font-weight:700;color:#022e64;">
                Kysyttävää ennen tilausta?
              </h2>

              <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#37556a;">
                Jos tarvitset apua tuotteiden, toimituksen tai maksamisen kanssa,<br>
                ota yhteyttä tiimiimme.
              </p>

              <p style="margin:0;font-size:14px;line-height:24px;">
                <a
                  href="https://www.skanditravels.com/about/support"
                  target="_blank"
                  style="color:#022e64;font-weight:bold;text-decoration:underline;"
                >
                  Ota yhteyttä asiakaspalveluun
                </a>
              </p>

              <p style="margin:8px 0 0;font-size:13px;line-height:22px;">
                <a
                  href="mailto:support@skanditravels.com"
                  style="color:#37556a;text-decoration:underline;"
                >
                  support@skanditravels.com
                </a>
              </p>
            </td>
          </tr>

          <!-- FOOTER: original branding; secondary legal copy; retain Wix's managed preferences footer -->
          <tr>
            <td
              class="footer-pad"
              align="left"
              bgcolor="#022e64"
              style="padding:24px 36px;background-color:#022e64;"
            >
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="footer-brand-cell" width="180" valign="middle" align="left" style="width:180px;padding:0 0 14px;">
                    <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_LIGHT.svg"
                      width="150" height="38" alt="THE STORE"
                      style="display:block;width:150px;height:auto;max-width:100%;color:#ffffff;"
                    >
                    <p style="margin:5px 0 0;font-size:12px;line-height:20px;color:#8fa6bc;">by <b>SKANDI TRAVELS</b></p>
                  </td>
                  <td class="footer-brand-cell footer-group-cell" valign="middle" align="right" style="padding:0 0 14px;">
                    <img class="group-member-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_GROUP-MEMBER-LIGHT.svg"
                      width="230" height="29" alt="A SKANDI GROUP MEMBER"
                      style="display:block;width:230px;height:auto;max-width:100%;margin-left:auto;color:#ffffff;"
                    >
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:12px;line-height:24px;">
                <a
                  href="https://www.instagram.com/skanditravels"
                  target="_blank"
                  style="color:#faf6ff;text-decoration:underline;"
                >Instagram</a>
                <span aria-hidden="true" style="color:#8fa6bc;">
                  &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                </span>
                <a
                  href="https://www.facebook.com/skanditravels"
                  target="_blank"
                  style="color:#f6faff;text-decoration:underline;"
                >Facebook</a>
              </p>

              <p style="margin:0 0 8px;font-size:11px;line-height:16px;color:#a2b4c5;">Mainos. Muistutus THE STORE -ostoskoristasi.</p>

              <!-- Business Info source: primary US HQ and Sweden HQ. Swedish registered seat and organisation number remain separate unverified company particulars. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 4px;table-layout:fixed;">
                <tr>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 18px 8px 0;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">YHDYSVALTAIN PÄÄKONTTORI</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Inc.</p>
                    <p style="margin:0;font-size:11px;line-height:16px;color:#a2b4c5;">450 Lexington Avenue<br>New York, NY 10163<br>Yhdysvallat</p>
                  </td>
                  <td class="company-details-cell" width="50%" valign="top" style="width:50%;padding:0 0 8px 12px;">
                    <p style="margin:0 0 3px;font-size:10px;line-height:14px;letter-spacing:0.5px;color:#a2b4c5;">RUOTSIN PÄÄKONTTORI</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;font-weight:normal;color:#a2b4c5;">SKANDI GROUP Aktiebolag</p>
                    <p style="margin:0 0 2px;font-size:11px;line-height:16px;color:#a2b4c5;">Biblioteksgatan 11<br>111 46 Stockholm<br>Ruotsi</p>
                    <p style="margin:0;font-size:11px;line-height:16px;"><a href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#a2b4c5;text-decoration:underline;">Yritystiedot</a></p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:11px;line-height:16px;color:#a2b4c5;">Lopeta markkinointiviestit alla olevasta tilauksen peruutus- tai sähköpostiasetuslinkistä.</p>
              <p style="margin:0 0 10px;font-size:11px;line-height:16px;"><a href="[SKANDI_WIX_UNSUBSCRIBE_URL]" style="color:#f6faff;text-decoration:underline;">Peru tilaus</a></p>

              <p style="margin:0 0 10px;font-size:11px;line-height:18px;">
                <a href="https://www.skanditravels.com/about/legal/policies?slug=privacy-policy" target="_blank" style="color:#f6faff;text-decoration:underline;">Tietosuoja</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a href="mailto:support@skanditravels.com" style="color:#f6faff;text-decoration:underline;">Yhteystiedot</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
                <a
                  href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#f6faff;text-decoration:underline;">Ehdot &amp; käytännöt</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com/the-store" target="_blank" style="color:#f6faff;text-decoration:underline;">THE STORE</a>
              <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com" style="color:#f6faff;text-decoration:underline;">SKANDI TRAVELS</a>
            </p>
              <p style="margin:0;border-bottom:1px solid #284d76;border-top:1px solid #284d76;padding:9px 0;font-size:10px;line-height:15px;color:#a2b4c5;">© 2026 SKANDI GROUP Inc. (Yhdysvallat) &amp; SKANDI GROUP Aktiebolag (Ruotsi). Kaikki oikeudet pidätetään. THE STORE™ &amp; SKANDI TRAVELS™ ovat SKANDI GROUPin tavaramerkkejä.
              </p>
            </td>
          </tr>
          <tr><td style="background-color:#f6faff;height:5px;font-size:0;line-height:5px;">&nbsp;</td></tr>
        </table>

        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>


</body>
</html>`;
  return { subject: "Suosikkisi ovat yhä SKANDI-ostoskorissasi", html: start + recommendations + clubOffer + footer };
}

const renderers = Object.freeze({ en: renderEN, sv: renderSV, no: renderNO, da: renderDA, fi: renderFI });

export function renderStoreCartRecovery(language, data) {
  return (renderers[language] || renderEN)(data);
}
