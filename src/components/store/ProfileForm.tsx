"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, useToast } from "@/components/ui/feedback";
import { Button, Input } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const toast = useToast(); const router = useRouter();
  const [f, setF] = useState({ fullName, phone }); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiError | null>(null);
  return (
    <form className="card max-w-lg space-y-4 p-6" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr(null);
      try { await api("/api/account/profile", { method: "PATCH", body: f }); toast("Profile updated"); router.refresh(); } catch (x) { setErr(x as ApiError); }
      setBusy(false);
    }}>
      <Input label="Full name" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} error={err?.fields?.fullName?.[0]} />
      <Input label="Phone number" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={err?.fields?.phone?.[0]} />
      <Input label="Email" value={email} disabled hint="Contact support to change your email." />
      {err && !err.fields && <Alert>{err.message}</Alert>}
      <Button loading={busy}>Save changes</Button>
    </form>
  );
}
