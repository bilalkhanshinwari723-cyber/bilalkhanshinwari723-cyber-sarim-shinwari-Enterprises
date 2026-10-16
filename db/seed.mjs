// Seed: admin/user + the real ledger from the paper screenshots
// Account 22226 — Alam Shair (Sarim Shinwari). Expected closing: Dr 7,38,175. Total qty: 175.
// Usage: DATABASE_URL=... node db/seed.mjs
import pg from "pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// [date, remarks, qty, truckNo, debit, credit]
const ROWS = [
  ["2025-12-31", "Opening Balance", null, null, 44200, 0],
  ["2026-01-02", "Fecto to Bunji 9100", 35, "AA-147", 318500, 0],
  ["2026-01-02", "Fecto to Binji 9100", 35, "AA-145", 318500, 0],
  ["2026-01-14", "Fecto to Bunji 9100", 35, "AA-148", 318500, 0],
  ["2026-01-24", "Fecto to Bunji 9000", 35, "AA-147", 315000, 0],
  ["2026-01-24", "Online-Behzad", null, null, 0, 955500],
  ["2026-01-26", "Fecto to Bunji 9000", 35, "AA-145", 315000, 0],
  ["2026-02-02", "Fecto to Bunji 35/147/9000", null, null, 315000, 0],
  ["2026-02-02", "Fecto to Bunji 35/144/9000", null, null, 315000, 0],
  ["2026-02-03", "Online ABL", null, null, 0, 1224000],
  ["2026-02-03", "Behzad (31+35 Ton)", null, null, 594000, 0],
  ["2026-02-10", "Isl to Bunji 30/150/10000", null, null, 300000, 3000],
  ["2026-02-11", "Fecto to Bunji 35/733/9000", null, null, 315000, 0],
  ["2026-02-11", "Fecto to Bunji 35/147/9000", null, null, 315000, 0],
  ["2026-02-12", "Fecto to Gilgit 31/327/9200", null, null, 285200, 0],
  ["2026-02-12", "Fecto to Gilgit 31/148/9200", null, null, 285200, 0],
  ["2026-02-12", "Bosa", null, null, 30000, 0],
  ["2026-02-20", "Online ABL", null, null, 0, 1260000],
  ["2026-02-21", "Fecto to Bunji 34/377/9000", null, null, 306000, 0],
  ["2026-02-23", "Fecto to Gilgit 35/148/9200", null, null, 322000, 0],
  ["2026-02-24", "Online MZBL", null, null, 0, 285200],
  ["2026-02-26", "Fecto to Gilgit 40/149/9200", null, null, 368000, 0],
  ["2026-03-03", "Online ABL", null, null, 0, 297000],
  ["2026-03-10", "Fecto to Bunji 41/149/9600", null, null, 393600, 0],
  ["2026-03-13", "Cash (377)", null, null, 0, 350000],
  ["2026-03-16", "Online", null, null, 0, 800000],
  ["2026-04-02", "Online ABL", null, null, 0, 598000],
  ["2026-04-02", "Fecto to GB 35/147/13500", null, null, 472500, 0],
  ["2026-04-13", "Fecto to Skardu 33.55/2477/15000", null, null, 503250, 0],
  ["2026-04-13", "Fecton to Skardu 31.62/3477/15000", null, null, 474300, 0],
  ["2026-04-13", "Fecto to Skardu 31.60/4677/15000", null, null, 474000, 0],
  ["2026-04-13", "Fecto to Skardu 32.09/177/15000", null, null, 481350, 0],
  ["2026-04-17", "Fecto to Gilgit 40/149/11300", null, null, 452000, 0],
  ["2026-04-21", "Online ABL", null, null, 0, 1920000],
  ["2026-05-06", "Fecto To Bunji 40/149/11200", null, null, 448000, 0],
  ["2026-05-06", "Fecto to Khaplu 35/147/17000", null, null, 595000, 0],
  ["2026-05-11", "Online ABL", null, null, 0, 1019500],
  ["2026-05-11", "Fecto to Khaplu 32.01/177/17500", null, null, 560175, 0],
  ["2026-05-11", "147 Driver Cash", null, null, 0, 500000],
  ["2026-05-16", "Fecto to Khaplu 31.56/2477/17500", null, null, 552300, 0],
  ["2026-05-16", "Fecto to Khaplu 32.17/4677/17500", null, null, 562975, 0],
  ["2026-05-18", "Online MZBL", null, null, 0, 1673025],
  ["2026-05-18", "Fecto to Bunji 40/149/11200", null, "149", 448000, 0],
  ["2026-05-18", "Commission", null, null, 0, 4000],
  ["2026-05-19", "Fecto to Khaplu 32.35/3477/17500", null, null, 566125, 0],
  ["2026-05-21", "Fecto to Khaplu 34.17/177/17500", null, null, 597975, 0],
  ["2026-05-25", "Online Meezan", null, null, 0, 500000],
  ["2026-06-01", "Fecto to Khaplu 32.35/177/17500", null, null, 566125, 0],
  ["2026-06-01", "Fecto to Khaplu 33.79/4677/17500", null, null, 591325, 0],
  ["2026-06-02", "Fecto to Khaplu 32.16/3477/17500", null, null, 562800, 0],
  ["2026-06-02", "Fecto to GB 35/146/12000", null, null, 420000, 0],
  ["2026-06-06", "Shahid 146", null, null, 0, 200000],
  ["2026-06-08", "Online Meezan", null, null, 0, 1000000],
  ["2026-06-12", "Fecto to Bunji 41/149/11000", null, null, 451000, 0],
  ["2026-06-12", "Fecto to Gilgit 35/145/11600", null, null, 406000, 0],
  ["2026-06-13", "Online MZBL", null, null, 0, 1000000],
  ["2026-06-18", "Online MZN", null, null, 0, 1500000],
  ["2026-06-18", "Fecto to Bunji 41/149/9800", null, null, 401800, 0],
  ["2026-06-18", "Fecto to GB 35/144/10300", null, null, 360500, 0],
  ["2026-06-25", "B/W to Gilgit 35/377/9900", null, null, 346500, 0],
  ["2026-06-28", "Online MZBL", null, null, 0, 500000],
  ["2026-07-02", "Fecto to GB 44/149/10300", null, null, 453200, 0],
  ["2026-07-03", "Fecto to Bunji 35/144/9800", null, null, 343000, 0],
  ["2026-07-08", "Online ABL", null, null, 0, 1500000],
  ["2026-07-08", "Fecto to Astore 32/145/12000", null, null, 384000, 0],
  ["2026-07-18", "Fecto to GB 35/146/11200", null, null, 392000, 0],
  ["2026-07-24", "Fecto to GB 35/146/11500", null, null, 402500, 0],
  ["2026-07-27", "146-Shahid Cash", null, null, 0, 402500],
  ["2026-07-29", "Fecto to Bunji 40/149/10500", null, null, 420000, 0],
  ["2026-07-29", "Fecto to Bunji 35/145/10500", null, null, 367500, 0],
  ["2026-07-29", "Online Mezan", null, null, 0, 1000000],
  ["2026-08-18", "Online MZBL", null, null, 0, 600000],
];

async function main() {
  // schema
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);

  // users
  const adminPw = await bcrypt.hash("admin123", 10);
  const userPw = await bcrypt.hash("user123", 10);
  await pool.query(
    `INSERT INTO users (email, name, password, role) VALUES ($1,$2,$3,'admin')
     ON CONFLICT (email) DO NOTHING`,
    ["admin@stoneledger.local", "Administrator", adminPw]
  );
  await pool.query(
    `INSERT INTO users (email, name, password, role) VALUES ($1,$2,$3,'user')
     ON CONFLICT (email) DO NOTHING`,
    ["user@stoneledger.local", "Staff User", userPw]
  );

  // account
  const ar = await pool.query(
    `INSERT INTO accounts (code, name, phone, opening_date, closing_date, opening_balance, notes)
     VALUES ('22226','Alam Shair (Sarim Shinwari)','03150403009','2026-01-01','2026-08-28',0,
             'Sample ledger transcribed from paper (Aug 2026).')
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`
  );
  const accountId = ar.rows[0].id;

  await pool.query("DELETE FROM transactions WHERE account_id = $1", [accountId]);
  for (const [date, remarks, qty, truckNo, debit, credit] of ROWS) {
    await pool.query(
      `INSERT INTO transactions (account_id, date, remarks, qty, truck_no, debit, credit)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [accountId, date, remarks, qty, truckNo, debit, credit]
    );
  }

  const br = await pool.query(
    `SELECT SUM(debit) - SUM(credit) AS bal, SUM(qty) AS qty FROM transactions WHERE account_id = $1`,
    [accountId]
  );
  const bal = Number(br.rows[0].bal);
  const qty = Number(br.rows[0].qty);
  console.log(`Seeded ${ROWS.length} transactions. Closing: ${bal} (expect 738175). Total qty: ${qty} (expect 175)`);
  if (bal !== 738175) throw new Error("BALANCE MISMATCH");
  if (qty !== 175) throw new Error("QTY MISMATCH");
  console.log("SEED OK");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => pool.end());
