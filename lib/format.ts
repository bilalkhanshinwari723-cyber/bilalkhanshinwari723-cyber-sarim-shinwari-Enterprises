// Pakistani number formatting: 318500 -> "3,18,500" (lakh grouping, as in the paper ledger)
// (Node's en-PK locale gives western grouping, so we format manually.)

/** 738175 -> "7,38,175" — last 3 digits, then groups of 2. */
function groupPK(intStr: string): string {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  let rest = intStr.slice(0, -3);
  const groups: string[] = [];
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) groups.unshift(rest);
  return groups.join(",") + "," + last3;
}

function fmtNum(n: number, decimals: number): string {
  const neg = n < 0;
  const abs = Math.abs(n);
  const fixed = abs.toFixed(decimals);
  const [i, d] = fixed.split(".");
  let s = groupPK(i);
  if (decimals > 0 && d && Number(d) !== 0) s += "." + d.replace(/0+$/, "");
  return (neg ? "-" : "") + s;
}

export function fmtMoney(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num) || num === 0) return "";
  return fmtNum(num, 2);
}

export function fmtMoneyZero(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "0";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";
  return fmtNum(num, 2);
}

export function fmtQty(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "";
  const s = String(n);
  // display exactly as entered: strip trailing zeros
  if (s.includes(".")) return s.replace(/\.?0+$/, "");
  return s;
}

// "2026-01-02" -> "02-Jan-26"
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dd}-${MON[dt.getMonth()]}-${String(dt.getFullYear()).slice(2)}`;
}

// "2026-01-02" -> "01 January 2026"
const MONL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function fmtDateLong(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return `${String(dt.getDate()).padStart(2, "0")} ${MONL[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function toISODate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

export function parseAmount(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}
