"use client";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button, Checkbox, Input, PasswordInput } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";

export default function SignupPage() {
  const [f, setF] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const [fields, setFields] = useState<Record<string, string[]>>({}); const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const fe = (k: string) => fields[k]?.[0];

  if (done) return (
    <div className="card p-8 text-center">
      <h1 className="text-3xl">Check your email</h1>
      <p className="mt-3 text-muted">We sent a verification link to <b className="text-ink">{f.email}</b>. Open it to finish creating your account.</p>
      <Link href="/login" className="btn-outline mt-6 w-full">Back to log in</Link>
    </div>
  );
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-3xl">Create your account</h1>
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(""); setFields({});
        try { await api("/api/auth/signup", { body: { ...f, acceptedTerms: terms } }); setDone(true); }
        catch (x) { if (x instanceof ApiError) { setFields(x.fields ?? {}); setErr(x.fields ? "" : x.message); } setBusy(false); }
      }}>
        <Input label="Full name" autoComplete="name" required value={f.fullName} onChange={set("fullName")} error={fe("fullName")} />
        <Input label="Email address" type="email" autoComplete="email" inputMode="email" required value={f.email} onChange={set("email")} error={fe("email")} />
        <Input label="Phone number" type="tel" autoComplete="tel" inputMode="tel" required placeholder="0803 123 4567" value={f.phone} onChange={set("phone")} error={fe("phone")} />
        <PasswordInput autoComplete="new-password" required value={f.password} onChange={set("password")} error={fe("password")} hint="At least 8 characters, with a letter and a number." />
        <PasswordInput label="Confirm password" autoComplete="new-password" required value={f.confirmPassword} onChange={set("confirmPassword")} error={fe("confirmPassword")} />
        <div>
          <Checkbox checked={terms} onChange={(e) => setTerms(e.target.checked)} label={<>I agree to the <Link href="/terms" className="underline" target="_blank">Terms</Link> &amp; <Link href="/privacy" className="underline" target="_blank">Privacy Policy</Link></>} />
          {fe("acceptedTerms") && <p role="alert" className="text-xs text-red-600">{fe("acceptedTerms")}</p>}
        </div>
        {err && <Alert>{err}</Alert>}
        <Button className="w-full" loading={busy}>Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-brand-600">Log in</Link></p>
    </div>
  );
}
