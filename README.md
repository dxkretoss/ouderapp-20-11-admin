# Ouderschap & Co — Admin panel

Super admin dashboard for the Ouderschap & Co parent app: an overview of all accounts, a searchable user list,
and per user: account details, weekly schedule, calendar appointments, tasks, costs and settlements, family links,
sessions and invitations. Accounts can be disabled and enabled again.

React 19 + Vite, Tailwind CSS 4, Lucide icons. Plain `.jsx` / `.js`.

## How it is secured

The panel has **no direct database access**. It only calls one edge function, `admin-api`, which lives in the
parent app's repository (`supabase/functions/admin-api`). That function:

- only lets profiles with role `superadmin` (verified, not disabled) sign in; any other account gets the same
  "invalid e-mail or password" as a wrong password;
- limits failed sign-ins (5 per e-mail and 10 per network per 15 minutes);
- uses its own short sessions (`admin_sessions`): 8 hours max, 30 minutes idle, only a hash of the token is stored;
  app tokens never work here and admin tokens never work in the app;
- re-checks the admin's role on every request;
- records every admin sign-in and action in `admin_audit_log` (server-side only, not shown in the panel);
- never returns messages, documents, BSN, medical data, bank accounts or passwords; "only for me" appointments are
  listed without their title.

In the browser the token lives in `sessionStorage` (gone when the tab closes), production builds get a strict
Content-Security-Policy, and `public/_headers` adds security headers for static hosting.

Optional extra hardening (Supabase secrets for `admin-api`):

| Secret | Effect |
|---|---|
| `ADMIN_IP_ALLOWLIST` | Comma-separated IPs; requests from other networks are refused, including sign-in. |
| `ADMIN_ORIGINS` | Comma-separated origins (e.g. `https://admin.example.com`); requests from other browser origins are refused. |

## Setup

1. **Database** — run `supabase/migrations/20261128000002_admin_panel.sql` (parent app repo) in the Supabase SQL editor.
2. **Edge functions** — deploy `admin-api`, plus `custom-auth` and every other function (they share the updated
   `_shared/session.ts`, which now refuses disabled accounts and the super admin in the parent app):
   `npx supabase functions deploy --no-verify-jwt`.
3. **Super admin login** — in this folder:
   ```bash
   npm install
   npm run admin:sql -- --email you@yourdomain.com
   ```
   Run the generated `create-super-admin.local.sql` once in the SQL editor, save the printed password in a
   password manager and delete the file.
4. **Environment** — copy `.env.example` to `.env.local` and fill in the same Supabase URL and anon key as the app.
5. **Run** — `npm run dev` (http://localhost:5174) or `npm run build` and host `dist/` on a separate (sub)domain.

## Structure

```
src/
  lib/        api.js (admin-api client), auth.jsx (session), useApi.js, format.js
  components/ ui.jsx (buttons, cards, badges, modal…), Layout.jsx, charts.jsx, StatusBadge.jsx, RequireAdmin.jsx
  pages/      Login, Dashboard, Users, UserDetail, Settings
scripts/      create-super-admin.mjs
```
