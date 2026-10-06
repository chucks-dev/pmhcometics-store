import { env } from "../env";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.resendKey) {
    console.log(`\n[email:dev] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, " ")}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.emailFrom, to, subject, html }),
  });
  if (!res.ok) console.error("Email send failed", res.status, await res.text());
}

const wrap = (body: string) =>
  `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1a1a1a">${body}</div>`;
const button = (href: string, label: string) =>
  `<p><a href="${href}" style="display:inline-block;background:#d6247c;color:#fff;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:600">${label}</a></p>`;

export function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${env.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail(to, "Verify your email", wrap(
    `<h2>Welcome, ${esc(name)} 💖</h2><p>Confirm your email to finish creating your account. This link expires in 24 hours.</p>${button(link, "Verify email")}`));
}

export function sendPasswordResetEmail(to: string, name: string, token: string) {
  const link = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail(to, "Reset your password", wrap(
    `<h2>Hi ${esc(name)},</h2><p>Use the button below to choose a new password. This link expires in 30 minutes. If you didn't ask for this, you can ignore this email.</p>${button(link, "Reset password")}`));
}

const naira = (kobo: number) => "₦" + (kobo / 100).toLocaleString("en-NG");

export function sendOrderConfirmationEmail(to: string, name: string, orderNumber: string, totalKobo: number, link: string) {
  return sendEmail(to, `Payment received · Order ${orderNumber}`, wrap(
    `<h2>Payment successful 🎉</h2><p>Thank you, ${esc(name)}. We've received ${naira(totalKobo)} for order <b>${esc(orderNumber)}</b>.</p>${button(link, "Track your order")}`));
}

export function sendOrderStatusEmail(to: string, name: string, orderNumber: string, statusLabel: string, link: string) {
  return sendEmail(to, `Order ${orderNumber}: ${statusLabel}`, wrap(
    `<h2>Hi ${esc(name)},</h2><p>Your order <b>${esc(orderNumber)}</b> is now <b>${esc(statusLabel)}</b>.</p>${button(link, "View order")}`));
}
