"use client";
import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api, ApiError, cn } from "@/lib/api";
import { Button, Input, Textarea } from "@/components/ui/forms";
import { Alert } from "@/components/ui/feedback";
import { useStore } from "./StoreProvider";

export function ReviewForm({ productId }: { productId: string }) {
  const { user } = useStore();
  const [rating, setRating] = useState(0); const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  if (!user) return <p className="text-muted"><Link href="/login" className="font-semibold text-brand-600 underline">Log in</Link> to review products you&apos;ve purchased.</p>;
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!rating) return setMsg({ kind: "error", text: "Choose a star rating." });
      setBusy(true); setMsg(null);
      try { const r = await api<{ message: string }>(`/api/products/${productId}/reviews`, { body: { rating, title: title || undefined, body: body || undefined } }); setMsg({ kind: "success", text: r.message }); setRating(0); setTitle(""); setBody(""); }
      catch (x) { setMsg({ kind: "error", text: x instanceof ApiError ? x.message : "Couldn't send your review." }); }
      setBusy(false);
    }}>
      <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="flex h-11 w-11 items-center justify-center">
            <Star className={cn("h-7 w-7", n <= rating ? "fill-brand-400 text-brand-400" : "text-line")} />
          </button>
        ))}
      </div>
      <Input label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
      <Textarea label="Your review (optional)" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <Button loading={busy}>Submit review</Button>
    </form>
  );
}
