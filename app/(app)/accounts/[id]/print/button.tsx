"use client";

export default function PrintButtonClient() {
  return (
    <button
      onClick={() => window.print()}
      style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: 14 }}
    >
      🖨 Print / Save as PDF
    </button>
  );
}
