"use client";
import { useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button, Input, Textarea } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", message: "" }); const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(""); const [err, setErr] = useState<ApiError | null>(null);
  return (
    <div className="container-x max-w-xl py-12">
      <h1 className="text-5xl">Contact us</h1>
      <p className="mt-3 text-muted">Ask about an order, a product, or anything else. We usually reply within a day.</p>
      {done ? <div className="mt-8"><Alert kind="success">{done}</Alert></div> : (
        <form className="card mt-8 space-y-4 p-6" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr(null);
          try { setDone((await api<{ message: string }>("/api/contact", { body: f })).message); } catch (x) { setErr(x as ApiError); }
          setBusy(false);
        }}>
          <Input label="Your name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={err?.fields?.name?.[0]} />
          <Input label="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={err?.fields?.email?.[0]} />
          <Textarea label="Message" required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} error={err?.fields?.message?.[0]} />
          {err && !err.fields && <Alert>{err.message}</Alert>}
          <Button loading={busy} className="w-full">Send message</Button>
        </form>
      )}
    </div>
  );
}
