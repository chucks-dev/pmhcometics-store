/** Only allow same-site relative redirects (blocks open-redirect via ?next=https://evil). */
export const safeNext = (v: string | null | undefined, fallback = "/") => (v && /^\/(?!\/)/.test(v) ? v : fallback);
