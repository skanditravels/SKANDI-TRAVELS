// /src/backend/SKANDI_CORE/invoice.js
// SKANDI R-006.6 — canonical SKANDI Customer Invoice renderer.
// Visual source of truth: user-approved skandi_invoice_pdf_sample.html.
// This renderer is presentation-only: it consumes canonical booking/finance data,
// never creates a second financial ledger, and stores generated HTML through the
// existing PRIVATE Platform Asset Library owned by Reservations.


const TEMPLATE = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">\n<title>SKANDI Travels • PDF Invoice</title>\n\n<link href=\"https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js\" crossorigin=\"anonymous\" referrerpolicy=\"no-referrer\"></script>\n\n<style>\n*{margin:0;padding:0;box-sizing:border-box;}\n\n:root{\n  --skandi-blue:#022e64;\n  --skandi-blue-soft:#285ca8;\n  --skandi-light-blue:#d7e6ff;\n  --skandi-pale-blue:#f6faff;\n  --skandi-panel:#f2f4f8;\n  --skandi-border:#e6e9ee;\n  --skandi-text:#000;\n  --skandi-body:#333;\n  --skandi-muted:#555;\n  --skandi-soft-muted:#6b7280;\n  --skandi-green:#087443;\n  --skandi-red:#b42318;\n}\n\nhtml,body{width:100%;min-height:100%;}\n\nbody{\n  font-family:\"Montserrat\",Arial,sans-serif;\n  margin:0;\n  padding:40px;\n  background:#fff;\n  color:var(--skandi-text);\n  font-size:11px;\n  line-height:1.4;\n  -webkit-print-color-adjust:exact;\n  print-color-adjust:exact;\n}\n\n.hidden{display:none!important;}\n\n.document-container{\n  max-width:8.5in;\n  margin:0 auto;\n  background:#fff;\n}\n\n.header-section{\n  display:flex;\n  padding:22px 30px 28px 22px;\n  background:linear-gradient(135deg,var(--skandi-light-blue),var(--skandi-pale-blue));\n  justify-content:space-between;\n  align-items:flex-start;\n  margin-bottom:30px;\n  border-bottom:1px solid var(--skandi-border);\n}\n\n.brand-logo{\n  max-width:220px;\n  height:auto;\n  display:block;\n}\n\n.document-title-block{\n  text-align:right;\n  color:var(--skandi-blue);\n}\n\n.document-title{\n  font-size:30px;\n  font-weight:700;\n  margin:0 0 5px;\n  letter-spacing:-.5px;\n  color:var(--skandi-blue);\n}\n\n.document-title-block h2{\n  font-size:15px;\n  color:var(--skandi-blue);\n  margin:0 0 5px;\n}\n\n.document-subtitle{\n  font-size:10px;\n  color:var(--skandi-muted);\n  font-style:italic;\n  max-width:330px;\n}\n\n.invoice-banner{\n  border-top:2px solid var(--skandi-blue);\n  border-bottom:1px solid var(--skandi-border);\n  padding:8px 0 10px;\n  margin-bottom:24px;\n  display:grid;\n  grid-template-columns:1fr auto;\n  gap:20px;\n  align-items:start;\n}\n\n.invoice-banner strong{\n  color:var(--skandi-blue);\n  font-size:13px;\n}\n\n.invoice-banner p{\n  color:var(--skandi-body);\n  font-size:10px;\n  margin-top:3px;\n}\n\n.invoice-pill{\n  background:var(--skandi-blue);\n  color:#fff;\n  border-radius:999px;\n  padding:6px 11px;\n  font-size:9px;\n  font-weight:700;\n  letter-spacing:.08em;\n  text-transform:uppercase;\n  white-space:nowrap;\n}\n\n.invoice-pill.paid{background:var(--skandi-green);}\n.invoice-pill.overdue,.invoice-pill.cancelled{background:var(--skandi-red);}\n\n.info-columns{\n  display:grid;\n  grid-template-columns:1fr 1fr;\n  gap:40px;\n  margin-bottom:28px;\n}\n\n.block-title{\n  color:var(--skandi-blue);\n  font-size:12px;\n  font-weight:700;\n  margin-bottom:6px;\n  text-transform:uppercase;\n  letter-spacing:.04em;\n}\n\n#bill_to_name,#seller_name{\n  font-weight:700;\n  font-size:13px;\n  margin-bottom:5px;\n}\n\n.meta-data-table{\n  width:100%;\n  border-collapse:collapse;\n}\n\n.meta-data-table td{\n  padding:2px 0;\n  vertical-align:top;\n  font-size:11px;\n}\n\n.meta-data-table td.label{\n  width:45%;\n  color:var(--skandi-body);\n}\n\n.meta-data-table td.value{\n  font-weight:700;\n  text-align:left;\n  overflow-wrap:anywhere;\n}\n\n.invoice-highlight{\n  font-size:14px!important;\n  color:var(--skandi-blue)!important;\n  letter-spacing:.04em;\n}\n\n.section-header{\n  font-size:13px;\n  font-weight:700;\n  color:var(--skandi-blue);\n  border-bottom:2px solid var(--skandi-blue);\n  padding-bottom:2px;\n  margin-top:24px;\n  margin-bottom:8px;\n  display:flex;\n  justify-content:space-between;\n  align-items:flex-end;\n  gap:18px;\n}\n\n.section-subtitle{\n  font-size:10px;\n  color:#444;\n  font-weight:400;\n  text-align:right;\n}\n\n.invoice-lines-table,.items-list-table,.price-table{\n  width:100%;\n  border-collapse:collapse;\n  margin-bottom:12px;\n}\n\n.invoice-lines-table th{\n  color:#fff;\n  background:var(--skandi-blue);\n  text-align:left;\n  font-size:9px;\n  letter-spacing:.06em;\n  text-transform:uppercase;\n  padding:6px 5px;\n  border-bottom:1px solid var(--skandi-blue);\n}\n\n.invoice-lines-table td,.items-list-table td,.price-table td{\n  padding:5px 5px;\n  border-bottom:1px solid #e0e0e0;\n  vertical-align:top;\n}\n\n.invoice-lines-table tr:last-child td,.items-list-table tr:last-child td,.price-table tr:last-child td{\n  border-bottom:none;\n}\n\n.invoice-lines-table td.amount,.invoice-lines-table th.amount,\n.price-table td.amount{\n  text-align:right;\n  font-weight:700;\n}\n\n.invoice-lines-table td.center,.invoice-lines-table th.center{\n  text-align:center;\n}\n\n.line-description strong{\n  display:block;\n  color:#000;\n}\n\n.line-description span{\n  display:block;\n  color:#555;\n  font-size:9px;\n  margin-top:2px;\n}\n\n.price-table tr.total-row td{\n  border-top:1px solid #000;\n  font-weight:700;\n  font-size:13px;\n  padding-top:6px;\n}\n\n.price-table tr.balance-row td{\n  font-size:14px;\n  font-weight:800;\n  color:var(--skandi-blue);\n  border-top:2px solid var(--skandi-blue);\n  padding-top:7px;\n}\n\n.split-layout{\n  display:grid;\n  grid-template-columns:1.2fr .8fr;\n  gap:40px;\n}\n\n.qr-wrapper{\n  display:flex;\n  justify-content:flex-start;\n  margin-top:20px;\n}\n\n.qr-fallback{\n  border:1px solid var(--skandi-border);\n  border-radius:8px;\n  padding:10px;\n  font-size:10px;\n  color:#444;\n}\n\n.payment-box{\n  border:1px solid var(--skandi-border);\n  background:var(--skandi-panel);\n  border-radius:8px;\n  padding:10px 12px;\n  font-size:10px;\n  color:#333;\n  line-height:1.55;\n}\n\n.payment-box strong{\n  color:var(--skandi-blue);\n}\n\n.legal-section{\n  margin-top:30px;\n}\n\n.legal-grid{\n  display:grid;\n  grid-template-columns:1fr 1fr;\n  gap:24px;\n}\n\n.legal-box{\n  border:1px solid var(--skandi-border);\n  padding:10px 12px;\n  min-height:88px;\n}\n\n.legal-box h3{\n  font-size:12px;\n  color:var(--skandi-blue);\n  margin-bottom:5px;\n}\n\n.legal-box p,.legal-box li{\n  font-size:10px;\n  color:#444;\n  line-height:1.5;\n}\n\n.legal-box ul{padding-left:16px;}\n\n.notice-container{\n  border-top:2px solid var(--skandi-blue);\n  margin-top:32px;\n  padding-top:8px;\n}\n\n.notice-grid{\n  display:grid;\n  grid-template-columns:1fr 1fr;\n  gap:40px;\n  margin-bottom:15px;\n}\n\n.notice-title{\n  font-size:13px;\n  font-weight:700;\n  color:var(--skandi-blue);\n  margin-bottom:5px;\n}\n\n.footer-text{\n  font-size:10px;\n  color:#444;\n  margin-top:12px;\n}\n\n.validation-warning{\n  border:2px solid #b00020;\n  padding:10px;\n  margin-bottom:18px;\n  color:#b00020;\n  font-weight:700;\n  font-size:11px;\n}\n\n@media print{\n  @page{size:letter;margin:.42in;}\n  body{padding:0;margin:0;background:#fff;}\n  .document-container{max-width:100%;}\n  .section-header,.split-layout,.notice-container,.legal-section,.invoice-lines-table{page-break-inside:avoid;}\n}\n</style>\n</head>\n\n<body>\n\n<div class=\"document-container\">\n\n  <div id=\"validation_warning\" class=\"validation-warning hidden\"></div>\n\n  <header class=\"header-section\">\n    <img id=\"brand_logo\" src=\"https://static.wixstatic.com/media/394052_0e4f0c0da11443688a30b3e688c619c6~mv2.png\" alt=\"SKANDI Travels Logo\" class=\"brand-logo\">\n    <div class=\"document-title-block\">\n      <h1 class=\"document-title\" id=\"document_title\">Invoice</h1>\n      <h2 id=\"document_subheading\">Customer Invoice</h2>\n      <div class=\"document-subtitle\" id=\"document_subtitle\">\n        Official SKANDI Travels invoice. Please reference the invoice number when making payment or contacting finance.\n      </div>\n    </div>\n  </header>\n\n  <section class=\"invoice-banner\">\n    <div>\n      <strong id=\"invoice_banner_title\">Invoice Issued</strong>\n      <p id=\"invoice_banner_text\">\n        This invoice was created by SKANDI Corporate Finance. Review billing details, service lines, taxes, payment terms and due date before payment.\n      </p>\n    </div>\n    <div class=\"invoice-pill\" id=\"invoice_status_pill\">Issued</div>\n  </section>\n\n  <section class=\"info-columns\">\n    <div>\n      <div class=\"block-title\">Bill To</div>\n      <div id=\"bill_to_name\">----</div>\n      <div id=\"bill_to_address_line1\">----</div>\n      <div id=\"bill_to_address_line2\">----</div>\n      <div id=\"bill_to_address_line3\">----</div>\n      <table class=\"meta-data-table\" style=\"margin-top:10px;\">\n        <tr><td class=\"label\">Contact:</td><td class=\"value\" id=\"bill_to_contact\">-----</td></tr>\n        <tr><td class=\"label\">E-mail:</td><td class=\"value\" id=\"bill_to_email\">-----</td></tr>\n        <tr><td class=\"label\">Telephone:</td><td class=\"value\" id=\"bill_to_phone\">-----</td></tr>\n        <tr><td class=\"label\">Tax ID:</td><td class=\"value\" id=\"bill_to_tax_id\">-----</td></tr>\n      </table>\n    </div>\n\n    <div>\n      <table class=\"meta-data-table\">\n        <tr><td class=\"label\">Invoice number:</td><td class=\"value invoice-highlight\" id=\"lbl_invoice_number\">------</td></tr>\n        <tr><td class=\"label\">Invoice date:</td><td class=\"value\" id=\"lbl_invoice_date\">-----</td></tr>\n        <tr><td class=\"label\">Due date:</td><td class=\"value\" id=\"lbl_due_date\">-----</td></tr>\n        <tr><td class=\"label\">Terms:</td><td class=\"value\" id=\"lbl_terms\">-----</td></tr>\n        <tr><td class=\"label\">Currency:</td><td class=\"value\" id=\"lbl_currency\">-----</td></tr>\n        <tr><td class=\"label\">Reference:</td><td class=\"value\" id=\"lbl_reference\">-----</td></tr>\n        <tr><td class=\"label\">Company code:</td><td class=\"value\" id=\"lbl_company_code\">-----</td></tr>\n        <tr><td class=\"label\">Posting status:</td><td class=\"value\" id=\"lbl_posting_status\">-----</td></tr>\n      </table>\n    </div>\n  </section>\n\n  <section class=\"info-columns\" style=\"margin-bottom:18px;\">\n    <div>\n      <div class=\"block-title\">Seller</div>\n      <div id=\"seller_name\">SKANDI Travels</div>\n      <div id=\"seller_address_line1\">----</div>\n      <div id=\"seller_address_line2\">----</div>\n      <table class=\"meta-data-table\" style=\"margin-top:10px;\">\n        <tr><td class=\"label\">Telephone:</td><td class=\"value\" id=\"seller_phone\">-----</td></tr>\n        <tr><td class=\"label\">Website:</td><td class=\"value\" id=\"seller_website\">-----</td></tr>\n        <tr><td class=\"label\">Tax / VAT ID:</td><td class=\"value\" id=\"seller_tax_id\">-----</td></tr>\n      </table>\n    </div>\n\n    <div>\n      <div class=\"block-title\">Finance Reference</div>\n      <table class=\"meta-data-table\">\n        <tr><td class=\"label\">Booking ref:</td><td class=\"value\" id=\"lbl_booking_reference\">-----</td></tr>\n        <tr><td class=\"label\">Store order:</td><td class=\"value\" id=\"lbl_order_reference\">-----</td></tr>\n        <tr><td class=\"label\">Purchase order:</td><td class=\"value\" id=\"lbl_po_number\">-----</td></tr>\n        <tr><td class=\"label\">Cost center:</td><td class=\"value\" id=\"lbl_cost_center\">-----</td></tr>\n        <tr><td class=\"label\">Profit center:</td><td class=\"value\" id=\"lbl_profit_center\">-----</td></tr>\n        <tr><td class=\"label\">Journal document:</td><td class=\"value\" id=\"lbl_journal_document\">-----</td></tr>\n      </table>\n    </div>\n  </section>\n\n  <section>\n    <div class=\"section-header\">\n      <div>Invoice Lines</div>\n      <div class=\"section-subtitle\">Services, products, taxes and amounts</div>\n    </div>\n    <table class=\"invoice-lines-table\">\n      <thead>\n        <tr>\n          <th style=\"width:42%\">Description</th>\n          <th class=\"center\" style=\"width:8%\">Qty</th>\n          <th class=\"amount\" style=\"width:13%\">Unit</th>\n          <th class=\"amount\" style=\"width:13%\">Net</th>\n          <th class=\"center\" style=\"width:10%\">Tax</th>\n          <th class=\"amount\" style=\"width:14%\">Gross</th>\n        </tr>\n      </thead>\n      <tbody id=\"invoice_lines_target\"></tbody>\n    </table>\n  </section>\n\n  <section class=\"split-layout\" style=\"margin-top:24px;\">\n    <div>\n      <div class=\"section-header\">\n        <div>Payment Instructions</div>\n        <div class=\"section-subtitle\">Use invoice number as payment reference</div>\n      </div>\n      <div class=\"payment-box\" id=\"payment_instructions_box\">----</div>\n      <div id=\"invoice_master_qrcode\" class=\"qr-wrapper\"></div>\n    </div>\n\n    <div>\n      <div class=\"section-header\">Invoice Totals</div>\n      <table class=\"price-table\" id=\"table_invoice_totals\"></table>\n    </div>\n  </section>\n\n  <section class=\"legal-section\">\n    <div class=\"section-header\">\n      <div>Invoice & Legal Disclosures</div>\n      <div class=\"section-subtitle\">Finance, tax and payment conditions</div>\n    </div>\n\n    <div class=\"legal-grid\">\n      <div class=\"legal-box\">\n        <h3>Seller / Agency Information</h3>\n        <p id=\"seller_disclosure_text\">----</p>\n      </div>\n\n      <div class=\"legal-box\">\n        <h3>Tax Disclosure</h3>\n        <p id=\"tax_disclosure_text\">----</p>\n      </div>\n\n      <div class=\"legal-box\">\n        <h3>Payment Terms</h3>\n        <p id=\"payment_invoice_terms_text\">----</p>\n      </div>\n\n      <div class=\"legal-box\">\n        <h3>Invoice Conditions</h3>\n        <p id=\"invoice_conditions_text\">----</p>\n      </div>\n    </div>\n  </section>\n\n  <footer class=\"notice-container\">\n    <div class=\"notice-grid\">\n      <div>\n        <div class=\"notice-title\">Important Information</div>\n        <div class=\"footer-text\" style=\"margin-top:0;\" id=\"important_info_text\">\n          Please pay by the due date and include the invoice number as the payment reference.\n        </div>\n      </div>\n\n      <div>\n        <table class=\"meta-data-table\" style=\"margin-top:5px;\">\n          <tr><td class=\"label\">Finance Contact:</td><td class=\"value\" id=\"lbl_finance_contact\">-----</td></tr>\n          <tr><td class=\"label\">Finance E-mail:</td><td class=\"value\" id=\"lbl_finance_email\">-----</td></tr>\n        </table>\n      </div>\n    </div>\n\n    <div class=\"footer-text\" id=\"final_document_note\">\n      This PDF invoice summarizes amounts due to SKANDI Travels or amounts recorded in SKANDI Corporate Finance. Receipts, vouchers, confirmations or supplier documents may be issued separately.\n    </div>\n  </footer>\n\n</div>\n\n<script>\nlet CURRENT_INVOICE_DATA = null;\n\nfunction escapeHTML(value){\n  return String(value ?? \"\")\n    .replaceAll(\"&\",\"&amp;\")\n    .replaceAll(\"<\",\"&lt;\")\n    .replaceAll(\">\",\"&gt;\")\n    .replaceAll('\"',\"&quot;\")\n    .replaceAll(\"'\",\"&#039;\");\n}\n\nfunction setText(id,value){\n  const node=document.getElementById(id);\n  if(node) node.innerText=value ?? \"\";\n}\n\nfunction cleanValue(value){\n  if(value === null || value === undefined) return \"\";\n  if(typeof value === \"boolean\") return value ? \"Yes\" : \"No\";\n  return String(value);\n}\n\nfunction hasValue(value){\n  return cleanValue(value).trim() !== \"\";\n}\n\nfunction number(value){\n  const n=Number(value || 0);\n  return Number.isFinite(n) ? n : 0;\n}\n\nfunction money(value,currency){\n  const num=number(value);\n  const prefix=currency ? `${currency} ` : \"\";\n  return `${prefix}${num.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;\n}\n\nfunction statusClass(status){\n  const s=String(status||\"\").toLowerCase();\n  if(s.includes(\"paid\") || s.includes(\"cleared\")) return \"paid\";\n  if(s.includes(\"overdue\") || s.includes(\"cancel\")) return \"overdue\";\n  return \"\";\n}\n\nfunction normalizeInvoiceData(raw){\n  const data=raw && typeof raw === \"object\" ? raw : {};\n\n  data.document=data.document || {};\n  data.invoice=data.invoice || {};\n  data.seller=data.seller || {};\n  data.customer=data.customer || data.billTo || {};\n  data.finance=data.finance || {};\n  data.payment=data.payment || {};\n  data.compliance=data.compliance || {};\n  data.financeCorporateSettings=data.financeCorporateSettings || data.corporateSettings || data.settings || {};\n  data.corporateSettings=data.corporateSettings || data.financeCorporateSettings || {};\n  data.lines=Array.isArray(data.lines) ? data.lines : [];\n  data.totals=data.totals || {};\n\n  data.paymentInvoiceTermsText =\n    data.paymentInvoiceTermsText ||\n    data.invoice.paymentInvoiceTermsText ||\n    data.financeCorporateSettings.paymentInvoiceTermsText ||\n    data.corporateSettings.paymentInvoiceTermsText ||\n    data.payment.paymentInvoiceTermsText ||\n    data.compliance.paymentInvoiceTermsText ||\n    \"\";\n\n  const currency=data.totals.currency || data.invoice.currency || data.currency || \"\";\n\n  if(data.lines.length){\n    data.lines=data.lines.map((line,index)=>{\n      const quantity=number(line.quantity || 1);\n      const unitPrice=number(line.unitPrice || line.price || 0);\n      const netAmount=line.netAmount !== undefined ? number(line.netAmount) : quantity * unitPrice;\n      const taxAmount=line.taxAmount !== undefined ? number(line.taxAmount) : number(line.tax || 0);\n      const grossAmount=line.grossAmount !== undefined ? number(line.grossAmount) : netAmount + taxAmount;\n      return {\n        lineNumber:line.lineNumber || index + 1,\n        description:line.description || line.lineText || line.name || \"Invoice line\",\n        details:line.details || line.note || \"\",\n        quantity,\n        unitPrice,\n        netAmount,\n        taxRate:line.taxRate || line.taxCode || \"\",\n        taxAmount,\n        grossAmount,\n        glAccount:line.glAccount || line.glAccountId || \"\",\n        costCenter:line.costCenter || line.costCenterId || \"\"\n      };\n    });\n  }\n\n  const subtotal=data.totals.subtotal !== undefined ? number(data.totals.subtotal) : data.lines.reduce((a,x)=>a+number(x.netAmount),0);\n  const taxTotal=data.totals.taxTotal !== undefined ? number(data.totals.taxTotal) : data.lines.reduce((a,x)=>a+number(x.taxAmount),0);\n  const total=data.totals.total !== undefined ? number(data.totals.total) : subtotal + taxTotal;\n  const paid=data.totals.paid !== undefined ? number(data.totals.paid) : number(data.totals.amountPaid || 0);\n\n  data.totals={...data.totals,currency,subtotal,taxTotal,total,paid,balanceDue: data.totals.balanceDue !== undefined ? number(data.totals.balanceDue) : Math.max(0,total-paid)};\n\n  return data;\n}\n\nfunction validateInvoiceData(data){\n  const missing=[];\n\n  if(!hasValue(data.invoice?.invoiceNumber)) missing.push(\"invoice.invoiceNumber\");\n  if(!hasValue(data.invoice?.invoiceDate)) missing.push(\"invoice.invoiceDate\");\n  if(!hasValue(data.invoice?.dueDate)) missing.push(\"invoice.dueDate\");\n  if(!hasValue(data.customer?.name)) missing.push(\"customer.name\");\n  if(!hasValue(data.seller?.legalName)) missing.push(\"seller.legalName\");\n  if(!hasValue(data.totals?.currency)) missing.push(\"totals.currency\");\n  if(!Array.isArray(data.lines) || !data.lines.length) missing.push(\"lines\");\n  if(data.totals?.total === undefined) missing.push(\"totals.total\");\n  if(!hasValue(data.paymentInvoiceTermsText)) missing.push(\"paymentInvoiceTermsText\");\n\n  const warning=document.getElementById(\"validation_warning\");\n\n  if(missing.length){\n    warning.classList.remove(\"hidden\");\n    warning.innerText=`PDF INVOICE WARNING - Missing required production data: ${missing.join(\", \")}`;\n  }else{\n    warning.classList.add(\"hidden\");\n    warning.innerText=\"\";\n  }\n}\n\nfunction renderInvoiceLines(data){\n  const target=document.getElementById(\"invoice_lines_target\");\n  const currency=data.totals.currency || \"\";\n\n  if(!data.lines.length){\n    target.innerHTML=`\n      <tr>\n        <td colspan=\"6\" style=\"color:#555;\">No invoice lines were provided.</td>\n      </tr>\n    `;\n    return;\n  }\n\n  target.innerHTML=data.lines.map(line=>`\n    <tr>\n      <td class=\"line-description\">\n        <strong>${escapeHTML(line.description)}</strong>\n        ${line.details ? `<span>${escapeHTML(line.details)}</span>` : \"\"}\n        ${line.glAccount || line.costCenter ? `<span>GL ${escapeHTML(line.glAccount || \"—\")} · CC ${escapeHTML(line.costCenter || \"—\")}</span>` : \"\"}\n      </td>\n      <td class=\"center\">${escapeHTML(line.quantity)}</td>\n      <td class=\"amount\">${money(line.unitPrice,currency)}</td>\n      <td class=\"amount\">${money(line.netAmount,currency)}</td>\n      <td class=\"center\">${escapeHTML(line.taxRate || \"\")}${line.taxAmount ? `<br>${escapeHTML(money(line.taxAmount,currency))}` : \"\"}</td>\n      <td class=\"amount\">${money(line.grossAmount,currency)}</td>\n    </tr>\n  `).join(\"\");\n}\n\nfunction renderTotals(data){\n  const t=data.totals || {};\n  const c=t.currency || \"\";\n  const target=document.getElementById(\"table_invoice_totals\");\n\n  target.innerHTML=`\n    <tr><td>Subtotal</td><td class=\"amount\">${money(t.subtotal,c)}</td></tr>\n    <tr><td>Tax</td><td class=\"amount\">${money(t.taxTotal,c)}</td></tr>\n    <tr class=\"total-row\"><td>Total</td><td class=\"amount\">${money(t.total,c)}</td></tr>\n    <tr><td>Amount paid</td><td class=\"amount\" style=\"color:#022e64;\">${money(t.paid,c)}</td></tr>\n    <tr class=\"balance-row\"><td>Balance due</td><td class=\"amount\">${money(t.balanceDue,c)}</td></tr>\n  `;\n}\n\nfunction renderPaymentInstructions(data){\n  const invoice=data.invoice || {};\n  const payment=data.payment || {};\n  const t=data.totals || {};\n  const lines=[\n    payment.instructions,\n    payment.paymentLink ? `Payment link: ${payment.paymentLink}` : \"\",\n    payment.bankName ? `Bank: ${payment.bankName}` : \"\",\n    payment.iban ? `IBAN: ${payment.iban}` : \"\",\n    payment.swift ? `SWIFT/BIC: ${payment.swift}` : \"\",\n    payment.routingNumber ? `Routing: ${payment.routingNumber}` : \"\",\n    payment.accountNumber || payment.accountLast4 ? `Account: ${payment.accountNumber || (\"ending \" + payment.accountLast4)}` : \"\",\n    `Reference: ${invoice.invoiceNumber || \"\"}`,\n    `Amount due: ${money(t.balanceDue,t.currency)}`\n  ].filter(hasValue);\n\n  document.getElementById(\"payment_instructions_box\").innerHTML=lines.length\n    ? lines.map((x,i)=> i===0 ? `<strong>${escapeHTML(x)}</strong>` : escapeHTML(x)).join(\"<br>\")\n    : \"Payment instructions were not provided.\";\n}\n\nfunction renderLegal(data){\n  const seller=data.seller || {};\n  const payment=data.payment || {};\n  const compliance=data.compliance || {};\n  const invoice=data.invoice || {};\n\n  const sellerText =\n    compliance.sellerDisclosureText ||\n    [\n      seller.legalName || \"SKANDI Travels\",\n      seller.addressLine1,\n      seller.addressLine2,\n      seller.phone,\n      seller.website,\n      seller.taxId ? `Tax ID: ${seller.taxId}` : \"\"\n    ].filter(hasValue).join(\" · \");\n\n  setText(\"seller_disclosure_text\",sellerText || \"Seller information not provided.\");\n\n  setText(\n    \"tax_disclosure_text\",\n    compliance.taxDisclosureText ||\n    \"Tax, VAT, sales tax or local charges are calculated based on the invoice line configuration, customer location, supplier rules and applicable finance settings.\"\n  );\n\n  const paymentInvoiceTermsText =\n    data.paymentInvoiceTermsText ||\n    invoice.paymentInvoiceTermsText ||\n    data.financeCorporateSettings?.paymentInvoiceTermsText ||\n    data.corporateSettings?.paymentInvoiceTermsText ||\n    data.settings?.paymentInvoiceTermsText ||\n    compliance.paymentInvoiceTermsText ||\n    payment.paymentInvoiceTermsText ||\n    \"\";\n\n  setText(\"payment_invoice_terms_text\", paymentInvoiceTermsText);\n\n  setText(\n    \"invoice_conditions_text\",\n    compliance.invoiceConditionsText ||\n    \"Late payment, chargebacks, refunds, credits and corrections may be handled according to SKANDI Travels finance policy, supplier terms, customer contract terms and applicable law.\"\n  );\n}\n\nfunction renderQr(data){\n  const target=document.getElementById(\"invoice_master_qrcode\");\n  const invoice=data.invoice || {};\n  const customer=data.customer || {};\n  const t=data.totals || {};\n  const qrString=data.document?.qrText || [\n    invoice.invoiceNumber || \"INVOICE\",\n    customer.name || \"CUSTOMER\",\n    t.total || \"\",\n    t.currency || \"\",\n    invoice.dueDate || \"\"\n  ].join(\"-\").replace(/\\s+/g,\"\");\n\n  target.innerHTML=\"\";\n\n  if(typeof QRCode !== \"undefined\"){\n    new QRCode(target,{\n      text:qrString,\n      width:90,\n      height:90,\n      colorDark:\"#022e64\",\n      colorLight:\"#ffffff\",\n      correctLevel:QRCode.CorrectLevel.M\n    });\n  }else{\n    target.innerHTML=`<div class=\"qr-fallback\">QR unavailable<br>${escapeHTML(invoice.invoiceNumber || \"\")}</div>`;\n  }\n}\n\nfunction synchronizeInvoiceDocument(rawData){\n  const data=normalizeInvoiceData(rawData);\n  CURRENT_INVOICE_DATA=data;\n\n  validateInvoiceData(data);\n\n  const invoice=data.invoice || {};\n  const seller=data.seller || {};\n  const customer=data.customer || {};\n  const finance=data.finance || {};\n  const payment=data.payment || {};\n  const t=data.totals || {};\n  const status=invoice.status || payment.status || \"Issued\";\n\n  if(seller.logoUrl){\n    document.getElementById(\"brand_logo\").src=seller.logoUrl;\n  }\n\n  setText(\"document_title\",data.document.title || (invoice.type === \"CREDIT_NOTE\" ? \"Credit Note\" : \"Invoice\"));\n  setText(\"document_subheading\",data.document.subheading || (invoice.type === \"SUPPLIER\" ? \"Supplier Invoice\" : \"Customer Invoice\"));\n  setText(\"document_subtitle\",data.document.subtitle || \"Official SKANDI Travels invoice generated from SKANDI Corporate Finance.\");\n\n  setText(\"invoice_banner_title\",data.document.bannerTitle || \"Invoice Issued\");\n  setText(\"invoice_banner_text\",data.document.bannerText || \"This invoice was created by SKANDI Corporate Finance. Review billing details, service lines, taxes, payment terms and due date before payment.\");\n\n  const pill=document.getElementById(\"invoice_status_pill\");\n  pill.innerText=status;\n  pill.className=`invoice-pill ${statusClass(status)}`;\n\n  setText(\"bill_to_name\",customer.name || \"\");\n  setText(\"bill_to_address_line1\",customer.addressLine1 || customer.billingAddressLine1 || \"\");\n  setText(\"bill_to_address_line2\",customer.addressLine2 || customer.billingAddressLine2 || \"\");\n  setText(\"bill_to_address_line3\",[customer.postalCode,customer.city,customer.state,customer.country].filter(hasValue).join(\" \"));\n  setText(\"bill_to_contact\",customer.contactName || \"\");\n  setText(\"bill_to_email\",customer.email || \"\");\n  setText(\"bill_to_phone\",customer.phone || customer.mobile || \"\");\n  setText(\"bill_to_tax_id\",customer.taxId || customer.vatId || \"\");\n\n  setText(\"lbl_invoice_number\",invoice.invoiceNumber || \"\");\n  setText(\"lbl_invoice_date\",invoice.invoiceDate || \"\");\n  setText(\"lbl_due_date\",invoice.dueDate || \"\");\n  setText(\"lbl_terms\",invoice.terms || payment.terms || \"\");\n  setText(\"lbl_currency\",t.currency || \"\");\n  setText(\"lbl_reference\",invoice.reference || invoice.externalReference || \"\");\n  setText(\"lbl_company_code\",finance.companyCode || invoice.companyCode || \"\");\n  setText(\"lbl_posting_status\",finance.postingStatus || invoice.postingStatus || \"\");\n\n  setText(\"seller_name\",seller.legalName || \"SKANDI Travels\");\n  setText(\"seller_address_line1\",seller.addressLine1 || seller.address || \"\");\n  setText(\"seller_address_line2\",[seller.postalCode,seller.city,seller.state,seller.country].filter(hasValue).join(\" \"));\n  setText(\"seller_phone\",seller.phone || \"\");\n  setText(\"seller_website\",seller.website || \"\");\n  setText(\"seller_tax_id\",seller.taxId || seller.vatId || \"\");\n\n  setText(\"lbl_booking_reference\",invoice.bookingReference || finance.bookingReference || \"\");\n  setText(\"lbl_order_reference\",invoice.orderReference || finance.orderReference || \"\");\n  setText(\"lbl_po_number\",invoice.poNumber || invoice.purchaseOrderNumber || \"\");\n  setText(\"lbl_cost_center\",finance.costCenter || invoice.costCenter || \"\");\n  setText(\"lbl_profit_center\",finance.profitCenter || invoice.profitCenter || \"\");\n  setText(\"lbl_journal_document\",finance.journalDocumentId || invoice.journalDocumentId || \"\");\n\n  setText(\"important_info_text\",data.importantInfo || \"Please pay by the due date and include the invoice number as the payment reference.\");\n  setText(\"lbl_finance_contact\",seller.financeContact || \"SKANDI Corporate Finance\");\n  setText(\"lbl_finance_email\",seller.financeEmail || seller.email || \"\");\n  setText(\"final_document_note\",data.finalDocumentNote || \"This PDF invoice summarizes amounts due to SKANDI Travels or amounts recorded in SKANDI Corporate Finance. Receipts, vouchers, confirmations or supplier documents may be issued separately.\");\n\n  renderInvoiceLines(data);\n  renderTotals(data);\n  renderPaymentInstructions(data);\n  renderLegal(data);\n  renderQr(data);\n}\n\nwindow.onmessage=function(event){\n  const message=event.data || {};\n\n  if(message.type === \"PDF_SKANDI_INVOICE_DATA\"){\n    synchronizeInvoiceDocument(message.payload || message.data || {});\n  }\n};\n\nif(window.SKANDI_INVOICE_DATA){\n  synchronizeInvoiceDocument(window.SKANDI_INVOICE_DATA);\n}\n\nwindow.parent.postMessage({\n  type:\"PDF_SKANDI_INVOICE_HTML_READY\"\n},\"*\");\n</script>\n\n</body>\n</html>";

const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const arr = (v) => Array.isArray(v) ? v : [];
const text = (v, n = 6000) => String(v ?? "").trim().slice(0, n);
const upper = (v, n = 300) => text(v, n).toUpperCase();
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const dateOnly = (v) => {
  const s = text(v, 80);
  if (!s) return "";
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (m) return m[0];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
};
const safeJson = (value) => JSON.stringify(value)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

function passengerName(passengers = [], booking = {}) {
  const p = arr(passengers)[0] || {};
  return text(
    p.display_name ||
    p.displayName ||
    [p.first_name || p.firstName, p.last_name || p.lastName].filter(Boolean).join(" ") ||
    booking.customer_name ||
    booking.customerName,
    300
  );
}

function componentInvoiceLine(component = {}, index = 0) {
  const p = obj(component.payload);
  const q = Math.max(1, num(p.quantity || component.quantity || 1));
  const unit =
    p.unitPrice ?? p.unit_price ??
    component.unit_amount ?? component.unitAmount ??
    p.price ?? p.amount ?? 0;
  const net =
    p.netAmount ?? p.net_amount ??
    (num(unit) ? num(unit) * q : component.total_amount ?? component.totalAmount ?? 0);
  const tax =
    p.taxAmount ?? p.tax_amount ?? 0;
  const gross =
    p.grossAmount ?? p.gross_amount ??
    component.total_amount ?? component.totalAmount ??
    (num(net) + num(tax));
  const type = text(component.component_type || component.componentType || p.type, 100).replaceAll("_", " ");
  const title = text(component.title || p.title || p.name || type || `Travel service ${index + 1}`, 500);
  const supplier = text(component.supplier || p.providerName || p.supplierName, 300);
  const reference = text(component.supplier_reference || component.supplierReference || p.reference || p.voucherRef, 180);
  const details = [supplier && `Supplier: ${supplier}`, reference && `Reference: ${reference}`].filter(Boolean).join(" · ");
  return {
    lineNumber: index + 1,
    description: title,
    details,
    quantity: q,
    unitPrice: num(unit),
    netAmount: num(net),
    taxRate: text(p.taxRate || p.tax_rate || p.taxCode || "", 80),
    taxAmount: num(tax),
    grossAmount: num(gross),
    glAccount: text(p.glAccount || p.gl_account || "", 80),
    costCenter: text(p.costCenter || p.cost_center || "", 80)
  };
}

function invoiceLines(booking = {}, components = []) {
  const bp = obj(booking.payload);
  const finance = obj(bp.finance);
  const explicit =
    arr(bp.invoiceLines).length ? arr(bp.invoiceLines) :
    arr(bp.financeInvoiceLines).length ? arr(bp.financeInvoiceLines) :
    arr(finance.invoiceLines).length ? arr(finance.invoiceLines) :
    arr(bp.priceItems).length ? arr(bp.priceItems) :
    [];

  if (explicit.length) {
    return explicit.map((line, index) => {
      const q = Math.max(1, num(line.quantity || 1));
      const unit = num(line.unitPrice ?? line.unit_price ?? line.price ?? 0);
      const net = line.netAmount !== undefined ? num(line.netAmount) :
        line.net_amount !== undefined ? num(line.net_amount) :
        unit * q;
      const tax = num(line.taxAmount ?? line.tax_amount ?? line.tax ?? 0);
      const gross = line.grossAmount !== undefined ? num(line.grossAmount) :
        line.gross_amount !== undefined ? num(line.gross_amount) :
        net + tax;
      return {
        lineNumber: line.lineNumber || line.lineNo || index + 1,
        description: text(line.description || line.lineText || line.name || `Invoice line ${index + 1}`, 500),
        details: text(line.details || line.note || "", 1500),
        quantity: q,
        unitPrice: unit,
        netAmount: net,
        taxRate: text(line.taxRate || line.taxCode || "", 80),
        taxAmount: tax,
        grossAmount: gross,
        glAccount: text(line.glAccount || line.glAccountId || "", 80),
        costCenter: text(line.costCenter || line.costCenterId || "", 80)
      };
    });
  }

  const mapped = arr(components)
    .filter((c) => !["REMOVED", "CANCELLED"].includes(upper(c.status, 40)))
    .map(componentInvoiceLine)
    .filter((line) => line.grossAmount || line.netAmount || line.unitPrice);

  if (mapped.length) return mapped;

  const total = num(booking.total_amount ?? booking.totalAmount);
  if (!total) return [];
  return [{
    lineNumber: 1,
    description: "Confirmed SKANDI Travels booking",
    details: `Booking reference: ${text(booking.booking_reference || booking.bookingReference || booking.pnr_locator || booking.pnrLocator, 120)}`,
    quantity: 1,
    unitPrice: total,
    netAmount: total,
    taxRate: "",
    taxAmount: 0,
    grossAmount: total,
    glAccount: "",
    costCenter: ""
  }];
}

function buildInvoiceData({ booking = {}, passengers = [], components = [], documentNumber = "", generatedAt = "" } = {}) {
  const bp = obj(booking.payload);
  const invoice = obj(bp.invoice);
  const finance = obj(bp.finance);
  const payment = obj(bp.payment);
  const compliance = obj(bp.invoiceCompliance || bp.compliance);
  const settings = obj(bp.financeCorporateSettings || bp.corporateSettings);
  const seller = obj(bp.seller || bp.agency || bp.financeSeller);
  const customer = obj(bp.customer);
  const lines = invoiceLines(booking, components);
  const currency = upper(
    invoice.currency || booking.currency || bp.currency || settings.currency || "USD",
    3
  );

  const subtotal = invoice.netAmount !== undefined ? num(invoice.netAmount) :
    lines.reduce((sum, line) => sum + num(line.netAmount), 0);
  const taxTotal = invoice.taxAmount !== undefined ? num(invoice.taxAmount) :
    lines.reduce((sum, line) => sum + num(line.taxAmount), 0);
  const canonicalTotal = num(
    invoice.grossAmount ??
    invoice.total ??
    booking.total_amount ??
    booking.totalAmount
  );
  const lineGross = lines.reduce((sum, line) => sum + num(line.grossAmount), 0);
  const total = canonicalTotal || lineGross || (subtotal + taxTotal);
  const paid = num(
    invoice.amountPaid ??
    payment.amountPaid ??
    bp.amountPaid ??
    (upper(payment.status, 40) === "PAID" ? total : 0)
  );
  const due = invoice.balanceDue !== undefined ? num(invoice.balanceDue) : Math.max(0, total - paid);
  const customerName = text(customer.name || booking.customer_name || booking.customerName || passengerName(passengers, booking), 300);
  const bookingRef = text(booking.booking_reference || booking.bookingReference || booking.pnr_locator || booking.pnrLocator || booking.id, 120);
  const generatedDate = dateOnly(generatedAt || new Date().toISOString());

  return {
    document: {
      title: "Invoice",
      subheading: "Customer Invoice",
      subtitle: "Official SKANDI Travels invoice generated from SKANDI Corporate Finance.",
      bannerTitle: upper(invoice.status || payment.status, 40).includes("PAID") ? "Invoice Paid" : "Invoice Issued",
      bannerText: "Review billing details, service lines, taxes, payment terms and due date before payment."
    },
    invoice: {
      type: "CUSTOMER",
      invoiceNumber: text(invoice.invoiceNumber || invoice.invoice_number || documentNumber, 120),
      invoiceDate: dateOnly(invoice.invoiceDate || invoice.invoice_date || generatedDate),
      dueDate: dateOnly(invoice.dueDate || invoice.due_date || payment.dueDate || settings.defaultDueDate),
      terms: text(invoice.terms || payment.terms || settings.paymentTerms, 300),
      currency,
      status: text(invoice.status || payment.status || "Draft", 80),
      reference: text(invoice.reference || invoice.referenceNumber || bookingRef, 300),
      bookingReference: bookingRef,
      orderReference: text(invoice.orderReference || booking.supplier_order_id || booking.supplierOrderId, 200),
      poNumber: text(invoice.poNumber || invoice.purchaseOrderNumber || finance.poNumber, 120),
      companyCode: text(invoice.companyCode || finance.companyCode || settings.companyCode, 80),
      postingStatus: text(invoice.postingStatus || finance.postingStatus || "DRAFT", 80),
      paymentInvoiceTermsText: text(invoice.paymentInvoiceTermsText, 6000)
    },
    seller: {
      legalName: text(seller.legalName || seller.name || "SKANDI Travels", 300),
      addressLine1: text(seller.addressLine1 || seller.address, 400),
      addressLine2: text(seller.addressLine2, 400),
      postalCode: text(seller.postalCode, 40),
      city: text(seller.city, 120),
      state: text(seller.state, 120),
      country: text(seller.country, 120),
      phone: text(seller.phone || bp.agencyPhone, 120),
      website: text(seller.website || "https://www.skanditravels.com", 300),
      taxId: text(seller.taxId || seller.vatId, 160),
      financeContact: text(seller.financeContact || "SKANDI Corporate Finance", 200),
      financeEmail: text(seller.financeEmail || seller.email, 300),
      logoUrl: text(seller.logoUrl, 1000)
    },
    customer: {
      name: customerName,
      addressLine1: text(customer.addressLine1 || customer.billingAddressLine1, 400),
      addressLine2: text(customer.addressLine2 || customer.billingAddressLine2, 400),
      postalCode: text(customer.postalCode, 40),
      city: text(customer.city, 120),
      state: text(customer.state, 120),
      country: text(customer.country, 120),
      contactName: text(customer.contactName || customerName, 300),
      email: text(customer.email || booking.customer_email || booking.customerEmail, 400),
      phone: text(customer.phone || customer.mobile || booking.customer_phone || booking.customerPhone, 120),
      taxId: text(customer.taxId || customer.vatId, 160)
    },
    finance: {
      companyCode: text(finance.companyCode || invoice.companyCode || settings.companyCode, 80),
      costCenter: text(finance.costCenter || invoice.costCenter, 120),
      profitCenter: text(finance.profitCenter || invoice.profitCenter, 120),
      postingStatus: text(finance.postingStatus || invoice.postingStatus || "DRAFT", 80),
      journalDocumentId: text(finance.journalDocumentId || invoice.journalDocumentId, 180),
      bookingReference: bookingRef,
      orderReference: text(booking.supplier_order_id || booking.supplierOrderId, 200)
    },
    payment: {
      status: text(payment.status || (due <= 0 && total > 0 ? "Paid" : "Open"), 80),
      terms: text(payment.terms || invoice.terms || settings.paymentTerms, 300),
      instructions: text(payment.instructions || settings.paymentInstructions, 3000),
      paymentLink: text(payment.paymentLink, 1000),
      bankName: text(payment.bankName || settings.bankName, 300),
      iban: text(payment.iban || settings.iban, 160),
      swift: text(payment.swift || payment.bic || settings.swift || settings.bic, 120),
      routingNumber: text(payment.routingNumber || settings.routingNumber, 120),
      accountNumber: text(payment.accountNumber || settings.accountNumber, 160),
      accountLast4: text(payment.accountLast4 || settings.accountLast4, 20)
    },
    lines,
    totals: { currency, subtotal, taxTotal, total, paid, balanceDue: due },
    compliance: {
      sellerDisclosureText: text(compliance.sellerDisclosureText, 6000),
      taxDisclosureText: text(compliance.taxDisclosureText, 6000),
      invoiceConditionsText: text(compliance.invoiceConditionsText, 6000),
      paymentInvoiceTermsText: text(compliance.paymentInvoiceTermsText, 6000)
    },
    paymentInvoiceTermsText: text(
      bp.paymentInvoiceTermsText ||
      invoice.paymentInvoiceTermsText ||
      settings.paymentInvoiceTermsText ||
      compliance.paymentInvoiceTermsText ||
      payment.paymentInvoiceTermsText,
      6000
    ),
    financeCorporateSettings: settings,
    importantInfo: text(bp.invoiceImportantInfo || bp.importantInfo, 6000),
    finalDocumentNote: text(bp.invoiceFinalDocumentNote, 6000)
  };
}

export function renderInvoice(input = {}) {
  const data = buildInvoiceData(input);
  const injection = `<script>window.SKANDI_INVOICE_DATA=${safeJson(data)};</script>`;
  return TEMPLATE.replace("</head>", `${injection}</head>`);
}
