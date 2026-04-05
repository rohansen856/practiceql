import { EncryptedBlob } from "@/types/connection";

const PBKDF2_ITERATIONS = 210_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const VERIFIER_PLAINTEXT = "practiceql:vault-ok";

function toBase64(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return typeof btoa === "function" ? btoa(str) : Buffer.from(bytes).toString("base64");
}

function fromBase64(str: string): Uint8Array {
  const bin = typeof atob === "function" ? atob(str) : Buffer.from(str, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function generateSalt(): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return toBase64(salt);
}

export async function createVaultKey(
  passphrase: string,
  saltB64: string,
): Promise<CryptoKey> {
  return deriveKey(passphrase, fromBase64(saltB64));
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  return {
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(cipher)),
  };
}

export async function decrypt(key: CryptoKey, blob: EncryptedBlob): Promise<string> {
  const iv = fromBase64(blob.iv);
  const data = fromBase64(blob.ciphertext);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plain);
}

export async function createVerifier(key: CryptoKey): Promise<EncryptedBlob> {
  return encrypt(key, VERIFIER_PLAINTEXT);
}

export async function verifyPassphrase(
  key: CryptoKey,
  verifier: EncryptedBlob,
): Promise<boolean> {
  try {
    const plain = await decrypt(key, verifier);
    return plain === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}
