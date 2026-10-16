import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";

// GET /api/reports/transactions?from=&to=&type=debit|credit&q=&truck=
// Date-wise / debit / credit / truck-wise report across accounts.
export async function GET(req: NextRequest) {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const sp = req.nextUrl.searchParams;

  const conds: string[] = [];
  const params: unknown[] = [];
  let n = 1;
  const from = sp.get("from");
  const to = sp.get("to");
  if (from) { conds.push(`t.date >= $${n++}`); params.push(from); }
  if (to) { conds.push(`t.date <= $${n++}`); params.push(to); }
  const type = sp.get("type");
  if (type === "debit") conds.push("t.debit > 0");
  if (type === "credit") conds.push("t.credit > 0");
  const q = sp.get("q");
  if (q) { conds.push(`t.remarks ILIKE $${n++}`); params.push(`%${q}%`); }
  const truck = sp.get("truck");
  if (truck) { conds.push(`t.truck_no ILIKE $${n++}`); params.push(`%${truck}%`); }

  const rows = await query<Record<string, unknown>>(
    `SELECT t.id, to_char(t.date, 'YYYY-MM-DD') AS date, t.remarks, t.qty, t.truck_no, t.debit, t.credit,
            a.code AS account_code, a.name AS account_name
     FROM transactions t JOIN accounts a ON a.id = t.account_id
     ${conds.length ? "WHERE " + conds.join(" AND ") : ""}
     ORDER BY t.date ASC, t.id ASC LIMIT 2000`,
    params
  );

  let totalDebit = 0;
  let totalCredit = 0;
  const out = rows.map((t) => {
    const debit = parseFloat(String(t.debit)) || 0;
    const credit = parseFloat(String(t.credit)) || 0;
    totalDebit += debit;
    totalCredit += credit;
    return {
      id: t.id,
      date: String(t.date).slice(0, 10),
      accountCode: t.account_code,
      accountName: t.account_name,
      remarks: t.remarks,
      qty: t.qty,
      truckNo: t.truck_no,
      debit,
      credit,
    };
  });

  return ok({
    rows: out,
    count: out.length,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
  });
}
