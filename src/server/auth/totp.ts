import { authenticator } from "otplib";
import { decrypt } from "../security/crypto";

authenticator.options = { window: 1 }; // tolerate ±30s clock drift

export const generateTotpSecret = () => authenticator.generateSecret();
export const totpUri = (email: string, secret: string) =>
  authenticator.keyuri(email, "Cosmetics Admin", secret);

export function verifyTotp(encryptedSecret: string, code: string): boolean {
  try {
    return authenticator.check(code, decrypt(encryptedSecret));
  } catch {
    return false;
  }
}
