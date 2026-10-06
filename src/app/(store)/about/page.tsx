export const metadata = { title: "About" };
export default function About() {
  return (
    <div className="container-x max-w-2xl py-12">
      <h1 className="text-5xl">About PMHCOSMETICS</h1>
      <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
        <p>PMHCOSMETICS is a Nigerian beauty store for people who want fewer, better products. We choose skincare, makeup, hair, body and fragrance essentials we&apos;d use ourselves.</p>
        <p>Every product is checked for authenticity before it ships, and we deliver across all 36 states and the FCT.</p>
        <p>Questions about what suits you? <a href="/contact" className="text-brand-600 underline">Talk to us</a>.</p>
      </div>
    </div>
  );
}
