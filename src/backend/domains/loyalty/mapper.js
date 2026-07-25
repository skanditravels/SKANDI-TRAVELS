export function mapPointsLedgerRow(row = {}) {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    memberId: row.member_id,
    type: row.type,
    amount: Number(row.amount || 0),
    description: row.description || "",
    status: row.status || "",
    transactionDate: row.transaction_date || row.created_at || "",
    payload: row.payload || {}
  };
}
