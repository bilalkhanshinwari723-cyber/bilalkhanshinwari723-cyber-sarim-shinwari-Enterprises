import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { ok, err, requireUser, audit } from "@/lib/api";
import { parseAmount } from "@/lib/format";

// POST /api/transactions — any logged-in user can add
export async function POST(req: NextRequest) {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const b = await req.json().catch(() => ({}));

  const accountId = Number(b.accountId);
  if (!accountId) return err("Account is required");
  const account = await queryOne<{ code: string }>(
    "SELECT code FROM accounts WHERE id = $1", [accountId]
  );
  if (!account) return err("Account not found", 404);

  const remarks = String(b.remarks || "").trim();
  if (!remarks) return err("Remarks are required");
  const date = b.date ? new Date(b.date) : null;
  if (!date || isNaN(date.getTime())) return err("Valid date is required");

  const debit = parseAmount(b.debit);
  const credit = parseAmount(b.credit);
  if (debit < 0 || credit < 0) return err("Debit/credit cannot be negative");
  if (debit === 0 && credit === 0) return err("Enter a debit or a credit amount");

  let qty: number | null = null;
  if (b.qty !== undefined && b.qty !== null && String(b.qty).trim() !== "") {
    const q = parseFloat(String(b.qty));
    if (isNaN(q) || q < 0) return err("Quantity must be a positive number");
    qty = q;
  }

  const row = await queryOne<{ id: number }>(
    `INSERT INTO transactions (account_id, date, remarks, qty, truck_no, debit, credit)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      accountId,
      b.date,
      remarks,
      qty,
      String(b.truckNo || "").trim() || null,
      debit,
      credit,
    ]
  );
  await audit(u.id, "transaction.create", "transaction", row!.id,
    `${account.code} ${remarks} Dr ${debit} Cr ${credit}`);
  return ok({ id: row!.id }, 201);
}
