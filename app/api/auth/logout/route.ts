import { clearSessionCookie, getSessionUser } from "@/lib/auth";
import { ok, audit } from "@/lib/api";

export async function POST() {
  const u = await getSessionUser();
  await clearSessionCookie();
  if (u) await audit(u.id, "auth.logout", "user", u.id);
  return ok({ ok: true });
}
