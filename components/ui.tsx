"use client";
import React from "react";

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";
export const btnPrimary = btn + " bg-emerald-700 text-white hover:bg-emerald-800";
export const btnDark = btn + " bg-slate-800 text-white hover:bg-slate-900";
export const btnGhost = btn + " border border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
export const btnDanger = btn + " bg-red-600 text-white hover:bg-red-700";
export const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600";
export const labelCls = "mb-1 block text-sm font-medium text-slate-700";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-slate-400">{text}</p>;
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-xl ${wide ? "max-w-2xl" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  text,
  onYes,
  onNo,
  danger,
}: {
  text: string;
  onYes: () => void;
  onNo: () => void;
  danger?: boolean;
}) {
  return (
    <Modal title="Please confirm" onClose={onNo}>
      <p className="text-sm text-slate-600">{text}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className={btnGhost} onClick={onNo}>Cancel</button>
        <button className={danger ? btnDanger : btnPrimary} onClick={onYes}>Yes, continue</button>
      </div>
    </Modal>
  );
}
