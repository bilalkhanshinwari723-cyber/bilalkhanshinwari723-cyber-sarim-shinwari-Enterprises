"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { get, post, put, del } from "@/lib/client";
import { Card, PageHead, Empty, Modal, Confirm, btnPrimary, btnGhost, btnDanger, inputCls, labelCls } from "@/components/ui";
import { fmtMoneyZero, fmtDateLong } from "@/lib/format";

interface Account {
  id: number; code: string; name: string; phone: string | null;
  openingDate: string | null; closingDate: string | null;
  openingBalance: number; status: string; notes: string | null;
  transactions: number; totalDebit: number; totalCredit: number; currentBalance: number;
}

const BLANK = { code: "", name: "", phone: "", openingDate: "", closingDate: "", openingBalance: "", notes: "", status: "active" };

export default function AccountsPage() {
  const [list, setList] = useState<Account[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState(BLANK);
  const [confirmDel, setConfirmDel] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const sp = useSearchParams();

  const load = useCallback(async (term: string) => {
    const r = await get<{ accounts: Account[] }>(`/api/accounts${term ? `?q=${encodeURIComponent(term)}` : ""}`);
    setList(r.accounts);
  }, []);

  useEffect(() => {
    get<{ user: { role: string } | null }>("/api/auth/me").then((r) => setIsAdmin(r.user?.role === "admin")).catch(() => {});
    load("");
    if (sp.get("new") === "1") { setEditing(null); setForm(BLANK); setShowForm(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  function openNew() { setEditing(null); setForm(BLANK); setError(""); setShowForm(true); }
  function openEdit(a: Account) {
    setEditing(a);
    setForm({
      code: a.code, name: a.name, phone: a.phone || "",
      openingDate: a.openingDate ? a.openingDate.slice(0, 10) : "",
      closingDate: a.closingDate ? a.closingDate.slice(0, 10) : "",
      openingBalance: String(a.openingBalance), notes: a.notes || "", status: a.status,
    });
    setError(""); setShowForm(true);
  }

  async function save() {
    setError("");
    try {
      if (editing) await put(`/api/accounts/${editing.id}`, form);
      else await post("/api/accounts", form);
      setShowForm(false);
      load(q).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function doDelete() {
    if (!confirmDel) return;
    try {
      await del(`/api/accounts/${confirmDel.id}`);
      setConfirmDel(null);
      load(q).catch(() => {});
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHead
        title="Accounts"
        sub={`${list.length} account${list.length === 1 ? "" : "s"}`}
        actions={isAdmin ? <button className={btnPrimary} onClick={openNew}>+ New Account</button> : undefined}
      />
      <Card className="mb-4">
        <input
          className={inputCls}
          placeholder="Search by code, name or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Card>
      <Card>
        {list.length === 0 ? (
          <Empty text="No accounts found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500">
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-3 text-right">Balance</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-3 font-mono">{a.code}</td>
                    <td className="py-2.5 pr-3 font-medium">{a.name}</td>
                    <td className="py-2.5 pr-3">{a.phone || "—"}</td>
                    <td className={`py-2.5 pr-3 text-right font-semibold ${a.currentBalance < 0 ? "text-red-600" : "text-slate-900"}`}>
                      {fmtMoneyZero(a.currentBalance)} {a.currentBalance < 0 ? "Cr" : a.currentBalance > 0 ? "Dr" : ""}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${a.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <Link href={`/accounts/${a.id}`} className="mr-2 text-emerald-700 hover:underline">Ledger</Link>
                      {isAdmin && (
                        <>
                          <button onClick={() => openEdit(a)} className="mr-2 text-slate-600 hover:underline">Edit</button>
                          <button onClick={() => setConfirmDel(a)} className="text-red-600 hover:underline">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <Modal title={editing ? "Edit Account" : "New Account"} onClose={() => setShowForm(false)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Account Code *</label><input className={inputCls} value={form.code} onChange={set("code")} /></div>
            <div><label className={labelCls}>Name *</label><input className={inputCls} value={form.name} onChange={set("name")} /></div>
            <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.phone} onChange={set("phone")} /></div>
            <div><label className={labelCls}>Opening Balance</label><input className={inputCls} type="number" step="0.01" value={form.openingBalance} onChange={set("openingBalance")} /></div>
            <div><label className={labelCls}>Opening Date</label><input className={inputCls} type="date" value={form.openingDate} onChange={set("openingDate")} /></div>
            <div><label className={labelCls}>Closing Date</label><input className={inputCls} type="date" value={form.closingDate} onChange={set("closingDate")} /></div>
            <div><label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={set("status")}>
                <option value="active">Active</option><option value="closed">Closed</option>
              </select>
            </div>
            <div className="sm:col-span-2"><label className={labelCls}>Notes</label><textarea className={inputCls} rows={2} value={form.notes} onChange={set("notes")} /></div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={btnPrimary} onClick={save}>Save</button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Confirm
          danger
          text={`Delete account ${confirmDel.code} (${confirmDel.name}) and ALL its ${confirmDel.transactions} transactions? This cannot be undone.`}
          onYes={doDelete}
          onNo={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
