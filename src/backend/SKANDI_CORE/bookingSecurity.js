// /src/backend/SKANDI_CORE/bookingSecurity.js
// SKANDI Backend Base 1.0 — B-006 encrypted traveler payload.
// Sensitive APIS/document data is encrypted before entering booking_carts.payload.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { text } from "backend/SKANDI_CORE/platformValidation.js";

const getSecretValue = elevate(secrets.getSecretValue);
let keyPromise = null;

function secretString(raw) {
  if (typeof raw === "string") return raw.trim();
  for (const key of ["value", "secretValue", "secret", "data"]) {
    if (typeof raw?.[key] === "string" && raw[key].trim()) return raw[key].trim();
  }
  return "";
}
async function encryptionKey() {
  if (keyPromise) return keyPromise;
  keyPromise = (async () => {
    let raw;
    try { raw = await getSecretValue("BOOKING_PAYLOAD_KEY"); }
    catch (_) {
      const error = new Error("BOOKING_PAYLOAD_KEY is unavailable.");
      error.code = "BOOKING_ENCRYPTION_NOT_CONFIGURED";
      error.publicMessage = "Secure traveler storage is not configured.";
      throw error;
    }
    const value = secretString(raw);
    if (value.length < 32) {
      const error = new Error("BOOKING_PAYLOAD_KEY must contain at least 32 characters of entropy.");
      error.code = "BOOKING_ENCRYPTION_NOT_CONFIGURED";
      error.publicMessage = "Secure traveler storage is not configured.";
      throw error;
    }
    return createHash("sha256").update(value, "utf8").digest();
  })();
  try { return await keyPromise; }
  catch (error) { keyPromise = null; throw error; }
}

export async function encryptBookingData(value) {
  const key = await encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plain = Buffer.from(JSON.stringify(value ?? null), "utf8");
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  return {
    v: 1,
    alg: "A256GCM",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: encrypted.toString("base64")
  };
}

export async function decryptBookingData(envelope) {
  if (!envelope || typeof envelope !== "object") return null;
  if (Number(envelope.v) !== 1 || text(envelope.alg, 20) !== "A256GCM") {
    const error = new Error("Unsupported encrypted booking payload.");
    error.code = "BOOKING_PAYLOAD_VERSION_UNSUPPORTED";
    error.publicMessage = "This checkout session was created by an older secure-booking generation. Start a new booking search.";
    throw error;
  }
  try {
    const key = await encryptionKey();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(String(envelope.iv || ""), "base64"));
    decipher.setAuthTag(Buffer.from(String(envelope.tag || ""), "base64"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(String(envelope.ciphertext || ""), "base64")),
      decipher.final()
    ]).toString("utf8");
    return JSON.parse(plain);
  } catch (error) {
    if (error?.code === "BOOKING_ENCRYPTION_NOT_CONFIGURED") throw error;
    const safe = new Error("Encrypted booking data could not be opened.");
    safe.code = "BOOKING_PAYLOAD_DECRYPT_FAILED";
    safe.publicMessage = "Secure traveler details could not be restored. Start a new checkout or contact SKANDI.";
    throw safe;
  }
}
