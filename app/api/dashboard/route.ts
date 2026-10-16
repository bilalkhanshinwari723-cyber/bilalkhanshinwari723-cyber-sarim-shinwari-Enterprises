import { query } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";

// GET /api/dashboard — totals across all accounts
export async function GET() {
  const u = await requireUser();
  if (u instanceof Response) return u;

  const [ac, sums, today, recent, opening] = await Promise.all([
    query<{ c: string }>("SELECT COUNT(*) AS c FROM accounts WHERE status='active'"),
    query<{ d: string | null; c: string | null }>(
      "SELECT SUM(debit) AS d, SUM(credit) AS c FROM transactions"
    ),
    query<{ c: string }>(
      "SELECT COUNT(*) AS c FROM transactions WHERE date = CURRENT_DATE"
    ),
    query<Record<string, unknown>>(
      `SELECT t.id, to_char(t.date, 'YYYY-MM-DD') AS date, t.remarks, t.debit, t.credit, a.code AS account_code, a.name AS account_name
       FROM transactions t JOIN accounts a ON a.id = t.account_id
       ORDER BY t.date DESC, t.id DESC LIMIT 10`
    ),
    query<{ s: string | null }>(
      "SELECT SUM(opening_balance) AS s FROM accounts WHERE status='active'"
    ),
  ]);

  const totalDebit = parseFloat(sums[0]?.d || "0") || 0;
  const totalCredit = parseFloat(sums[0]?.c || "0") || 0;
  const totalOpening = parseFloat(opening[0]?.s || "0") || 0;
  const outstanding = Math.round((totalOpening + totalDebit - totalCredit) * 100) / 100;

  return ok({
    totalAccounts: Number(ac[0]?.c) || 0,
    totalDebit,
    totalCredit,
    totalOutstanding: outstanding,
    todayTransactions: Number(today[0]?.c) || 0,
    recent: recent.map((t) => ({
      id: t.id,
      date: String(t.date).slice(0, 10),
      remarks: t.remarks,
      debit: parseFloat(String(t.debit)) || 0,
      credit: parseFloat(String(t.credit)) || 0,
      accountCode: t.account_code,
      accountName: t.account_name,
    })),
  });
}
