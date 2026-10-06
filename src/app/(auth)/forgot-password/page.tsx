"use client";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button, Input } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-3xl">Reset your password</h1>
      <p className="mt-1 text-muted">Enter your email and we&apos;ll send you a reset link.</p>
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr("");
        try { setMsg((await api<{ message: string }>("/api/auth/forgot-password", { body: { email } })).message); } catch (x) { setErr(x instanceof ApiError ? x.message : "Try again"); }
        setBusy(false);
      }}>
        <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {msg && <Alert kind="success">{msg}</Alert>}{err && <Alert>{err}</Alert>}
        <Button className="w-full" loading={busy}>Send reset link</Button>
      </form>
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-brand-600">Back to log in</Link></p>
    </div>
  );
}
