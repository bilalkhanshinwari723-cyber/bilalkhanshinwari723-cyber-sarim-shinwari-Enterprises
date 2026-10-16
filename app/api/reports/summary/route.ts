import { query } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";

// GET /api/reports/summary — per-account totals + balances
export async function GET() {
  const u = await requireUser();
  if (u instanceof Response) return u;

  const rows = await query<Record<string, unknown>>(
    `SELECT a.code, a.name, a.phone, a.status,
            COUNT(t.id) AS transactions,
            COALESCE(SUM(t.debit),0) AS total_debit,
            COALESCE(SUM(t.credit),0) AS total_credit,
            a.opening_balance
     FROM accounts a LEFT JOIN transactions t ON t.account_id = a.id
     GROUP BY a.id ORDER BY a.name ASC`
  );

  return ok({
    accounts: rows.map((r) => {
      const debit = parseFloat(String(r.total_debit)) || 0;
      const credit = parseFloat(String(r.total_credit)) || 0;
      const opening = parseFloat(String(r.opening_balance)) || 0;
      return {
        code: r.code,
        name: r.name,
        phone: r.phone,
        status: r.status,
        transactions: Number(r.transactions) || 0,
        totalDebit: Math.round(debit * 100) / 100,
        totalCredit: Math.round(credit * 100) / 100,
        balance: Math.round((opening + debit - credit) * 100) / 100,
      };
    }),
  });
}
