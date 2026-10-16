import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { computeLedger } from "@/lib/ledger";
import { fmtMoney, fmtMoneyZero, fmtQty, fmtDate, fmtDateLong } from "@/lib/format";
import PrintButtonClient from "./button";

const ROWS_PER_PAGE = 28;

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  const token = store.get("sl_session")?.value;
  const sess = token ? verifyToken(token) : null;
  if (!sess) redirect("/login");

  const { id } = await params;
  const accountId = Number(id);
  const account = await queryOne<Record<string, unknown>>(
    "SELECT * FROM accounts WHERE id = $1", [accountId]
  );
  if (!account) redirect("/accounts");

  const ledger = await computeLedger(accountId);
  const rows = ledger.rows;

  const pages: typeof rows[] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  if (pages.length === 0) pages.push([]);

  const now = new Date();
  const stamp = now.toLocaleString("en-US", {
    month: "long", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  let serial = 0;

  const code = String(account.code);
  const name = String(account.name);
  const phone = account.phone ? String(account.phone) : "";
  const openingDate = account.opening_date ? String(account.opening_date) : null;
  const closingDate = account.closing_date ? String(account.closing_date) : null;

  return (
    <div className="print-ledger">
      <div className="no-print" style={{ padding: "12px 20px", display: "flex", gap: 10, borderBottom: "1px solid #ddd", marginBottom: 16 }}>
        <PrintButtonClient />
        <span style={{ fontSize: 13, color: "#666", alignSelf: "center" }}>
          In the print dialog choose “Save as PDF” to export a PDF file.
        </span>
      </div>

      {pages.map((pageRows, pi) => (
        <div key={pi} className="ledger-page">
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, textDecoration: "underline", margin: 0 }}>ACCOUNTS LEDGER</h1>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 12, marginBottom: 4 }}>
            <div style={{ textAlign: "right" }}>
              <div>Page {pi + 1} of {pages.length}</div>
              <div>{stamp}</div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 6 }}>
            <tbody>
              <tr>
                <td style={{ width: 90, color: "#555" }}>Ac Code</td>
                <td style={{ fontWeight: 700 }}>{code}&nbsp;&nbsp;{name}{phone ? `(${phone})` : ""}</td>
                <td style={{ width: 110, color: "#555" }}>Opening Date</td>
                <td style={{ width: 150 }}>{fmtDateLong(openingDate)}</td>
              </tr>
              <tr>
                <td></td><td></td>
                <td style={{ color: "#555" }}>Closing Date</td>
                <td>{fmtDateLong(closingDate)}</td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#eee" }}>
                {["", "Date", "Remarks", "Qty", "Truck Number", "Debit", "Credit", "Balance"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((t) => {
                serial += 1;
                return (
                  <tr key={t.id}>
                    <td style={td}>{serial}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtDate(t.date)}</td>
                    <td style={td}>{t.remarks}</td>
                    <td style={{ ...td, textAlign: "right" }}>{fmtQty(t.qty)}</td>
                    <td style={td}>{t.truckNo || ""}</td>
                    <td style={{ ...td, textAlign: "right" }}>{fmtMoney(t.debit)}</td>
                    <td style={{ ...td, textAlign: "right" }}>{fmtMoney(t.credit)}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{fmtMoneyZero(t.balance)}</td>
                  </tr>
                );
              })}
              {pi === pages.length - 1 && (
                <tr style={{ fontWeight: 700 }}>
                  <td style={td} colSpan={3}></td>
                  <td style={{ ...td, textAlign: "right" }}>{fmtQty(String(ledger.totalQty))}</td>
                  <td style={td}>Balance:</td>
                  <td style={td}></td>
                  <td style={{ ...td, textAlign: "center" }}>{ledger.closingBalance < 0 ? "Cr" : ledger.closingBalance > 0 ? "Dr" : ""}</td>
                  <td style={{ ...td, textAlign: "right" }}>{fmtMoneyZero(ledger.closingBalance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      <style>{`
        .ledger-page { padding: 10px 14px 18px; page-break-after: always; }
        .ledger-page:last-child { page-break-after: auto; }
        @media print {
          aside, header { display: none !important; }
          main { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
          body { background: #fff !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

const th: React.CSSProperties = { border: "1px solid #999", padding: "5px 7px", textAlign: "left" };
const td: React.CSSProperties = { border: "1px solid #999", padding: "4px 7px" };
