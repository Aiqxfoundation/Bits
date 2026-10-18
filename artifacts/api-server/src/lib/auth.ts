import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const ACCOUNT_KEY_BYTES = 32;
const SESSION_TOKEN_BYTES = 32;
const KEY_SALT_BYTES = 16;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_SCHEME = "scrypt";

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,32}$/;
const ACCOUNT_KEY_PATTERN = /^[A-Za-z0-9._~+/-]{16,200}$/;

/** A high-entropy account key. Shown once to the account holder, never stored in clear text. */
export function generateAccountKey(): string {
  return randomBytes(ACCOUNT_KEY_BYTES).toString("base64url");
}

/** An opaque bearer token. Only its SHA-256 digest is persisted. */
export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Derives a salted scrypt hash for an account key, formatted as `scrypt:<salt>:<hash>`. */
export async function hashAccountKey(key: string): Promise<string> {
  const salt = randomBytes(KEY_SALT_BYTES).toString("hex");
  const derived = await scrypt(key.normalize("NFKC"), salt, SCRYPT_KEY_LENGTH);
  return `${SCRYPT_SCHEME}:${salt}:${derived.toString("hex")}`;
}

export async function verifyAccountKey(key: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash) return false;
  const [scheme, salt, digest] = storedHash.split(":");
  if (scheme !== SCRYPT_SCHEME || !salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  const derived = await scrypt(key.normalize("NFKC"), salt, SCRYPT_KEY_LENGTH);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

export function isValidAccountKey(value: string): boolean {
  return ACCOUNT_KEY_PATTERN.test(value);
}
