"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { get } from "@/lib/client";
import { Card, PageHead, Empty, btnPrimary, btnGhost } from "@/components/ui";
import { fmtMoneyZero, fmtMoney, fmtDate } from "@/lib/format";

interface Dash {
  totalAccounts: number;
  totalDebit: number;
  totalCredit: number;
  totalOutstanding: number;
  todayTransactions: number;
  recent: { id: number; date: string; remarks: string; debit: number; credit: number; accountCode: string; accountName: string }[];
}

export default function DashboardPage() {
  const [d, setD] = useState<Dash | null>(null);

  useEffect(() => {
    get<Dash>("/api/dashboard").then(setD).catch(() => {});
  }, []);

  if (!d) return <p className="text-slate-400">Loading…</p>;

  const cards = [
    { label: "Total Accounts", value: String(d.totalAccounts) },
    { label: "Total Debit", value: fmtMoneyZero(d.totalDebit) },
    { label: "Total Credit", value: fmtMoneyZero(d.totalCredit) },
    { label: "Outstanding Balance", value: fmtMoneyZero(d.totalOutstanding), hot: true },
    { label: "Today's Transactions", value: String(d.todayTransactions) },
  ];

  return (
    <div>
      <PageHead
        title="Dashboard"
        sub="Business at a glance"
        actions={
          <>
            <Link href="/accounts?new=1" className={btnPrimary}>+ New Account</Link>
            <Link href="/accounts" className={btnGhost}>Accounts</Link>
            <Link href="/reports" className={btnGhost}>Reports</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className={c.hot ? "border-emerald-300 bg-emerald-50" : ""}>
            <p className="text-xs font-medium text-slate-500">{c.label}</p>
            <p className={`mt-1 text-xl font-bold ${c.hot ? "text-emerald-800" : "text-slate-900"}`}>{c.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <h2 className="mb-3 font-bold text-slate-900">Recent Transactions</h2>
        {d.recent.length === 0 ? (
          <Empty text="No transactions yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Account</th>
                  <th className="py-2 pr-3">Remarks</th>
                  <th className="py-2 pr-3 text-right">Debit</th>
                  <th className="py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(t.date)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{t.accountCode} · {t.accountName}</td>
                    <td className="py-2 pr-3">{t.remarks}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoney(t.debit)}</td>
                    <td className="py-2 text-right">{fmtMoney(t.credit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
