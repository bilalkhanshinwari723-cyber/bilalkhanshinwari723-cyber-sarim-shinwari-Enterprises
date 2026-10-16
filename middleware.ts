import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith("/_next") || pathname.startsWith("/favicon"))) {
    return NextResponse.next();
  }
  const token = req.cookies.get("sl_session")?.value;
  const isApi = pathname.startsWith("/api");
  if (!token) {
    if (isApi) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
