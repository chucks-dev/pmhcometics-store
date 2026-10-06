"use client";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button, Input, PasswordInput } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";

export default function AdminLogin() {
  const [step, setStep] = useState<"password" | "code">("password");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(""); try { await fn(); } catch (e) { setErr(e instanceof ApiError ? e.message : "Something went wrong."); } setBusy(false); };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <p className="mb-6 text-center font-display text-3xl text-brand-700">PMHCOSMETICS <span className="text-base text-muted">Admin</span></p>
      <div className="card p-6">
        {step === "password" ? (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("/api/admin/auth/login", { body: { email, password } }); setStep("code"); }); }}>
            <h1 className="text-2xl">Admin login</h1>
            <Input label="Admin email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <PasswordInput autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            {err && <Alert>{err}</Alert>}
            <Button className="w-full" loading={busy}>Login</Button>
            <p className="text-center text-sm text-muted">Forgot your password? Ask a Super Admin to reset your account.</p>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("/api/admin/auth/verify-2fa", { body: { code } }); window.location.href = "/"; }); }}>
            <h1 className="text-2xl">Two-factor code</h1>
            <p className="text-muted">Enter the 6-digit code from your authenticator app.</p>
            <Input label="Code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            {err && <Alert>{err}</Alert>}
            <Button className="w-full" loading={busy}>Verify</Button>
            <button type="button" className="w-full text-center text-sm text-muted underline" onClick={() => { setStep("password"); setCode(""); setErr(""); }}>Start over</button>
          </form>
        )}
      </div>
      <Link href="/login" className="sr-only">Login</Link>
    </div>
  );
}
