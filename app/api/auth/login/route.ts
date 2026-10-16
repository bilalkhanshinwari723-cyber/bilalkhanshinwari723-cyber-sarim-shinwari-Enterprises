import { NextRequest } from "next/server";
import { queryOne } from "@/lib/db";
import { checkPassword, setSessionCookie } from "@/lib/auth";
import { ok, err, audit } from "@/lib/api";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return err("Email and password are required");

  const user = await queryOne<{
    id: number; email: string; name: string; password: string; role: string;
  }>("SELECT id, email, name, password, role FROM users WHERE email = $1", [
    String(email).toLowerCase().trim(),
  ]);
  if (!user) return err("Invalid email or password", 401);
  if (!(await checkPassword(String(password), user.password)))
    return err("Invalid email or password", 401);

  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role });
  await audit(user.id, "auth.login", "user", user.id);
  return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
}
