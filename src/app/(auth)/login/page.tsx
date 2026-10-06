"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button, Input, PasswordInput } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { safeNext } from "@/lib/safe-next";

function LoginForm() {
  const next = safeNext(useSearchParams().get("next"), "");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiError | null>(null); const [resent, setResent] = useState(false);
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-3xl">Welcome back</h1>
      <p className="mt-1 text-muted">Log in to see your orders and picks.</p>
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(null);
        try {
          const r = await api<{ redirect: string }>("/api/auth/login", { body: { email, password } });
          window.location.href = r.redirect === "/onboarding" ? r.redirect : next || r.redirect; // full reload refreshes cart + session
        } catch (x) { setErr(x as ApiError); setBusy(false); }
      }}>
        <Input label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordInput autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && (
          <Alert>
            {err.message}
            {err.code === "EMAIL_NOT_VERIFIED" && !resent && (
              <button type="button" className="ml-1 font-semibold underline" onClick={async () => { await api("/api/auth/resend-verification", { body: { email } }).catch(() => {}); setResent(true); }}>Resend verification email</button>
            )}
            {resent && " We've sent a new link."}
          </Alert>
        )}
        <Button className="w-full" loading={busy}>Log in</Button>
        <div className="text-center"><Link href="/forgot-password" className="text-sm font-medium text-brand-600">Forgot password?</Link></div>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New here? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-600">Create an account</Link></p>
    </div>
  );
}
export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
