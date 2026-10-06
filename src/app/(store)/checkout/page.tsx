"use client";
import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CartSummary } from "@/components/store/CartSummary";
import { useStore } from "@/components/store/StoreProvider";
import { ProductImage } from "@/components/ui/display";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Button, ButtonLink, Checkbox, Input, Select } from "@/components/ui/forms";
import { PaymentSelector, type PaymentProvider } from "@/components/ui/PaymentSelector";
import { api, ApiError, cn } from "@/lib/api";
import { NIGERIAN_STATES } from "@/lib/constants";
import { formatNaira } from "@/lib/money";

const NG_PHONE = /^(\+234|234|0)?[789][01]\d{8}$/;
const STEPS = ["Your details", "Delivery", "Payment"];

export default function CheckoutPage() {
  const { ready, user, cart, deliveryState, setDeliveryState } = useStore();
  const [step, setStep] = useState(0);
  const [guest, setGuest] = useState(false);
  const [f, setF] = useState({ fullName: "", email: "", phone: "", state: "Lagos", city: "", street: "", info: "" });
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [save, setSave] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => { setF((x) => ({ ...x, state: deliveryState })); }, [deliveryState]);
  useEffect(() => {
    if (!user) return;
    setF((x) => ({ ...x, fullName: x.fullName || user.fullName, email: x.email || user.email, phone: x.phone || (user.phone ?? "") }));
    api<{ addresses: any[] }>("/api/account/addresses").then(({ addresses }) => {
      const a = addresses.find((x) => x.isDefault) ?? addresses[0];
      if (a) setF((x) => ({ ...x, state: a.state, city: a.city, street: a.street, info: a.additionalInfo ?? "" }));
    }).catch(() => {});
  }, [user]);

  if (!ready) return null;
  if (!cart.items.length) return <div className="container-x"><EmptyState title="Nothing to check out" text="Your bag is empty." action={<ButtonLink href="/shop">Shop now</ButtonLink>} /></div>;

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (f.fullName.trim().length < 2) e.fullName = "Enter your full name";
      if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email";
      if (!NG_PHONE.test(f.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a valid Nigerian number, e.g. 0803 123 4567";
    }
    if (s === 1) {
      if (f.city.trim().length < 2) e.city = "Enter your city or town";
      if (f.street.trim().length < 5) e.street = "Enter your street address";
    }
    setErrors(e); return !Object.keys(e).length;
  };
  const next = () => { if (validate(step)) { setStep(step + 1); if (step === 1) setDeliveryState(f.state); window.scrollTo({ top: 0, behavior: "smooth" }); } };

  const pay = async () => {
    if (!provider) return setError("Choose how you'd like to pay.");
    setBusy(true); setError("");
    try {
      const r = await api<{ paymentUrl: string }>("/api/checkout", {
        body: {
          customer: { fullName: f.fullName, email: f.email, phone: f.phone },
          delivery: { state: f.state, city: f.city, street: f.street, info: f.info || null },
          provider, discountCode: cart.discountCode, saveAddress: !!user && save,
        },
      });
      window.location.href = r.paymentUrl;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again."); setBusy(false);
    }
  };

  const showGate = !user && !guest;
  return (
    <div className="container-x py-6 lg:py-10">
      <div className="mb-6 flex items-center justify-between"><Link href="/cart" className="text-sm text-muted hover:text-ink">← Back to bag</Link><span className="font-display text-xl text-brand-700">Checkout</span></div>

      {showGate ? (
        <div className="mx-auto max-w-md space-y-4">
          <h1 className="text-3xl">How would you like to check out?</h1>
          <Button className="w-full" onClick={() => setGuest(true)}>Continue as guest</Button>
          <ButtonLink href="/login?next=/checkout" variant="outline" className="w-full">Already have an account? Log in</ButtonLink>
          <p className="text-center text-sm text-muted">Don&apos;t have an account? <Link href="/signup?next=/checkout" className="font-semibold text-brand-600">Sign up</Link></p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <ol className="mb-8 flex items-center gap-2" aria-label="Checkout steps">
              {STEPS.map((s, i) => (
                <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === step ? "step" : undefined}>
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold", i < step ? "bg-brand-500 text-white" : i === step ? "border-2 border-brand-500 text-brand-600" : "border border-line text-muted")}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>
                  <span className={cn("hidden text-sm sm:block", i === step ? "font-semibold" : "text-muted")}>{s}</span>
                  {i < 2 && <span className="h-px flex-1 bg-line" />}
                </li>
              ))}
            </ol>

            {step === 0 && (
              <section className="space-y-4"><h1 className="text-3xl">Your details</h1>
                <Input label="Full name" autoComplete="name" value={f.fullName} onChange={set("fullName")} error={errors.fullName} />
                <Input label="Email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} error={errors.email} hint="We'll send your receipt here." />
                <Input label="Phone number" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={set("phone")} error={errors.phone} placeholder="0803 123 4567" />
                <Button className="w-full" onClick={next}>Continue to delivery</Button>
              </section>
            )}
            {step === 1 && (
              <section className="space-y-4"><h1 className="text-3xl">Delivery</h1>
                <Select label="State" value={f.state} onChange={set("state")}>{NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select>
                <Input label="City / town" autoComplete="address-level2" value={f.city} onChange={set("city")} error={errors.city} />
                <Input label="Street address" autoComplete="street-address" value={f.street} onChange={set("street")} error={errors.street} />
                <Input label="Additional delivery information (optional)" value={f.info} onChange={set("info")} placeholder="Landmark, gate code, etc." />
                {user && <Checkbox label="Save this address to my account" checked={save} onChange={(e) => setSave(e.target.checked)} />}
                <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(0)}>Back</Button><Button className="flex-1" onClick={next}>Continue to payment</Button></div>
              </section>
            )}
            {step === 2 && (
              <section className="space-y-5"><h1 className="text-3xl">Payment</h1>
                <PaymentSelector value={provider} onChange={setProvider} />
                <p className="text-sm text-muted">You&apos;ll be taken to a secure page to complete payment, then brought back here. Delivering to {f.street}, {f.city}, {f.state}.</p>
                {error && <Alert>{error}</Alert>}
                <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button className="flex-1" loading={busy} onClick={pay}>Pay {formatNaira(cart.totalKobo)}</Button></div>
              </section>
            )}
          </div>

          <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
            <h2 className="text-2xl">Order summary</h2>
            <ul className="space-y-3">
              {cart.items.map((i) => (
                <li key={i.productId} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"><ProductImage src={i.image} alt="" /><span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-ink px-1 text-[11px] text-white">{i.quantity}</span></div>
                  <span className="min-w-0 flex-1 truncate text-sm">{i.name}</span><span className="text-sm font-medium">{formatNaira(i.lineKobo)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-line pt-4"><CartSummary /></div>
          </aside>
        </div>
      )}
    </div>
  );
}
