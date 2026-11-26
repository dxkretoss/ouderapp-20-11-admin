#!/usr/bin/env node
/**
 * Creates (or resets) the super admin login.
 *
 *   npm run admin:sql -- --email admin@example.com [--name "Super Admin"] [--password "…"] [--skip-policy]
 *
 * Without --password a strong random password is generated. The script never talks to the database:
 * it writes `create-super-admin.local.sql` (git-ignored) with only the bcrypt HASH of the password.
 * Run that file once in the Supabase SQL editor. The plain password is printed here only — store it
 * in a password manager and delete the .sql file afterwards.
 *
 * Safety: if the e-mail already belongs to a normal app account, the SQL aborts instead of promoting it.
 * Resetting an existing super admin also ends all of its admin sessions.
 */
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function generatePassword(length = 20) {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%^&*-_=+?"];
  const all = sets.join("");
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const email = (arg("email") || "").trim().toLowerCase();
const name = (arg("name") || "Super Admin").trim();
const password = arg("password") || generatePassword();

if (!/^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]+$/.test(email)) {
  console.error("Give a valid e-mail: npm run admin:sql -- --email admin@example.com");
  process.exit(1);
}
const strong = password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
if (!strong) {
  // --skip-policy: deliberately use a password outside the policy (still at least 12 characters).
  if (!process.argv.includes("--skip-policy") || password.length < 12) {
    console.error("Password must have 12+ characters with upper case, lower case, a digit and a special character (or pass --skip-policy, min. 12 characters).");
    process.exit(1);
  }
  console.warn("Warning: this password does not meet the admin policy (missing upper/lower case, digit or special character).");
}

const sql = (v) => `'${String(v).replace(/'/g, "''")}'`;
const hash = bcrypt.hashSync(password, 12);

const out = `-- Super admin login for the Ouderschap & Co admin panel.
-- Generated ${new Date().toISOString()}. Contains only a bcrypt hash, but still: delete this file after running it.
-- Requires migration 20261128000002_admin_panel.sql.
DO $$
DECLARE
  v_id   uuid;
  v_role text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'disabled_at')
     OR to_regclass('public.admin_sessions') IS NULL THEN
    RAISE EXCEPTION 'Run migration 20261128000002_admin_panel.sql first (it adds profiles.disabled_at and admin_sessions).';
  END IF;

  SELECT id, role INTO v_id, v_role FROM public.profiles WHERE lower(email) = ${sql(email)};

  IF v_id IS NOT NULL AND v_role IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION 'The e-mail % belongs to a normal app account. Use another e-mail for the admin.', ${sql(email)};
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.profiles (email, password, name, role, usage_mode, is_verified, onboarding_completed)
    VALUES (${sql(email)}, ${sql(hash)}, ${sql(name)}, 'superadmin', 'together', true, true);
  ELSE
    UPDATE public.profiles
       SET password = ${sql(hash)},
           name = ${sql(name)},
           is_verified = true,
           onboarding_completed = true,
           password_must_be_set = false,
           disabled_at = NULL,
           disabled_reason = NULL,
           updated_at = now()
     WHERE id = v_id;
    UPDATE public.admin_sessions SET revoked_at = now() WHERE admin_id = v_id AND revoked_at IS NULL;
  END IF;
END $$;
`;

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "create-super-admin.local.sql");
writeFileSync(file, out, { mode: 0o600 });

console.log(`
Super admin SQL written to: ${file}

  E-mail:   ${email}
  Password: ${password}

1. Run the SQL file once in the Supabase dashboard → SQL editor.
2. Store the password in a password manager, then delete the .sql file.
3. Sign in at the admin panel. You can change the password under Settings.
`);
