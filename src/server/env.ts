function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}
const optional = (name: string) => process.env[name] ?? "";

// Lazy getters so importing this file never throws at build time.
export const env = {
  get isProd() { return process.env.NODE_ENV === "production"; },
  get databaseUrl() { return required("DATABASE_URL"); },
  get appUrl() { return required("APP_URL").replace(/\/$/, ""); },
  get adminUrl() { return required("ADMIN_URL").replace(/\/$/, ""); },
  get totpKey() { return required("TOTP_ENCRYPTION_KEY"); },
  get devAutoVerify() { return !this.isProd && process.env.DEV_AUTO_VERIFY_EMAIL === "true"; },
  get resendKey() { return optional("RESEND_API_KEY"); },
  get emailFrom() { return process.env.EMAIL_FROM ?? "PMHCOSMETICS <no-reply@localhost>"; },
  get paystackSecret() { return required("PAYSTACK_SECRET_KEY"); },
  get flutterwaveSecret() { return required("FLUTTERWAVE_SECRET_KEY"); },
  get flutterwaveHash() { return required("FLUTTERWAVE_WEBHOOK_HASH"); },
  get cronSecret() { return optional("CRON_SECRET"); },
  s3: {
    get endpoint() { return optional("S3_ENDPOINT"); },
    get region() { return process.env.S3_REGION || "auto"; },
    get bucket() { return required("S3_BUCKET"); },
    get accessKeyId() { return required("S3_ACCESS_KEY_ID"); },
    get secretAccessKey() { return required("S3_SECRET_ACCESS_KEY"); },
    get publicBase() { return required("S3_PUBLIC_BASE_URL").replace(/\/$/, ""); },
  },
};
