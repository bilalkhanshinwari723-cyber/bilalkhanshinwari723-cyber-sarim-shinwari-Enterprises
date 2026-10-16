import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { ok, err, requireUser, requireAdmin, audit } from "@/lib/api";
import { parseAmount } from "@/lib/format";
import { computeLedger, type AccountRow } from "@/lib/ledger";

// GET /api/accounts?q=... — list with current balances
export async function GET(req: NextRequest) {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";

  const accounts = q
    ? await query<AccountRow>(
        `SELECT a.*, (SELECT COUNT(*) FROM transactions t WHERE t.account_id = a.id) AS tx_count
         FROM accounts a
         WHERE a.code ILIKE $1 OR a.name ILIKE $1 OR a.phone ILIKE $1
         ORDER BY a.name ASC`,
        [`%${q}%`]
      )
    : await query<AccountRow>(
        `SELECT a.*, (SELECT COUNT(*) FROM transactions t WHERE t.account_id = a.id) AS tx_count
         FROM accounts a ORDER BY a.name ASC`
      );

  const out = await Promise.all(
    accounts.map(async (a) => {
      const l = await computeLedger(a.id);
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        phone: a.phone,
        openingDate: a.opening_date,
        closingDate: a.closing_date,
        openingBalance: parseFloat(a.opening_balance) || 0,
        status: a.status,
        notes: a.notes,
        transactions: Number((a as unknown as Record<string, unknown>).tx_count) || 0,
        totalDebit: l.totalDebit,
        totalCredit: l.totalCredit,
        currentBalance: l.closingBalance,
      };
    })
  );
  return ok({ accounts: out });
}

// POST /api/accounts — admin only
export async function POST(req: NextRequest) {
  const u = await requireAdmin();
  if (u instanceof Response) return u;
  const b = await req.json().catch(() => ({}));
  const code = String(b.code || "").trim();
  const name = String(b.name || "").trim();
  if (!code || !name) return err("Account code and name are required");

  const exists = await queryOne("SELECT id FROM accounts WHERE code = $1", [code]);
  if (exists) return err("Account code already exists");

  const row = await queryOne<{ id: number }>(
    `INSERT INTO accounts (code, name, phone, opening_date, closing_date, opening_balance, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      code,
      name,
      String(b.phone || "").trim() || null,
      b.openingDate || null,
      b.closingDate || null,
      parseAmount(b.openingBalance),
      String(b.notes || "").trim() || null,
      b.status === "closed" ? "closed" : "active",
    ]
  );
  await audit(u.id, "account.create", "account", row!.id, `${code} ${name}`);
  return ok({ id: row!.id }, 201);
}
