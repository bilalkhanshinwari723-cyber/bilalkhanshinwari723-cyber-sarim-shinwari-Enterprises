import { NextRequest } from "next/server";
import { queryOne } from "@/lib/db";
import { ok, err, requireUser } from "@/lib/api";
import { computeLedger } from "@/lib/ledger";

// GET /api/accounts/[id]/ledger?from=&to=&q=&truck=&type=debit|credit
// Running balances are computed fresh on every call — never stored.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const id = Number((await ctx.params).id);
  const sp = req.nextUrl.searchParams;
  const account = await queryOne<Record<string, unknown>>(
    "SELECT * FROM accounts WHERE id = $1", [id]
  );
  if (!account) return err("Account not found", 404);

  const ledger = await computeLedger(id, {
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
    q: sp.get("q") || undefined,
    truck: sp.get("truck") || undefined,
    type: (sp.get("type") as "debit" | "credit" | "all") || undefined,
  });

  return ok({
    account: {
      id: account.id,
      code: account.code,
      name: account.name,
      phone: account.phone,
      openingDate: account.opening_date,
      closingDate: account.closing_date,
      openingBalance: parseFloat(String(account.opening_balance)) || 0,
      status: account.status,
      notes: account.notes,
    },
    ...ledger,
  });
}
