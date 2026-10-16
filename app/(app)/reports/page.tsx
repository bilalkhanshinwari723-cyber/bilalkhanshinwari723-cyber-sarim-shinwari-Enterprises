"use client";
import { useEffect, useState } from "react";
import { get } from "@/lib/client";
import { Card, PageHead, Empty, inputCls, labelCls, btnPrimary, btnGhost } from "@/components/ui";
import { fmtMoneyZero, fmtDate } from "@/lib/format";

type Tab = "summary" | "transactions" | "outstanding" | "monthly";

interface SumRow {
  code: string; name: string; phone: string | null; status: string;
  transactions: number; totalDebit: number; totalCredit: number; balance: number;
}
interface TxRow {
  id: number; date: string; accountCode: string; accountName: string;
  remarks: string; qty: string | null; truckNo: string | null; debit: number; credit: number;
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("summary");
  const [summary, setSummary] = useState<SumRow[]>([]);
  const [txs, setTxs] = useState<{ rows: TxRow[]; totalDebit: number; totalCredit: number } | null>(null);
  const [f, setF] = useState({ from: "", to: "", type: "all", q: "", truck: "" });

  useEffect(() => {
    get<{ accounts: SumRow[] }>("/api/reports/summary").then((r) => setSummary(r.accounts)).catch(() => {});
  }, []);

  async function runTxReport() {
    const sp = new URLSearchParams();
    if (f.from) sp.set("from", f.from);
    if (f.to) sp.set("to", f.to);
    if (f.type !== "all") sp.set("type", f.type);
    if (f.q) sp.set("q", f.q);
    if (f.truck) sp.set("truck", f.truck);
    const r = await get<{ rows: TxRow[]; totalDebit: number; totalCredit: number }>(
      `/api/reports/transactions?${sp.toString()}`
    );
    setTxs(r);
  }

  useEffect(() => { runTxReport().catch(() => {}); }, []);

  const outstanding = summary.filter((s) => s.balance !== 0).sort((a, b) => b.balance - a.balance);
  const monthly = (() => {
    const m: Record<string, { debit: number; credit: number; n: number }> = {};
    (txs?.rows || []).forEach((t) => {
      const k = t.date.slice(0, 7);
      m[k] = m[k] || { debit: 0, credit: 0, n: 0 };
      m[k].debit += t.debit; m[k].credit += t.credit; m[k].n += 1;
    });
    return Object.entries(m).sort().reverse();
  })();

  const tabs: { id: Tab; label: string }[] = [
    { id: "summary", label: "Account Summary" },
    { id: "transactions", label: "Transactions" },
    { id: "outstanding", label: "Outstanding" },
    { id: "monthly", label: "Monthly" },
  ];

  return (
    <div>
      <PageHead title="Reports" sub="Filter, review and print" />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === t.id ? "bg-emerald-700 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b text-left text-xs text-slate-500">
                <th className="py-2 pr-3">Code</th><th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3 text-right">Debit</th><th className="py-2 pr-3 text-right">Credit</th>
                <th className="py-2 text-right">Balance</th>
              </tr></thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.code} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-3 font-mono">{s.code}</td>
                    <td className="py-2 pr-3">{s.name}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoneyZero(s.totalDebit)}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoneyZero(s.totalCredit)}</td>
                    <td className={`py-2 text-right font-semibold ${s.balance < 0 ? "text-red-600" : ""}`}>
                      {fmtMoneyZero(s.balance)} {s.balance < 0 ? "Cr" : s.balance > 0 ? "Dr" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "transactions" && (
        <>
          <Card className="mb-4">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div><label className={labelCls}>From</label><input type="date" className={inputCls} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
              <div><label className={labelCls}>To</label><input type="date" className={inputCls} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
              <div><label className={labelCls}>Type</label>
                <select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                  <option value="all">All</option><option value="debit">Debit</option><option value="credit">Credit</option>
                </select>
              </div>
              <div><label className={labelCls}>Remarks</label><input className={inputCls} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
              <div><label className={labelCls}>Truck</label><input className={inputCls} value={f.truck} onChange={(e) => setF({ ...f, truck: e.target.value })} /></div>
              <div className="flex items-end"><button className={btnPrimary + " w-full"} onClick={() => runTxReport().catch(() => {})}>Run</button></div>
            </div>
          </Card>
          <Card>
            {!txs ? <Empty text="Run the report." /> : (
              <>
                <p className="mb-2 text-sm text-slate-500">
                  {txs.rows.length} transactions · Debit {fmtMoneyZero(txs.totalDebit)} · Credit {fmtMoneyZero(txs.totalCredit)}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead><tr className="border-b text-left text-xs text-slate-500">
                      <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Account</th><th className="py-2 pr-3">Remarks</th>
                      <th className="py-2 pr-3">Truck</th><th className="py-2 pr-3 text-right">Debit</th><th className="py-2 text-right">Credit</th>
                    </tr></thead>
                    <tbody>
                      {txs.rows.map((t) => (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(t.date)}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{t.accountCode}</td>
                          <td className="py-2 pr-3">{t.remarks}</td>
                          <td className="py-2 pr-3">{t.truckNo || ""}</td>
                          <td className="py-2 pr-3 text-right">{t.debit ? fmtMoneyZero(t.debit) : ""}</td>
                          <td className="py-2 text-right">{t.credit ? fmtMoneyZero(t.credit) : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {tab === "outstanding" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b text-left text-xs text-slate-500">
                <th className="py-2 pr-3">Code</th><th className="py-2 pr-3">Name</th>
                <th className="py-2 text-right">Outstanding</th>
              </tr></thead>
              <tbody>
                {outstanding.map((s) => (
                  <tr key={s.code} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-3 font-mono">{s.code}</td>
                    <td className="py-2 pr-3">{s.name}</td>
                    <td className={`py-2 text-right font-semibold ${s.balance < 0 ? "text-red-600" : ""}`}>
                      {fmtMoneyZero(s.balance)} {s.balance < 0 ? "Cr" : "Dr"}
                    </td>
                  </tr>
                ))}
                {outstanding.length === 0 && <tr><td colSpan={3}><Empty text="No outstanding balances." /></td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "monthly" && (
        <Card>
          <p className="mb-3 text-sm text-slate-500">Run the Transactions report with a date range first, then monthly totals appear here.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b text-left text-xs text-slate-500">
                <th className="py-2 pr-3">Month</th><th className="py-2 pr-3 text-right">Txns</th>
                <th className="py-2 pr-3 text-right">Debit</th><th className="py-2 text-right">Credit</th>
              </tr></thead>
              <tbody>
                {monthly.map(([m, v]) => (
                  <tr key={m} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-3 font-medium">{m}</td>
                    <td className="py-2 pr-3 text-right">{v.n}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoneyZero(v.debit)}</td>
                    <td className="py-2 text-right">{fmtMoneyZero(v.credit)}</td>
                  </tr>
                ))}
                {monthly.length === 0 && <tr><td colSpan={4}><Empty text="No data." /></td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
