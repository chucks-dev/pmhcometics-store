"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/forms";
import { api } from "@/lib/api";

type Result = { state: "success" | "failed" | "pending"; orderNumber: string; fulfilled?: boolean };

function Callback() {
  const sp = useSearchParams(); const router = useRouter();
  const order = sp.get("order") ?? ""; const t = sp.get("t") ?? "";
  const [res, setRes] = useState<Result | null>(null); const [err, setErr] = useState(false);
  const tries = useRef(0);

  useEffect(() => {
    let stop = false;
    const check = async () => {
      try {
        const r = await api<Result>("/api/payments/verify", { body: { order, t } });
        if (stop) return;
        setRes(r);
        if (r.state === "success" && r.fulfilled !== false) router.replace(`/order/${r.orderNumber}?t=${encodeURIComponent(t)}&confirmed=1`);
        else if (r.state === "pending" && ++tries.current < 8) setTimeout(check, 3000);
      } catch { if (!stop) setErr(true); }
    };
    check();
    return () => { stop = true; };
  }, [order, t, router]);

  if (err) return <Box title="We couldn't confirm your payment yet" text="If you were charged, don't worry: we'll confirm it automatically and email you. You can also check again."><Button onClick={() => location.reload()}>Check again</Button></Box>;
  if (res?.state === "failed") return <Box title="Payment didn't go through" text="You haven't been charged for this attempt. Your bag is still saved, so you can try again."><ButtonLink href="/checkout">Try again</ButtonLink></Box>;
  if (res?.state === "success" && res.fulfilled === false) return <Box title="Payment received" text="One of your items sold out while you were paying. Our team will refund you shortly and email you."><ButtonLink href="/shop">Continue shopping</ButtonLink></Box>;
  if (res?.state === "pending" && tries.current >= 8) return <Box title="Still waiting for confirmation" text="Your bank is taking a moment. We'll email you as soon as it's confirmed."><Button onClick={() => location.reload()}>Check again</Button></Box>;
  return (
    <div className="flex flex-col items-center py-24 text-center" role="status">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
      <h1 className="mt-6 text-3xl">Confirming your payment…</h1><p className="mt-2 text-muted">Please don&apos;t close this page.</p>
    </div>
  );
}

function Box({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-sm flex-col items-center py-20 text-center"><h1 className="text-3xl">{title}</h1><p className="mt-3 text-muted">{text}</p><div className="mt-6">{children}</div><Link href="/contact" className="mt-6 text-sm text-brand-600 underline">Contact support</Link></div>;
}

export default function PaymentCallback() { return <div className="container-x"><Suspense><Callback /></Suspense></div>; }
