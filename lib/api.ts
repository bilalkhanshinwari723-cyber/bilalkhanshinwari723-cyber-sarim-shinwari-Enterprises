import { NextResponse } from "next/server";
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Require a logged-in user; returns the user or an error response. */
export async function requireUser(): Promise<SessionUser | NextResponse> {
  const u = await getSessionUser();
  if (!u) return err("Not logged in", 401);
  return u;
}

/** Require admin role. */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const u = await getSessionUser();
  if (!u) return err("Not logged in", 401);
  if (!isAdmin(u)) return err("Admin only", 403);
  return u;
}

export async function audit(
  userId: number | null,
  action: string,
  entity?: string,
  entityId?: number,
  details?: string
) {
  try {
    await query(
      "INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
      [userId, action, entity || null, entityId || null, details || null]
    );
  } catch {
    /* audit must never break the main flow */
  }
}
