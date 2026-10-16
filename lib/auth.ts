import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { queryOne } from "./db";

const COOKIE_NAME = "sl_session";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function checkPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const p = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    return {
      id: Number(p.id),
      email: String(p.email),
      name: String(p.name),
      role: String(p.role),
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const sess = verifyToken(token);
  if (!sess) return null;
  const u = await queryOne<UserRow>(
    "SELECT id, email, name, role FROM users WHERE id = $1",
    [sess.id]
  );
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

export async function setSessionCookie(user: SessionUser) {
  const store = await cookies();
  store.set(COOKIE_NAME, signToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function isAdmin(u: SessionUser | null): boolean {
  return !!u && u.role === "admin";
}
