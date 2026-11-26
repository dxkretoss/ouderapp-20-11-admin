import { useState } from "react";
import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, errorText } from "@/lib/api";
import { Button, Card, ErrorBox, FIELD, PageHeader } from "@/components/ui";

const RULES = [
  ["At least 12 characters", (v) => v.length >= 12],
  ["Upper case letter", (v) => /[A-Z]/.test(v)],
  ["Lower case letter", (v) => /[a-z]/.test(v)],
  ["A digit", (v) => /[0-9]/.test(v)],
  ["A special character", (v) => /[^A-Za-z0-9]/.test(v)],
];

export default function Settings() {
  const { admin } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const strong = RULES.every(([, ok]) => ok(next));
  const valid = current && strong && next === repeat && next !== current;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await api("change-password", { current_password: current, new_password: next });
      setDone(true);
      setCurrent(""); setNext(""); setRepeat("");
    } catch (err) {
      setError(err.code === "INVALID_CREDENTIALS" ? "Your current password is incorrect." : errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your admin account and security." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Change password" subtitle="Other admin sessions of this account are signed out.">
          <form onSubmit={submit} noValidate className="space-y-4">
            <input type="email" autoComplete="username" value={admin?.email ?? ""} readOnly hidden />
            <label className="block text-xs font-medium text-ink-soft">Current password
              <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={`mt-1.5 ${FIELD}`} />
            </label>
            <label className="block text-xs font-medium text-ink-soft">New password
              <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={`mt-1.5 ${FIELD}`} />
            </label>
            <ul className="grid grid-cols-2 gap-1.5 text-xs">
              {RULES.map(([label, ok]) => (
                <li key={label} className={`flex items-center gap-1.5 ${ok(next) ? "text-good" : "text-ink-muted"}`}>
                  <CheckCircle2 className="size-3.5" aria-hidden />{label}
                </li>
              ))}
            </ul>
            <label className="block text-xs font-medium text-ink-soft">Repeat new password
              <input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} aria-invalid={!!repeat && repeat !== next} className={`mt-1.5 ${FIELD}`} />
            </label>
            {repeat && repeat !== next ? <p className="text-xs font-semibold text-bad">The passwords do not match.</p> : null}
            {error ? <ErrorBox message={error} /> : null}
            {done ? <p role="status" className="flex items-center gap-2 rounded-2xl bg-good-soft px-3 py-2 text-sm font-semibold text-good"><CheckCircle2 className="size-4" aria-hidden />Password changed.</p> : null}
            <Button type="submit" icon={KeyRound} loading={busy} disabled={!valid}>Change password</Button>
          </form>
        </Card>

        <Card title="How this panel is protected">
          <ul className="space-y-3 text-[13px] text-ink-soft">
            {[
              "Only accounts with the super admin role can sign in; the app's normal accounts are refused.",
              "The super admin cannot sign in to the parent app and cannot reset its password by e-mail.",
              "Sessions end after 8 hours, or after 30 minutes without activity, and only last while this tab is open.",
              "Failed sign-ins are limited per e-mail address and per network.",
              "Every admin sign-in and action is recorded on the server.",
              "Messages, documents, BSN and medical details of families are never shown here.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />{t}</li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
