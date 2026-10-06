"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button, Input } from "@/components/ui/forms";
import { useToast } from "@/components/ui/feedback";

export function Newsletter() {
  const toast = useToast();
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  return (
    <section className="container-x mt-20">
      <div className="rounded-[2rem] bg-brand-800 px-6 py-12 text-center text-white sm:px-12">
        <h2 className="text-3xl sm:text-4xl">Get new arrivals first</h2>
        <p className="mx-auto mt-2 max-w-md text-brand-100">Occasional emails with new products and offers. Unsubscribe anytime.</p>
        <form className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr("");
          try { const r = await api<{ message: string }>("/api/newsletter", { body: { email } }); toast(r.message); setEmail(""); }
          catch (x) { setErr(x instanceof ApiError ? x.message : "Try again"); }
          setBusy(false);
        }}>
          <div className="flex-1 text-left"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" error={err} className="!border-transparent" /></div>
          <Button loading={busy} className="!bg-white !text-brand-700 hover:!bg-brand-50 sm:self-start">Subscribe</Button>
        </form>
      </div>
    </section>
  );
}
