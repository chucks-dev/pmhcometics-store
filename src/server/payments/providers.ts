import { env } from "../env";

export type Provider = "paystack" | "flutterwave";

export interface InitInput {
  reference: string; amountKobo: number; email: string; name: string; phone: string; callbackUrl: string;
}
export interface VerifyResult {
  state: "success" | "failed" | "pending";
  providerTxId: string | null; amountKobo: number; currency: string; raw: unknown;
}

const timeout = () => AbortSignal.timeout(15_000);

// ───── Paystack ─────
async function paystack(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init, signal: timeout(),
    headers: { Authorization: `Bearer ${env.paystackSecret}`, "Content-Type": "application/json" },
  });
  return res.json();
}

// ───── Flutterwave (v3 API: static secret key) ─────
async function flutterwave(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.flutterwave.com/v3${path}`, {
    ...init, signal: timeout(),
    headers: { Authorization: `Bearer ${env.flutterwaveSecret}`, "Content-Type": "application/json" },
  });
  return res.json();
}

/** Returns the hosted-checkout URL to redirect the customer to. */
export async function initializePayment(provider: Provider, i: InitInput): Promise<string> {
  if (provider === "paystack") {
    const r = await paystack("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({ email: i.email, amount: i.amountKobo, currency: "NGN", reference: i.reference, callback_url: i.callbackUrl }),
    });
    if (!r.status || !r.data?.authorization_url) throw new Error(`Paystack init failed: ${r.message}`);
    return r.data.authorization_url;
  }
  const r = await flutterwave("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: i.reference, amount: i.amountKobo / 100, currency: "NGN", redirect_url: i.callbackUrl,
      customer: { email: i.email, name: i.name, phonenumber: i.phone },
      customizations: { title: "PMHCOSMETICS" },
    }),
  });
  if (r.status !== "success" || !r.data?.link) throw new Error(`Flutterwave init failed: ${r.message}`);
  return r.data.link;
}

/** Asks the gateway directly for the truth. Never trust a browser redirect or a webhook body alone. */
export async function verifyWithProvider(provider: Provider, reference: string): Promise<VerifyResult> {
  if (provider === "paystack") {
    const r = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
    const d = r.data;
    if (!r.status || !d) return { state: "pending", providerTxId: null, amountKobo: 0, currency: "NGN", raw: r };
    const state = d.status === "success" ? "success" : ["failed", "reversed"].includes(d.status) ? "failed" : "pending";
    return { state, providerTxId: d.id ? String(d.id) : null, amountKobo: Number(d.amount), currency: d.currency, raw: d };
  }
  const r = await flutterwave(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`);
  const d = r.data;
  if (r.status !== "success" || !d) return { state: "pending", providerTxId: null, amountKobo: 0, currency: "NGN", raw: r };
  const state = d.status === "successful" ? "success" : d.status === "failed" ? "failed" : "pending";
  return { state, providerTxId: d.id ? String(d.id) : null, amountKobo: Math.round(Number(d.amount) * 100), currency: d.currency, raw: d };
}
