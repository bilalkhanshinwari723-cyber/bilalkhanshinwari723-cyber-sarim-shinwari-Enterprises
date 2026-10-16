"use client";
import { useEffect, useState } from "react";
import { get } from "@/lib/client";
import { Card, PageHead, Empty, btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";

export default function SettingsPage() {
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    get<{ user: { role: string } | null }>("/api/auth/me").then((r) => setRole(r.user?.role || "")).catch(() => {});
  }, []);

  async function backup() {
    setBusy(true); setMsg("");
    try {
      const data = await get<Record<string, unknown>>("/api/backup");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarim-shinwari-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Backup downloaded.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Backup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHead title="Settings" sub="Data management" />
      <Card className="mb-4">
        <h2 className="mb-2 font-bold text-slate-900">Backup</h2>
        <p className="mb-3 text-sm text-slate-500">
          Download a complete JSON copy of all accounts and transactions. Keep it somewhere safe.
          {role !== "admin" && " (Admin only.)"}
        </p>
        <button className={btnPrimary} disabled={busy || role !== "admin"} onClick={backup}>
          {busy ? "Preparing…" : "⬇ Download backup"}
        </button>
        {msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}
      </Card>
      <Card>
        <h2 className="mb-2 font-bold text-slate-900">About</h2>
        <p className="text-sm text-slate-500">
          Sarim Shinwari Enterprises — digital accounts ledger.
          Balances are always calculated automatically (Debit adds, Credit subtracts) and never stored,
          so they can never go stale.
        </p>
      </Card>
    </div>
  );
}
