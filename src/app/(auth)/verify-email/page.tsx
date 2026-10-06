"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

function Verify() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading"); const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!token) { setState("error"); setMsg("This link is missing its token. Open the link from your email again."); return; }
    api<{ redirect: string }>("/api/auth/verify-email", { body: { token } })
      .then((r) => { setState("ok"); setTimeout(() => (window.location.href = r.redirect), 1200); })
      .catch((e) => { setState("error"); setMsg(e instanceof ApiError ? e.message : "Something went wrong."); });
  }, [token]);
  return (
    <div className="card p-8 text-center" role="status">
      {state === "loading" && <><h1 className="text-3xl">Verifying…</h1><p className="mt-2 text-muted">One moment.</p></>}
      {state === "ok" && <><h1 className="text-3xl">Account created 🎉</h1><p className="mt-2 text-muted">Taking you to your beauty preferences…</p></>}
      {state === "error" && <><h1 className="text-3xl">Link not valid</h1><p className="mt-2 text-muted">{msg}</p><Link href="/login" className="btn-primary mt-6 w-full">Log in to resend</Link></>}
    </div>
  );
}
export default function VerifyEmailPage() { return <Suspense><Verify /></Suspense>; }
