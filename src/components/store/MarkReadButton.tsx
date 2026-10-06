"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/forms";
import { api } from "@/lib/api";

export function MarkReadButton() {
  const router = useRouter();
  return <Button size="sm" variant="outline" onClick={async () => { await api("/api/account/notifications", { method: "PATCH", body: {} }); router.refresh(); }}>Mark all as read</Button>;
}
