"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { get, post } from "@/lib/client";

interface Me { id: number; email: string; name: string; role: string; }

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/accounts", label: "Accounts", icon: "👥" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    get<{ user: Me | null }>("/api/auth/me").then((r) => {
      if (!r.user) router.push("/login");
      else setMe(r.user);
    }).catch(() => router.push("/login"));
  }, [router]);

  async function logout() {
    await post("/api/auth/logout", {}).catch(() => {});
    router.push("/login");
  }

  if (!me) return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 font-bold text-white">S</div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">Sarim Shinwari Enterprises</p>
          <p className="text-xs text-slate-400">{me.name} · {me.role}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
              pathname === n.href || pathname.startsWith(n.href + "/")
                ? "bg-emerald-50 text-emerald-800"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="w-5 text-center">{n.icon}</span> {n.label}
          </Link>
        ))}
      </nav>
      <div className="p-3">
        <button
          onClick={logout}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          ⏻ Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-slate-200 bg-white md:block">
        {sidebar}
      </aside>
      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white">{sidebar}</aside>
        </div>
      )}
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-xl hover:bg-slate-100">☰</button>
          <p className="font-bold text-slate-900">Sarim Shinwari Enterprises</p>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
