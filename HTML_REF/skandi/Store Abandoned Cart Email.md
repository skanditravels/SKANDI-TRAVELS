# SKANDI INFO / LOG — Store Abandoned Cart Email

- System: SKANDI / Wix Stores customer email.
- Current authority: customer's Pasted text(20261103-140152).txt and V12 architecture.
- Source record: HTML_REF/skandi/Store Abandoned Cart Email.md (new reference record).
- Page/route/embed ID: not a page or HTML embed; Wix abandoned-checkout email action.
- Controller: Wix Checkout abandoned automation; Send HTTP request; exclusive count branches; Send an email.
- Backend facade: src/backend/http-functions.js, post_skandiStoreEmailRecommendations.
- Canonical core: src/backend/SKANDI_CORE/storefront.js, getStoreEmailRecommendationsCore.
- Provider: installed @wix/ecom recommendations and current @wix/stores Catalog V3.
- Database: no new table, schema, query, Supabase client or database write.
- Boundary: public read-only catalog data, explicit output whitelist; no recipient/recovery/order/private fields.
- Contract: input product_id and line_items; output recommendationCount and two flat name/image/URL slots.
- Original email data: contact.name.first/contact.email, checkout_url, product_image_url, product_name, product_price, currency.
- Assets: existing live URLs by default; optional public main-branch PNG assets in exact assets/email/store-abandoned-cart paths.
- Deployment: prepared only; not written to GitHub or published to Wix.
- Last checked: 2026-11-03, read-only live algorithms and recommendation/product API response.
- Open requirements: backend installation/publication, HTTP/action-output bindings, actual recipient test,
  approved Swedish registered address/organisation/VAT details, and optional GitHub asset commit.
- Existing HTML_REF status: current main tree contained only HTML_REF/GLOBAL/PAGE_SETTINGS.csv;
  no existing email record was available to extend. Existing runtime Store owner was reused.

## Change log

- 2026-11-03: Earlier supplied email established first-product recovery, image branding and personalization.
- 2026-11-03: New user upload preserves 15px hero copy and bold currency. Separate EU/US footer,
  replace fixed recommendations with dynamic API response slots, and remove unsupported cart.* markup.
  Extend existing Store core/HTTP owner, add full 0/1-card variants and optional GitHub asset versions.

## Installation and remaining configuration

Read WIX_SETUP.txt. This record is a source reference, not an executable module.
The complete intended TWO-recommendation email payload follows. One/zero variants
are complete branch-specific files in variants/; GitHub-image equivalents are in github-images/.

## Complete intended HTML

```html
<!DOCTYPE html>
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
        padding: 0 0 20px !important;
      }

      .footer-group-cell {
        padding: 0 0 20px !important;
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
        padding: 28px 22px !important;
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

  <!--
    Subject: Your favourites are still in your SKANDI cart
    Preview: A little something for your next getaway. Pick up where you left off.
    Source: customer's Pasted text(20261103-140152).txt.
    The original first-item, contact and checkout fields are retained.
    cart.items, cart.subtotal and cart.total are not abandoned-checkout trigger fields.
    The optional first name is separate from the generic heading.
    Recommendation fields below are CUSTOM HTTP-response fields, not built-in Wix variables.
    First install the included backend files, configure Send HTTP request, define its
    response structure, and bind its outputs in the email using Wix's property picker.
    This file is the TWO-recommendation branch only. Use the supplied ONE or ZERO
    variants for the other recommendationCount values. HTML does not branch itself.
    No fixed product ID, product image or product-page URL is embedded in these cards.
    Logos/hero retain current public URLs in this file. Complete GitHub-image versions
    are in github-images/ and require the bundled asset files committed to main first.
    Retain Wix's managed email-preferences footer in the final send.
    No JavaScript runs in this email. No automation or live site was changed.
  -->

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
                          <p style="margin:0;font-size:18px;line-height:24px;font-weight:700;color:#022e64;">${contact.name.first}</p>
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
                            href="${checkout_url}"
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
                            href="${checkout_url}"
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

          <!-- ABANDONED PRODUCT -->
          <tr>
            <td
              class="content-pad"
              style="padding:34px 36px 32px;border-bottom:1px solid #e1e8ed;"
            >
              <h2 style="margin:0 0 22px;font-size:22px;line-height:28px;letter-spacing:-0.3px;font-weight:700;color:#022e64;">
                Take another look
              </h2>

<!-- This block shows ONE real abandoned item. Keep Wix's native item bindings. -->
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td
                    class="product-photo"
                    width="128"
                    align="center"
                    valign="top"
                    style="width:128px;"
                  >
                    <img
                      class="product-image"
                      src="${product_image_url}"
                      width="128"
                      alt="${product_name}"
                      style="display:block;width:128px;max-width:128px;height:auto;font-size:12px;line-height:18px;color:#536b7c;"
                    >
                  </td>

                  <td
                    class="product-details"
                    valign="middle"
                    style="padding-left:24px;"
                  >
                    <h3 style="margin:0 0 8px;font-size:17px;line-height:24px;font-weight:700;color:#022e64;">
                      ${product_name}
                    </h3>

                    <p style="margin:0;font-size:17px;line-height:24px;font-weight:bold;color:#022e64;">
                      ${product_price}
                    </p>
                    <p style="margin:0 0 2px;font-size:12px;line-height:24px;color:#022e64;">Currency: <b>${currency}</b></p>
</td>
                </tr>
              </table>

              <p style="margin:22px 0 24px;font-size:13px;line-height:21px;color:#536b7c;">
                Open your cart to review all your selected items, options, current prices and delivery choices.
              </p>

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
                      href="${checkout_url}"
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
                      href="${checkout_url}"
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

          <!-- DYNAMIC RECOMMENDATIONS: bind the custom HTTP-response fields before use -->
          <tr>
            <td class="content-pad" style="padding:32px 36px;border-bottom:1px solid #e1e8ed;">
              <h2 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:#022e64;">Complete your travel kit</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#536b7c;">More from The Store for your next journey. View current options and prices on each product page.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 12px 0 0;">
                    <a href="${recommendation1Url}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${recommendation1ImageUrl}" width="230" alt="${recommendation1Name}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${recommendation1Name}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${recommendation1Url}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">View product</a></p>
                  </td>
                  <td class="upsell-cell" width="50%" valign="top" style="width:50%;padding:0 0 0 12px;">
                    <a href="${recommendation2Url}" target="_blank" style="color:#022e64;text-decoration:none;">
                      <img class="upsell-image" src="${recommendation2ImageUrl}" width="230" alt="${recommendation2Name}" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
                    </a>
                    <h3 style="margin:16px 0 12px;font-size:16px;line-height:23px;font-weight:700;color:#022e64;">${recommendation2Name}</h3>
                    <p style="margin:0;font-size:13px;line-height:22px;"><a href="${recommendation2Url}" target="_blank" style="color:#022e64;font-weight:bold;text-decoration:underline;">View product</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CUSTOMER SERVICE -->
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

          <!-- FOOTER -->
          <tr>
            <td
              class="footer-pad"
              align="left"
              bgcolor="#022e64"
              style="padding:30px 36px;background-color:#022e64;"
            >
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="footer-brand-cell" width="180" valign="middle" align="left" style="width:180px;padding:0 0 20px;">
                    <img
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/THE_STORE_LIGHT.svg"
                      width="150" height="38" alt="THE STORE"
                      style="display:block;width:150px;height:auto;max-width:100%;color:#ffffff;"
                    >
                    <p style="margin:5px 0 0;font-size:12px;line-height:20px;color:#8fa6bc;">by <b>SKANDI TRAVELS</b></p>
                  </td>
                  <td class="footer-brand-cell footer-group-cell" valign="middle" align="right" style="padding:0 0 20px;">
                    <img class="group-member-image"
                      src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_GROUP-MEMBER-LIGHT.svg"
                      width="230" height="29" alt="A SKANDI GROUP MEMBER"
                      style="display:block;width:230px;height:auto;max-width:100%;margin-left:auto;color:#ffffff;"
                    >
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px;font-size:12px;line-height:24px;">
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

              <p style="margin:0 0 1px;font-size:11px;color:#8fa6bc;">You received this reminder because you added items to your SKANDI Store cart using <a href="mailto:${contact.email}" style="color:#8fa6bc;text-decoration:underline;">${contact.email}</a>.
              </p>

              <!-- Separate company-detail blocks; the Swedish registered address/IDs have not been supplied. -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0 8px;table-layout:fixed;">
                <tr>
                  <td class="company-details-cell" width="50%" height="112" valign="top" style="width:50%;height:112px;padding:0 18px 18px 0;">
                    <p style="margin:0 0 7px;font-size:10px;line-height:16px;letter-spacing:1px;font-weight:bold;color:#b8d5e6;">EU / SWEDEN</p>
                    <p style="margin:0 0 6px;font-size:12px;line-height:19px;font-weight:bold;color:#ffffff;">SKANDI GROUP Aktiebolag</p>
                    <p style="margin:0 0 6px;font-size:11px;line-height:18px;color:#b8c9d8;">Sweden</p>
                    <p style="margin:0;font-size:11px;line-height:18px;"><a href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#f6faff;text-decoration:underline;">Company information</a></p>
                  </td>
                  <td class="company-details-cell" width="50%" height="112" valign="top" style="width:50%;height:112px;padding:0 0 18px 12px;">
                    <p style="margin:0 0 7px;font-size:10px;line-height:16px;letter-spacing:1px;font-weight:bold;color:#b8d5e6;">UNITED STATES</p>
                    <p style="margin:0 0 6px;font-size:12px;line-height:19px;font-weight:bold;color:#ffffff;">SKANDI GROUP Inc.</p>
                    <p style="margin:0;font-size:11px;line-height:18px;color:#b8c9d8;">450 Lexington Avenue<br>New York, NY 10163<br>United States</p>
                  </td>
                </tr>
              </table>

              
              <p style="margin:0 0 12px;font-size:11px;">
                <a
                  href="https://www.skanditravels.com/about/legal" target="_blank" style="color:#f6faff;text-decoration:underline;">Terms &amp; Policies</a>
                <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com/the-store" target="_blank" style="color:#f6faff;text-decoration:underline;">THE STORE</a>
              <span style="color:#8fa6bc;"> &nbsp; | &nbsp; </span>
              <a href="https://www.skanditravels.com" style="color:#f6faff;text-decoration:underline;">SKANDI TRAVELS</a>
            </p>
              <p style="border-bottom:1px solid #8fa6bc;border-top:1px solid #8fa6bc;padding:15px 0 10px 0;font-size:9px;line-height:14px;color:#8fa6bc;">© 2026 SKANDI GROUP Inc. (United States) &amp; SKANDI GROUP Aktiebolag (Sweden). All rights reserved. THE STORE™ &amp; SKANDI TRAVELS™ are trademarks of the SKANDI GROUP.
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

<!-- Retain Wix's own managed email-preferences footer in the final send. -->
</body>
</html>
```
