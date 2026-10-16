import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { ok, err, requireUser, requireAdmin, audit } from "@/lib/api";
import { parseAmount } from "@/lib/format";
import { accountSummary } from "@/lib/ledger";

type Ctx = { params: Promise<{ id: string }> };

function shapeAccount(a: Record<string, unknown>) {
  return {
    id: a.id,
    code: a.code,
    name: a.name,
    phone: a.phone,
    openingDate: a.opening_date,
    closingDate: a.closing_date,
    openingBalance: parseFloat(String(a.opening_balance)) || 0,
    status: a.status,
    notes: a.notes,
  };
}

// GET /api/accounts/[id] — detail + summary
export async function GET(_req: NextRequest, ctx: Ctx) {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const id = Number((await ctx.params).id);
  const s = await accountSummary(id).catch(() => null);
  if (!s || !s.account) return err("Account not found", 404);
  return ok({ ...s, account: shapeAccount(s.account as unknown as Record<string, unknown>) });
}

// PUT /api/accounts/[id] — admin only
export async function PUT(req: NextRequest, ctx: Ctx) {
  const u = await requireAdmin();
  if (u instanceof Response) return u;
  const id = Number((await ctx.params).id);
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  if (!name) return err("Account name is required");

  if (b.code) {
    const clash = await queryOne("SELECT id FROM accounts WHERE code = $1 AND id <> $2", [
      String(b.code).trim(),
      id,
    ]);
    if (clash) return err("Account code already exists");
  }

  const sets: string[] = ["name = $1", "updated_at = NOW()"];
  const params: unknown[] = [name];
  let n = 2;
  if (b.code) { sets.push(`code = $${n++}`); params.push(String(b.code).trim()); }
  sets.push(`phone = $${n++}`); params.push(String(b.phone || "").trim() || null);
  sets.push(`opening_date = $${n++}`); params.push(b.openingDate || null);
  sets.push(`closing_date = $${n++}`); params.push(b.closingDate || null);
  sets.push(`opening_balance = $${n++}`); params.push(parseAmount(b.openingBalance));
  sets.push(`notes = $${n++}`); params.push(String(b.notes || "").trim() || null);
  sets.push(`status = $${n++}`); params.push(b.status === "closed" ? "closed" : "active");
  params.push(id);

  const row = await queryOne<{ id: number; code: string; name: string }>(
    `UPDATE accounts SET ${sets.join(", ")} WHERE id = $${n} RETURNING id, code, name`,
    params
  );
  if (!row) return err("Account not found", 404);
  await audit(u.id, "account.update", "account", id, `${row.code} ${row.name}`);
  return ok({ ok: true });
}

// DELETE /api/accounts/[id] — admin only
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const u = await requireAdmin();
  if (u instanceof Response) return u;
  const id = Number((await ctx.params).id);
  const a = await queryOne<{ code: string; name: string }>(
    "SELECT code, name FROM accounts WHERE id = $1", [id]
  );
  if (!a) return err("Account not found", 404);
  await query("DELETE FROM accounts WHERE id = $1", [id]);
  await audit(u.id, "account.delete", "account", id, `${a.code} ${a.name}`);
  return ok({ ok: true });
}
