"use client";
import { useState } from "react";
import { Alert, useToast } from "@/components/ui/feedback";
import { Button, PasswordInput } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";

export function SecurityForms() {
  const toast = useToast();
  const [cur, setCur] = useState(""); const [pw, setPw] = useState(""); const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiError | null>(null); const [local, setLocal] = useState("");
  return (
    <div className="max-w-lg space-y-6">
      <form className="card space-y-4 p-6" onSubmit={async (e) => {
        e.preventDefault(); setLocal(""); setErr(null);
        if (pw !== confirm) return setLocal("The new passwords don't match.");
        setBusy(true);
        try { await api("/api/account/password", { body: { currentPassword: cur, newPassword: pw } }); toast("Password changed. Other devices were signed out."); setCur(""); setPw(""); setConfirm(""); }
        catch (x) { setErr(x as ApiError); }
        setBusy(false);
      }}>
        <h2 className="font-sans text-lg font-semibold">Change password</h2>
        <PasswordInput label="Current password" autoComplete="current-password" required value={cur} onChange={(e) => setCur(e.target.value)} />
        <PasswordInput label="New password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} error={err?.fields?.newPassword?.[0]} hint="At least 8 characters, with a letter and a number." />
        <PasswordInput label="Confirm new password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {(local || (err && !err.fields)) && <Alert>{local || err?.message}</Alert>}
        <Button loading={busy}>Update password</Button>
      </form>
      <div className="card p-6">
        <h2 className="font-sans text-lg font-semibold">Devices</h2>
        <p className="mt-1 text-muted">Sign out everywhere except this device.</p>
        <Button variant="outline" className="mt-4" onClick={async () => { await api("/api/account/sessions", { method: "DELETE" }); toast("Signed out of other devices"); }}>Sign out other devices</Button>
      </div>
    </div>
  );
}
