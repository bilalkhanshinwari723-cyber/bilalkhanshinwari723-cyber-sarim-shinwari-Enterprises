"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { get, post, put, del } from "@/lib/client";
import { Card, PageHead, Empty, Modal, Confirm, btnPrimary, btnGhost, btnDanger, inputCls, labelCls } from "@/components/ui";
import { fmtMoney, fmtMoneyZero, fmtQty, fmtDate, fmtDateLong, toISODate } from "@/lib/format";

interface Tx {
  id: number; date: string; remarks: string; qty: string | null;
  truckNo: string | null; debit: number; credit: number; balance: number;
}
interface Acct {
  id: number; code: string; name: string; phone: string | null;
  openingDate: string | null; closingDate: string | null;
  openingBalance: number; status: string; notes: string | null;
}
interface LedgerData {
  account: Acct; rows: Tx[]; totalQty: number;
  totalDebit: number; totalCredit: number; closingBalance: number;
}

const QUICK = [
  "Fecto to Bunji", "Fecto to GB", "Fecto to Khaplu", "Fecto to Skardu",
  "Fecto to Gilgit", "Fecto to Astore", "Online ABL", "Online MZBL",
  "Online Meezan", "Online Behzad", "Cash", "Driver Cash", "Commission",
];

const TBLANK = { date: toISODate(new Date()), remarks: "", qty: "", truckNo: "", debit: "", credit: "" };

export default function LedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [data, setData] = useState<LedgerData | null>(null);
  const [f, setF] = useState({ q: "", truck: "", from: "", to: "", type: "all" });
  const [showTx, setShowTx] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [form, setForm] = useState(TBLANK);
  const [confirmDel, setConfirmDel] = useState<Tx | null>(null);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    const sp = new URLSearchParams();
    if (f.q) sp.set("q", f.q);
    if (f.truck) sp.set("truck", f.truck);
    if (f.from) sp.set("from", f.from);
    if (f.to) sp.set("to", f.to);
    if (f.type !== "all") sp.set("type", f.type);
    const r = await get<LedgerData>(`/api/accounts/${id}/ledger?${sp.toString()}`);
    setData(r);
  }, [id, f]);

  useEffect(() => {
    get<{ user: { role: string } | null }>("/api/auth/me").then((r) => setIsAdmin(r.user?.role === "admin")).catch(() => {});
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  function openNew() {
    setEditing(null); setForm(TBLANK); setError(""); setShowTx(true);
  }
  function openEdit(t: Tx) {
    setEditing(t);
    setForm({
      date: t.date, remarks: t.remarks, qty: t.qty || "",
      truckNo: t.truckNo || "", debit: t.debit ? String(t.debit) : "",
      credit: t.credit ? String(t.credit) : "",
    });
    setError(""); setShowTx(true);
  }

  async function saveTx() {
    setError("");
    try {
      if (editing) await put(`/api/transactions/${editing.id}`, { ...form, accountId: id });
      else await post("/api/transactions", { ...form, accountId: id });
      setShowTx(false);
      load().catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function doDelete() {
    if (!confirmDel) return;
    try {
      await del(`/api/transactions/${confirmDel.id}`);
      setConfirmDel(null);
      load().catch(() => {});
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const setF2 = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });
  const setT = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  if (!data) return <p className="text-slate-400">Loading ledger…</p>;
  const a = data.account;

  return (
    <div>
      <PageHead
        title="Accounts Ledger"
        actions={
          <>
            <button className={btnPrimary} onClick={openNew}>+ Add Transaction</button>
            <Link href={`/accounts/${id}/print`} target="_blank" className={btnGhost}>🖨 Print / PDF</Link>
            <Link href="/accounts" className={btnGhost}>← Accounts</Link>
          </>
        }
      />

      {/* account header — mirrors the paper ledger */}
      <Card className="mb-4">
        <div className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
          <p><span className="text-slate-500">Ac Code:</span> <b className="font-mono">{a.code}</b></p>
          <p><span className="text-slate-500">Opening Date:</span> <b>{fmtDateLong(a.openingDate)}</b></p>
          <p><span className="text-slate-500">Account Name:</span> <b>{a.name}{a.phone ? ` (${a.phone})` : ""}</b></p>
          <p><span className="text-slate-500">Closing Date:</span> <b>{fmtDateLong(a.closingDate)}</b></p>
        </div>
      </Card>

      {/* filters */}
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <input className={inputCls} placeholder="Search remarks…" value={f.q} onChange={setF2("q")} />
          <input className={inputCls} placeholder="Truck number…" value={f.truck} onChange={setF2("truck")} />
          <input className={inputCls} type="date" value={f.from} onChange={setF2("from")} title="From date" />
          <input className={inputCls} type="date" value={f.to} onChange={setF2("to")} title="To date" />
          <select className={inputCls} value={f.type} onChange={setF2("type")}>
            <option value="all">All</option>
            <option value="debit">Debit only</option>
            <option value="credit">Credit only</option>
          </select>
          <button className={btnGhost} onClick={() => setF({ q: "", truck: "", from: "", to: "", type: "all" })}>Clear</button>
        </div>
      </Card>

      {/* ledger table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                <th className="border px-2 py-2">#</th>
                <th className="border px-2 py-2">Date</th>
                <th className="border px-2 py-2">Remarks</th>
                <th className="border px-2 py-2 text-right">Qty</th>
                <th className="border px-2 py-2">Truck Number</th>
                <th className="border px-2 py-2 text-right">Debit</th>
                <th className="border px-2 py-2 text-right">Credit</th>
                <th className="border px-2 py-2 text-right">Balance</th>
                <th className="border px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((t, i) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="border px-2 py-1.5 text-slate-400">{i + 1}</td>
                  <td className="border px-2 py-1.5 whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td className="border px-2 py-1.5">{t.remarks}</td>
                  <td className="border px-2 py-1.5 text-right">{fmtQty(t.qty)}</td>
                  <td className="border px-2 py-1.5 whitespace-nowrap">{t.truckNo || ""}</td>
                  <td className="border px-2 py-1.5 text-right">{fmtMoney(t.debit)}</td>
                  <td className="border px-2 py-1.5 text-right">{fmtMoney(t.credit)}</td>
                  <td className="border px-2 py-1.5 text-right font-semibold">{fmtMoneyZero(t.balance)}</td>
                  <td className="border px-2 py-1.5 whitespace-nowrap text-right">
                    <button onClick={() => openEdit(t)} className="mr-2 text-slate-600 hover:underline">Edit</button>
                    {isAdmin && <button onClick={() => setConfirmDel(t)} className="text-red-600 hover:underline">Del</button>}
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr><td colSpan={9}><Empty text="No transactions found." /></td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td className="border px-2 py-2" colSpan={3}>Total</td>
                <td className="border px-2 py-2 text-right">{fmtQty(String(data.totalQty))}</td>
                <td className="border px-2 py-2"></td>
                <td className="border px-2 py-2 text-right">{fmtMoneyZero(data.totalDebit)}</td>
                <td className="border px-2 py-2 text-right">{fmtMoneyZero(data.totalCredit)}</td>
                <td className="border px-2 py-2 text-right">
                  {fmtMoneyZero(data.closingBalance)} {data.closingBalance < 0 ? "Cr" : data.closingBalance > 0 ? "Dr" : ""}
                </td>
                <td className="border px-2 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {showTx && (
        <Modal title={editing ? "Edit Transaction" : "Add Transaction"} onClose={() => setShowTx(false)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Date *</label><input type="date" className={inputCls} value={form.date} onChange={setT("date")} /></div>
            <div><label className={labelCls}>Truck Number</label><input className={inputCls} value={form.truckNo} onChange={setT("truckNo")} placeholder="e.g. AA-147" /></div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Remarks *</label>
              <input className={inputCls} value={form.remarks} onChange={setT("remarks")} placeholder="Type or pick below…" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button key={q} type="button" onClick={() => setForm({ ...form, remarks: q })}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs hover:bg-emerald-50 hover:border-emerald-300">
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Qty</label><input className={inputCls} type="number" step="0.001" min="0" value={form.qty} onChange={setT("qty")} placeholder="e.g. 35 or 33.55" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Debit</label><input className={inputCls} type="number" step="0.01" min="0" value={form.debit} onChange={setT("debit")} /></div>
              <div><label className={labelCls}>Credit</label><input className={inputCls} type="number" step="0.01" min="0" value={form.credit} onChange={setT("credit")} /></div>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Enter a debit (stone sold — customer owes more) or a credit (payment received), or both. Balance recalculates automatically.</p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setShowTx(false)}>Cancel</button>
            <button className={btnPrimary} onClick={saveTx}>Save</button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Confirm
          danger
          text={`Delete this transaction (${fmtDate(confirmDel.date)} — ${confirmDel.remarks})? Balances will recalculate automatically.`}
          onYes={doDelete}
          onNo={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
