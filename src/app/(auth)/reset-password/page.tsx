"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button, PasswordInput } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";

function Reset() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState(""); const [confirmPassword, setConfirm] = useState("");
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [err, setErr] = useState<ApiError | null>(null);
  if (done) return <div className="card p-8 text-center"><h1 className="text-3xl">Password updated</h1><p className="mt-2 text-muted">You can log in with your new password.</p><Link href="/login" className="btn-primary mt-6 w-full">Log in</Link></div>;
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-3xl">Choose a new password</h1>
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(null);
        try { await api("/api/auth/reset-password", { body: { token, password, confirmPassword } }); setDone(true); } catch (x) { setErr(x as ApiError); setBusy(false); }
      }}>
        <PasswordInput label="New password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={err?.fields?.password?.[0]} hint="At least 8 characters, with a letter and a number." />
        <PasswordInput label="Confirm new password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} error={err?.fields?.confirmPassword?.[0]} />
        {err && !err.fields && <Alert>{err.message} <Link href="/forgot-password" className="underline">Request a new link</Link></Alert>}
        <Button className="w-full" loading={busy}>Update password</Button>
      </form>
    </div>
  );
}
export default function ResetPasswordPage() { return <Suspense><Reset /></Suspense>; }
