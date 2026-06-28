# AfriTrust — Admin-Managed Wallet with OTP-Gated Withdrawals

- **Date:** 2026-06-28
- **Status:** Approved (ready for implementation plan)
- **Working directory:** `c:\Users\USER PC\Desktop\afritrust`

## 1. Summary

An admin-managed digital wallet. The admin credits a user's balance after verifying an
off-platform payment. To withdraw, a logged-in user submits bank details; the request is
only accepted after they enter a **single-use OTP that the admin generates in the admin
dashboard and relays to them manually** (e.g. over Telegram). On a valid OTP the balance is
**held** (debited immediately) and a pending withdrawal is created for the admin to pay out
or reject. The public site keeps AfriTrust b's exact visual design and defaults to **Spanish**
with an **English toggle** (predx i18n pattern).

This is built by combining three existing projects on the user's Desktop:
- **AfriTrust b** — base. Provides the visual design + the existing OTP/`withdrawals` core
  (`node:sqlite`, JWT admin login).
- **anthony invest** — source of the accounts/balances/dashboard *functionality* (not its look).
- **predx / "anthony neo site"** — source of the i18n pattern (`js/i18n.js`).

## 2. Locked decisions

1. **Build location:** here in `afritrust`, copying AfriTrust b in as the base (AfriTrust b stays untouched as backup).
2. **OTP delivery:** admin generates the code in the dash and relays it manually. **No Telegram bot.**
3. **OTP binding:** each OTP is bound to a **specific user** the admin selects; only that user can redeem it.
4. **Balance debit timing:** **hold at request** (debit on submit), **refund if the admin rejects**.
5. **Visual design:** identical to AfriTrust b (same CSS, components, palette, fonts). New pages styled with AfriTrust b's design system.
6. **Feature scope:** **wallet core only.** No trades engine, ROI plans, subscriptions, KYC, trade-mode, or impersonation.
7. **Money storage:** **integer minor units** (cents/kobo) everywhere.
8. **Registration approval:** **auto-approve** — users can log in immediately after registering. Admin can **block** anyone.

## 3. Goals / Non-goals

**Goals**
- Users register (with chosen currency), log in, and see their balance + transaction history.
- Admin credits/debits balances server-side after off-platform verification.
- Withdrawals are gated by an admin-issued, user-bound, single-use OTP; balance is held on submit.
- Admin manages users, issues OTPs per user, and approves/rejects withdrawals.
- Spanish-default UI with an English toggle, persisted.
- Built securely (see §8).

**Non-goals (out of scope)**
- No real payment gateway / deposits flow (admin credits manually).
- No trading, ROI plans, subscriptions, KYC, referrals engine, impersonation, FX conversion.
- No automated Telegram bot.
- Multi-currency *per user* is not required — each user has one currency; no cross-currency conversion.

## 4. Architecture & stack

- **One unified Express backend** built on AfriTrust b's `node:sqlite` (`DatabaseSync`) foundation.
- Libraries: `express`, `cors`, `helmet`, `express-rate-limit`, `bcryptjs`, `jsonwebtoken`, `dotenv`.
- **Frontend:** static HTML/CSS/JS in AfriTrust b's style (no framework, no Tailwind — keep AfriTrust b's `css/style.css` + `css/components.css`).
- **Dev runtime:** `serve.mjs` serves pages on `http://localhost:3000`; API runs on `http://localhost:3002`. CORS is already configured between them. Screenshot workflow (`screenshot.mjs` → `:3000`) stays intact.
- **Prod runtime:** the Express process also serves the static frontend (single origin). `DB_PATH` env points at a persistent volume. **Requires Node ≥ 22** for stable `node:sqlite`.
- **API base** is read from `js/config.js` (dev → `:3002`, prod → same origin).

*Rejected alternatives:* rebuilding on anthony invest's `sql.js` layer (AfriTrust b is the chosen base; `node:sqlite` is native and cleaner); two separate services (needless complexity, two DBs).

## 5. Data model (`node:sqlite`, all money as INTEGER minor units)

```sql
-- Accounts. balance_minor is whole cents/kobo. role separates admin. blocked suspends login.
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    UNIQUE NOT NULL,
  password      TEXT    NOT NULL,          -- bcrypt hash
  currency      TEXT    NOT NULL,          -- from allowlist, set at registration
  balance_minor INTEGER NOT NULL DEFAULT 0,
  role          TEXT    NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  blocked       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    DEFAULT (datetime('now'))
);

-- Full ledger: every balance change writes a row.
CREATE TABLE transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  type         TEXT    NOT NULL,           -- 'credit' | 'debit' | 'withdrawal'
  amount_minor INTEGER NOT NULL,
  currency     TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'completed', -- 'pending'|'completed'|'failed'
  reference    TEXT,
  note         TEXT,
  created_at   TEXT    DEFAULT (datetime('now'))
);

-- Single-use OTP codes, BOUND to one user. Admin generates; relays manually.
CREATE TABLE otps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT    UNIQUE NOT NULL,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  status     TEXT    NOT NULL DEFAULT 'active', -- 'active' | 'used'
  note       TEXT,
  created_at TEXT    DEFAULT (datetime('now')),
  used_at    TEXT
);

-- Withdrawal/payout requests. Saved only after a valid user-bound OTP. Linked to a txn.
CREATE TABLE withdrawals (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  reference                   TEXT    UNIQUE NOT NULL,
  user_id                     INTEGER NOT NULL REFERENCES users(id),
  transaction_id              INTEGER REFERENCES transactions(id),
  amount_minor                INTEGER NOT NULL,
  currency                    TEXT    NOT NULL,
  beneficiary_bank_name       TEXT    NOT NULL,
  beneficiary_account_name    TEXT    NOT NULL,
  beneficiary_account_number  TEXT    NOT NULL,
  beneficiary_account_type    TEXT,
  beneficiary_bank_country    TEXT,
  routine_bank_code           TEXT,
  otp_code                    TEXT,
  status                      TEXT    NOT NULL DEFAULT 'pending', -- 'pending'|'paid'|'rejected'
  admin_note                  TEXT,
  created_at                  TEXT    DEFAULT (datetime('now')),
  updated_at                  TEXT    DEFAULT (datetime('now')),
  paid_at                     TEXT
);
```

Admin is seeded from `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) as a `users` row with `role='admin'`.

## 6. API endpoints

**Auth** (`/api/auth`)
- `POST /register` — `{ name, email, password, currency }` → validate, bcrypt, insert (auto-approved). Returns nothing sensitive.
- `POST /login` — `{ email, password }` → verify, reject if blocked, issue JWT. Returns `{ token, user }` (no password).

**User** (`/api/user`, requires user JWT)
- `GET /profile` → public columns of the current user (incl. `balance_minor`, `currency`).
- `GET /transactions` → this user's ledger.
- `POST /password` — `{ current, next }` → change password (verify current).
- `POST /withdraw` — the secured flow (see §7).

**Admin** (`/api/admin`, requires admin JWT)
- `POST /login` — admin password login (or unified `/api/auth/login` with role check — implementation detail in plan).
- `GET /users`, `POST /users/:id/credit` `{ amount, note }`, `POST /users/:id/debit` `{ amount, note }`, `POST /users/:id/block` / `/unblock`.
- `GET /otps`, `POST /otps` `{ user_id, note }` → generate user-bound code, `DELETE /otps/:id`.
- `GET /withdrawals`, `POST /withdrawals/:id/paid`, `POST /withdrawals/:id/reject` (refunds balance).
- `GET /transactions` (all), `POST /users/:id/message` `{ subject, body }` (optional, lightweight messages table).

## 7. Core flows

### 7.1 Register
Validate: name ≥ 2 chars; email format; password ≥ 8 chars **and** contains a number; `currency` ∈ allowlist. Reject duplicate email (409). bcrypt(12) hash. Insert user (`balance_minor = 0`, auto-approved). Redirect to login.

### 7.2 Admin credits / debits balance
Admin opens a user, enters an amount (major units) + note. Server converts to minor units, validates `> 0`. **Atomic:** `balance_minor += amount_minor` (debit checks `≥ amount`), insert `transactions` row (`type='credit'|'debit'`, `status='completed'`). Server-side only; client never sends a balance.

### 7.3 Admin issues OTP
Admin selects a user + optional note → server generates a unique 8-char code (unambiguous alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) bound to `user_id`, inserts `otps` row (`status='active'`). Code shown once in the dash; admin relays it manually.

### 7.4 Withdraw (secured)
1. Authenticated user fills bank details + amount (their currency).
2. Step 2 asks for the OTP.
3. Server: verify JWT → `user`. Validate amount `> 0` and `≤ balance_minor`. Look up OTP: must be `active` **and** `user_id === user.id`. Rate-limited.
4. **Single atomic transaction** (`BEGIN … COMMIT`, `ROLLBACK` on any failure):
   - mark OTP `used` (`used_at = now`),
   - `balance_minor -= amount_minor` (re-check inside txn to prevent races/double-spend),
   - insert `withdrawals` (`status='pending'`, `user_id`, `reference`, bank details, `amount_minor`),
   - insert `transactions` (`type='withdrawal'`, `status='pending'`, `reference`), link `transaction_id`.
5. Return `{ reference }` → success page.

### 7.5 Admin resolves withdrawal
- **Mark paid:** `withdrawals.status='paid'`, `paid_at=now`; linked `transactions.status='completed'`. (Balance already held.)
- **Reject:** atomic — `withdrawals.status='rejected'`; **refund** `balance_minor += amount_minor`; linked `transactions.status='failed'`.

## 8. Security measures

- **Passwords:** bcrypt cost 12; never returned to any client. Password change verifies the current password.
- **Auth:** JWT Bearer, minimal payload (`id`, `role`); admin routes behind a role-checked guard. Server refuses to boot if `JWT_SECRET` is unset.
- **Money integrity:** all math server-side, integer minor units, inside atomic DB transactions; every withdrawal re-checks `amount ≤ balance` *inside* the transaction. Prevents double-spend and float drift.
- **OTP:** single-use, bound to one user, 8 chars from a 32-symbol alphabet (~10¹² space); **rate-limited** submission; codes marked used atomically with the debit.
- **Brute force:** `express-rate-limit` on `/api/auth/login` and `/api/user/withdraw` (OTP submit).
- **Input validation** on every field server-side; **currency allowlist**; amounts parsed to integer minor units and bounded.
- **SQL:** parameterized statements only. Admin field updates use a **column whitelist** — no column names from user input.
- **Transport/headers:** `helmet`; CORS restricted to known origins; secrets in `.env` (gitignored).

## 9. Internationalization (predx pattern)

- Port `js/i18n.js`: a `T` dictionary of `{ es, en }` strings; `getLang()` defaults to **`es`**; `setLang()` persists to `localStorage['afritrust_lang']` and re-applies; `applyLang()` updates every `[data-i18n]`, `[data-i18n-html]`, `[data-i18n-placeholder]` element, sets `document.documentElement.lang`, and toggles the `#langToggle` button label (`English` ⇄ `Español`).
- A `#langToggle` button sits in the nav of every page. All user-facing copy carries `data-i18n*` keys; both Spanish and English strings authored.

## 10. Pages (AfriTrust b design language)

- `index.html` — landing; nav gains **Login / Register + lang toggle**; copy updated to reflect that accounts now exist.
- `register.html` — name, email, password, **currency selector**.
- `login.html` — email + password.
- `dashboard.html` — **Overview** (balance + recent transactions), **Withdraw** (2-step, OTP-gated), **Profile** (change password), logout.
- `success.html` — request submitted, shows reference.
- `admin.html` — login; **Users** (credit/debit, block, issue user-bound OTP), **Withdrawals** (mark paid / reject), **Transactions**, optional **Messages**.

## 11. Money & currency handling

- Stored as INTEGER minor units. Display: divide by 100, format with currency symbol/code.
- **Currency allowlist** (initial): NGN, USD, EUR, GBP, GHS, KES, ZAR — final list confirmed during implementation. Each user has exactly one currency; withdrawals use the user's currency.

## 12. Acceptance criteria

1. A new user registers with a currency, logs in, and sees a zero balance.
2. Admin credits the user; the balance and a `credit` transaction appear.
3. User starts a withdrawal; without a valid user-bound OTP it is rejected.
4. Admin issues an OTP for that user; user submits it; balance is reduced by the amount and a `pending` withdrawal + transaction appear; a reference is shown.
5. A withdrawal exceeding the balance is rejected; an OTP issued for user A cannot be redeemed by user B.
6. Admin marks paid → transaction completed; admin reject → balance refunded, transaction failed.
7. Site loads in Spanish; toggle switches to English and persists across reloads/pages.
8. Visual design matches AfriTrust b.

## 13. Open items for the implementation plan

- Confirm final currency allowlist and display formatting.
- Decide unified vs separate admin login (role-checked `/api/auth/login` vs dedicated `/api/admin/login`).
- Whether to keep the public anonymous-style landing copy or rewrite for the account model (kept in AfriTrust b's visual style either way).
