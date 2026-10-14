// /src/backend/SKANDI_CORE/financeControl.js
// SKANDI V12 Corporate Finance Control — canonical domain core.
// Uses only schema-verified public objects through the canonical Supabase transport.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors";

const READ_LIMIT = 1500;
const ACTUAL_TABLES = Object.freeze({
  ledger: "finance_ledger_entries",
  invoices: "invoices",
  invoicePayments: "invoice_payments",
  expenses: "expenses",
  receipts: "sales_receipts",
  storeOrders: "storefront_orders",
  paymentEvents: "payment_events",
  bookings: "altea_bookings",
  bookingComponents: "altea_booking_components",
  tours: "tour_activity_inventory",
  transfers: "airport_transfers",
  payrollRuns: "staff_payroll_runs",
  payrollLines: "staff_payroll_run_lines",
  payrollSettings: "staff_payroll_settings",
  taxProfiles: "employee_tax_profiles",
  approvals: "document_approvals",
  financeDocuments: "document_definitions"
});

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}
function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
function first(value) {
  return Array.isArray(value) ? value[0] || null : value || null;
}
function rowId(prefix = "FIN") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function sessionProfile(session = {}) {
  const staff = session.staff || session.profile || session.user || {};
  return {
    name: clean(session.displayName || session.name || staff.displayName || staff.name || staff.fullName || "Finance user", 160),
    skId: clean(session.skId || session.sk_id || staff.skId || staff.sk_id || "", 60),
    role: clean(session.jobTitle || session.role || staff.jobTitle || staff.job_title || staff.role || "", 160),
    base: clean(session.base || session.station || staff.base || staff.station || "", 80)
  };
}
async function readTable(table, order = "created_at.desc", limit = READ_LIMIT, select = "*") {
  return restRequest({ table, query: { select, order, limit } });
}
async function readWithWarning(key, table, order = "created_at.desc", limit = READ_LIMIT, select = "*") {
  try {
    return { key, rows: await readTable(table, order, limit, select), warning: null };
  } catch (error) {
    return {
      key,
      rows: [],
      warning: {
        source: table,
        code: clean(error?.code || "FINANCE_SOURCE_READ_FAILED", 120),
        message: clean(error?.message || `Could not read ${table}.`, 500)
      }
    };
  }
}
function payloadOf(row = {}) {
  return row?.payload && typeof row.payload === "object" && !Array.isArray(row.payload) ? row.payload : {};
}
function ledgerView(rows = []) {
  return rows.map(row => {
    const payload = payloadOf(row);
    const debit = number(row.debit);
    const credit = number(row.credit);
    const amount = credit - debit;
    const date = row.transaction_date || row.entry_date || row.created_at || "";
    const period = clean(payload.period || (date ? String(date).slice(0, 7) : ""), 20);
    return {
      _id: row.id,
      journalDocumentId: row.entry_id || row.id,
      lineNo: payload.lineNo || payload.line_no || 1,
      companyCode: payload.companyCode || payload.company_code || "SKANDI",
      ledgerId: payload.ledgerId || payload.ledger_id || "PRIMARY",
      postingDate: date,
      glAccountId: row.account_code || payload.glAccountId || "",
      accountName: row.account_name || payload.accountName || "",
      accountType: payload.accountType || (credit > debit ? "Revenue" : debit > credit ? "Expense" : "Other"),
      sourceModule: row.source_type || row.reference_type || payload.sourceModule || "",
      sourceDocumentType: row.reference_type || row.source_type || "",
      sourceDocumentId: row.source_id || row.reference_id || "",
      lineText: row.description || row.note || "",
      amountGroup: amount,
      amountCompanyCode: amount,
      amountTransaction: amount,
      groupCurrency: row.currency || "USD",
      companyCodeCurrency: row.currency || "USD",
      transactionCurrency: row.currency || "USD",
      fiscalYear: period.slice(0, 4),
      fiscalPeriod: period.slice(5, 7),
      taxCode: payload.taxCode || payload.tax_code || "",
      postingStatus: row.status || "POSTED",
      raw: row
    };
  });
}
function invoiceView(rows = []) {
  return rows.map(row => {
    const payload = payloadOf(row);
    const invoiceType = clean(payload.invoiceType || payload.invoice_type || payload.type || "CUSTOMER", 30).toUpperCase();
    return {
      _id: row.id,
      invoiceId: row.invoice_id || row.id,
      invoiceNumber: row.invoice_number || row.invoice_id || row.id,
      invoiceType,
      companyCode: payload.companyCode || payload.company_code || "SKANDI",
      customerId: row.customer_member_id || row.customer_email || "",
      partnerId: payload.partnerId || payload.partner_id || row.customer_member_id || row.customer_email || "",
      customerName: row.customer_name || payload.customerName || "",
      invoiceDate: row.issue_date || row.created_at || "",
      dueDate: row.due_date || "",
      currency: row.currency || "USD",
      netAmount: number(row.subtotal),
      taxAmount: number(row.tax_total),
      grossAmount: number(row.total),
      paidAmount: number(row.paid_total),
      balanceDue: number(row.balance_due),
      paymentStatus: row.status || (number(row.balance_due) <= 0 && number(row.total) > 0 ? "PAID" : "OPEN"),
      postingStatus: row.status || "DRAFT",
      pdfUrl: row.pdf_url || "",
      lineItems: Array.isArray(row.line_items) ? row.line_items : [],
      taxLines: Array.isArray(row.tax_lines) ? row.tax_lines : [],
      raw: row
    };
  });
}
function expenseView(rows = []) {
  return rows.map(row => {
    const p = payloadOf(row);
    return {
      _id: row.id,
      expenseReportId: row.expense_id || row.id,
      reportNumber: row.expense_id || row.id,
      employeeId: p.employeeId || p.employee_id || p.skId || "",
      companyCode: p.companyCode || p.company_code || "SKANDI",
      reportDate: row.expense_date || row.created_at || "",
      currency: row.currency || "USD",
      category: row.category || "",
      costCenterId: p.costCenterId || p.cost_center_id || "",
      grossAmount: number(row.amount),
      taxAmount: number(row.tax_amount),
      receiptUrl: row.receipt_url || "",
      purpose: p.purpose || row.vendor || "",
      notes: p.notes || "",
      status: row.status || "DRAFT",
      vendor: row.vendor || "",
      raw: row
    };
  });
}
function receiptView(rows = []) {
  return rows.map(row => ({
    _id: row.id,
    receiptNumber: row.receipt_number || row.receipt_id || row.id,
    title: `Receipt ${row.receipt_number || row.receipt_id || ""}`.trim(),
    bookingReference: row.booking_reference || row.pnr || "",
    amount: number(row.amount),
    taxAmount: number(row.tax),
    currency: row.currency || "USD",
    paymentStatus: row.payment_status || "",
    sourceType: "Sales receipt",
    status: row.payment_status || "",
    issuedAt: row.issued_at || row.created_at || "",
    raw: row
  }));
}
function integrationEvents(sources = {}) {
  const events = [];
  const pushRows = (rows, source, mapper) => {
    for (const row of rows || []) {
      const x = mapper(row);
      events.push({
        inboundEventId: `${source}:${x.id}`,
        sourceSystem: source,
        sourceRecordId: x.id,
        eventType: x.type,
        amount: x.amount,
        currency: x.currency,
        status: x.status,
        eventDate: x.date,
        description: x.description,
        payload: row
      });
    }
  };
  pushRows(sources.bookings, "ALTEA", row => ({
    id: row.booking_reference || row.id, type: row.product_type || row.booking_type || "BOOKING",
    amount: number(row.total_amount), currency: row.currency || "", status: row.status || row.payment_status || "",
    date: row.updated_at || row.created_at || "", description: `${row.origin || ""} ${row.destination || ""}`.trim()
  }));
  pushRows(sources.bookingComponents, "ALTEA_COMPONENT", row => ({
    id: row.id, type: row.component_type || "COMPONENT", amount: number(row.total_amount),
    currency: row.currency || "", status: row.status || "", date: row.updated_at || row.created_at || "",
    description: row.title || row.supplier || ""
  }));
  pushRows(sources.tours, "TOUR_INVENTORY", row => ({
    id: row.tour_id || row.id, type: "TOUR", amount: number(row.adult_price) * number(row.sold),
    currency: row.currency || "", status: row.status || "", date: row.service_date || row.updated_at || "",
    description: row.activity_name || row.destination || ""
  }));
  pushRows(sources.transfers, "TRANSFER", row => ({
    id: row.transfer_id || row.id, type: "TRANSFER", amount: number(row.price),
    currency: row.currency || "", status: row.status || (row.active ? "ACTIVE" : "INACTIVE"),
    date: row.updated_at || row.created_at || "", description: row.title || row.provider || ""
  }));
  pushRows(sources.storeOrders, "WIX_STOREFRONT", row => {
    const p = payloadOf(row);
    return {
      id: row.order_id || row.id, type: "STORE_ORDER",
      amount: number(p.total?.amount ?? p.totalAmount ?? p.priceSummary?.total?.amount ?? p.priceSummary?.total),
      currency: p.currency || p.priceSummary?.currency || "", status: row.status || row.fulfillment_status || "",
      date: row.updated_at || row.created_at || "", description: p.number || p.orderNumber || row.order_id || ""
    };
  });
  pushRows(sources.paymentEvents, "PAYMENT", row => ({
    id: row.event_id || row.id, type: row.provider || "PAYMENT", amount: number(row.amount),
    currency: row.currency || "", status: row.status || "", date: row.updated_at || row.created_at || "",
    description: row.booking_id || row.member_id || ""
  }));
  pushRows(sources.payrollRuns, "PAYROLL", row => ({
    id: row.run_code || row.id, type: "PAYROLL_RUN", amount: number(row.gross_total),
    currency: row.currency || "", status: row.status || "", date: row.finalized_at || row.calculated_at || row.updated_at || "",
    description: row.period_code || ""
  }));
  return events.sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")));
}
function financeDocumentDefinitions(rows = []) {
  return (rows || []).filter(row => String(row.category || "").toUpperCase() === "FINANCE");
}
function payrollTaxProfiles(rows = []) {
  return rows.map(row => ({
    _id: row.id,
    profileId: row.id,
    employeeId: row.employee_id || "",
    countryCode: row.country || "",
    taxCode: row.tax_code || "",
    employeeTaxPercent: number(row.tax_percent),
    pensionPercent: number(row.pension_percent),
    socialSecurityPercent: number(row.social_security_percent),
    extraWithholding: number(row.extra_withholding),
    effectiveFrom: row.effective_from || "",
    status: row.active === false ? "Inactive" : "Active",
    raw: row
  }));
}
function payrollSettings(rows = []) {
  return rows.map(row => ({
    _id: row.id,
    settingId: row.id,
    settingKey: row.setting_key || "",
    settingValue: row.setting_value ?? "",
    payload: row.payload || {},
    status: "Active"
  }));
}
function workflowCases(rows = []) {
  return rows.map(row => ({
    _id: row.id,
    workflowCaseId: row.id,
    caseType: row.approval_stage || "Document approval",
    sourceDocumentId: row.document_id,
    assignedTo: row.approver_id || "",
    status: row.decision || "PENDING",
    comment: row.comment || "",
    decidedAt: row.decided_at || ""
  }));
}

export async function getFinanceControlBootstrapCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  const specs = [
    ["ledger", ACTUAL_TABLES.ledger, "transaction_date.desc"],
    ["invoices", ACTUAL_TABLES.invoices, "created_at.desc"],
    ["invoicePayments", ACTUAL_TABLES.invoicePayments, "created_at.desc"],
    ["expenses", ACTUAL_TABLES.expenses, "created_at.desc"],
    ["receipts", ACTUAL_TABLES.receipts, "created_at.desc"],
    ["storeOrders", ACTUAL_TABLES.storeOrders, "created_at.desc"],
    ["paymentEvents", ACTUAL_TABLES.paymentEvents, "created_at.desc"],
    ["bookings", ACTUAL_TABLES.bookings, "created_at.desc"],
    ["bookingComponents", ACTUAL_TABLES.bookingComponents, "created_at.desc"],
    ["tours", ACTUAL_TABLES.tours, "created_at.desc"],
    ["transfers", ACTUAL_TABLES.transfers, "created_at.desc"],
    ["payrollRuns", ACTUAL_TABLES.payrollRuns, "created_at.desc"],
    ["payrollLines", ACTUAL_TABLES.payrollLines, "created_at.desc"],
    ["payrollSettings", ACTUAL_TABLES.payrollSettings, "updated_at.desc"],
    ["taxProfiles", ACTUAL_TABLES.taxProfiles, "updated_at.desc"],
    ["approvals", ACTUAL_TABLES.approvals, "decided_at.desc"],
    ["financeDocuments", ACTUAL_TABLES.financeDocuments, "code.asc"]
  ];
  const settled = await Promise.all(specs.map(([key, table, order]) => readWithWarning(key, table, order)));
  const sources = Object.fromEntries(settled.map(item => [item.key, item.rows]));
  const warnings = settled.map(item => item.warning).filter(Boolean);

  const allInvoices = invoiceView(sources.invoices);
  const customerInvoices = allInvoices.filter(x => x.invoiceType !== "SUPPLIER");
  const supplierInvoices = allInvoices.filter(x => x.invoiceType === "SUPPLIER");
  const entries = ledgerView(sources.ledger);
  const data = {
    FinanceUniversalJournal: entries,
    FinanceDocumentHeader: [],
    FinanceCompanyCode: [],
    FinanceCurrency: [],
    FinanceFxRate: [],
    FinanceGLAccount: [],
    FinanceCostCenter: [],
    FinanceProfitCenter: [],
    FinanceCostCenterBudget: [],
    FinanceExpenseReports: expenseView(sources.expenses),
    FinanceExpenseReportLines: [],
    FinanceReceipts: receiptView(sources.receipts),
    FinancePurchaseRequests: [],
    FinancePurchaseOrders: [],
    FinancePurchaseOrderLines: [],
    FinancePurchaseReceipts: [],
    FinanceSupplierInvoice: supplierInvoices,
    FinanceSupplierInvoiceLine: [],
    FinanceCustomerInvoice: customerInvoices,
    FinanceCustomerInvoiceLine: [],
    FinanceInvoicePdfFiles: allInvoices.filter(x => x.pdfUrl).map(x => ({
      invoicePdfId: x.invoiceId, invoiceId: x.invoiceId, invoiceNumber: x.invoiceNumber,
      fileUrl: x.pdfUrl, status: x.postingStatus
    })),
    FinanceInvoiceTemplates: [],
    FinanceBankAccount: [],
    FinanceBankStatementLine: [],
    FinanceCommerceOrderMirror: sources.storeOrders,
    FinanceCommercePaymentMirror: sources.paymentEvents,
    FinancePayrollTaxProfiles: payrollTaxProfiles(sources.taxProfiles),
    FinancePayrollBenefitPlans: [],
    FinancePayrollDeductionRules: [],
    FinancePayrollGlMappings: [],
    FinanceApprovalPolicies: [],
    FinanceCorporateSettings: payrollSettings(sources.payrollSettings),
    FinanceWorkflowCase: workflowCases(sources.approvals),
    FinanceAuditEvent: [],
    IntegrationInboundEvent: integrationEvents(sources),
    OperationalBookings: sources.bookings,
    OperationalBookingComponents: sources.bookingComponents,
    OperationalTours: sources.tours,
    OperationalTransfers: sources.transfers,
    PayrollRuns: sources.payrollRuns,
    PayrollRunLines: sources.payrollLines,
    FinanceDocumentDefinitions: financeDocumentDefinitions(sources.financeDocuments)
  };

  return {
    ok: warnings.length === 0,
    profile: sessionProfile(session),
    entries,
    data,
    warnings,
    sourceStatus: Object.fromEntries(settled.map(item => [item.key, {
      ok: !item.warning,
      rows: item.rows.length,
      source: specs.find(spec => spec[0] === item.key)?.[1] || ""
    }])),
    period: {
      startDate: clean(input.startDate || input.period?.startDate, 20),
      endDate: clean(input.endDate || input.period?.endDate, 20)
    },
    generatedAt: new Date().toISOString()
  };
}

export async function saveFinanceExpenseReportCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  const row = {
    expense_id: clean(input.expenseReportId || input.report?.expenseReportId || rowId("EXP"), 100),
    vendor: clean(input.vendor || input.report?.vendor || input.purpose || input.report?.purpose || "Staff expense", 200),
    category: clean(input.category || input.report?.category || "Other", 100),
    amount: number(input.grossAmount ?? input.report?.grossAmount ?? input.amount),
    currency: clean(input.currency || input.report?.currency || "USD", 12).toUpperCase(),
    expense_date: clean(input.reportDate || input.report?.reportDate || input.date || new Date().toISOString().slice(0, 10), 20),
    receipt_url: clean(input.receiptUrl || input.report?.receiptUrl || "", 3000) || null,
    status: clean(input.status || input.report?.status || "DRAFT", 80),
    tax_amount: number(input.taxAmount ?? input.report?.taxAmount),
    approved_by: null,
    payload: {
      ...payloadOf(input),
      employeeId: clean(input.employeeId || input.report?.employeeId || "", 100),
      companyCode: clean(input.companyCode || input.report?.companyCode || "SKANDI", 40),
      costCenterId: clean(input.costCenterId || input.report?.costCenterId || "", 100),
      purpose: clean(input.purpose || input.report?.purpose || "", 500),
      notes: clean(input.notes || input.report?.notes || "", 2000),
      savedBy: sessionProfile(session).skId
    }
  };
  const result = await restRequest({ table: ACTUAL_TABLES.expenses, method: "POST", body: row });
  return { ok: true, record: first(result), message: "Expense report saved." };
}

export async function saveFinanceInvoiceCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  const header = input.header || input.invoice || input;
  const line = input.line || {};
  const pdf = input.pdf || {};
  const invoiceId = clean(header.invoiceId || header.invoiceNumber || rowId("INV"), 100);
  const net = number(header.netAmount ?? line.netAmount ?? header.subtotal);
  const tax = number(header.taxAmount ?? line.taxAmount ?? header.tax_total);
  const gross = number(header.grossAmount ?? line.grossAmount ?? header.total ?? (net + tax));
  const status = clean(header.postingStatus || header.status || "DRAFT", 80).toUpperCase();
  const row = {
    invoice_id: invoiceId,
    invoice_number: clean(header.invoiceNumber || invoiceId, 100),
    customer_member_id: clean(header.customerMemberId || "", 160) || null,
    customer_email: clean(header.customerEmail || "", 320) || null,
    customer_name: clean(header.customerName || header.partnerId || "", 200) || null,
    status,
    issue_date: clean(header.invoiceDate || new Date().toISOString().slice(0, 10), 20),
    due_date: clean(header.dueDate || "", 20) || null,
    currency: clean(header.currency || line.currency || "USD", 12).toUpperCase(),
    subtotal: net,
    tax_total: tax,
    total: gross,
    paid_total: number(header.paidAmount),
    balance_due: Math.max(0, gross - number(header.paidAmount)),
    line_items: [{ ...line, description: clean(line.description || header.lineDescription || "Service", 500) }],
    tax_lines: tax ? [{ amount: tax, code: clean(header.taxCode || "", 80) }] : [],
    seller: { name: "SKANDI" },
    buyer: { id: clean(header.partnerId || "", 200), name: clean(header.customerName || "", 200) },
    pdf_url: clean(pdf.fileUrl || header.pdfUrl || "", 3000) || null,
    payload: {
      invoiceType: clean(header.invoiceType || "CUSTOMER", 30).toUpperCase(),
      companyCode: clean(header.companyCode || "SKANDI", 40),
      costCenterId: clean(line.costCenterId || header.costCenterId || "", 100),
      savedBy: sessionProfile(session).skId
    }
  };
  const existing = await restRequest({ table: ACTUAL_TABLES.invoices, query: { select: "id,invoice_id", invoice_id: `eq.${invoiceId}`, limit: 1 } });
  const result = existing.length
    ? await restRequest({ table: ACTUAL_TABLES.invoices, method: "PATCH", query: { invoice_id: `eq.${invoiceId}` }, body: row })
    : await restRequest({ table: ACTUAL_TABLES.invoices, method: "POST", body: row });
  return { ok: true, invoice: first(result), message: status === "POSTED" ? "Invoice saved as posted." : "Invoice saved." };
}

export async function saveFinanceRecordCore({ collection = "", item = {} } = {}) {
  const session = await requireStaffPortalSessionCore();
  const name = clean(collection, 120);
  if (name === "FinanceCorporateSettings") {
    const key = clean(item.settingKey || item.setting_key, 200);
    if (!key) throw new SkandiError("FINANCE_SETTING_KEY_REQUIRED");
    const body = {
      setting_key: key,
      setting_value: clean(item.settingValue ?? item.setting_value, 2000),
      payload: { ...item, savedBy: sessionProfile(session).skId }
    };
    const existing = await restRequest({ table: ACTUAL_TABLES.payrollSettings, query: { select: "id,setting_key", setting_key: `eq.${key}`, limit: 1 } });
    const result = existing.length
      ? await restRequest({ table: ACTUAL_TABLES.payrollSettings, method: "PATCH", query: { setting_key: `eq.${key}` }, body })
      : await restRequest({ table: ACTUAL_TABLES.payrollSettings, method: "POST", body });
    return { ok: true, collection: name, record: first(result), message: "Finance setting saved." };
  }
  throw new SkandiError(
    "FINANCE_COLLECTION_NOT_PERSISTED",
    `${name || "This finance collection"} has no verified canonical storage contract. The action was not reported as successful.`
  );
}

export async function saveFinancePurchaseRequestCore() {
  await requireStaffPortalSessionCore();
  throw new SkandiError(
    "FINANCE_PURCHASE_STORAGE_NOT_CONFIGURED",
    "Purchase-request storage is not present in the verified V12 Supabase schema. No purchase record was written."
  );
}

export async function getFinanceControlDiagnosticsCore() {
  await requireStaffPortalSessionCore();
  return {
    ok: true,
    canonicalTables: ACTUAL_TABLES,
    unsupportedUiCollections: [
      "FinanceBankAccount", "FinanceBankStatementLine", "FinanceCostCenter", "FinanceCostCenterBudget",
      "FinanceApprovalPolicies", "FinanceCurrency", "FinanceTaxCode", "FinancePayrollBenefitPlans",
      "FinancePayrollGlMappings", "FinancePurchaseRequests"
    ],
    note: "Unsupported collections are rejected rather than returning false success."
  };
}
