import { query } from "@/lib/db";
import { ok, requireAdmin, audit } from "@/lib/api";

// GET /api/backup — admin only: full JSON export of business data
export async function GET() {
  const u = await requireAdmin();
  if (u instanceof Response) return u;
  const [users, accounts, transactions, logs] = await Promise.all([
    query("SELECT id, email, name, role, created_at FROM users ORDER BY id"),
    query("SELECT * FROM accounts ORDER BY id"),
    query("SELECT * FROM transactions ORDER BY account_id, date, id"),
    query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 500"),
  ]);
  await audit(u.id, "backup.export");
  return ok({ exportedAt: new Date().toISOString(), users, accounts, transactions, logs });
}
