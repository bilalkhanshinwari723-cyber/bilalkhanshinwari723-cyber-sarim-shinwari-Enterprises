"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";
import { btnPrimary, inputCls, labelCls, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await post("/api/auth/login", { email, password });
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-xl font-bold text-white">
            S
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sarim Shinwari Enterprises</h1>
          <p className="mt-1 text-sm text-slate-500">Accounts & ledger management</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className={btnPrimary + " w-full"} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Default admin: admin@stoneledger.local / admin123
        </p>
      </Card>
    </div>
  );
}
