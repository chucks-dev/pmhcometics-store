export const metadata = { title: "FAQ" };
const FAQ = [
  ["How long does delivery take?", "Lagos orders usually arrive within 1–3 working days. Other states take 3–7 working days."],
  ["How much is delivery?", "Delivery is a flat fee based on your state, and it's free on larger orders. You'll see the exact amount in your bag before you pay."],
  ["How can I pay?", "You can pay by card, bank transfer or USSD through Paystack or Flutterwave. We never see or store your card details."],
  ["Do I need an account to order?", "No. You can check out as a guest. An account lets you track orders, save addresses and get personalised picks."],
  ["Can I return a product?", "If your order arrives damaged or incorrect, contact us within 48 hours with photos and we'll make it right."],
  ["How do I track my order?", "Open your confirmation email or go to My orders in your account. The page shows each step from confirmed to delivered."],
];
export default function Faq() {
  return (
    <div className="container-x max-w-2xl py-12">
      <h1 className="text-5xl">Frequently asked questions</h1>
      <div className="mt-8">{FAQ.map(([q, a]) => (
        <details key={q} className="group border-b border-line">
          <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">{q}<span className="text-2xl text-muted transition group-open:rotate-45">+</span></summary>
          <p className="pb-5 text-muted">{a}</p>
        </details>
      ))}</div>
    </div>
  );
}
