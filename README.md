# Sarim Shinwari Enterprises — Web Accounts & Ledger

A complete, production-ready web application that replaces the paper Accounts Ledger.
Runs in any modern browser (Chrome, Edge, Firefox) on laptop, desktop, tablet, or mobile.

## Features

- **Dashboard** — total accounts, debit, credit, outstanding balance, today's and recent transactions
- **Accounts** — add/edit/delete/search, per-account balance, debit/credit totals
- **Ledger** — chronological `Date | Remarks | Qty | Truck Number | Debit | Credit | Balance`
  with **automatic running balance** (never entered manually, recalculated on every read)
- **Transactions** — add/edit/delete with confirmation; quick remark buttons
  (Fecto to Bunji/GB/Khaplu/Skardu/Gilgit/Astore, Online ABL/MZBL/Meezan/Behzad, Cash, Driver Cash, Commission…)
- **Search & filters** — by remarks, truck number, date range, debit/credit
- **Reports** — account summary, transactions (date-wise/debit/credit/truck-wise), outstanding, monthly
- **Printable ledger** — mirrors the paper format (ACCOUNTS LEDGER header, Page X of Y,
  account info, totals, Dr/Cr). Print or **Save as PDF** from the browser
- **Roles** — admin (full access) vs user (view + add transactions)
- **Backup** — one-click JSON export of all data (admin)
- **Audit log** — every create/update/delete is recorded

## Tech

- Next.js 16 (App Router) — frontend + API in one deploy
- PostgreSQL (Neon-ready) via `pg`
- JWT-in-cookie auth + bcrypt passwords
- Pakistani number formatting (3,18,500) exactly like the paper ledger

## Quick start (local)

```bash
npm install
cp .env.example .env        # set DATABASE_URL and JWT_SECRET
node db/seed.mjs            # creates tables + admin/user + sample ledger (72 rows)
npm run dev                 # http://localhost:3000
```

Login: `admin@stoneledger.local` / `admin123` (change after first login — see below),
or `user@stoneledger.local` / `user123`.

The seed loads the real ledger from the paper screenshots (Ac 22226, Alam Shair),
closing balance **Dr 7,38,175**, total qty **175** — verified against the paper.

## Deploy (free)

1. Create a free PostgreSQL database at [neon.tech](https://neon.tech), copy the connection string.
2. Push this folder to GitHub, import into [vercel.com](https://vercel.com).
3. In Vercel → Settings → Environment Variables add:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = a long random string
4. After deploy, run the seed once against the Neon DB:
   `DATABASE_URL="<neon-url>" node db/seed.mjs`
5. Change the default admin password (see below).

## Changing the admin password (SQL)

```sql
-- first generate a bcrypt hash: node -e "require('bcryptjs').hash('NEWPASS',10).then(console.log)"
UPDATE users SET password='<bcrypt-hash>' WHERE email='admin@stoneledger.local';
```

## Balance rule

`balance = previous balance + debit − credit`, in date order (same-day rows keep entry order).
Debit = stone loaded/sold (customer owes more). Credit = payment received (online, cash, driver cash, commission).
Balances are computed on every read and never stored, so editing or deleting any
transaction automatically corrects all following balances.
