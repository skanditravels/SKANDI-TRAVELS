import { webMethod, Permissions } from 'wix-web-module';

import { requireInternalAgent, text, writeInternalAudit } from './RIA/internalAccess.js';
import { restRequest } from './RIA/supabaseServer.js';

function now() { return new Date().toISOString(); }
function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
}
function date(value) {
  const output = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(output) ? output : '';
}
function entryDate(row = {}) {
  return row.transaction_date || row.entry_date || row.created_at?.slice(0, 10) || '';
}
function inPeriod(row, period = {}) {
  const value = entryDate(row);
  return (!period.startDate || value >= period.startDate) && (!period.endDate || value <= period.endDate);
}
function normalizePeriod(input = {}) {
  return {
    startDate: date(input.startDate || input.period?.startDate),
    endDate: date(input.endDate || input.period?.endDate),
  };
}
function ledgerMap(row = {}) {
  return {
    id: row.id || '', entryId: row.entry_id || row.id || '', sourceType: row.source_type || row.reference_type || '',
    sourceId: row.source_id || row.reference_id || '', accountCode: row.account_code || '', accountName: row.account_name || '',
    debit: money(row.debit), credit: money(row.credit), currency: row.currency || 'SEK', transactionDate: entryDate(row),
    note: row.note || row.description || '', status: row.status || 'POSTED', payload: row.payload || {},
  };
}

async function requireFinanceAccess() {
  return requireInternalAgent({ capability: 'manage' });
}

async function getLedgerRows(period = {}) {
  const rows = await restRequest({
    table: 'finance_ledger_entries',
    query: { select: '*', order: 'transaction_date.desc,created_at.desc', limit: 2000 },
  });
  return (rows || []).filter((row) => inPeriod(row, period));
}

function profitAndLoss(rows = []) {
  const income = rows.reduce((total, row) => total + money(row.credit), 0);
  const expenses = rows.reduce((total, row) => total + money(row.debit), 0);
  return { income, expenses, net: Math.round((income - expenses) * 100) / 100, entries: rows.length };
}

async function audit(agent, action, target, after = {}) {
  await writeInternalAudit({ agent, action: `FINANCE_${action}`, target, after }).catch(() => null);
}

export const listFinanceLedgerEntries = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireFinanceAccess();
  const period = normalizePeriod(input);
  const rows = await getLedgerRows(period);
  return { ok: true, period, entries: rows.map(ledgerMap) };
});

export const getProfitAndLossStatement = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireFinanceAccess();
  const period = normalizePeriod(input);
  const rows = await getLedgerRows(period);
  return { ok: true, period, ...profitAndLoss(rows), entries: rows.map(ledgerMap) };
});

export const getCorporateFinanceBootstrap = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { profile } = await requireFinanceAccess();
  const period = normalizePeriod(input);
  const [ledger, invoices, expenses] = await Promise.all([
    getLedgerRows(period),
    restRequest({ table: 'invoices', query: { select: '*', order: 'issue_date.desc,created_at.desc', limit: 1000 } }),
    restRequest({ table: 'expenses', query: { select: '*', order: 'expense_date.desc,created_at.desc', limit: 1000 } }),
  ]);
  const matchingInvoices = (invoices || []).filter((row) => inPeriod({ ...row, transaction_date: row.issue_date }, period));
  const matchingExpenses = (expenses || []).filter((row) => inPeriod({ ...row, transaction_date: row.expense_date }, period));
  return {
    ok: true,
    profile,
    period,
    ledger: ledger.map(ledgerMap),
    invoices: matchingInvoices,
    expenses: matchingExpenses,
    profitAndLoss: profitAndLoss(ledger),
  };
});

export const syncFinanceLedger = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireFinanceAccess();
  const period = normalizePeriod(input);
  const [ledger, invoices, expenses] = await Promise.all([
    getLedgerRows(period),
    restRequest({ table: 'invoices', query: { select: '*', order: 'issue_date.desc,created_at.desc', limit: 1000 } }),
    restRequest({ table: 'expenses', query: { select: '*', order: 'expense_date.desc,created_at.desc', limit: 1000 } }),
  ]);
  const sources = new Set(ledger.map((row) => `${row.source_type || ''}:${row.source_id || ''}`));
  const entries = [];

  for (const invoice of invoices || []) {
    if (!inPeriod({ ...invoice, transaction_date: invoice.issue_date }, period)) continue;
    const sourceId = invoice.id || invoice.invoice_id || invoice.invoice_number;
    if (!sourceId || sources.has(`INVOICE:${sourceId}`)) continue;
    entries.push({
      entry_id: `INV-${sourceId}-${Date.now()}`,
      source_type: 'INVOICE', source_id: String(sourceId), account_code: '4000', account_name: 'Travel revenue',
      debit: 0, credit: money(invoice.total), currency: text(invoice.currency || 'SEK', 3),
      transaction_date: date(invoice.issue_date) || now().slice(0, 10), note: text(invoice.invoice_number || invoice.invoice_id || 'Invoice', 500),
      status: 'POSTED', payload: { invoiceId: invoice.invoice_id || sourceId }, created_at: now(), updated_at: now(),
    });
  }

  for (const expense of expenses || []) {
    if (!inPeriod({ ...expense, transaction_date: expense.expense_date }, period)) continue;
    const sourceId = expense.id || expense.expense_id;
    if (!sourceId || sources.has(`EXPENSE:${sourceId}`)) continue;
    entries.push({
      entry_id: `EXP-${sourceId}-${Date.now()}`,
      source_type: 'EXPENSE', source_id: String(sourceId), account_code: '6000', account_name: text(expense.category || 'Operating expense', 240),
      debit: money(expense.amount), credit: 0, currency: text(expense.currency || 'SEK', 3),
      transaction_date: date(expense.expense_date) || now().slice(0, 10), note: text(expense.vendor || expense.expense_id || 'Expense', 500),
      status: 'POSTED', payload: { expenseId: expense.expense_id || sourceId }, created_at: now(), updated_at: now(),
    });
  }

  if (entries.length) {
    await restRequest({ table: 'finance_ledger_entries', method: 'POST', body: entries });
  }
  await audit(agent, 'LEDGER_SYNCED', null, { inserted: entries.length, period });
  return { ok: true, period, inserted: entries.length };
});

export const saveManualFinanceEntry = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireFinanceAccess();
  const item = input.entry || input.item || input;
  const debit = money(item.debit);
  const credit = money(item.credit);
  if ((debit <= 0 && credit <= 0) || (debit > 0 && credit > 0)) {
    throw new Error('FINANCE_ENTRY_AMOUNT_INVALID');
  }
  const saved = await restRequest({
    table: 'finance_ledger_entries', method: 'POST',
    body: {
      entry_id: text(item.entryId || '', 120) || `MAN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      source_type: 'MANUAL', source_id: text(item.sourceId, 120) || null,
      account_code: text(item.accountCode || '9999', 80), account_name: text(item.accountName || 'Manual entry', 240),
      debit, credit, currency: text(item.currency || 'SEK', 3), transaction_date: date(item.transactionDate || item.date) || now().slice(0, 10),
      note: text(item.note || item.description, 1000), status: 'POSTED', payload: { ...item, enteredBy: agent.id }, created_at: now(), updated_at: now(),
    },
  });
  const entry = saved?.[0] || null;
  await audit(agent, 'MANUAL_ENTRY_SAVED', entry?.id || null, { entryId: entry?.entry_id || null });
  return { ok: true, entry: ledgerMap(entry || {}) };
});
