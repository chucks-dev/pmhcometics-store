export const metadata = { title: "Privacy Policy" };
export default function Privacy() {
  return (
    <div className="container-x max-w-2xl space-y-4 py-12 text-muted">
      <h1 className="text-5xl text-ink">Privacy Policy</h1>
      <p><b>Template: have a lawyer review it before launch.</b> Last updated: {new Date().getFullYear()}.</p>
      <h2 className="pt-4 text-2xl text-ink">What we collect</h2>
      <p>Your name, email, phone number, delivery address, order history, and the beauty preferences you choose to share. We use cookies to keep you signed in and to remember your bag.</p>
      <h2 className="pt-4 text-2xl text-ink">How we use it</h2>
      <p>To process and deliver orders, send receipts and order updates, suggest products you may like, and prevent fraud. We don&apos;t sell your data.</p>
      <h2 className="pt-4 text-2xl text-ink">Payments</h2>
      <p>Payments are handled by Paystack and Flutterwave. Your card details go directly to them and are never stored on our servers.</p>
      <h2 className="pt-4 text-2xl text-ink">Your rights</h2>
      <p>You can view and update your details in your account, or email us to access, correct or delete your data under the Nigeria Data Protection Act.</p>
    </div>
  );
}
