import { query, queryOne } from "./db";

export interface LedgerRow {
  id: number;
  date: string; // ISO
  remarks: string;
  qty: string | null;
  truckNo: string | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerResult {
  rows: LedgerRow[];
  totalQty: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface AccountRow {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  opening_date: string | null;
  closing_date: string | null;
  opening_balance: string;
  notes: string | null;
  status: string;
}

interface TxRow {
  id: number;
  date: string;
  remarks: string;
  qty: string | null;
  truck_no: string | null;
  debit: string;
  credit: string;
}

/**
 * Compute the full running ledger for an account.
 * Balance rule (from the paper ledger): balance = prev + debit − credit.
 * Rows ordered chronologically; same-day rows keep entry order (id).
 * Balances are ALWAYS derived — never stored — so add/edit/delete
 * can never leave stale balances behind.
 */
export async function computeLedger(
  accountId: number,
  opts?: { from?: string; to?: string; q?: string; truck?: string; type?: "debit" | "credit" | "all" }
): Promise<LedgerResult> {
  const account = await queryOne<AccountRow>(
    "SELECT * FROM accounts WHERE id = $1",
    [accountId]
  );
  if (!account) throw new Error("Account not found");

  const conds: string[] = ["account_id = $1"];
  const params: unknown[] = [accountId];
  let n = 2;
  if (opts?.from) { conds.push(`date >= $${n++}`); params.push(opts.from); }
  if (opts?.to) { conds.push(`date <= $${n++}`); params.push(opts.to); }
  if (opts?.q) { conds.push(`remarks ILIKE $${n++}`); params.push(`%${opts.q}%`); }
  if (opts?.truck) { conds.push(`truck_no ILIKE $${n++}`); params.push(`%${opts.truck}%`); }
  if (opts?.type === "debit") conds.push("debit > 0");
  if (opts?.type === "credit") conds.push("credit > 0");

  const txs = await query<TxRow>(
    `SELECT id, to_char(date, 'YYYY-MM-DD') AS date, remarks, qty, truck_no, debit, credit FROM transactions
     WHERE ${conds.join(" AND ")} ORDER BY date ASC, id ASC`,
    params
  );

  let bal = parseFloat(account.opening_balance) || 0;
  let totalQty = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  const rows: LedgerRow[] = txs.map((t) => {
    const debit = parseFloat(t.debit) || 0;
    const credit = parseFloat(t.credit) || 0;
    bal = Math.round((bal + debit - credit) * 100) / 100;
    const qty = t.qty === null ? 0 : parseFloat(t.qty) || 0;
    totalQty = Math.round((totalQty + qty) * 1000) / 1000;
    totalDebit = Math.round((totalDebit + debit) * 100) / 100;
    totalCredit = Math.round((totalCredit + credit) * 100) / 100;
    return {
      id: t.id,
      date: typeof t.date === "string" ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10),
      remarks: t.remarks,
      qty: t.qty,
      truckNo: t.truck_no,
      debit,
      credit,
      balance: bal,
    };
  });

  return { rows, totalQty, totalDebit, totalCredit, closingBalance: bal };
}

export async function accountSummary(accountId: number) {
  const ledger = await computeLedger(accountId);
  const account = await queryOne<AccountRow>("SELECT * FROM accounts WHERE id = $1", [accountId]);
  return {
    account,
    transactionCount: ledger.rows.length,
    totalQty: ledger.totalQty,
    totalDebit: ledger.totalDebit,
    totalCredit: ledger.totalCredit,
    currentBalance: ledger.closingBalance,
  };
}
