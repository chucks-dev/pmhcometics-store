import argon2 from "argon2";

const OPTS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (plain: string) => argon2.hash(plain, OPTS);

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

let dummyHash: string | undefined;
/** Spend the same time as a real check so response timing doesn't reveal whether an email exists. */
export async function burnVerify(plain: string): Promise<void> {
  dummyHash ??= await hashPassword("timing-equalizer-password");
  await verifyPassword(dummyHash, plain);
}
