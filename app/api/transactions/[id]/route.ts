import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { ok, err, requireUser, requireAdmin, audit } from "@/lib/api";
import { parseAmount } from "@/lib/format";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/transactions/[id] — edit (balances recalc automatically on read)
export async function PUT(req: NextRequest, ctx: Ctx) {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const id = Number((await ctx.params).id);
  const b = await req.json().catch(() => ({}));

  const existing = await queryOne<Record<string, unknown>>(
    `SELECT t.id, t.account_id, to_char(t.date, 'YYYY-MM-DD') AS date, t.remarks, t.qty,
            t.truck_no, t.debit, t.credit, a.code AS account_code
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id WHERE t.id = $1`,
    [id]
  );
  if (!existing) return err("Transaction not found", 404);

  const remarks = String(b.remarks ?? existing.remarks).trim();
  if (!remarks) return err("Remarks are required");
  const dateStr = b.date ? String(b.date) : String(existing.date).slice(0, 10);
  if (isNaN(new Date(dateStr).getTime())) return err("Valid date is required");

  const debit = b.debit !== undefined ? parseAmount(b.debit) : parseFloat(String(existing.debit));
  const credit = b.credit !== undefined ? parseAmount(b.credit) : parseFloat(String(existing.credit));
  if (debit < 0 || credit < 0) return err("Debit/credit cannot be negative");
  if (debit === 0 && credit === 0) return err("Enter a debit or a credit amount");

  let qty: number | null = existing.qty === null ? null : parseFloat(String(existing.qty));
  if (b.qty !== undefined) {
    if (b.qty === null || String(b.qty).trim() === "") qty = null;
    else {
      const q = parseFloat(String(b.qty));
      if (isNaN(q) || q < 0) return err("Quantity must be a positive number");
      qty = q;
    }
  }
  const truckNo = b.truckNo !== undefined
    ? (String(b.truckNo).trim() || null)
    : (existing.truck_no as string | null);

  await query(
    `UPDATE transactions SET date=$1, remarks=$2, qty=$3, truck_no=$4, debit=$5, credit=$6,
     updated_at=NOW() WHERE id=$7`,
    [dateStr, remarks, qty, truckNo, debit, credit, id]
  );
  await audit(u.id, "transaction.update", "transaction", id,
    `${existing.account_code} ${remarks} Dr ${debit} Cr ${credit}`);
  return ok({ ok: true });
}

// DELETE /api/transactions/[id] — admin only
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const u = await requireAdmin();
  if (u instanceof Response) return u;
  const id = Number((await ctx.params).id);
  const t = await queryOne<Record<string, unknown>>(
    `SELECT t.remarks, t.debit, t.credit, a.code AS account_code FROM transactions t
     JOIN accounts a ON a.id = t.account_id WHERE t.id = $1`,
    [id]
  );
  if (!t) return err("Transaction not found", 404);
  await query("DELETE FROM transactions WHERE id = $1", [id]);
  await audit(u.id, "transaction.delete", "transaction", id,
    `${t.account_code} ${t.remarks} Dr ${t.debit} Cr ${t.credit}`);
  return ok({ ok: true });
}
